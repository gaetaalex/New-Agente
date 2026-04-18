import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche, questions, agentName, specificField } = await req.json();

    if (!niche) {
      return NextResponse.json({ error: 'Nicho é obrigatório' }, { status: 400 });
    }

    let prompt = "";
    
    if (specificField === 'business_details' && questions?.length === 1) {
      prompt = `
        Você é um assistente de IA focado em negócios para o nicho de "${niche}".
        Para a pergunta: "${questions[0]}", sugira uma resposta realista e profissional.
        Nome da empresa/agente: "${agentName || 'Nova Empresa'}".

        Retorne APENAS um objeto JSON com o seguinte formato:
        {
          "business_details": {
            "${questions[0]}": "Sua resposta sugerida aqui"
          }
        }
      `;
    } else {
      prompt = `
        Você é um especialista em configuração de Agentes de IA para WhatsApp.
        Crie o perfil completo de um agente para o nicho: "${niche}".
        Nome do Agente (se disponível): "${agentName || 'Alpha'}".

        Perguntas a serem respondidas no campo 'business_details':
        ${questions ? questions.join('\n') : 'Não há perguntas específicas.'}

        Retorne APENAS um objeto JSON com o seguinte formato:
        {
          "persona": "Descrição curta da personalidade e objetivo do agente",
          "business_details": {
             "Pergunta 1": "Resposta sugerida 1",
             "Pergunta 2": "Resposta sugerida 2"
          },
          "system_prompt": "Instrução de sistema completa e detalhada para o agente se comportar corretamente."
        }
        
        Importante:
        - Use um tom profissional e amigável.
        - As respostas devem ser realistas para o setor.
        - O system_prompt deve ser robusto.
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um assistente que gera configurações de agentes de IA em formato JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Falha ao gerar conteúdo');

    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    console.error('[AI SUGGEST ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
