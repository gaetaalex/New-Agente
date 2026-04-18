"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Plus, 
  Search, 
  Settings2, 
  Activity, 
  MessageSquare,
  Zap,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Settings,
  Users,
  MessageCircle,
  MessageSquareShare
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AgentTestChat from "@/components/AgentTestChat";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [testingAgent, setTestingAgent] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    system_prompt: "",
    is_active: true
  });

  const openEditModal = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      system_prompt: agent.system_prompt || "",
      is_active: agent.is_active
    });
    setIsModalOpen(true);
  };

  const closeAndReset = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    setFormData({ name: "", system_prompt: "", is_active: true });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: profile } = await supabase
        .from("na_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      let currentCompanyId = profile?.company_id;

      if (!currentCompanyId) {
        console.warn("Perfil não encontrado em Agents! Iniciando Auto-Heal...");
        const { data: fallbackComp } = await supabase.from("na_companies").select("id").limit(1).single();
        if (fallbackComp?.id) {
          await supabase.from("na_profiles").upsert({
            id: user.id,
            company_id: fallbackComp.id,
            full_name: "Recuperado Vercel",
            role: "user"
          });
          currentCompanyId = fallbackComp.id;
        } else {
          return;
        }
      }

      setCompanyId(currentCompanyId);
      await fetchAgents(currentCompanyId);
    } catch (err) {
      console.error("Erro inicial:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async (cid?: string) => {
    const targetCid = cid || companyId;
    if (!targetCid) return;

    try {
      const { data, error } = await supabase
        .from("na_agents")
        .select("*")
        .eq("company_id", targetCid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error("Erro ao buscar agentes:", err);
    }
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setSaving(true);
    try {
      if (editingAgent) {
        const { error } = await supabase
          .from("na_agents")
          .update(formData)
          .eq("id", editingAgent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("na_agents")
          .insert([
            {
              ...formData,
              company_id: companyId
            }
          ]);
        if (error) throw error;
      }

      closeAndReset();
      await fetchAgents();
    } catch (err) {
      console.error("Erro ao salvar agente:", err);
      alert("Erro ao salvar agente");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (agent: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm({ id: agent.id, name: agent.name });
  };

  const handleDeleteAgent = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("na_agents")
        .delete()
        .eq("id", deleteConfirm.id);

      if (error) throw error;

      setAgents(prev => prev.filter(a => a.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err?.message || String(err)}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Agentes (Gerenciador)</h1>
          <p className="text-muted-foreground text-xs mt-1">Gerencie e configure suas inteligências artificiais de forma dinâmica.</p>
        </div>
        <Link 
          href="/agents/new"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou ID..." 
            className="w-full bg-muted border border-border rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-3 bg-muted border border-border rounded-2xl flex items-center gap-2 font-medium hover:bg-muted/80 transition-all">
            <Activity className="w-4 h-4" />
            Todos os Status
          </button>
          <button className="px-4 py-3 bg-muted border border-border rounded-2xl flex items-center gap-2 font-medium hover:bg-muted/80 transition-all">
            <Settings2 className="w-4 h-4" />
            Recentes
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3].map(i => (
             <div key={i} className="glass h-64 rounded-3xl animate-pulse bg-muted" />
           ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="glass p-12 rounded-[3rem] text-center border-dashed border-border">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nenhum agente por aqui</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Você ainda não criou nenhum agente. Comece agora para automatizar seu atendimento.
          </p>
          <Link 
            href="/agents/new"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all inline-block"
          >
            Crie seu primeiro Agente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-border hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white shadow-lg overflow-hidden relative">
                    <Bot className="w-6 h-6 relative z-10" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(agent)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors border border-border text-muted-foreground hover:text-primary"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => openDeleteConfirm(agent, e)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-border text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{agent.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                  {agent.system_prompt || "Sem prompt configurado."}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted/50 p-3 rounded-2xl border border-border/50">
                     <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 uppercase font-black tracking-widest">
                       <MessageSquare className="w-3 h-3 text-primary" /> Conversas
                     </div>
                     <p className="text-lg font-black text-foreground">
                        {agent.conversations_count || "0"}
                     </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-2xl border border-border/50">
                     <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 uppercase font-black tracking-widest">
                       <Zap className="w-3 h-3 text-amber-500" /> Eficácia
                     </div>
                     <p className="text-lg font-black text-foreground">
                        {agent.efficiency || "0"}%
                     </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <button 
                  onClick={() => setTestingAgent(agent)}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm font-bold hover:bg-muted/80 transition-all flex items-center justify-center gap-2 text-foreground"
                >
                  <MessageCircle className="w-4 h-4 text-primary" /> Testar
                </button>
                <Link 
                  href={`/agents/${agent.id}/flow`}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg shadow-primary/30"
                >
                  <Play className="w-4 h-4" /> Configurar
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl glass p-8 md:p-10 rounded-[2.5rem] border border-border shadow-2xl relative"
          >
            <button 
              onClick={closeAndReset}
              className="absolute right-6 top-6 p-2 hover:bg-muted rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{editingAgent ? 'Editar Agente' : 'Configurar Novo Agente'}</h2>
                <p className="text-sm text-muted-foreground">{editingAgent ? 'Ajuste as configurações do seu robô.' : 'Defina como sua IA deve se comportar.'}</p>
              </div>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Nome do Agente</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-muted border border-border rounded-2xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-medium text-foreground placeholder:text-muted-foreground/30"
                  placeholder="Ex: Consultor de Vendas"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Instruções da IA (System Prompt)</label>
                <textarea
                  required
                  rows={6}
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                  className="w-full bg-muted border border-border rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-all font-medium resize-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50"
                  placeholder="Você é um assistente prestativo da empresa X..."
                />
                <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-widest font-bold">
                  Dica: Seja detalhado sobre o tom de voz e os objetivos do agente.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="flex-1 px-6 py-4 bg-muted border border-border rounded-2xl font-bold hover:bg-muted/80 transition-all text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    editingAgent ? "Salvar Alterações" : "Criar Agente Agora"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Chat de Teste */}
      <AnimatePresence>
        {testingAgent && (
          <AgentTestChat 
            agent={testingAgent} 
            onClose={() => setTestingAgent(null)} 
          />
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-card border border-border rounded-[2rem] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Excluir Agente</h2>
                  <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
                <p className="text-sm text-foreground">
                  Tem certeza que deseja excluir o agente <strong className="text-red-500">"{deleteConfirm.name}"</strong>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl font-bold text-sm hover:bg-muted/80 transition-all text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAgent}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Excluir Agente</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
