import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Evita throw instantâneo, mas falha embaixo se vazio.
    });

    const { agentId, message } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json({ error: 'Faltando agentId ou message' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'Chave OPENAI_API_KEY não configurada no servidor (.env.local)',
        answer: "❌ Erro Server: Você precisa adicionar a variável OPENAI_API_KEY no arquivo .env.local para eu poder processar sua mensagem."
      }, { status: 500 });
    }

    // Buscar as configurações do agente no banco
    const { data: agent, error } = await supabase
      .from('na_agents')
      .select('name, system_prompt, config')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      console.error('Erro ao buscar agente:', error);
      return NextResponse.json({ error: 'Agente não encontrado no banco' }, { status: 404 });
    }

    // Extrair histórico ou injetar prompt
    // Idealmente você leria do "flow" do banco para processar grafos (nós/edges)
    // Para simplificar a prova de conceito do Motor Local: usaremos o System_Prompt base
    let systemInstruction = agent.system_prompt || `Você é ${agent.name}. Responda amigavelmente.`;

    // Processar a chamada para a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0]?.message?.content || 'Desculpe, não consegui formular uma resposta.';

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Erro na API Chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
