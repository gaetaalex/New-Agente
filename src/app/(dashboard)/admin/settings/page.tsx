"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  SlidersHorizontal,
  Save, 
  Loader2,
  DollarSign,
  Shield,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [prices, setPrices] = useState({
    monthly_price: '199.99',
    yearly_price: '159.99',
  });
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('na_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || profile.role !== 'master') { router.push('/dashboard'); return; }

      setIsAuthorized(true);

      // Carregar preços atuais
      const { data: settings } = await supabase
        .from('na_settings')
        .select('key, value')
        .in('key', ['monthly_price', 'yearly_price']);
      
      if (settings) {
        const mp = settings.find((s: any) => s.key === 'monthly_price');
        const yp = settings.find((s: any) => s.key === 'yearly_price');
        setPrices({
          monthly_price: mp?.value || '199.99',
          yearly_price: yp?.value || '159.99',
        });
      }

      // Atualizar também o checkout com os preços corretos
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      // Usar service_role via função RPC para modificar na_settings
      const { error: e1 } = await supabase.rpc('update_setting', {
        p_key: 'monthly_price',
        p_value: prices.monthly_price
      });
      const { error: e2 } = await supabase.rpc('update_setting', {
        p_key: 'yearly_price',
        p_value: prices.yearly_price
      });

      if (e1 || e2) throw e1 || e2;
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  const monthlyNum = parseFloat(prices.monthly_price) || 0;
  const yearlyNum = parseFloat(prices.yearly_price) || 0;

  return (
    <div className="max-w-2xl space-y-8 pb-16">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Configurações Globais</h1>
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest opacity-40">
            Preços dinâmicos · Admin Master
          </p>
        </div>

      </div>

      {/* Aviso de Segurança */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed font-medium">
          As alterações de preço afetarão <strong>novos assinantes</strong>. Assinaturas existentes no Mercado Pago não são alteradas automaticamente.
        </p>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mensal</p>
          </div>
          <p className="text-2xl font-bold italic text-foreground">R$ {monthlyNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-muted-foreground opacity-40 mt-1">por mês</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Anual</p>
          </div>
          <p className="text-2xl font-bold italic text-foreground">R$ {yearlyNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-muted-foreground opacity-40 mt-1">
            por mês · Total: R$ {(yearlyNum * 12).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>


      {/* Form */}
      <form onSubmit={handleSave} className="glass p-6 rounded-2xl border border-border space-y-6">
        <h2 className="text-sm font-bold text-foreground">Editar Preços</h2>

        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Preço Mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={prices.monthly_price}
                onChange={(e) => setPrices(p => ({ ...p, monthly_price: e.target.value }))}
                className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 transition-all text-sm font-bold text-foreground"
                placeholder="199.99"
              />
            </div>

          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Preço Anual — valor cobrado por mês (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={prices.yearly_price}
                onChange={(e) => setPrices(p => ({ ...p, yearly_price: e.target.value }))}
                className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 transition-all text-sm font-bold text-foreground"
                placeholder="159.99"
              />
            </div>

            <p className="text-[9px] text-muted-foreground opacity-40 ml-1">
              Desconto aplicado: {monthlyNum > 0 ? Math.round((1 - yearlyNum / monthlyNum) * 100) : 0}%
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!</>
          ) : (
            <><Save className="w-4 h-4" /> Salvar Preços</>
          )}
        </button>

      </form>
    </div>
  );
}
