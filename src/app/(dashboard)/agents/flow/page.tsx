
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  Plus, 
  Workflow, 
  Bot, 
  ChevronRight, 
  Play, 
  Trash2,
  Settings2,
  Calendar,
  Sparkles,
  MessageSquare,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function AgentsFlowEcosystem() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('na_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setLoading(false);
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
        .from('na_agents')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      setAgents(prev => prev.filter(a => a.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(`Erro ao excluir: ${error?.message || String(error)}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                <Workflow className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-black italic tracking-tight">Agentes 2.0 (Ecossistema)</h1>
            </div>
            <p className="text-foreground/40 text-sm font-medium">Gerencie seu ecossistema de inteligência artificial através de fluxos avançados.</p>
          </div>
          
          <Link 
            href="/agents/new"
            className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 text-white"
          >
            <Plus className="w-5 h-5" />
            Novo Agente
          </Link>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center">
            <Bot className="w-16 h-16 text-foreground/10 mb-4" />
            <h3 className="text-xl font-bold text-foreground/40">Nenhum agente encontrado</h3>
            <p className="text-foreground/20 text-sm max-w-xs mt-2">Crie seu primeiro agente para visualizá-lo aqui.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={agent.id}
              className="group bg-card shadow-sm border border-border rounded-[2.5rem] p-6 hover:border-primary/40 transition-all relative overflow-hidden flex flex-col h-full"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                    ) : (
                      <Bot className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg italic leading-tight text-foreground">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-muted/80 text-[8px] font-black uppercase tracking-widest text-muted-foreground">{agent.role || 'Assistente'}</span>
                      <span className="text-[9px] text-primary font-bold uppercase tracking-wider">{agent.field || 'Geral'}</span>
                    </div>
                  </div>
                </div>
                <div className={agent.is_active ? "w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "w-2 h-2 rounded-full bg-muted-foreground/20"} />
              </div>

              {/* Flow Context */}
              <div className="flex-1 space-y-4 mb-6">
                <div className="p-4 bg-muted rounded-3xl border border-border h-24 flex items-center justify-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                        {i === 1 ? <Sparkles className="w-3 h-3 text-primary" /> : i === 2 ? <MessageSquare className="w-3 h-3 text-blue-400" /> : <Calendar className="w-3 h-3 text-green-500" />}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      +{(agent.flow?.nodes?.length || 2) - 3 > 0 ? (agent.flow?.nodes?.length || 2) - 3 : 1}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-2xl border border-border">
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Nós do Fluxo</p>
                    <p className="text-lg font-black italic text-foreground">{agent.flow?.nodes?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-2xl border border-border">
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Status</p>
                    <p className="text-lg font-black italic text-green-500">ATIVO</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link 
                  href={`/agents/${agent.id}/flow`}
                  className="flex-1 py-3 bg-muted hover:bg-muted/80 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 group/btn text-foreground"
                >
                  <Workflow className="w-4 h-4 text-primary group-hover/btn:rotate-12 transition-transform" />
                  Abrir Fluxo
                </Link>
                <Link 
                  href={`/agents/${agent.id}/edit`}
                  className="w-12 h-12 bg-muted hover:bg-muted/80 border border-border rounded-2xl flex items-center justify-center transition-all active:scale-95"
                >
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                </Link>
                <button 
                  onClick={(e) => openDeleteConfirm(agent, e)}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center transition-all active:scale-95 group/del"
                >
                  <Trash2 className="w-5 h-5 text-red-500 group-hover/del:text-white transition-colors" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
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
