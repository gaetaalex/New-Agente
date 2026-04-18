"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Tag,
  User,
  Plus,
  X,
  Trash2,
  ExternalLink,
  MessageSquare,
  MapPin,
  ShieldAlert,
  Briefcase
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "basic", label: "Dados Básicos" },
  { id: "address", label: "Endereço" },
  { id: "business", label: "Informações Comerciais" },
  { id: "emergency", label: "Contato de Emergência" },
];

export default function ContactsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({
    full_name: "",
    nickname: "",
    person_type: "Pessoa Física",
    cpf_cnpj: "",
    rg: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    birth_date: "",
    gender: "Não informado",
    address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "" },
    emergency: { name: "", phone: "", relation: "" },
    business: { company: "", position: "" }
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
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
          .from("na_clients")
          .select("*")
          .eq('company_id', profile.company_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClients(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.full_name || !companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("na_clients")
        .insert([{
          ...newClient,
          company_id: companyId,
          address_json: newClient.address,
          emergency_contact_json: newClient.emergency,
          business_info_json: newClient.business,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      setNewClient({
        full_name: "", nickname: "", person_type: "Pessoa Física", cpf_cnpj: "", rg: "",
        phone_primary: "", phone_secondary: "", email: "", birth_date: "", gender: "Não informado",
        address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "" },
        emergency: { name: "", phone: "", relation: "" },
        business: { company: "", position: "" }
      });
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error("Erro ao criar cliente:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone_primary?.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Base de Clientes</h1>
            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest opacity-40">Gestão de contatos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex px-3 py-1.5 bg-muted border border-border rounded-xl font-bold uppercase tracking-widest text-[9px] items-center gap-2 hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground">
            <Download className="w-3 h-3" /> Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="w-3 h-3" /> Novo Cliente
          </button>
        </div>
      </header>

      {/* Filters (Compact) */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
          <input 
            type="text" 
            placeholder="Nome ou telefone..." 
            className="w-full bg-muted border border-border rounded-xl py-2 pl-9 pr-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground placeholder:text-muted-foreground/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-muted border border-border rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground appearance-none outline-none focus:border-primary/40">
          <option>Todos Status</option>
        </select>
        <select className="bg-muted border border-border rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground appearance-none outline-none focus:border-primary/40">
          <option>Tipo Pessoa</option>
        </select>
        <select className="bg-muted border border-border rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground appearance-none outline-none focus:border-primary/40">
          <option>Canal de Aquisição</option>
        </select>
      </div>

      {/* List - Compact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 glass rounded-2xl animate-pulse border border-border" />
          ))
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40 border border-dashed border-border rounded-3xl">
            <Users className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Nenhum cliente cadastrado</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="glass border border-white/10 rounded-2xl p-4 space-y-3 hover:border-primary/40 transition-all group relative cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                  {client.full_name?.charAt(0) || "C"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors">{client.full_name}</h4>
                  <p className="text-[9px] text-muted-foreground truncate opacity-60 italic">{client.person_type}</p>
                </div>
              </div>

              <div className="space-y-1.5 opacity-50">
                <div className="flex items-center gap-2 text-[10px]">
                  <Phone className="w-2.5 h-2.5 text-primary" /> {client.phone_primary}
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <Mail className="w-2.5 h-2.5 text-primary" /> {client.email}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                  {client.id.substring(0, 8)}
                </span>
                <div className="flex gap-2">
                   <button className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 border border-border"><MessageSquare className="w-3 h-3 text-primary" /></button>
                   <button className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 border border-border"><MoreVertical className="w-3 h-3 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Novo Cliente (Multi-Tab) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold italic tracking-tight uppercase">Novo Cliente</h2>
                    <p className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">Cadastro completo de cliente</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex overflow-x-auto gap-2 border-b border-border pb-px no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all relative min-w-fit",
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {activeTab === "basic" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Nome Completo*</label>
                        <input required type="text"
                          className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground"
                          value={newClient.full_name} onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Apelido/Nome Fantasia</label>
                        <input type="text"
                          className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground"
                          value={newClient.nickname} onChange={(e) => setNewClient({...newClient, nickname: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Tipo de Pessoa</label>
                        <select className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 appearance-none text-[11px] text-foreground"
                          value={newClient.person_type} onChange={(e) => setNewClient({...newClient, person_type: e.target.value})}>
                          <option value="Pessoa Física">Pessoa Física</option>
                          <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">CPF/CNPJ</label>
                        <input type="text" placeholder="000.000.000-00"
                          className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground"
                          value={newClient.cpf_cnpj} onChange={(e) => setNewClient({...newClient, cpf_cnpj: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">Telefone Principal</label>
                        <input type="text" placeholder="(00) 00000-0000"
                          className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground"
                          value={newClient.phone_primary} onChange={(e) => setNewClient({...newClient, phone_primary: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">E-mail</label>
                        <input type="email" placeholder="email@exemplo.com"
                          className="w-full bg-muted/30 border border-border rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px] text-foreground"
                          value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "address" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-1">
                           <MapPin className="w-2 h-2" /> Endereço Completo
                        </label>
                        <input type="text" placeholder="Logradouro"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.address.street} onChange={(e) => setNewClient({...newClient, address: {...newClient.address, street: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-2">Cidade</label>
                        <input type="text"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.address.city} onChange={(e) => setNewClient({...newClient, address: {...newClient.address, city: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-2">CEP</label>
                        <input type="text"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.address.zip} onChange={(e) => setNewClient({...newClient, address: {...newClient.address, zip: e.target.value}})}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "business" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-1">
                           <Briefcase className="w-2 h-2" /> Empresa / Cargo
                        </label>
                        <input type="text" placeholder="Nome da empresa"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.business.company} onChange={(e) => setNewClient({...newClient, business: {...newClient.business, company: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <input type="text" placeholder="Cargoocupação"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.business.position} onChange={(e) => setNewClient({...newClient, business: {...newClient.business, position: e.target.value}})}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "emergency" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-1">
                           <ShieldAlert className="w-2 h-2" /> Contato de Emergência
                        </label>
                        <input type="text" placeholder="Nome do contato"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.emergency.name} onChange={(e) => setNewClient({...newClient, emergency: {...newClient.emergency, name: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-2">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.emergency.phone} onChange={(e) => setNewClient({...newClient, emergency: {...newClient.emergency, phone: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-2">Parentesco</label>
                        <input type="text"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 outline-none focus:border-primary/40 transition-all text-[11px]"
                          value={newClient.emergency.relation} onChange={(e) => setNewClient({...newClient, emergency: {...newClient.emergency, relation: e.target.value}})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                 <div className="pt-4 flex gap-3 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-muted border border-border rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-muted/80 transition-all text-foreground">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50">
                    {isSaving ? "Salvando..." : "Criar Cliente"}
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
