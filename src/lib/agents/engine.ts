import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

interface FlowNode {
  id: string;
  type: string;
  data: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export class FlowEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }

  async processMessage(
    companyId: string,
    agentId: string,
    remoteJid: string,
    text: string,
    flowData: any,
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
  ) {
    console.log(`[FLOW ENGINE] Processando: ${remoteJid} | Msg: ${text}`);

    // 1. Buscar Agente e Flow FIRST
    const { data: agent, error: agentError } = await supabase
      .from("na_agents")
      .select("flow, system_prompt, is_active, config, name, business_details")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) throw new Error("Agente não encontrado");
    if (!agent.is_active) {
      console.log(`[FLOW ENGINE] Agente ${agentId} está PAUSADO. Ignorando.`);
      return;
    }

    const flow = (agent.flow as FlowData) || { nodes: [], edges: [] };
    const initialNode = flow.nodes.find((n) => n.type === "initial");

    // 1.5 Buscar Cliente por Telefone para Personalização
    const phone = remoteJid.replace("@s.whatsapp.net", "");
    const { data: client } = await supabase
      .from("na_clients")
      .select("full_name")
      .eq("phone_primary", phone)
      .maybeSingle();

    // 2. Buscar Sessão Ativa
    const { data: session, error: sessError } = await supabase
      .from("na_chat_sessions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("remote_jid", remoteJid)
      .single();

    let currentSession = session;

    // 3. Validação de Início (Session vs Keyword) e RESET
    const isGreeting = ["ola", "oi", "menu", "ajuda", "bom dia", "boa tarde", "boa noite"].includes(text.toLowerCase().trim());
    
    if (sessError || !session) {
      if (initialNode?.data?.triggerKeyword) {
        const keyword = initialNode.data.triggerKeyword.trim().toLowerCase();
        if (!text.toLowerCase().includes(keyword)) {
          console.log(`[FLOW ENGINE] Ignorando: "${text}" não contém keyword "${keyword}"`);
          return;
        }
      }

      await supabase.from('na_debug_logs').insert({ event_type: 'engine_debug', payload: { step: 'creating_new_session', jid: remoteJid } });

      // Criar nova sessão
      const { data: newSess, error: createError } = await supabase
        .from("na_chat_sessions")
        .insert({
          company_id: companyId,
          agent_id: agentId,
          remote_jid: remoteJid,
          messages: [{ role: "user", content: text }],
          current_node_id: initialNode?.id,
          status: 'active'
        })
        .select("*")
        .single();
      
      if (createError) {
        await supabase.from('na_debug_logs').insert({ event_type: 'engine_debug', payload: { step: 'session_creation_failed', error: createError.message } });
        throw createError;
      }
      currentSession = newSess;
    } else {
      await supabase.from('na_debug_logs').insert({ event_type: 'engine_debug', payload: { step: 'updating_session', session_id: session.id, current_node: session.current_node_id, is_greeting: isGreeting } });

      // SE for saudação e estiver travado em transfer, volta pro início
      if (isGreeting && (session.current_node_id === 'transfer' || session.status === 'human_needed')) {
         session.current_node_id = initialNode?.id || null;
         session.status = 'active';
      }

      // Atualizar histórico da sessão existente
      const newMessages = [...(session.messages || []), { role: "user", content: text }];
      await supabase
        .from("na_chat_sessions")
        .update({ 
          messages: newMessages, 
          last_interaction: new Date().toISOString(),
          current_node_id: session.current_node_id,
          status: session.status || 'active'
        })
        .eq("id", session.id);
      currentSession.messages = newMessages;
    }

    // 4. Determinar Nó Atual para Execução
    let currentNodeId = currentSession.current_node_id;
    if (!currentNodeId) {
      if (!initialNode) throw new Error("Fluxo sem nó inicial");
      currentNodeId = initialNode.id;
    }

    await supabase.from('na_debug_logs').insert({ event_type: 'engine_debug', payload: { step: 'executing_step', node_id: currentNodeId } });

    // 5. Executar
    await this.executeStep(
      currentNodeId,
      flow,
      currentSession,
      agent,
      text,
      instanceName,
      evolutionApiUrl,
      evolutionApiKey
    );
  }

  private async executeStep(
    nodeId: string,
    flow: FlowData,
    session: any,
    agent: any,
    userInput: string,
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
  ) {
    const node = flow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    console.log(`[FLOW ENGINE] Executando Nó: ${node.type} (${node.id})`);

    // Lógica por tipo de nó
    console.log(`[FLOW ENGINE] Tipo: ${node.type} | DataID: ${node.data.nodeId}`);
    
    await supabase.from('na_debug_logs').insert({
       event_type: 'engine_step',
       payload: { node_id: nodeId, type: node.type, data_id: node.data.nodeId }
    });

    switch (node.type) {
      case "initial": {
        const nextNodeId = this.getNextNodeId(nodeId, flow);
        if (nextNodeId) {
          await this.executeStep(nextNodeId, flow, session, agent, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
        }
        break;
      }

      case "ai_response": 
      case "action": {
        const actionType = node.data.nodeId;
        
        if (actionType === "wa" || actionType === "ai") {
          let responseText = "";
          
          if (actionType === "wa") {
            responseText = node.data.waMessage || node.data.message || "Olá!";
          } else if (actionType === "ai") {
            const prompt = node.data.prompt || node.data.message || "";
            const businessContext = JSON.stringify(agent.business_details || agent.config?.business_details || {});
            console.log(`[FLOW ENGINE] Chamando OpenAI para prompt: ${prompt}`);
            
            try {
              const aiRes = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: agent.system_prompt || "Você é um assistente prestativo." },
                  { role: "system", content: `IDENTIDADE: Seu nome é ${agent.name}.` },
                  { role: "system", content: `CONTEXTO DE NEGÓCIO (SERVIÇOS/REGRAS): ${businessContext}` },
                  { role: "system", content: `CLIENTE: Você está falando com ${session.context?.customer_name || "um novo cliente"}.` },
                  { role: "system", content: `Instrução do Nó Atual: ${prompt}` },
                  ...session.messages.slice(-5)
                ],
              });
              responseText = aiRes.choices[0]?.message?.content || "...";
            } catch (aiErr: any) {
              console.error("[FLOW ENGINE] Erro OpenAI:", aiErr);
              throw new Error(`Falha na IA: ${aiErr.message}`);
            }
          }

          await this.sendWhatsApp(instanceName, session.remote_jid, responseText, evolutionApiUrl, evolutionApiKey);
          
          // --- ROTEAMENTO SEMÂNTICO INTELIGENTE ---
          let nextNodeId = null;
          const outboundEdges = flow.edges.filter(e => e.source === nodeId);
          
          if (outboundEdges.length === 1) {
            nextNodeId = outboundEdges[0].target;
          } else if (outboundEdges.length > 1) {
            console.log("[FLOW ENGINE] Múltiplas rotas detectadas. Decidindo semânticamente...");
            const businessContext = JSON.stringify(agent.business_details || agent.config?.business_details || {});
            const options = outboundEdges.map(e => ({ id: e.target, label: e.label || "Seguir fluxo" }));
            const decisionPrompt = `O usuário disse: "${userInput}". 
            Contexto da Empresa: ${businessContext}
            
            Com base na intenção dele, escolha a opção mais adequada entre as rotas de saída:
            ${options.map((o, i) => `${i}: ${o.label}`).join('\n')}
            
            IMPORTANTE: Se a intenção do usuário for apenas tirar dúvidas sobre serviços, preços ou informações gerais que já constam no contexto acima, responda "STAY".
            Responda APENAS o número da opção (ex: 0, 1) ou "STAY".`;

            try {
              const routeRes = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: decisionPrompt }],
                max_tokens: 5
              });
              const decision = routeRes.choices[0]?.message?.content?.trim() || "STAY";
              if (decision !== "STAY" && !isNaN(parseInt(decision))) {
                const idx = parseInt(decision);
                if (options[idx]) nextNodeId = options[idx].id;
              }
            } catch (err) {
              console.error("[FLOW ENGINE] Erro no roteamento semântico:", err);
            }
          }

          await this.updateSession(session.id, nextNodeId || nodeId, responseText);
          
          // Se houver troca de nó IMEDIATA (ex: para um nó de ação), podemos optar por executar o próximo passo aqui
          // Mas por design de chat, geralmente esperamos o próximo input do usuário.
          // Exceto se for um nó de "Mensagem" fixa ou similar.
          return;
        }

        if (actionType === "availability" || actionType === "faq" || actionType === "lead") {
          // Estes nós usam IA para gerar a resposta com base no contexto específico do nó
          const prompt = node.data.prompt || node.data.message || (actionType === "availability" ? "Verifique os horários disponíveis" : "Responda à dúvida do cliente");
          const businessContext = JSON.stringify(agent.business_details || agent.config?.business_details || {});

          let responseText = "";
          try {
            const aiRes = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: agent.system_prompt || "" },
                { role: "system", content: `DETALHES DA EMPRESA (SERVIÇOS/HORÁRIOS): ${businessContext}` },
                { role: "system", content: `Ação Atual: ${node.data.label}. Instrução: ${prompt}` },
                ...session.messages.slice(-5)
              ],
            });
            responseText = aiRes.choices[0]?.message?.content || "...";
          } catch (err: any) {
             responseText = "Vou verificar essa informação para você. Um momento...";
          }

          await this.sendWhatsApp(instanceName, session.remote_jid, responseText, evolutionApiUrl, evolutionApiKey);
          const nextNodeId = this.getNextNodeId(nodeId, flow);
          await this.updateSession(session.id, nextNodeId || nodeId, responseText);
          return;
        }

        if (actionType === "transfer") {
          const dept = node.data.department || "atendimento";
          const msg = `Estou transferindo você para o departamento: *${dept.toUpperCase()}*. Por favor, aguarde um instante enquanto um humano assume o atendimento.`;
          await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
          
          // No sistema real, marcaríamos a sessão como 'human_needed'
          await supabase.from('na_chat_sessions').update({ 
            status: 'human_needed',
            current_node_id: nodeId 
          }).eq('id', session.id);
          return; // Para o bot
        }

        if (actionType === "link") {
          const url = node.data.url || "https://mercadoagentes.com.br";
          const text = node.data.linkText || "Clique aqui para acessar";
          const msg = `${text}\n\n${url}`;
          await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
          
          const nextNodeId = this.getNextNodeId(nodeId, flow);
          await this.updateSession(session.id, nextNodeId || nodeId, msg);
          return;
        }

        if (actionType === "pay") {
          const amount = node.data.amount || "0.00";
          const desc = node.data.paymentDescription || "Serviço";
          const msg = `💳 *Cobrança Gerada*\nResumo: ${desc}\nValor: R$ ${amount}\n\nUtilize o link abaixo ou o código Pix Copia e Cola que enviaremos a seguir para realizar o pagamento.`;
          await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
          
          // Simulação de Link Pix
          await this.sendWhatsApp(instanceName, session.remote_jid, "https://mercadoagentes.com.br/pay/simulated-pix-link", evolutionApiUrl, evolutionApiKey);

          const nextNodeId = this.getNextNodeId(nodeId, flow);
          await this.updateSession(session.id, nextNodeId || nodeId, msg);
          return;
        }

        if (actionType === "n8n") {
          const webhookUrl = node.data.webhookUrl;
          const waitTime = parseInt(node.data.waitTime as string || "0");
          
          if (waitTime > 0) {
            console.log(`[FLOW ENGINE] Aguardando ${waitTime}ms antes de acionar n8n...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          if (webhookUrl) {
            console.log(`[FLOW ENGINE] Disparando webhook n8n: ${webhookUrl}`);
            try {
              fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  remote_jid: session.remote_jid,
                  user_input: userInput,
                  company_id: session.company_id,
                  context: session.context,
                  agent_id: session.agent_id
                })
              }).catch(e => console.error("[FLOW ENGINE] Erro fetch n8n:", e));
            } catch (e) {
              console.error("[FLOW ENGINE] Erro disparo n8n:", e);
            }
          }
          
          const nextNodeId = this.getNextNodeId(nodeId, flow);
          await this.updateSession(session.id, nextNodeId || nodeId, "Integração n8n acionada.");
          
          // Se houver próximo nó, executamos imediatamente (n8n é side-effect)
          if (nextNodeId) {
            await this.executeStep(nextNodeId, flow, session, agent, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
          }
          return;
        }
        break;
      }

      case "capability": {
        const actionType = node.data.nodeId;
        if (actionType === "booking") {
            try {
              const now = new Date();
              const dateContext = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
              
              const context = session.context || {};
              const bookingConfig = node.data || {}; // Configurações do Canvas

              // 1. Seleção de Serviço
              if (!context.selected_service_id) {
                const { data: services } = await supabase
                  .from('na_services')
                  .select('id, name, price')
                  .eq('company_id', session.company_id)
                  .eq('active', true);

                if (!services || services.length === 0) {
                  const msg = "Ainda não temos serviços cadastrados para agendamento online.";
                  await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                  return;
                }

                const aiSvc = await this.openai.chat.completions.create({
                  model: "gpt-3.5-turbo",
                  messages: [{ role: "system", content: `Analise: "${userInput}". Serviços: ${JSON.stringify(services)}. Retorne apenas o ID ou null.` }]
                });

                const matchedSvcId = aiSvc.choices[0]?.message?.content?.trim();
                if (matchedSvcId && matchedSvcId !== "null" && matchedSvcId.length > 5) {
                  context.selected_service_id = matchedSvcId;
                  context.selected_service_name = services.find(s => s.id === matchedSvcId)?.name;
                } else {
                  const listMsg = "Qual destes serviços você deseja agendar?\n\n" + 
                    services.map(s => `🔹 *${s.name}* (R$ ${s.price})`).join('\n');
                  await this.sendWhatsApp(instanceName, session.remote_jid, listMsg, evolutionApiUrl, evolutionApiKey);
                  await this.updateSessionContext(session.id, context);
                  return;
                }
              }

              // 2. Extração de Data/Hora e NOME
              const aiRes = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: `Extraia JSON {date, time, name} para "${userInput}". Hoje=${dateContext}. Se o nome não estiver claro, retorne null no campo name.` }],
                response_format: { type: "json_object" }
              });

              const extracted = JSON.parse(aiRes.choices[0]?.message?.content || "{}");
              
              if (extracted.name && !context.customer_name) {
                 context.customer_name = extracted.name;
              }

              if (extracted.date && extracted.time) {
                  // 2.1 Verificar se é DOMINGO
                  const bookDate = new Date(`${extracted.date}T12:00:00`);
                  if (bookDate.getDay() === 0) {
                      const msg = "Puxa, infelizmente não abrimos aos domingos. Poderia escolher um dia de segunda a sábado?";
                      await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                      await this.updateSessionContext(session.id, context);
                      return;
                  }

                  // 3. Validação de Horário de Funcionamento (Business Rules)
                  const workStart = bookingConfig.workStart || '09:00';
                  const workEnd = bookingConfig.workEnd || '18:00';
                  const bookingTime = extracted.time;

                  if (bookingTime < workStart || bookingTime > workEnd) {
                      const msg = `Puxa, infelizmente nesse horário não estamos atendendo. Nosso horário de funcionamento é das ${workStart} às ${workEnd}. Teria outro horário?`;
                      await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                      return;
                  }

                  // 4. Verificar Disponibilidade (Se ativo no Canvas)
                  if (bookingConfig.verifyAvailability !== false) {
                      const { data: existing } = await supabase
                          .from('na_bookings')
                          .select('id')
                          .eq('company_id', session.company_id)
                          .eq('date', extracted.date)
                          .eq('time', extracted.time)
                          .neq('status', 'cancelled');
                      
                      if (existing && existing.length > 0) {
                          const msg = "Esse horário acabou de ser preenchido por outro cliente. Poderia escolher outro horário para o mesmo dia ou outro dia?";
                          await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                          return;
                      }
                  }

                  // 5. Perguntar o NOME se ainda não tivermos
                  if (!context.customer_name) {
                     const msg = "Com quem eu falo? Por favor, me diga seu nome para eu registrar no agendamento.";
                     await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                     await this.updateSessionContext(session.id, context);
                     return;
                  }

                  // 6. Salvar Agendamento
                  const { data: booking, error: bookErr } = await supabase
                    .from("na_bookings")
                    .insert({
                        company_id: session.company_id,
                        agent_id: session.agent_id,
                        client_name: context.customer_name,
                        client_phone: session.remote_jid.replace("@s.whatsapp.net", ""),
                        service_id: context.selected_service_id,
                        date: extracted.date,
                        time: extracted.time,
                        status: 'confirmed'
                    })
                    .select('*, na_services(name)')
                    .single();

                  if (bookErr) {
                      console.error("[FLOW ENGINE] Erro ao salvar agendamento:", bookErr);
                      throw bookErr;
                  }

                  const confirmMsg = `Perfeito, ${context.customer_name}! Seu agendamento para *${booking.na_services?.name}* foi confirmado para o dia ${extracted.date} às ${extracted.time}. Te esperamos lá!`;
                  await this.sendWhatsApp(instanceName, session.remote_jid, confirmMsg, evolutionApiUrl, evolutionApiKey);
                  
                  // Resetar contexto após sucesso
                  await this.updateSessionContext(session.id, {});
                  const nextNodeId = this.getNextNodeId(nodeId, flow);
                  await this.updateSession(session.id, nextNodeId || nodeId, confirmMsg);
                  return;
              } else {
                  const msg = `Para qual dia e horário você prefere o seu *${context.selected_service_name}*?`;
                  await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                  await this.updateSessionContext(session.id, context);
              }
            } catch (bookErr: any) {
               console.error("[FLOW ENGINE] Erro no Nó Booking:", bookErr);
            }
        }
        break;
      }

      case "condition": {
        // Obter labels das opções para prover contexto à IA
        const nodeYes = flow.nodes.find(n => n.id === this.getNextNodeId(nodeId, flow, 'yes'));
        const nodeNo = flow.nodes.find(n => n.id === this.getNextNodeId(nodeId, flow, 'no'));
        
        const labelYes = nodeYes?.data?.label || "Seguir para o próximo passo (SIM)";
        const labelNo = nodeNo?.data?.label || "Outro assunto (NÃO)";

        const prompt = `Analise a mensagem do usuário: "${userInput}". 
        Com base na intenção do usuário, responda SIM se ele deseja "${labelYes}" ou responda NAO se a intenção dele for mais condizente com "${labelNo}".
        Responda apenas "SIM" ou "NAO".`;

        const aiRes = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: prompt }],
        });

        const decision = aiRes.choices[0]?.message?.content?.toUpperCase() || "NAO";
        const handle = decision.includes("SIM") ? "yes" : "no";
        
        const nextNodeId = this.getNextNodeId(nodeId, flow, handle);
        if (nextNodeId) {
          await this.executeStep(nextNodeId, flow, session, agent, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
        }
        break;
      }
    }
  }

  private getNextNodeId(nodeId: string, flow: FlowData, sourceHandle?: string): string | null {
    const edge = flow.edges.find((e) => e.source === nodeId && (!sourceHandle || e.sourceHandle === sourceHandle));
    return edge ? edge.target : null;
  }

  private async updateSession(sessionId: string, nodeId: string, lastResponse: string, context: any = null) {
    const { data: session } = await supabase.from("na_chat_sessions").select("messages, context").eq("id", sessionId).single();
    const newMessages = [...(session?.messages || []), { role: "assistant", content: lastResponse }];
    
    const updateData: any = {
      current_node_id: nodeId,
      messages: newMessages
    };

    if (context !== null) {
      updateData.context = context;
    }
    
    await supabase
      .from("na_chat_sessions")
      .update(updateData)
      .eq("id", sessionId);
  }

  private async updateSessionContext(sessionId: string, context: any) {
    await supabase
      .from("na_chat_sessions")
      .update({ context })
      .eq("id", sessionId);
  }

  private async syncWithGoogleCalendar(companyId: string, event: { summary: string, start: string, description: string }) {
    try {
      // 1. Buscar integração Google
      const { data: integration } = await supabase
        .from('na_integrations')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', 'google_calendar')
        .single();

      if (!integration || integration.status !== 'connected') {
        console.log(`[FLOW ENGINE] Sincronização Google ignorada: Integração não encontrada ou desconectada para ${companyId}`);
        return;
      }

      console.log(`[FLOW ENGINE] Sincronizando com Google Calendar para empresa ${companyId}...`);
      
      // NOTA: Aqui normalmente usaríamos o refresh_token para obter um access_token válido.
      // Como estamos implementando a estrutura, vamos logar a tentativa.
      // Em uma implementação real, faríamos o fetch para https://www.googleapis.com/calendar/v3/calendars/primary/events
      
      await supabase.from('na_debug_logs').insert({
        event_type: 'google_calendar_sync_attempt',
        payload: { company_id: companyId, event }
      });

    } catch (err: any) {
      console.error("[FLOW ENGINE] Erro ao sincronizar Google Calendar:", err);
    }
  }

  private async sendWhatsApp(instanceName: string, remoteJid: string, text: string, url: string, key: string) {
    const toPhone = remoteJid.replace("@s.whatsapp.net", "");
    console.log(`[FLOW ENGINE] Enviando WhatsApp para ${toPhone}: ${text.substring(0, 20)}...`);
    
    const response = await fetch(`${url}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
      },
      body: JSON.stringify({
        number: toPhone,
        text: text, // Evolution API v2 usa "text" diretamente
      }),
    });

    const resBody = await response.text();

    // Logar resultado no banco para diagnóstico
    await supabase.from('na_debug_logs').insert({
       event_type: response.ok ? 'whatsapp_sent' : 'whatsapp_error',
       payload: {
          status: response.status,
          body: resBody,
          to: toPhone,
          url: `${url}/message/sendText/${instanceName}`
       }
    });

    if (!response.ok) {
       console.error(`[FLOW ENGINE] Erro ao enviar WhatsApp: ${response.status}`, resBody);
    }
  }
}
