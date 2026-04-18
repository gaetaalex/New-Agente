import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { FlowEngine } from '@/lib/agents/engine';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Evita erro estático do Vercel
    });

    const body = await req.json();
    console.log('[EVOLUTION WEBHOOK] Recebido:', JSON.stringify(body, null, 2));

    // 1. Validar Mensagem
    const message = body.data?.messages?.[0] || body.data;
    const instanceName = body.instance;
    const sender = body.sender;
    
    await supabase.from('na_debug_logs').insert({
       event_type: 'webhook_step',
       payload: { step: '1_admission', instance: instanceName, sender, fromMe: message.key?.fromMe, source: message.source }
    });

    if (!message || !message.key) return NextResponse.json({ message: 'Sem mensagem' });

    // Travas Anti-Loop e Sistema
    if (message.key.fromMe || sender?.includes(body.instanceId) || message.source === 'web') {
       return NextResponse.json({ message: 'Ignorada (Self/System)' });
    }

    // 2. Extrair Texto
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || 
                 message.message?.buttonsResponseMessage?.selectedButtonId ||
                 "";

    if (!text && !message.message?.imageMessage) {
       return NextResponse.json({ message: 'Sem conteúdo textual' });
    }

    // 3. Buscar Integração e Agente
    const { data: integration } = await supabase
      .from('na_integrations')
      .select('*')
      .eq('instance_name', instanceName)
      .single();
    
    if (!integration) {
       await supabase.from('na_debug_logs').insert({
          event_type: 'webhook_step',
          payload: { step: 'error_no_integration', instance: instanceName }
       });
       return NextResponse.json({ message: 'Instância não encontrada no banco' });
    }

    const { data: agent, error: agentError } = await supabase
      .from('na_agents')
      .select('*')
      .eq('company_id', integration.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (agentError || !agent) {
       await supabase.from('na_debug_logs').insert({
          event_type: 'webhook_step',
          payload: { step: 'error_no_agent', company_id: integration.company_id, error: agentError?.message }
       });
       return NextResponse.json({ message: 'Agente não configurado' });
    }

    // 4. Iniciar Processamento
    await supabase.from('na_debug_logs').insert({
       event_type: 'webhook_step',
       payload: { step: '2_processing_start', agent_id: agent.id, text }
    });

    const engine = new FlowEngine();
    
    const evolutionApiUrl = (integration.config?.api_url || "").trim().replace(/\/$/, "");
    const evolutionApiKey = (integration.config?.api_key || "").trim();

    await engine.processMessage(
      integration.company_id,
      agent.id,
      message.key.remoteJid,
      text,
      agent.flow,
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
    
    // Salvar erro no banco para diagnóstico
    await supabase.from('na_debug_logs').insert({
       event_type: 'error',
       payload: {
         message: error.message,
         stack: error.stack,
         cause: error.cause
       }
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
