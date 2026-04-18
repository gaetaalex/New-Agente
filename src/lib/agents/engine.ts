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
      .select("flow, system_prompt, is_active, config, name")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) throw new Error("Agente não encontrado");
    if (!agent.is_active) {
      console.log(`[FLOW ENGINE] Agente ${agentId} está PAUSADO. Ignorando.`);
      return;
    }

    const flow = (agent.flow as FlowData) || { nodes: [], edges: [] };
    const initialNode = flow.nodes.find((n) => n.type === "initial");

    // 2. Buscar Sessão Ativa
    const { data: session, error: sessError } = await supabase
      .from("na_chat_sessions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("remote_jid", remoteJid)
      .single();

    let currentSession = session;

    // 3. Validação de Início (Session vs Keyword)
    if (sessError || !session) {
      if (initialNode?.data?.triggerKeyword) {
        const keyword = initialNode.data.triggerKeyword.trim().toLowerCase();
        if (!text.toLowerCase().includes(keyword)) {
          console.log(`[FLOW ENGINE] Ignorando: "${text}" não contém keyword "${keyword}"`);
          return;
        }
      }

      // Criar nova sessão
      const { data: newSess, error: createError } = await supabase
        .from("na_chat_sessions")
        .insert({
          company_id: companyId,
          agent_id: agentId,
          remote_jid: remoteJid,
          messages: [{ role: "user", content: text }],
          current_node_id: initialNode?.id
        })
        .select("*")
        .single();
      
      if (createError) throw createError;
      currentSession = newSess;
    } else {
      // Atualizar histórico da sessão existente
      const newMessages = [...(session.messages || []), { role: "user", content: text }];
      await supabase
        .from("na_chat_sessions")
        .update({ messages: newMessages, last_interaction: new Date().toISOString() })
        .eq("id", session.id);
      currentSession.messages = newMessages;
    }

    // 4. Determinar Nó Atual para Execução
    let currentNodeId = currentSession.current_node_id;
    if (!currentNodeId) {
      if (!initialNode) throw new Error("Fluxo sem nó inicial");
      currentNodeId = initialNode.id;
    }

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

      case "action": {
        const actionType = node.data.nodeId;
        
        if (actionType === "wa" || actionType === "ai") {
          let responseText = "";
          
          if (actionType === "wa") {
            responseText = node.data.waMessage || node.data.message || "Olá!";
          } else if (actionType === "ai") {
            const prompt = node.data.prompt || node.data.message || "";
            console.log(`[FLOW ENGINE] Chamando OpenAI para prompt: ${prompt}`);
            
            try {
              const aiRes = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: agent.system_prompt || "Você é um assistente prestativo." },
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
          
          const nextNodeId = this.getNextNodeId(nodeId, flow);
          await this.updateSession(session.id, nextNodeId || nodeId, responseText);
          return;
        }

        if (actionType === "availability" || actionType === "faq" || actionType === "lead") {
          // Estes nós usam IA para gerar a resposta com base no contexto específico do nó
          const prompt = node.data.prompt || node.data.message || (actionType === "availability" ? "Verifique os horários disponíveis" : "Responda à dúvida do cliente");
          const businessContext = JSON.stringify(agent.config?.business_details || {});

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

              // 2. Extração de Data/Hora
              const aiRes = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: `Extraia JSON {date, time} para "${userInput}". Hoje=${dateContext}.` }],
                response_format: { type: "json_object" }
              });

              const extracted = JSON.parse(aiRes.choices[0]?.message?.content || "{}");
              
              if (extracted.date && extracted.time) {
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

                  // 5. Salvar Agendamento
                  const saveInternal = bookingConfig.bookingDest !== 'google';
                  const syncGoogle = bookingConfig.bookingDest === 'google';
                  const companyName = bookingConfig.companyName || 'nossa unidade';

                  if (saveInternal) {
                      const { error: bookErr } = await supabase.from("na_bookings").insert({
                          company_id: session.company_id,
                          service_id: context.selected_service_id,
                          date: extracted.date,
                          time: extracted.time,
                          status: 'confirmed'
                      });
                      if (bookErr) throw bookErr;
                  }

                  if (syncGoogle) {
                      await this.syncWithGoogleCalendar(session.company_id, {
                        summary: `${context.selected_service_name} - ${companyName}`,
                        start: `${extracted.date}T${extracted.time}:00`,
                        description: `Agendado via WhatsApp (${session.remote_jid})`
                      });
                  }

                  const [year, month, day] = extracted.date.split('-');
                  const msg = `✅ *Confirmado!* Seu agendamento de *${context.selected_service_name}* na *${companyName}* foi realizado com sucesso para o dia ${day}/${month}/${year} às ${extracted.time}.`;
                  await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                  
                  const nextNodeId = this.getNextNodeId(nodeId, flow);
                  await this.updateSession(session.id, nextNodeId || nodeId, msg, {}); 
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
