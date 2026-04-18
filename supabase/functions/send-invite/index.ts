import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, companyName } = await req.json();

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Invitar usuário via Supabase Auth (Cria o registro e gera o link)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { company_name: companyName },
      redirectTo: `https://mercado-agentes-clone.vercel.app/login`, // URL do seu sistema live
    });

    if (inviteError) throw inviteError;

    // 2. Se tivermos Resend configurado, enviamos um e-mail personalizado
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "New Agentes <onboarding@resend.dev>", // Ou o domínio verificado do cliente
          to: [email],
          subject: `Convite: Bem-vindo à New Agentes - ${companyName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #6d28d9;">Olá!</h2>
              <p>Você foi convidado para gerenciar a infraestrutura de IA da <strong>${companyName}</strong> na plataforma <strong>New Agentes</strong>.</p>
              <p>Clique no botão abaixo para definir sua senha e acessar o sistema:</p>
              <a href="${inviteData.user.confirmation_sent_at}" style="display: inline-block; padding: 12px 24px; background-color: #6d28d9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                Aceitar Convite e Definir Senha
              </a>
              <p style="color: #666; font-size: 12px;">Se você não esperava por este convite, pode ignorar este e-mail.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Erro Resend:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
