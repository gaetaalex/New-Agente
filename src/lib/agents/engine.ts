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
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
  ) {
    console.log(`[FLOW ENGINE] Processando: ${remoteJid} | Msg: ${text}`);

    // 1. Buscar Sessão ou Criar
    const { data: session, error: sessError } = await supabase
      .from("na_chat_sessions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("remote_jid", remoteJid)
      .single();

    let currentSession = session;

    if (sessError || !session) {
      const { data: newSess, error: createError } = await supabase
        .from("na_chat_sessions")
        .insert({
          company_id: companyId,
          agent_id: agentId,
          remote_jid: remoteJid,
          messages: [{ role: "user", content: text }],
        })
        .select("*")
        .single();
      
      if (createError) throw createError;
      currentSession = newSess;
    } else {
      // Atualizar histórico
      const newMessages = [...(session.messages || []), { role: "user", content: text }];
      await supabase
        .from("na_chat_sessions")
        .update({ messages: newMessages, last_interaction: new Date().toISOString() })
        .eq("id", session.id);
      currentSession.messages = newMessages;
    }

    // 2. Buscar Agente e Flow
    const { data: agent, error: agentError } = await supabase
      .from("na_agents")
      .select("flow, system_prompt")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) throw new Error("Agente não encontrado");
    const flow = (agent.flow as FlowData) || { nodes: [], edges: [] };

    // 3. Determinar Nó Atual
    let currentNodeId = currentSession.current_node_id;
    if (!currentNodeId) {
      const initialNode = flow.nodes.find((n) => n.type === "initial");
      if (!initialNode) throw new Error("Fluxo sem nó inicial");
      currentNodeId = initialNode.id;
    }

    // 4. Executar Máquina de Estados
    await this.executeStep(
      currentNodeId,
      flow,
      currentSession,
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
    userInput: string,
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
  ) {
    const node = flow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    console.log(`[FLOW ENGINE] Executando Nó: ${node.type} (${node.id})`);

    // Lógica por tipo de nó
    switch (node.type) {
      case "initial": {
        const nextNodeId = this.getNextNodeId(nodeId, flow);
        if (nextNodeId) {
          await this.executeStep(nextNodeId, flow, session, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
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
            const aiRes = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: session.agent_system_prompt || "Você é um assistente prestativo." },
                { role: "system", content: `Instrução do Nó Atual: ${prompt}` },
                ...session.messages.slice(-5)
              ],
            });
            responseText = aiRes.choices[0]?.message?.content || "...";
          }

          await this.sendWhatsApp(instanceName, session.remote_jid, responseText, evolutionApiUrl, evolutionApiKey);
          await this.updateSession(session.id, nodeId, responseText);

          const nextNodeId = this.getNextNodeId(nodeId, flow);
          if (nextNodeId) {
            await this.executeStep(nextNodeId, flow, session, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
          }
        } else if (actionType === "booking") {
            const extractionPrompt = `Assuma que o cliente disse: "${userInput}".
            Extraia em formato JSON: 
            { "date": "YYYY-MM-DD", "time": "HH:MM" }.
            Histórico: ${JSON.stringify(session.messages.slice(-3))}`;

            const aiRes = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "system", content: extractionPrompt }],
              response_format: { type: "json_object" }
            });

            const extracted = JSON.parse(aiRes.choices[0]?.message?.content || "{}");
            
            if (extracted.date && extracted.time) {
                const { error: bookErr } = await supabase.from("na_bookings").insert({
                    company_id: session.company_id,
                    date: extracted.date,
                    time: extracted.time,
                    status: 'confirmed'
                });

                const msg = bookErr ? "Desculpe, esse horário não está disponível." : `Perfeito! Agendado para ${extracted.date} às ${extracted.time}.`;
                await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                await this.updateSession(session.id, nodeId, msg);
            } else {
                const msg = "Para agendar, por favor me informe o dia e horário desejado.";
                await this.sendWhatsApp(instanceName, session.remote_jid, msg, evolutionApiUrl, evolutionApiKey);
                await this.updateSession(session.id, nodeId, msg);
            }

            const nextNodeId = this.getNextNodeId(nodeId, flow);
            if (nextNodeId) {
               await this.executeStep(nextNodeId, flow, session, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
            }
        }
        break;
      }

      case "condition": {
        const prompt = `Analise a mensagem do usuário: "${userInput}". 
        A intenção condicional é: "${node.data.label || 'Verificar escolha'}".
        Responda apenas "SIM" ou "NAO".`;

        const aiRes = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: prompt }],
        });

        const decision = aiRes.choices[0]?.message?.content?.toUpperCase() || "NAO";
        const handle = decision.includes("SIM") ? "yes" : "no";
        
        const nextNodeId = this.getNextNodeId(nodeId, flow, handle);
        if (nextNodeId) {
          await this.executeStep(nextNodeId, flow, session, userInput, instanceName, evolutionApiUrl, evolutionApiKey);
        }
        break;
      }
    }
  }

  private getNextNodeId(nodeId: string, flow: FlowData, sourceHandle?: string): string | null {
    const edge = flow.edges.find((e) => e.source === nodeId && (!sourceHandle || e.sourceHandle === sourceHandle));
    return edge ? edge.target : null;
  }

  private async updateSession(sessionId: string, nodeId: string, lastResponse: string) {
    const { data: session } = await supabase.from("na_chat_sessions").select("messages").eq("id", sessionId).single();
    const newMessages = [...(session?.messages || []), { role: "assistant", content: lastResponse }];
    
    await supabase
      .from("na_chat_sessions")
      .update({
        current_node_id: nodeId,
        messages: newMessages
      })
      .eq("id", sessionId);
  }

  private async sendWhatsApp(instanceName: string, remoteJid: string, text: string, url: string, key: string) {
    const toPhone = remoteJid.replace("@s.whatsapp.net", "");
    await fetch(`${url}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
      },
      body: JSON.stringify({
        number: toPhone,
        textMessage: { text },
      }),
    });
  }
}
