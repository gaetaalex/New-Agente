import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json();

    // Mercado Pago envia o ID do recurso na notificação
    // Pode ser um pagamento ou uma autorização de assinatura (preapproval)
    const resourceId = body.data?.id || body.id;
    const type = body.type || body.topic;

    console.log(`Recebendo notificação: ${type} - ID: ${resourceId}`);

    if (type === "payment" || type === "preapproval") {
      const resp = await fetch(`https://api.mercadopago.com/${type === 'payment' ? 'v1/payments' : 'preapproval'}/${resourceId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
      });
      
      const resourceData = await resp.json();
      const status = resourceData.status;
      const companyId = resourceData.external_reference;

      console.log(`Status do recurso: ${status} para Empresa: ${companyId}`);

      if (status === "approved" || status === "authorized" || status === "active") {
        // Upgrade automático da empresa
        const { error } = await supabase
          .from("na_companies")
          .update({ 
            plan: "pro", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", companyId);

        if (error) throw error;
        console.log(`Upgrade concluído para empresa: ${companyId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
