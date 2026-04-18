import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from("na_integrations")
      .select("config")
      .eq("instance_name", "webhook")
      .eq("type", "whatsapp_evolution");

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Instância não achada");

    const cfg = data[0].config;
    console.log("Configs fetched:", cfg.instance_name);

    const baseUrl = cfg.api_url.replace(/\/$/, "");
    const url = baseUrl + "/message/sendText/webhook";

    const payload = {
      number: "5511950029191",
      options: { delay: 1000, presence: "composing" },
      textMessage: { text: "Teste Evolution V2 direto da source" },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.api_key,
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    console.log(`HTTP ${res.status}`);
    console.log("Response Body:", bodyText);
  } catch (err) {
    console.error(err);
  }
}

run();
