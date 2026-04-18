"use server";

export async function proxyEvolutionFetch(url: string, endpoint: string, options: RequestInit = {}) {
  try {
    const baseUrl = url.replace(/\/$/, "");
    const fullUrl = `${baseUrl}${endpoint}`;

    // Inject bypass headers for popular tunnels (Ngrok, Localtunnel)
    const customHeaders = {
      ...(options.headers as any),
      "ngrok-skip-browser-warning": "true",
      "Bypass-Tunnel-Reminder": "true",
    };

    const res = await fetch(fullUrl, {
      ...options,
      headers: customHeaders,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.message || (data?.response && data?.response?.message) || `Erro ${res.status}: ${text.slice(0, 100)}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro de rede / Fetch falhou."
    };
  }
}
