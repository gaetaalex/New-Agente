"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  X,
  Target,
  DollarSign,
  Tag,
  Clock,
  User,
  AlertCircle,
  MessageSquare,
  History,
  CheckCircle2,
  StickyNote,
  Briefcase,
  Thermometer,
  CalendarDays,
  Play
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const columns = [
  { id: "new", label: "Novos Leads", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "interacting", label: "Interagindo", color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "booked", label: "Agendado", color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "won", label: "Fechados", color: "text-green-500", bg: "bg-green-500/10" },
];

const drawerTabs = [
  { id: "summary", label: "Resumo", icon: User },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "activities", label: "Atividades", icon: CheckCircle2 },
  { id: "notes", label: "Notas", icon: StickyNote },
];

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Drawer state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState("summary");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    company_name: "",
    role: "",
    deal_value: "",
    priority: "Sem prioridade",
    temperature: "Sem temperatura",
    observations: "",
    closing_date: "",
    tags: ""
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('na_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        
        const { data, error } = await supabase
          .from("na_leads")
          .select("*")
          .eq('company_id', profile.company_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone || !companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("na_leads")
        .insert([{
          ...newLead,
          company_id: companyId,
          status: "new",
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : 0,
          tags: newLead.tags ? newLead.tags.split(',').map(t => t.trim()) : [],
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      setNewLead({
        name: "", phone: "", email: "", company_name: "", role: "",
        deal_value: "", priority: "Sem prioridade", temperature: "Sem temperatura",
        observations: "", closing_date: "", tags: ""
      });
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error("Erro ao criar lead:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter(l => l.status === status);
  };

  const openDrawer = (lead: any) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setActiveDrawerTab("summary");
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Pipeline CRM</h1>
            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest">Gestão de contatos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl border border-border">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-transparent border-none outline-none text-[11px] w-24 md:w-40 text-foreground placeholder:text-muted-foreground/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="w-3 h-3" /> Novo Contato
          </button>
        </div>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[600px] -mx-4 px-4 md:mx-0 md:px-0">
        {columns.map((col) => {
          const colLeads = getLeadsByStatus(col.id);
          
          return (
            <div key={col.id} className="min-w-[280px] max-w-[280px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", col.color.replace('text', 'bg'))} />
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{col.label}</h3>
                  <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                    {colLeads.length}
                  </span>
                </div>
                <MoreHorizontal className="w-3 h-3 text-muted-foreground/40 hover:text-foreground cursor-pointer transition-colors" />
              </div>
              
              <div className="flex-1 space-y-3 p-1">
                {loading ? (
                  [1, 2].map(i => (
                    <div key={i} className="h-24 glass rounded-2xl animate-pulse border border-border" />
                  ))
                ) : colLeads.length === 0 ? (
                  <div className="h-24 border border-border border-dashed rounded-2xl flex flex-col items-center justify-center">
                    <p className="text-[8px] font-bold uppercase text-muted-foreground/60">Vazio</p>
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      onClick={() => openDrawer(lead)}
                      className="glass border border-border rounded-2xl p-3.5 space-y-3 hover:border-primary/40 transition-all group relative cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors text-foreground">{lead.name}</h4>
                          <p className="text-[9px] text-muted-foreground truncate opacity-60">
                            {lead.company_name || lead.phone}
                          </p>
                        </div>
                        {lead.temperature === 'Quente' && (
                          <div className="p-1 bg-red-500/20 rounded shadow-sm">
                            <Clock className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {lead.deal_value > 0 && (
                          <div className="px-1.5 py-0.5 bg-green-500/10 rounded text-[8px] font-bold text-green-500 flex items-center gap-1">
                            <DollarSign className="w-2 h-2" />
                            {lead.deal_value.toLocaleString('pt-BR')}
                          </div>
                        )}
                        {lead.priority !== 'Sem prioridade' && (
                          <div className="px-1.5 py-0.5 bg-primary/10 rounded text-[8px] font-bold text-primary flex items-center gap-1">
                            <Tag className="w-2 h-2" />
                            {lead.priority}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex -space-x-1.5">
                          <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center">
                            <User className="w-2 h-2 text-muted-foreground/40" />
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter italic">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
                <button className="w-full py-2 rounded-xl border border-dashed border-border/60 text-[8px] text-muted-foreground/80 hover:bg-muted/50 hover:border-border transition-all font-bold uppercase tracking-widest">
                  + Adicionar Card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Drawer Detalhes do Lead */}
      {isDrawerOpen && selectedLead && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />           <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-[70] glass border-l border-border shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            {/* Header Drawer */}
            <div className="p-6 md:p-8 space-y-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight truncate text-foreground">{selectedLead.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-bold text-muted-foreground">{selectedLead.phone}</span>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 hover:bg-muted rounded-full transition-colors group">
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform text-muted-foreground" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4">
                <div className="p-3 bg-muted border border-border rounded-2xl text-center transition-all hover:border-primary/20">
                  <p className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Valor</p>
                  <p className="text-xs font-bold text-emerald-600">R$ {selectedLead.deal_value?.toLocaleString('pt-BR') || '---'}</p>
                </div>
                <div className="p-3 bg-muted border border-border rounded-2xl text-center transition-all hover:border-primary/20">
                  <p className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Responsável</p>
                  <p className="text-xs font-bold text-muted-foreground">---</p>
                </div>
                <div className="p-3 bg-muted border border-border rounded-2xl text-center transition-all hover:border-primary/20">
                  <p className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Estágio</p>
                  <p className="text-xs font-bold text-primary">---</p>
                </div>
                <div className="p-3 bg-muted border border-border rounded-2xl text-center transition-all hover:border-primary/20">
                  <p className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Criado</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('pt-BR') : '--/--/----'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation Drawer */}
            <div className="flex items-center px-4 md:px-6 mt-4 gap-4 border-b border-border">
              {drawerTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDrawerTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative border-b-2",
                    activeDrawerTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground/40 hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Drawer */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
              {activeDrawerTab === "summary" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Informações Primárias</p>
                    <button className="text-[9px] font-black uppercase text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary/20 transition-all">Editar</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                       <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                          <Phone className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">Telefone</p>
                            <p className="text-xs font-medium text-foreground">{selectedLead.phone}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                          <Mail className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">E-mail</p>
                            <p className="text-xs font-medium text-foreground">{selectedLead.email || "---"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                          <Briefcase className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">Empresa / Cargo</p>
                            <p className="text-xs font-medium text-foreground">{selectedLead.company_name || "---"} {selectedLead.role ? `/ ${selectedLead.role}` : ""}</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                          <Tag className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">Prioridade</p>
                            <p className="text-xs font-medium text-foreground">{selectedLead.priority || "---"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                          <Thermometer className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">Temperatura</p>
                            <p className="text-xs font-medium text-foreground">{selectedLead.temperature || "---"}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl border border-border">
                       <CalendarDays className="w-3.5 h-3.5 text-primary opacity-60" />
                       <div>
                         <p className="text-[7px] font-bold uppercase text-muted-foreground/40 tracking-widest">Previsão de Fechamento</p>
                         <p className="text-xs font-medium text-foreground">{selectedLead.closing_date || "---"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === "timeline" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-0 before:w-px before:bg-border">
                      <div className="relative">
                         <div className="absolute -left-[1.35rem] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary ring-4 ring-primary/10 flex items-center justify-center">
                            <History className="w-2 h-2 text-primary" />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-muted-foreground/40 mb-1">
                              {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs font-medium text-foreground/80">Contato "{selectedLead.name}" criado no sistema</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeDrawerTab === "activities" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
                   <div className="flex items-center justify-between">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Tarefas & Compromissos</p>
                     <button 
                       onClick={() => setIsActivityModalOpen(true)}
                       className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[8px] flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/10"
                     >
                        <Plus className="w-2.5 h-2.5" /> Nova Atividade
                     </button>
                   </div>

                   <div className="flex-1 flex flex-col items-center justify-center opacity-40 border border-dashed border-border rounded-3xl p-10">
                      <CheckCircle2 className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-center text-muted-foreground">Nenhuma atividade pendente</p>
                   </div>
                </div>
              )}

              {activeDrawerTab === "notes" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="p-1 bg-muted rounded-2xl border border-border focus-within:border-primary/40 transition-all">
                      <textarea 
                        placeholder="Escreva uma nota personalizada..."
                        className="w-full bg-transparent p-4 text-xs outline-none border-none resize-none min-h-[120px] text-foreground placeholder:text-muted-foreground/40"
                      />
                      <div className="p-2 flex justify-end">
                         <button className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-[8px] hover:opacity-90 transition-all shadow-md shadow-primary/10">
                            Adicionar Nota
                         </button>
                      </div>
                   </div>
                   
                   <p className="text-center text-[9px] font-bold uppercase text-muted-foreground/40 mt-10 tracking-widest">Nenhuma nota registrada</p>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* Modal Nova Atividade (Sub-modal) */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
           <div className="glass w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight italic text-foreground">Nova Atividade</h3>
                    <button onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                       <X className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <form className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       {[
                         { id: 'call', label: 'Ligação', icon: Phone },
                         { id: 'email', label: 'E-mail', icon: Mail },
                         { id: 'meeting', label: 'Reunião', icon: Users },
                         { id: 'task', label: 'Tarefa', icon: CheckCircle2 },
                         { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                         { id: 'note', label: 'Nota', icon: StickyNote },
                       ].map(type => (
                         <div key={type.id} className="p-3 bg-muted/50 border border-border rounded-2xl flex flex-col items-center gap-2 hover:border-primary/40 cursor-pointer group transition-all">
                            <type.icon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover:text-foreground">{type.label}</span>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-1">
                       <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-2">Título</label>
                       <input type="text" placeholder="Ex: Follow-up com cliente"
                          className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground placeholder:text-muted-foreground/30"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-2">Data/Hora</label>
                          <input type="datetime-local"
                             className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-2">Duração (min)</label>
                          <input type="number" placeholder="30"
                             className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground placeholder:text-muted-foreground/30"
                          />
                       </div>
                    </div>

                    <button type="button" className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 mt-4">
                       Criar Atividade
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}


      {/* Modal Novo Contato (Compact Premium) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold italic tracking-tight uppercase text-foreground">Novo Contato</h2>
                  <p className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">Preencha os detalhes do lead</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Nome*</label>
                  <input required type="text" placeholder="Nome completo"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Telefone*</label>
                  <input required type="text" placeholder="(00) 00000-0000"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">E-mail</label>
                  <input type="email" placeholder="email@exemplo.com"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Empresa</label>
                  <input type="text" placeholder="Nome da empresa"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.company_name} onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Cargo</label>
                  <input type="text" placeholder="Cargo/Função"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.role} onChange={(e) => setNewLead({...newLead, role: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Valor do Negócio</label>
                  <input type="number" placeholder="0.00"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.deal_value} onChange={(e) => setNewLead({...newLead, deal_value: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Prioridade</label>
                  <select 
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs appearance-none text-foreground"
                    value={newLead.priority} onChange={(e) => setNewLead({...newLead, priority: e.target.value})}
                  >
                    <option value="Sem prioridade">Sem prioridade</option>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Temperatura</label>
                  <select 
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs appearance-none text-foreground"
                    value={newLead.temperature} onChange={(e) => setNewLead({...newLead, temperature: e.target.value})}
                  >
                    <option value="Sem temperatura">Sem temperatura</option>
                    <option value="Frio">Frio</option>
                    <option value="Morno">Morno</option>
                    <option value="Quente">Quente</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Observações</label>
                  <textarea placeholder="Anotações sobre o contato..." rows={3}
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs resize-none text-foreground"
                    value={newLead.observations} onChange={(e) => setNewLead({...newLead, observations: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Etiquetas (separadas por vírgula)</label>
                  <input type="text" placeholder="Etiqueta 1, Etiqueta 2"
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/40 transition-all text-xs text-foreground"
                    value={newLead.tags} onChange={(e) => setNewLead({...newLead, tags: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-muted border border-border rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-muted/80 transition-all text-foreground">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50">
                    {isSaving ? "Salvando..." : "Salvar Contato"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
