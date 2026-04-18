"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MessageSquare, Database, Globe, Plus, Settings2,
  Phone, Workflow, X, Loader2, CheckCircle2, AlertTriangle, Info,
  QrCode, RefreshCw, Copy, ExternalLink, Trash2, Link as LinkIcon,
  Wifi, WifiOff, ChevronRight, Check, Bot, CreditCard, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { proxyEvolutionFetch } from "./actions";

// ---------- Types ----------
interface Integration {
  id?: string;
  type: string;
  status: string;
  config: Record<string, any>;
  instance_name?: string;
}

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
}

// ---------- Evolution API helpers (client-side proxied through our next API) ----------
const EVOLUTION_DEFAULTS = {
  api_url: "http://localhost:8080",
  api_key: "",
  instance_name: ""
};

// ---------- Main Page ----------
export default function IntegrationsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loadingData, setLoadingData] = useState(true);

  // WhatsApp modal state
  const [showWAModal, setShowWAModal] = useState(false);
  const [waConfig, setWaConfig] = useState<EvolutionConfig>(EVOLUTION_DEFAULTS);
  const [waStep, setWaStep] = useState<"config" | "qr" | "connected">("config");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Estados para Integrações Estáticas
  const [showStaticModal, setShowStaticModal] = useState<any>(null);
  const [staticConfig, setStaticConfig] = useState<any>({});
  const [savingData, setSavingData] = useState(false);

  // -------- Load company & integrations --------
  useEffect(() => {
    loadData();
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingData(false); return; }

      const { data: profile, error: profileError } = await supabase
        .from("na_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      let profileCompanyId = profile?.company_id;

      if (profileError || !profileCompanyId) { 
        console.warn("Perfil não encontrado! Auto-Heal Iniciando. Procurando empresas disponíveis para vincular o usuário órfão.");
        // Auto-heal: Atrelar à primeira empresa Mestra que encontrar
        const { data: fallbackComp } = await supabase.from("na_companies").select("id").limit(1).single();
        if (fallbackComp?.id) {
          await supabase.from("na_profiles").upsert({
            id: user.id,
            company_id: fallbackComp.id,
            full_name: "Recuperado Vercel",
            role: "user"
          });
          profileCompanyId = fallbackComp.id;
          console.log("Auto-heal Concluído! Perfil atrelado à empresa:", profileCompanyId);
        } else {
           setLoadingData(false); 
           return; 
        }
      }
      
      setCompanyId(profileCompanyId);

      const { data: rows } = await supabase
        .from("na_integrations")
        .select("*")
        .eq("company_id", profileCompanyId);

      const map: Record<string, Integration> = {};
      (rows || []).forEach((r: any) => { map[r.type] = r; });
      setIntegrations(map);

      // Restore WhatsApp config form
      const wa = map["whatsapp_evolution"];
      if (wa) {
        setWaConfig({
          api_url: wa.config?.api_url || EVOLUTION_DEFAULTS.api_url,
          api_key: wa.config?.api_key || "",
          instance_name: wa.instance_name || wa.config?.instance_name || ""
        });
        if (wa.status === "connected") setWaStep("connected");
      }
    } catch (err) {
      console.error("Erro fatal no carregamento:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // -------- Save integration record --------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const saveIntegration = async (type: string, status: string, config: any, instanceName?: string) => {
    if (!companyId) {
      console.warn("ID da empresa não disponível.");
      return false;
    }
    try {
      const { error } = await supabase
        .from("na_integrations")
        .upsert({
          company_id: companyId,
          type,
          status,
          config,
          instance_name: instanceName || config?.instance_name || null,
          updated_at: new Date().toISOString()
        }, { onConflict: "company_id,type" });

      if (error) throw error;

      await loadData();
      return true;
    } catch (err: any) {
      console.error("Erro ao salvar integração:", err);
      alert(`Erro ao salvar integração: ${err.message}`);
      return false;
    }
  };

  // ======= WhatsApp / Evolution API =======

  const handleOpenWA = () => {
    const wa = integrations["whatsapp_evolution"];
    if (wa?.status === "connected") {
      setWaStep("connected");
    } else {
      setWaStep("config");
      setQrCode(null);
      setWaError(null);
    }
    setShowWAModal(true);
  };

  const handleCreateInstance = async () => {
    if (!waConfig.api_url || !waConfig.api_key || !waConfig.instance_name) {
      setWaError("Preencha todos os campos.");
      return;
    }
    setWaLoading(true);
    setWaError(null);
    try {
      let rawUrl = (waConfig.api_url || "").trim();
      if (!rawUrl.startsWith("http")) {
        throw new Error("A URL deve começar com http:// ou https://");
      }

      // Sanitização: Extrair apenas a base
      let baseUrl = "";
      try {
        const urlObj = new URL(rawUrl);
        baseUrl = urlObj.origin;
      } catch {
        baseUrl = rawUrl.replace(/\/$/, "");
      }
      
      console.log("[Evolution Sanitized URL]", baseUrl);

      // 1. Criar instância via Server Action Proxy (Bypass CORS)
      const resServer = await proxyEvolutionFetch(baseUrl, "/instance/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": waConfig.api_key
        },
        body: JSON.stringify({
          instanceName: waConfig.instance_name,
          token: waConfig.api_key,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS", // Exigência da Evolution v2
          reject_call: false
        }),
      });

      if (!resServer.success) {
        const customMsg = resServer.error || "";
        const msgLow = customMsg.toLowerCase();
        const isAlreadyExists = msgLow.includes("already exists");

        if (!isAlreadyExists) {
          throw new Error(customMsg);
        } else {
          console.log("[Evolution] Instância já existente no servidor informada! Pulando para etapa de QR Code...");
        }
      } else {
         console.log("[Evolution CREATE SUCCESS]", resServer.data);
      }

      // Salvar configuração parcial
      await saveIntegration("whatsapp_evolution", "pending", waConfig, waConfig.instance_name);

      // 2. Configurar Webhook na Evolution para apontar para a Vercel
      const vercelUrl = "https://mercado-agentes-clone.vercel.app/api/evolution/webhook";
      console.log("[Evolution] Configurando Webhook:", vercelUrl);
      
      await proxyEvolutionFetch(baseUrl, `/webhook/set/${waConfig.instance_name}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": waConfig.api_key 
        },
        body: JSON.stringify({
          url: vercelUrl,
          enabled: true,
          webhook_by_events: false,
          events: ["MESSAGES_UPSERT"]
        })
      });

      // 3. Conectar e buscar QR Code
      await fetchQRCode(baseUrl);

    } catch (err: any) {
      console.error("[Evolution ERROR]", err);
      if (err.message === "Failed to fetch") {
        setWaError("Erro de Conexão: O navegador não conseguiu acessar a URL da API. Verifique se o endereço está correto e se o serviço está online (CORS pode ser um problema se a API for http).");
      } else {
        setWaError(err.message);
      }
    } finally {
      setWaLoading(false);
    }
  };

  const fetchQRCode = async (baseUrl?: string) => {
    const url = (baseUrl || waConfig.api_url).replace(/\/$/, "");
    setWaLoading(true);
    try {
      console.log("[Evolution FETCH QR] Calling connect for:", waConfig.instance_name);
      // Conectar instância
      const resServer = await proxyEvolutionFetch(url, `/instance/connect/${waConfig.instance_name}`, {
        method: "GET",
        headers: { "apikey": waConfig.api_key }
      });
      
      if (!resServer.success) throw new Error(resServer.error);
      const connectData = resServer.data;
      console.log("[Evolution FETCH QR RESPONSE]", connectData);

      if (connectData.base64) {
        setQrCode(connectData.base64);
        setWaStep("qr");
        startPolling(url);
      } else if (connectData.instance?.state === "open" || connectData.state === "open") {
        await handleConnected();
      } else {
        setWaError("QR Code não disponível ainda. Instância pode estar em estado: " + (connectData.instance?.state || connectData.state || 'desconhecido'));
      }
    } catch (err: any) {
      setWaError("Erro ao buscar QR Code: " + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  const startPolling = (baseUrl: string) => {
    if (pollingInterval) clearInterval(pollingInterval);
    const interval = setInterval(async () => {
      try {
        const resServer = await proxyEvolutionFetch(baseUrl, `/instance/connectionState/${waConfig.instance_name}`, {
          method: "GET",
          headers: { "apikey": waConfig.api_key }
        });
        
        if (resServer.success) {
          const data = resServer.data;
          console.log("[Evolution STATUS POLL]", data);

          if (data.instance?.state === "open" || data.state === "open") {
            clearInterval(interval);
            setPollingInterval(null);
            await handleConnected();
          }
        }
      } catch { /* silent */ }
    }, 4000);
    setPollingInterval(interval);
  };

  const handleConnected = async () => {
    setQrCode(null);
    setWaStep("connected");
    await saveIntegration("whatsapp_evolution", "connected", waConfig, waConfig.instance_name);
  };

  const handleSyncWebhook = async () => {
    setWaLoading(true);
    try {
      const baseUrl = waConfig.api_url.replace(/\/$/, "");
      const vercelUrl = "https://mercado-agentes-clone.vercel.app/api/evolution/webhook";
      
      const resServer = await proxyEvolutionFetch(baseUrl, `/webhook/set/${waConfig.instance_name}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": waConfig.api_key 
        },
        body: JSON.stringify({
          url: vercelUrl,
          enabled: true,
          webhook_by_events: false,
          events: ["MESSAGES_UPSERT"]
        })
      });

      if (!resServer.success) throw new Error(resServer.error);
      alert("Webhook sincronizado com sucesso! Seu WhatsApp agora está ligado à Vercel.");
      setShowWAModal(false);
    } catch (err: any) {
      setWaError("Erro ao sincronizar: " + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnectWA = async () => {
    if (!window.confirm("Desconectar o WhatsApp desta instância?")) return;
    setWaLoading(true);
    try {
      const baseUrl = waConfig.api_url.replace(/\/$/, "");
      const resServer = await proxyEvolutionFetch(baseUrl, `/instance/logout/${waConfig.instance_name}`, {
        method: "DELETE",
        headers: { "apikey": waConfig.api_key }
      });
      if (!resServer.success) throw new Error(resServer.error);
      
      await saveIntegration("whatsapp_evolution", "disconnected", waConfig, waConfig.instance_name);
      setWaStep("config");
      setShowWAModal(false);
    } catch (err: any) {
      setWaError(err.message);
    } finally {
      setWaLoading(false);
    }
  };

  const handleOpenStatic = (item: any) => {
    // Carregar config existente se houver
    const existing = integrations[item.type];
    setStaticConfig(existing?.config || {});
    setShowStaticModal(item);
  };

  const handleSaveStatic = async () => {
    setSavingData(true);
    const success = await saveIntegration(showStaticModal.type, "connected", staticConfig, "");
    setSavingData(false);
    if (success) {
      alert("Configurações salvas com sucesso!");
      setShowStaticModal(null);
    }
  };

  // -------- Render --------

  const waIntegration = integrations["whatsapp_evolution"];
  const waStatus = waIntegration?.status || "disconnected";

  const staticIntegrations = [
    { 
      type: "typebot", 
      name: "Typebot", 
      desc: "Integre seus fluxos do Typebot para captura de leads qualificados.", 
      icon: MessageSquare, 
      color: "bg-orange-500", 
      category: "Automação",
      fields: [
        { key: "url", label: "URL do Visualize", placeholder: "https://typebot.co/..." },
        { key: "token", label: "Token API", placeholder: "Seu token do workspace" }
      ]
    },
    { 
      type: "n8n", 
      name: "n8n", 
      desc: "Conecte workflows complexos de automação e IA diretamente ao dashboard.", 
      icon: Bot, 
      color: "bg-red-500", 
      category: "Infraestrutura",
      fields: [
        { key: "url", label: "URL da Instância", placeholder: "https://n8n.suaempresa.com" },
        { key: "api_key", label: "API Key", placeholder: "Sua chave de API do n8n" }
      ]
    },
    { 
      type: "stripe", 
      name: "Stripe", 
      desc: "Receba pagamentos e gerencie assinaturas de forma automatizada.", 
      icon: CreditCard, 
      color: "bg-indigo-500", 
      category: "Financeiro" 
    },
    { 
      type: "google_calendar", 
      name: "Google Calendar", 
      desc: "Sincronize agendamentos automaticamente com sua conta do Google.", 
      icon: Calendar, 
      color: "bg-blue-600", 
      category: "Agenda",
      fields: [
        { key: "client_id", label: "Client ID (Google Console)", placeholder: "vok-..." },
        { key: "client_secret", label: "Client Secret", placeholder: "GOCSPX-..." }
      ]
    },
    { type: "supabase", name: "Supabase CRM", desc: "Sincronização nativa de leads e contatos com seu banco de dados.", icon: Database, color: "bg-[#3ecf8e]", category: "Dados" }
  ];

  return (
    <div className="space-y-10 pb-20 p-4 md:p-6">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <LinkIcon className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Integrações</h1>
        </div>
        <p className="text-muted-foreground text-xs ml-10">Conecte o New Agent com suas ferramentas favoritas</p>
      </header>

      {loadingData ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4">
          {/* ===== WhatsApp / Evolution API Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={cn(
              "glass rounded-[2rem] border transition-all group relative overflow-hidden flex flex-col h-full shadow-2xl hover:border-primary/40",
              waStatus === "connected" ? "border-green-500/20" : "border-border"
            )}
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-all border border-emerald-400/20">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5",
                  waStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  <div className={cn("w-1 h-1 rounded-full", waStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  {waStatus === "connected" ? "Ativo" : "Offline"}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black italic tracking-tighter uppercase text-foreground group-hover:text-primary transition-colors">Evolution API</h3>
                <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5">Gestão profissional de WhatsApp</p>
              </div>

              {waStatus === "connected" && (
                <div className="bg-muted border border-border rounded-xl p-2.5 space-y-1">
                   <div className="flex items-center gap-2">
                      <Wifi className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] font-bold text-foreground uppercase truncate">{waIntegration?.instance_name}</span>
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex gap-2">
               <button 
                  onClick={handleOpenWA}
                  className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all border border-border"
               >
                  Configurar
               </button>
               {waStatus === "connected" && (
                 <button 
                    onClick={handleDisconnectWA}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20"
                 >
                    <WifiOff className="w-4 h-4" />
                 </button>
               )}
            </div>
          </motion.div>

          {/* ===== Outros cards estáticos ===== */}
          {staticIntegrations.map((item, i) => {
            const integration = integrations[item.type];
            const status = item.type === "supabase" ? "connected" : (integration?.status || "disconnected");
            return (
              <motion.div
                key={item.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.05 }}
                className={cn(
                  "glass rounded-[2rem] border transition-all group relative overflow-hidden flex flex-col h-full shadow-2xl hover:border-primary/40",
                  status === "connected" ? "border-primary/20" : "border-border"
                )}
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all border border-border", item.color)}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-muted rounded text-muted-foreground border border-border">{item.category}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black italic tracking-tighter uppercase text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border flex gap-2">
                  <button 
                    onClick={() => handleOpenStatic(item)}
                    className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all border border-border"
                  >
                    Detalhes
                  </button>
                  <button 
                    onClick={() => handleOpenStatic(item)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg",
                      status === "connected" ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-105 active:scale-95"
                    )}
                  >
                    {status === "connected" ? "Ativo" : "Conectar"}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Card Nova Integração */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={() => alert("Novas integrações em desenvolvimento pela equipe do Mercado Agentes.")}
            className="glass rounded-[2rem] border border-dashed border-border flex flex-col items-center justify-center p-8 gap-4 group hover:border-primary/40 hover:bg-muted/50 transition-all cursor-pointer min-h-[220px]"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 border border-border transition-all shadow-inner">
              <Plus className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary transition-all" />
            </div>
            <div className="text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-all">Nova Integração</p>
               <p className="text-[8px] text-muted-foreground/30 font-bold italic group-hover:text-muted-foreground/50">Em Breve</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== WhatsApp Modal ===== */}
      <AnimatePresence>
        {showWAModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowWAModal(false); if (pollingInterval) clearInterval(pollingInterval); } }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass w-full max-w-md rounded-2xl border border-[#25D366]/20 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#25D366] rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">WhatsApp via Evolution API</h2>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                      {waStep === "config" ? "Configuração de Instância" : waStep === "qr" ? "Escaneie o QR Code" : "Conectado ✓"}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowWAModal(false); if (pollingInterval) clearInterval(pollingInterval); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {waStep === "config" && (
                  <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                       <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-emerald-200/60 font-medium leading-relaxed">
                          Insira apenas a <b>URL Base</b> da sua Evolution API (ex: https://api.suaempresa.com). 
                          O sistema cuidará do restante automaticamente.
                       </p>
                    </div>

                    {typeof window !== "undefined" && window.location.protocol === "https:" && waConfig.api_url?.includes("http://") && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
                         <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                         <p className="text-[10px] text-orange-700 font-medium leading-relaxed">
                            <b>Atenção:</b> Você está em um ambiente seguro (HTTPS), mas tentando conectar a uma API insegura (HTTP). 
                            Isso pode ser bloqueado pelo navegador. Use uma URL com HTTPS ou configure um túnel.
                         </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4">URL da Evolution API</label>
                      <input
                        type="text"
                        placeholder="http://localhost:8080"
                        value={waConfig.api_url}
                        onChange={(e) => setWaConfig({ ...waConfig, api_url: e.target.value })}
                        className="w-full bg-muted/30 border border-border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-primary/40 focus:bg-muted/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                      />
                    </div>

                    <div className="space-y-1.5 p-3 bg-muted border border-border rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Dica para Docker Local</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
                        No seu Docker, a <b>Global Key</b> é o valor definido na variável <code className="text-primary/70 font-mono">AUTHENTICATION_API_KEY</code> do seu arquivo <code className="text-primary/70 font-mono">.env</code>.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">API Key (Global Key)</label>
                      <input
                        value={waConfig.api_key}
                        onChange={(e) => setWaConfig(p => ({ ...p, api_key: e.target.value }))}
                        placeholder="Dê uma olhada no seu .env"
                        type="password"
                        className="w-full bg-muted border border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[#25D366]/50 transition-all text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Instância</label>
                      <input
                        value={waConfig.instance_name}
                        onChange={(e) => setWaConfig(p => ({ ...p, instance_name: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                        placeholder="minha-empresa-wa"
                        className="w-full bg-muted border border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[#25D366]/50 transition-all text-foreground"
                      />
                      <p className="text-[9px] text-muted-foreground opacity-50 ml-1">Apenas letras minúsculas, números e hífens</p>
                    </div>

                    {waError && (
                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {waError}
                      </div>
                    )}

                    <button
                      onClick={handleCreateInstance}
                      disabled={waLoading || !waConfig.api_url || !waConfig.api_key || !waConfig.instance_name}
                      className="w-full py-3.5 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {waLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      {waLoading ? "Criando instância..." : "Gerar QR Code"}
                    </button>
                  </div>
                )}

                {/* Passo 2: QR Code */}
                {waStep === "qr" && (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">Abra o WhatsApp no celular → <strong>Aparelhos Conectados</strong> → <strong>Conectar</strong> e escaneie:</p>

                    {qrCode ? (
                      <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-2xl">
                        <img
                          src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code WhatsApp"
                          className="w-52 h-52 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-52 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-[#25D366] opacity-60" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 text-[10px] text-yellow-700">
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                      Aguardando conexão... O QR Code expira em 60 segundos.
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => fetchQRCode()} disabled={waLoading} className="flex-1 py-2.5 bg-muted border border-border rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5">
                        {waLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Novo QR
                      </button>
                      <button onClick={() => setWaStep("config")} className="flex-1 py-2.5 bg-muted border border-border rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all">
                        Voltar
                      </button>
                    </div>

                    {waError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-[10px] text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5" /> {waError}
                      </div>
                    )}
                  </div>
                )}

                {/* Passo 3: Conectado */}
                {waStep === "connected" && (
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-700">WhatsApp Conectado!</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">Sua instância está ativa e pronta para receber mensagens.</p>
                    </div>

                    <div className="bg-muted border border-border rounded-xl p-3 space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Instância</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-foreground">{waConfig.instance_name}</span>
                          <button onClick={() => copyToClipboard(waConfig.instance_name)} className="p-1 hover:bg-muted rounded">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">URL API</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">{waConfig.api_url}</span>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-[11px] text-primary/80 leading-relaxed text-left">
                      🤖 Os agentes agora podem receber e responder mensagens do WhatsApp automaticamente via esta instância.
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleSyncWebhook}
                        disabled={waLoading}
                        className="flex-1 py-3 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
                      >
                        {waLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Sincronizar e Concluir
                      </button>
                      <button
                        onClick={handleDisconnectWA}
                        className="py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-600"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Integrações Estáticas */}
      <AnimatePresence>
        {showStaticModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setShowStaticModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", showStaticModal.color)}>
                    <showStaticModal.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Configurações de Integração</p>
                  </div>
                </div>
                <button onClick={() => setShowStaticModal(null)} className="p-1.5 hover:bg-muted rounded-lg transition-all">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {showStaticModal.fields?.map((field: any) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4">{field.label}</label>
                    <input 
                      type="text" 
                      placeholder={field.placeholder}
                      className="w-full bg-muted/30 border border-border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-primary/40 focus:bg-muted/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                      value={staticConfig[field.key] || ""}
                      onChange={(e) => setStaticConfig({...staticConfig, [field.key]: e.target.value})}
                    />
                  </div>
                ))}

                {showStaticModal.id === 'n8n' && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-3">
                     <div className="flex items-center gap-2">
                        <Workflow className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Como usar os nós n8n?</h4>
                     </div>
                     <ol className="text-[10px] text-muted-foreground space-y-2 list-decimal ml-4 font-medium leading-relaxed">
                        <li>Acesse o menu <b>Agentes</b> e escolha um agente.</li>
                        <li>Vá na aba <b>Fluxo</b> para abrir o construtor visual.</li>
                        <li>Arraste o nó <b>"n8n Workflow"</b> para o canvas.</li>
                        <li>Configure a URL do Webhook gerada no seu n8n.</li>
                     </ol>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowStaticModal(null)}
                    className="flex-1 py-4 bg-muted border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all text-foreground"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveStatic}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    disabled={savingData}
                  >
                    {savingData ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Salvar e Ativar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
