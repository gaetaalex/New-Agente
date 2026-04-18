import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Evita erro estático do Vercel
    });

    const body = await req.json();
    console.log('[EVOLUTION WEBHOOK] Recebido:', JSON.stringify(body, null, 2));

    // A Evolution API envia mensagens diferentes. Vamos focar apenas nas mensagens CRIAÇÃO
    if (body.event !== 'messages.upsert' || !body.data?.messages?.[0]) {
      return NextResponse.json({ message: 'Evento ignorado' });
    }

    const message = body.data.messages[0];
    const instanceName = body.instance; // Geralmente vem na raiz do payload ou no header
    
    // Ignorar mensagens enviadas por nós mesmos (ou outros bots da conta)
    if (message.key.fromMe) {
      return NextResponse.json({ message: 'Mensagem enviada por mim, ignorada' });
    }

    // Identificar tipo de mensagem e extrair o texto
    let textMessage = '';
    
    if (message.message?.conversation) {
      textMessage = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      textMessage = message.message.extendedTextMessage.text;
    }

    if (!textMessage) {
      return NextResponse.json({ message: 'Não é mensagem de texto, ignorada' });
    }

    const remoteJid = message.key.remoteJid; // número do cliente
    console.log(`[EVOLUTION WEBHOOK] Instância: ${instanceName} | Usuário: ${remoteJid} | Mensagem: ${textMessage}`);

    // ==========================================
    // 1. Encontrar o company_id pela instância
    // ==========================================
    const { data: integrations, error: intError } = await supabase
      .from('na_integrations')
      .select('company_id, config')
      .eq('type', 'whatsapp_evolution')
      .eq('instance_name', instanceName);

    if (intError || !integrations || integrations.length === 0) {
      console.error('[WEBHOOK ERRO] Instância não encontrada nas integrações:', instanceName);
      return NextResponse.json({ error: 'Instância não registrada' }, { status: 404 });
    }

    // Assumir a primeira (deve ser única)
    const integration = integrations[0];
    const companyId = integration.company_id;
    const evolutionApiUrl = integration.config?.api_url?.replace(/\/$/, "");
    const evolutionApiKey = integration.config?.api_key;

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('[WEBHOOK ERRO] Faltam url ou key na configuração da integração');
      return NextResponse.json({ error: 'Configuração Incompleta' }, { status: 500 });
    }

    // ==========================================
    // 2. Encontrar o Agente ativo dessa empresa
    // ==========================================
    const { data: agent, error: agentError } = await supabase
      .from('na_agents')
      .select('id, name, system_prompt')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (agentError || !agent) {
      console.warn('[WEBHOOK] Nenhum agente ativo encontrado para a empresa:', companyId);
      // Aqui poderíamos não responder nada, para não atrapalhar atendimentos humanos
      return NextResponse.json({ message: 'Nenhum agente ativo' });
    }

    // ==========================================
    // 3. Processar mensagem com o Motor de Fluxos (FlowEngine)
    // ==========================================
    const { FlowEngine } = require('@/lib/agents/engine');
    const engine = new FlowEngine();

    await engine.processMessage(
      companyId,
      agent.id,
      remoteJid,
      textMessage,
      instanceName,
      evolutionApiUrl,
      evolutionApiKey
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem processada pelo Motor de Fluxos',
      agent: agent.name
    });


  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
