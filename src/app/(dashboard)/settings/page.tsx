"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Key, 
  Headphones, 
  Zap, 
  AlertTriangle, 
  Plus, 
  CheckCircle2,
  ChevronRight,
  Info,
  Clock,
  Edit2,
  Loader2,
  Save,
  ZapOff
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [humanSupportKey, setHumanSupportKey] = useState("");
  const [autoActivate, setAutoActivate] = useState(true);
  const [reactivateTime, setReactivateTime] = useState(240);
  const [evolutionApiUrl, setEvolutionApiUrl] = useState("");
  const [evolutionApiKey, setEvolutionApiKey] = useState("");

  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apiKey, humanSupportKey, autoActivate, reactivateTime, evolutionApiUrl, evolutionApiKey, companyId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFetching(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('na_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      if (profile && profile.company_id) {
        setCompanyId(profile.company_id);
        const { data: company, error: companyError } = await supabase
          .from('na_companies')
          .select('settings')
          .eq('id', profile.company_id)
          .single();
        
        if (companyError) throw companyError;

        if (company) {
          const settings = (company.settings as any) || {};
          setApiKey(settings.api_key || "");
          setHumanSupportKey(settings.human_support_key || "");
          setAutoActivate(settings.auto_activate !== undefined ? settings.auto_activate : true);
          setReactivateTime(settings.reactivate_time || 240);
          setEvolutionApiUrl(settings.evolution_api_url || "");
          setEvolutionApiKey(settings.evolution_api_key || "");
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      alert("Erro: ID da empresa não encontrado. Tente recarregar a página.");
      return;
    }
    setSaving(true);
    try {
      // Primeiro buscamos as configurações atuais para não sobrescrever outros campos por acidente
      const { data: current, error: getError } = await supabase
        .from('na_companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (getError) throw getError;

      const updatedSettings = {
        ...(current?.settings || {}),
        api_key: apiKey,
        human_support_key: humanSupportKey,
        auto_activate: autoActivate,
        reactivate_time: reactivateTime,
        evolution_api_url: evolutionApiUrl,
        evolution_api_key: evolutionApiKey
      };

      const { error: updateError } = await supabase
        .from('na_companies')
        .update({ settings: updatedSettings })
        .eq('id', companyId);

      if (updateError) throw updateError;
      alert("✓ Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro crítico ao salvar:", error);
      alert("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="sticky top-0 z-[60] -mx-4 px-4 py-4 bg-background/80 backdrop-blur-2xl border-b border-border mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0">
              <Settings className="w-6 h-6 text-primary" />
           </div>
           <div>
              <h1 className="text-2xl font-black tracking-tight italic text-foreground">Configurações Globais</h1>
              <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest">Configurações Globais da Empresa</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/40">Atalho de Salvar</span>
             <span className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest">Ctrl + S disponivel</span>
          </div>
          <button 
             onClick={handleSave}
             disabled={saving}
             className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
             {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </header>

      {fetching ? (
        <div className="flex items-center justify-center py-20">
           <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* API Key Global */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[2.5rem] border border-border overflow-hidden flex flex-col hover:border-primary/20 transition-all shadow-2xl"
        >
           <div className="px-8 py-5 bg-muted border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Key className="w-4 h-4" />
                 </div>
                 <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80">API Key Global</span>
              </div>
              <div className={cn("w-2 h-2 rounded-full", apiKey ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
           </div>
           <div className="p-8 flex-1 space-y-6">
              <p className="text-[10px] text-muted-foreground/40 font-medium italic leading-relaxed text-center">
                Padrão para geração de conteúdo via IA em toda a plataforma.
              </p>

              <div className="space-y-4">
                  <input 
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-muted border border-border rounded-2xl py-4 px-6 text-xs font-bold text-center outline-none focus:border-primary/40 focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/40 shadow-inner"
                  />
                  {!apiKey ? (
                    <div className="py-4 flex flex-col items-center gap-3 opacity-20">
                       <AlertTriangle className="w-6 h-6 text-orange-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Pendente</span>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center gap-3">
                       <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Configurada</span>
                    </div>
                  )}
              </div>
           </div>
        </motion.div>

        {/* Atendimento Humano */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-[2.5rem] border border-border overflow-hidden flex flex-col hover:border-primary/20 transition-all shadow-2xl"
        >
           <div className="px-8 py-5 bg-muted border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Headphones className="w-4 h-4" />
                 </div>
                 <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80">Transbordo Humano</span>
              </div>

              <div className={cn("w-2 h-2 rounded-full", humanSupportKey ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
           </div>
           <div className="p-8 flex-1 space-y-6">
              <p className="text-[10px] text-muted-foreground/40 font-medium italic leading-relaxed text-center">
                Palavra-chave que dispara a notificação para suporte humano.
              </p>

              <div className="space-y-4">
                  <input 
                    type="text"
                    placeholder="Ex: SUPORTE"
                    value={humanSupportKey}
                    onChange={(e) => setHumanSupportKey(e.target.value)}
                    className="w-full bg-muted border border-border rounded-2xl py-4 px-6 text-xs font-black text-center outline-none focus:border-primary/40 focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                  />
                  {!humanSupportKey && (
                    <div className="py-4 flex flex-col items-center gap-3 opacity-20">
                       <ZapOff className="w-6 h-6 text-red-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Inativo</span>
                    </div>
                  )}
              </div>
           </div>
        </motion.div>

        {/* AI Activation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-[2.5rem] border border-border overflow-hidden flex flex-col hover:border-primary/20 transition-all shadow-2xl"
        >
           <div className="px-8 py-5 bg-muted border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Clock className="w-4 h-4" />
                 </div>
                 <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80">Reativação IA</span>
              </div>

              <div className="px-2.5 py-1 bg-emerald-500/10 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20">Auto</div>
           </div>
           <div className="p-8 flex-1 space-y-8">
              <p className="text-[10px] text-muted-foreground/40 font-medium italic leading-relaxed text-center">
                Tempo para a IA retomar o controle após o suporte humano finalizar.
              </p>

              
              <div className="flex flex-col items-center gap-4">
                <input 
                  type="number"
                  value={reactivateTime}
                  onChange={(e) => setReactivateTime(parseInt(e.target.value))}
                  className="w-32 bg-muted border border-border rounded-[2rem] py-6 text-center text-3xl font-black outline-none focus:border-primary/40 text-primary shadow-inner"
                />
                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/20 italic">Minutos de Espera</span>
              </div>
            </div>
         </motion.div>

         {/* Evolution API */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           className="glass rounded-[2.5rem] border border-border overflow-hidden flex flex-col md:col-span-2 xl:col-span-1 hover:border-primary/20 transition-all shadow-2xl"
         >
            <div className="px-8 py-5 bg-muted border-b border-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-primary-foreground shadow-lg shadow-emerald-500/20">
                     <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80">Evolution API</span>
               </div>
               <div className={cn(
                 "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                 evolutionApiUrl && evolutionApiKey ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
               )}>
                 {evolutionApiUrl && evolutionApiKey ? "Pronto" : "Pendente"}
               </div>
            </div>
            <div className="p-8 flex-1 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20 ml-4">Endpoint</p>
                      <input 
                        type="text"
                        placeholder="https://api.evolution.com"
                        value={evolutionApiUrl}
                        onChange={(e) => setEvolutionApiUrl(e.target.value)}
                        className="w-full bg-muted border border-border rounded-2xl py-3 px-5 text-[11px] font-bold outline-none focus:border-primary/40 transition-all text-foreground"
                      />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20 ml-4">API Token</p>
                      <input 
                        type="password"
                        placeholder="token..."
                        value={evolutionApiKey}
                        onChange={(e) => setEvolutionApiKey(e.target.value)}
                        className="w-full bg-muted border border-border rounded-2xl py-3 px-5 text-[11px] font-bold outline-none focus:border-primary/40 transition-all text-center text-foreground"
                      />
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 border border-emerald-400/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Gravando...' : 'Salvar Gateway'}
                </button>
            </div>
         </motion.div>
      </div>
      </>
      )}
    </div>
  );
}
