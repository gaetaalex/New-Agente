"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Check, 
  X, 
  Rocket, 
  Star,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const resources = [
  { label: "Agentes Publicados", current: 1, limit: 1, color: "bg-red-500" },
  { label: "Agendas Ativas", current: 0, limit: 1, color: "bg-blue-500" },
  { label: "Base de Contatos", current: 0, limit: 100, color: "bg-blue-500" },
  { label: "Fluxos IA", current: 0, limit: 5, color: "bg-blue-500" },
  { label: "Produtos", current: 0, limit: 20, color: "bg-blue-500" },
  { label: "Usuários", current: 0, limit: 1, color: "bg-blue-500" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [prices, setPrices] = useState({ monthly: 199.99, yearly: 159.99 });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

    // Buscar preços dinâmicos
    const { data: settings } = await supabase
      .from('na_settings')
      .select('key, value')
      .in('key', ['monthly_price', 'yearly_price']);

    if (settings) {
      const mp = settings.find(s => s.key === 'monthly_price');
      const yp = settings.find(s => s.key === 'yearly_price');
      setPrices({
        monthly: mp ? parseFloat(mp.value) : 199.99,
        yearly: yp ? parseFloat(yp.value) : 159.99,
      });
    }
  };

  const handleUpgrade = async () => {
    if (!companyData) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('mercado-pago-checkout', {
        body: { companyId: companyData.id, userEmail: user?.email, billingCycle }
      });
      if (error) throw error;
      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Link de pagamento não retornado.");
      }
    } catch (err: any) {
      alert(`Erro no Upgrade: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!companyData) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercado-pago-cancel', {
        body: { companyId: companyData.id }
      });
      if (error) throw error;
      if (data?.success) {
        setShowCancelConfirm(false);
        await fetchData();
        alert("Assinatura cancelada. Você voltou ao plano gratuito.");
      } else {
        throw new Error(data?.error || "Erro ao cancelar.");
      }
    } catch (err: any) {
      alert(`Erro ao cancelar: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const isPro = companyData?.plan === 'pro';
  const currentPrice = billingCycle === 'yearly' ? prices.yearly : prices.monthly;
  const yearlyTotal = (prices.yearly * 12).toFixed(2).replace('.', ',');

  return (
    <div className="space-y-10 pb-20 p-4 md:p-6 animate-in fade-in duration-700">
      <header className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gestão de Conta</h1>
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest opacity-40">Assinatura e Limites</p>
        </div>
      </header>

      {/* Status Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[2.5rem] border border-border p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="px-4 py-1.5 bg-primary/20 border border-primary/20 rounded-full inline-flex items-center gap-2 shadow-2xl shadow-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Status Global</span>
            </div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                {isPro ? 'Enterprise PRO' : 'Starter FREE'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-3 italic">Identificador ID: {companyData?.id?.substring(0,8) || 'Carregando...'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap bg-muted/50 px-6 py-5 rounded-[2rem] border border-border gap-8 items-center shadow-inner">
            <div>
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic">Renovação</p>
              <p className="text-sm font-black italic text-primary uppercase tracking-tighter mt-1">{isPro ? 'Automática' : 'Indisponível'}</p>
            </div>
            {!isPro && (
              <>
                <div className="w-px h-8 bg-border" />
                <button 
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Fazer Upgrade Agora
                </button>
              </>
            )}
            {isPro && (
              <>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic">Próximo Débito</p>
                  <p className="text-sm font-black italic text-foreground/80 uppercase tracking-tighter mt-1">

                    {companyData?.next_billing_date 
                      ? new Date(companyData.next_billing_date).toLocaleDateString('pt-BR') 
                      : 'Agendado'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {resources.map((res) => (
            <div key={res.label} className="space-y-3 group">
              <div className="flex justify-between items-end px-1">
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter italic group-hover:text-muted-foreground/60 transition-colors">{res.label}</p>
                <span className="text-[10px] font-black italic text-primary">
                  {Math.round((res.current / res.limit) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border p-[2px] shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(res.current / res.limit) * 100}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={cn("h-full rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]", res.color)}
                />
              </div>
            </div>
          ))}
        </div>

        {isPro && (
          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20 hover:text-red-500 transition-all italic hover:underline decoration-red-500/30 underline-offset-4"
            >
              Interromper assinatura pro
            </button>
          </div>
        )}

      </motion.div>

      {/* Plan Selection */}
      <div id="plans-section" className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Escolha sua Potência</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Escalabilidade com agentes de IA</p>
          
          <div className="inline-flex bg-muted p-1 rounded-2xl border border-border mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all relative ${
                billingCycle === 'yearly' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <span className="absolute -top-2.5 -right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plano Gratuito */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-7 rounded-2xl border-2 border-border flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center border border-border">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold italic">Gratuito</h3>
                <p className="text-xs text-muted-foreground opacity-50">Para começar a automatizar.</p>
              </div>
              <div className="text-4xl font-bold italic">Grátis</div>

              <div className="space-y-3 pt-2">
                {[
                  { text: "1 agente publicado", on: true },
                  { text: "100 contatos", on: true },
                  { text: "1 agenda", on: true },
                  { text: "Instâncias WhatsApp", on: false },
                  { text: "Suporte prioritário", on: false },
                ].map((f, j) => (
                  <div key={j} className={`flex items-center gap-3 ${f.on ? '' : 'opacity-20'}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${f.on ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                      {f.on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>

                    <p className="text-sm font-medium">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <button disabled className="w-full mt-8 py-3.5 rounded-xl border-2 border-green-500/40 text-green-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
              <ShieldCheck className="w-4 h-4" /> {isPro ? 'Plano Básico' : 'Seu Plano Atual'}
            </button>
          </motion.div>

          {/* Plano PRO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-7 rounded-2xl border-2 border-primary/30 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-7 right-7 px-4 py-1.5 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/20">
              <Star className="w-3 h-3 fill-primary-foreground" /> Premium
            </div>

            
            <div className="space-y-6">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                <Rocket className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold italic">Plano PRO</h3>
                <p className="text-xs text-muted-foreground opacity-50">Automação sem limites.</p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold italic">
                    {isPro ? 'ATUAL' : `R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                  {!isPro && <span className="text-muted-foreground text-xs">/mês</span>}
                </div>
                {billingCycle === 'yearly' && !isPro && (
                  <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-1">
                    Total anual: R$ {yearlyTotal}
                  </p>
                )}
                <p className="text-[8px] text-primary uppercase tracking-widest opacity-40 mt-1">via Mercado Pago</p>
              </div>
              <div className="space-y-3 pt-2">
                {[
                  { text: "Tudo do plano Gratuito", on: true },
                  { text: "Instâncias WhatsApp ilimitadas", on: true },
                  { text: "Agentes publicados ilimitados", on: true },
                  { text: "Base de Contatos ilimitada", on: true },
                  { text: "Suporte prioritário", on: true },
                ].map((f, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-primary/20 border border-primary/30 text-primary flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <p className="text-sm font-medium">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={!isPro ? handleUpgrade : undefined}
              disabled={loading || isPro}
              className={`w-full mt-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${
                isPro
                  ? 'border-2 border-green-500/50 text-green-500 cursor-default'
                  : 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'
              }`}
            >

              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {isPro ? <ShieldCheck className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                  <span>{isPro ? 'Assinatura Ativa' : 'Fazer Upgrade'}</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass w-full max-w-sm p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Cancelar Assinatura?</h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Você perderá acesso às funcionalidades PRO imediatamente. Seus dados serão preservados, mas os agentes extras serão pausados.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 bg-muted border border-border rounded-xl text-sm font-bold hover:bg-muted/80 transition-all text-foreground"
                >
                  Manter PRO
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >

                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cancelamento'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
