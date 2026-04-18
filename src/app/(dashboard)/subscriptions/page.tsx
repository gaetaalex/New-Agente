"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ShoppingBag,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Loader2,
  Trash2,
  Globe,
  Eye,
  UserPlus,
  Image as ImageIcon,
  Database,
  HelpCircle,
  Scissors,
  Zap,
  X,
  Users,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plan' | 'hirings'>('plan');
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('na_profiles')
          .select('company_id, na_companies(*)')
          .eq('id', user.id)
          .single();
        
        if (profile?.na_companies) {
          setCompanyData(profile.na_companies);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 p-2 md:p-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-[1.2rem] border border-primary/30 shadow-lg shadow-primary/10">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">Minhas Assinaturas</h1>
            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Gestão de Recursos e Faturamento</p>
          </div>

        </div>

        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 self-start md:self-auto">
          <Plus className="w-4 h-4" /> Contratar Recurso
        </button>
      </header>

      {/* Tabs Design */}
      <div className="flex items-center gap-1 p-1 bg-muted border border-border rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('plan')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'plan' ? "bg-background text-foreground shadow-xl border border-border" : "text-muted-foreground/40 hover:text-muted-foreground/60"
          )}
        >
          <Receipt className="w-3.5 h-3.5" /> Minha Assinatura
        </button>
        <button
          onClick={() => setActiveTab('hirings')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'hirings' ? "bg-background text-foreground shadow-xl border border-border" : "text-muted-foreground/40 hover:text-muted-foreground/60"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Contratações
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground/40 font-medium italic">
        Gerencie suas contratações de subcontas, agentes publicados e outros recursos adicionais.
      </p>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total de Pagamentos", value: "0", icon: CreditCard, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Valor Total", value: "R$ 0,00", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Assinaturas Ativas", value: "0", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-[2rem] p-6 border border-border relative overflow-hidden group hover:border-primary/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{stat.label}</p>
                <p className="text-2xl font-black italic tracking-tighter text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>

        ))}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por ID ou descrição..."
            className="w-full bg-muted border border-border rounded-2xl py-4 pl-12 pr-5 text-[11px] font-bold text-foreground outline-none focus:border-primary/40 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {[
            { label: "Todos os Status", icon: Filter },
            { label: "Todas as Recorrências", icon: History },
            { label: "Todos", icon: ChevronDown },
          ].map((filter, i) => (
            <button key={i} className="px-5 py-4 bg-muted border border-border rounded-2xl text-[10px] font-bold text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-muted/80 transition-all flex items-center gap-3">
              {filter.label}
              <filter.icon className="w-3.5 h-3.5 opacity-40" />
            </button>
          ))}
        </div>
      </div>


      {/* List Area */}
      {activeTab === 'hirings' ? (
        <div className="glass rounded-[2.5rem] border border-border min-h-[400px] flex flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="w-24 h-24 bg-muted border border-border rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground/80">Lista de Contratações</h3>
              <p className="text-[11px] text-muted-foreground/30 font-medium leading-relaxed max-w-[280px] mx-auto italic">
                Nenhuma contratação encontrada. Novas contratações de subcontas e agentes aparecerão aqui.
              </p>
            </div>
          </motion.div>
        </div>

      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="glass rounded-[3rem] p-10 border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                 <div className="px-4 py-2 bg-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 shadow-2xl shadow-primary/20">
                    {companyData?.plan === 'PRO' ? 'Plano Ativo' : 'Plano Gratuito'}
                 </div>
              </div>
              
              <div className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                       <Zap className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">
                          {companyData?.plan || 'FREE'} <span className="text-primary tracking-widest italic font-bold text-sm">EDITION</span>
                       </h2>
                       <p className="text-[11px] text-muted-foreground/30 font-black uppercase tracking-widest mt-2 italic">Assinatura configurada para {companyData?.name || 'sua empresa'}</p>
                    </div>
                 </div>


                 <div className="space-y-4">
                    {[
                       { label: "Agentes Ilimitados", check: true },
                       { label: "Suporte Prioritário", check: companyData?.plan === 'PRO' },
                       { label: "Remover Branding", check: companyData?.plan === 'PRO' },
                       { label: "Múltiplas Conexões WhatsApp", check: companyData?.plan === 'PRO' },
                    ].map((feat, i) => (
                       <div key={i} className="flex items-center gap-4 group/item">
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all", feat.check ? "bg-emerald-500/20 text-emerald-500 scale-110" : "bg-muted text-muted-foreground/10")}>
                             {feat.check ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </div>
                          <span className={cn("text-[11px] font-bold italic tracking-tight", feat.check ? "text-foreground/70" : "text-muted-foreground/20")}>{feat.label}</span>
                       </div>
                    ))}
                 </div>

                 
                 <button className="w-full py-5 bg-muted border border-border rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xl">
                    Fazer Upgrade de Plano
                 </button>

              </div>
           </div>

           <div className="space-y-6">
              <div className="glass rounded-[2.5rem] p-8 border border-border flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Próxima Renovação</p>
                    <p className="text-xl font-black italic text-foreground leading-none">12 de Mai, 2026</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/20">
                    <Clock className="w-6 h-6" />
                 </div>
              </div>

              <div className="glass rounded-[2.5rem] p-8 border border-border flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Método de Pagamento</p>
                    <div className="flex items-center gap-3">
                       <CreditCard className="w-5 h-5 text-primary" />
                       <p className="text-xl font-black italic text-foreground leading-none">Cartão •••• 4242</p>
                    </div>
                 </div>

                 <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Alterar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
