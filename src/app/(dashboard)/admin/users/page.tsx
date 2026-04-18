"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Star, 
  Filter,
  UserPlus,
  Loader2,
  Lock,
  Plus,
  X,
  Mail as MailIcon,
  Building,
  TrendingUp,
  ArrowUpRight,
  Globe,
  Database,
  BarChart3,
  CalendarDays,
  Users,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsersPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', company: '' });
  const [inviting, setInviting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
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
      fetchCompanies();
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;

      const formatted = (data || []).map((u: any) => ({
        id: u.id,
        company: u.company_name || 'Sem Empresa',
        company_id: u.company_id || u.id,
        email: u.email || '—',
        plan: u.plan?.toUpperCase() || 'FREE',
        status: u.is_active ? 'active' : 'blocked',
        joined: u.created_at,
        agentCount: Number(u.agent_count) || 0,
      }));

      setCompanies(formatted);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('send-invite', {
        body: { email: inviteData.email, companyName: inviteData.company }
      });
      if (error) throw error;
      setShowInviteModal(false);
      setInviteData({ email: '', company: '' });
      alert("Convite enviado!");
      fetchCompanies();
    } catch (error: any) {
      alert('Erro: ' + (error.message || 'Desconhecido'));
    } finally {
      setInviting(false);
    }
  };

  const togglePlan = async (company: any) => {
    const newPlan = company.plan === 'PRO' ? 'free' : 'pro';
    try {
      const { error } = await supabase
        .from('na_companies')
        .update({ plan: newPlan })
        .eq('id', company.company_id);
      if (error) throw error;
      fetchCompanies();
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  const toggleStatus = async (company: any) => {
    const newActive = company.status !== 'active';
    try {
      const { error } = await supabase
        .from('na_companies')
        .update({ is_active: newActive })
        .eq('id', company.company_id);
      if (error) throw error;
      fetchCompanies();
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  const filtered = companies.filter((c) =>
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const proCount = companies.filter(c => c.plan === 'PRO').length;
  const stats = [
    { label: 'Empresas', value: companies.length.toString(), icon: Building, color: 'text-blue-400' },
    { label: 'Plano PRO', value: proCount.toString(), icon: Star, color: 'text-amber-400' },
    { label: 'Faturamento', value: `R$ ${(proCount * 199.99).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Novos (30d)', value: companies.filter(c => new Date(c.joined) > new Date(Date.now() - 30 * 86400000)).length.toString(), icon: UserPlus, color: 'text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="h-screen -mt-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-30" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse text-muted-foreground">Verificando credenciais...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-full pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h1 className="text-xl font-bold tracking-tight">Admin Center</h1>
          </div>
          <p className="text-muted-foreground text-xs flex items-center gap-1.5 opacity-50 ml-3">
            <Globe className="w-3 h-3 text-primary" />
            Gestão Global · New Agent
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowInviteModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5" /> Convidar Cliente
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass p-4 rounded-2xl border border-border hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{stat.label}</p>
            <p className="text-lg font-bold tracking-tight text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>


      {/* Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table */}
        <div className="lg:col-span-9 glass rounded-2xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-3.5 h-3.5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Empresas Cadastradas</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">via na_companies</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-muted border border-border rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground w-52"
                />
              </div>
              <button className="p-2.5 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-all">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>


          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-1 p-3">
              <thead>
                <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                  <th className="px-4 py-2.5">Empresa / E-mail</th>
                  <th className="px-4 py-2.5 text-center">Plano</th>
                  <th className="px-4 py-2.5 text-center">Cadastro</th>
                  <th className="px-4 py-2.5 text-center">Agentes</th>
                  <th className="px-4 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((company, idx) => (
                    <motion.tr
                      key={company.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group bg-muted/10 hover:bg-muted/30 transition-all"
                    >

                      <td className="px-4 py-3 first:rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-border shrink-0">
                            <span className="font-bold text-xs text-primary">{company.company.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{company.company}</p>
                            <p className="text-[10px] text-muted-foreground/40">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePlan(company)}
                          className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                            company.plan === 'PRO'
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {company.plan}
                        </button>

                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-medium text-foreground/70">
                            {new Date(company.joined).toLocaleDateString('pt-BR')}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${company.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 text-muted-foreground">{company.status}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-foreground">{company.agentCount}</span>
                          <span className="text-[8px] text-muted-foreground uppercase">ativos</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right last:rounded-r">
                        <div className="flex justify-end gap-2 text-foreground">
                          <button
                            onClick={() => toggleStatus(company)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              company.status === 'active'
                                ? 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500'
                                : 'bg-green-500/20 text-green-500 shadow-lg shadow-green-500/10'
                            }`}
                            title={company.status === 'active' ? 'Suspender' : 'Reativar'}
                          >
                            {company.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button className="w-8 h-8 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg flex items-center justify-center transition-all border border-border">
                            <ArrowUpRight className="w-3.5 h-3.5 text-foreground" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground text-xs opacity-40">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Atividade</h3>
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-4">
              {[
                { user: 'S. Silva', type: 'Assinou PRO', time: '1h atrás' },
                { user: 'Admin', type: 'Convidou Usuário', time: '4h atrás' },
                { user: 'G. Barbearia', type: 'Novo Agente', time: '8h atrás' },
                { user: 'H. Fit', type: 'Cancelou Plano', time: '12h atrás' },
              ].map((act, i) => (
                <div key={i} className="flex gap-3 items-start pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground/90">{act.type}</p>
                    <div className="flex justify-between items-center mt-0.5">

                      <span className="text-[9px] text-muted-foreground uppercase">{act.user}</span>
                      <span className="text-[9px] font-bold text-primary uppercase">{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 bg-muted rounded-xl text-[9px] font-bold uppercase tracking-widest border border-border hover:bg-muted/80 transition-all text-muted-foreground/60">
              Ver Logs
            </button>
          </div>

          <div className="glass p-5 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CalendarDays className="w-5 h-5 text-primary mb-3 opacity-60" />
            <p className="text-xs font-bold text-foreground/90">Próximo Ciclo</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">15 de Abril, 2026</p>
            <div className="w-full h-1 bg-muted rounded-full mt-4 overflow-hidden">
              <div className="w-3/4 h-full bg-primary" />
            </div>
          </div>

        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Convidar Cliente</h2>
              <p className="text-muted-foreground text-xs mt-1">Um e-mail seguro será enviado para configuração de senha.</p>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary/50 transition-all text-sm text-foreground"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Empresa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={inviteData.company}
                    onChange={(e) => setInviteData({ ...inviteData, company: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary/50 transition-all text-sm text-foreground"
                    placeholder="Gaeta Barbearia"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Convite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
