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
    // 3. Processar mensagem com Inteligência Artificial
    // ==========================================
    if (!process.env.OPENAI_API_KEY) {
      console.error('[WEBHOOK ERRO] OPENAI_API_KEY ausente.');
      return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 });
    }

    let systemInstruction = agent.system_prompt || `Você é ${agent.name}. Responda amigavelmente.`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: textMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = aiResponse.choices[0]?.message?.content || 'Desculpe, estou enfrentando problemas técnicos agora.';

    // ==========================================
    // 4. Enviar a resposta de volta para o Evolution API
    // ==========================================
    console.log(`[EVOLUTION SEND] Enviando resposta para: ${remoteJid}`);
    
    // Na Evolution API v1.x e v2.x, o endpoint costuma ser POST /message/sendText/{instance}
    // E o body: { number: '123456789', text: '...' } 
    // remoteJid costuma vir como '5511999999999@s.whatsapp.net', tiramos o sufixo
    const toPhone = remoteJid.replace('@s.whatsapp.net', '');

    const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify({
        number: toPhone,
        options: {
           delay: 1500, // simula digitação (opcional dependendo da config)
           presence: 'composing' // status "digitando..."
        },
        textMessage: {
           text: answer
        }
      })
    });

    if (!sendRes.ok) {
      const errTxt = await sendRes.text();
      console.error('[EVOLUTION SEND ERRO] Falha ao enviar:', errTxt);
      return NextResponse.json({ error: 'Erro ao enviar resposta via whatsapp' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resposta enviada com sucesso',
      agent: agent.name
    });

  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
