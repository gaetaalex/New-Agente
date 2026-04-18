import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyId, userEmail, billingCycle } = await req.json();
    console.log(`[CHECKOUT] Iniciando: ${userEmail} | Empresa: ${companyId} | Ciclo: ${billingCycle}`);

    if (!MP_ACCESS_TOKEN) {
      console.error("[ERRO CRÍTICO] MP_ACCESS_TOKEN ausente nas variáveis de ambiente!");
      throw new Error("Sistema de pagamentos temporariamente indisponível (Erro: Credenciais).");
    }

    const isYearly = billingCycle === 'yearly';
    const amount = isYearly ? 1919.88 : 199.99;
    const frequencyType = isYearly ? "years" : "months";

    const body = {
      reason: `Plano PRO - Mercado Agentes (${isYearly ? 'Anual' : 'Mensal'})`,
      auto_recurring: {
        frequency: 1,
        frequency_type: frequencyType,
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `https://mercado-agentes-clone.vercel.app/billing?success=true`,
      payer_email: userEmail,
      external_reference: companyId,
      status: "pending"
    };

    console.log(`[MP] Criando preapproval: ${amount} BRL / ${frequencyType}`);
    
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await mpResponse.json();
    
    if (!mpResponse.ok) {
       console.error("[MP ERRO]", JSON.stringify(data));
       throw new Error(`Mercado Pago: ${data.message || 'Falha na criação do plano'}`);
    }

    console.log(`[SUCESSO] Checkout gerado: ${data.init_point}`);

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("[CHECKOUT ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
