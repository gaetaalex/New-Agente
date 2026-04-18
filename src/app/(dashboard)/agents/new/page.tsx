"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Zap, 
  MessageSquare, 
  User, 
  Building2, 
  Globe, 
  Wand2, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Target,
  Users,
  MessageCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Settings2,
  Plus,
  Workflow,
  Rocket,
  FileText,
  ChevronDown,
  Image as ImageIcon,
  Search,
  Calendar,
  BarChart3,
  CheckSquare,
  Star,
  Info,
  Smile,
  Heart,
  Trophy,
  TrendingUp,
  Hash,
  Check,
  PlusCircle,
  RefreshCcw,
  Layout
} from "lucide-react";
import Link from "next/link";
import { AGENT_TEMPLATES } from "@/lib/templates";
import { supabase } from "@/lib/supabase";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS = [
  { id: "idealization", name: "Idealização", icon: Sparkles },
  { id: "planning", name: "Planejamento", icon: Target },
  { id: "knowledge", name: "Conhecimento", icon: FileText },
  { id: "creation", name: "Criação", icon: Rocket },
];

const WIZARD_QUESTIONS: Record<string, string[]> = {
  aesthetic: [
    "Gênero do Assistente (Feminino/Masculino)",
    "Quais especialidades/serviços a clínica oferece?",
    "Quantos profissionais atendem no local?",
    "Qual o horário de funcionamento detalhado?",
    "Quais convênios e formas de pagamento são aceitos?",
    "Como é feito o agendamento atualmente (WhatsApp/Software)?",
    "Como o paciente deve ser instruído na chegada?",
    "Realizam procedimentos específicos internamente? Quais?",
    "Qual o endereço completo e pontos de referência?",
    "Informações adicionais para a personalidade do agente"
  ],
  medical: [
    "Gênero do Assistente",
    "Especialidades médicas atendidas",
    "Corpo clínico (médicos e especialidades)",
    "Horário de atendimento",
    "Planos de saúde aceitos",
    "Processo de marcação de consulta",
    "Documentação necessária para o paciente",
    "Possui estacionamento ou acessibilidade?",
    "Endereço e Contato",
    "Tom de voz e instruções de conduta"
  ],
  barber: [
    "Quantos profissionais atendem no salão?",
    "Quais os serviços mais procurados (Cabelo, Barba, Sobrancelha)?",
    "Vocês oferecem algum benefício para novos clientes?"
  ],
  restaurant: [
    "O foco é em reservas de mesa ou delivery?",
    "Quais os horários de pico?",
    "Existe um link de cardápio digital disponível?"
  ],
  sales: [
    "Qual o ticket médio do seu serviço/produto?",
    "O agente deve tentar fechar a venda ou apenas qualificar o lead?",
    "Qual o principal diferencial da sua empresa?"
  ],
  default: [
    "Qual o objetivo principal do agente?",
    "Quem é o seu público-alvo?",
    "Quais informações ele deve coletar?",
    "Como ele deve se despedir?"
  ]
};

export default function NewAgentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [builderMode, setBuilderMode] = useState<'steps' | 'prompt' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: "",
    category: "",
    persona: "",
    business_details: {}, 
    language: "Português",
    tone: "Profissional",
    system_prompt: "",
    is_active: true,
    knowledge_base: [],
    flow: { nodes: [], edges: [] },
    answers: []
  });

  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIFill = async (field?: string) => {
    if (!formData.category) {
      alert("Por favor, selecione um nicho primeiro.");
      return;
    }

    setIsAILoading(true);
    try {
      const questions = WIZARD_QUESTIONS[formData.category] || WIZARD_QUESTIONS.default;
      
      // Se for um campo específico (ex: detail:Como o paciente...)
      const isSpecificField = field?.startsWith('detail:');
      const targetDetail = isSpecificField ? field?.split('detail:')[1] : null;

      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: formData.category,
          questions: targetDetail ? [targetDetail] : questions,
          agentName: formData.name,
          specificField: targetDetail ? 'business_details' : field
        })
      });

      if (!response.ok) throw new Error('Erro na sugestão da IA');
      
      const data = await response.json();

      if (targetDetail) {
        // Atualizar apenas o detalhe específico
        setFormData((prev: any) => ({
          ...prev,
          business_details: {
            ...prev.business_details,
            [targetDetail]: data.business_details?.[targetDetail] || data[targetDetail] || ""
          }
        }));
      } else if (field === 'persona') {
        setFormData((prev: any) => ({ ...prev, persona: data.persona }));
      } else if (field === 'system_prompt') {
        setFormData((prev: any) => ({ ...prev, system_prompt: data.system_prompt }));
      } else {
        // Preenchimento global
        setFormData((prev: any) => ({
          ...prev,
          persona: data.persona || prev.persona,
          system_prompt: data.system_prompt || prev.system_prompt,
          business_details: { ...prev.business_details, ...data.business_details }
        }));
      }
    } catch (err: any) {
      console.error("Erro AI:", err);
      alert("Falha ao gerar sugestão da IA. Tente preencher manualmente.");
    } finally {
      setIsAILoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) throw new Error("Usuário não logado ou sessão expirada");

      // Buscar company_id do perfil do usuário
      const { data: profile } = await supabase
        .from("na_profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      // Usar o company_id do perfil, ou o id do usuário como fallback
      let profileCompanyId = profile?.company_id || null;

      if (!profileCompanyId) {
        console.warn("Perfil órfão no Agent Builder! Auto-Heal ativando...");
        const { data: fallbackComp } = await supabase.from("na_companies").select("id").limit(1).single();
        if (fallbackComp?.id) {
          await supabase.from("na_profiles").upsert({
            id: user.id,
            company_id: fallbackComp.id,
            full_name: "Recuperado Builder",
            role: "user"
          });
          profileCompanyId = fallbackComp.id;
        } else {
          throw new Error("Sistema vazio (faltam empresas padrão). Contate o suporte.");
        }
      }
      
      const companyId = profileCompanyId;

      // --- LÓGICA DE GERAÇÃO DE FLUXO ROBUSTO (Mestre Inteligente) ---
      let nodes: any[] = [];
      let edges: any[] = [];

      if (builderMode === 'prompt' || !selectedTemplate) {
        // Gerar um fluxo "Cérebro IA" completo por padrão
        nodes = [
          { 
            id: 'start', 
            type: 'initial', 
            position: { x: 400, y: 0 }, 
            data: { label: 'Início', nodeId: 'start' } 
          },
          { 
            id: 'brain', 
            type: 'ai_response', 
            position: { x: 350, y: 150 }, 
            data: { 
              label: 'Cérebro do Agente', 
              sublabel: 'AÇÃO • AI RESPONSE',
              preview: `Olá! Eu sou ${formData.name}. Como posso ajudar?`,
              prompt: formData.system_prompt,
              type: 'AI Response', nodeId: 'ai'
            }
          },
          { 
            id: 'booking', 
            type: 'action', 
            position: { x: 150, y: 400 }, 
            data: { 
              label: 'Agendamento', 
              sublabel: 'AÇÃO • AVAILABILITY',
              type: 'availability', nodeId: 'availability',
              color: 'bg-green-500'
            }
          },
          { 
            id: 'transfer', 
            type: 'action', 
            position: { x: 550, y: 400 }, 
            data: { 
              label: 'Falar com Humano', 
              sublabel: 'AÇÃO • TRANSFER',
              type: 'transfer', nodeId: 'transfer',
              color: 'bg-orange-500'
            }
          }
        ];

        edges = [
          { id: 'e-start-brain', source: 'start', target: 'brain', animated: true },
          { id: 'e-brain-booking', source: 'brain', target: 'booking', animated: true, label: 'agendamento' },
          { id: 'e-brain-transfer', source: 'brain', target: 'transfer', animated: true, label: 'humano' }
        ];
      } else {
        // Fluxo baseado em Template
        const baseNodes = selectedTemplate?.flow?.nodes || [];
        const baseEdges = selectedTemplate?.flow?.edges || [];

        nodes = baseNodes.map((node: any) => {
          if (node.id === 'greeting' || node.id === '2' || node.data?.label?.toLowerCase().includes('saudação')) {
            return {
              ...node,
              data: {
                ...node.data,
                preview: `Olá! Sou a ${formData.name}. Como posso ajudar?`,
                prompt: formData.system_prompt,
                systemMessage: formData.system_prompt
              }
            };
          }
          return node;
        });
        edges = baseEdges;
      }

      const { error: saveError } = await supabase
        .from("na_agents")
        .insert([{
          company_id: companyId,
          name: formData.name,
          role: selectedTemplate?.defaultData?.role || 'Assistente',
          field: selectedTemplate?.defaultData?.field || formData.category,
          system_prompt: formData.system_prompt || `Você é o ${formData.name}.`,
          personalities: formData.tone ? [formData.tone] : [],
          config: formData,
          is_active: true,
          flow: { 
            nodes: nodes, 
            edges: edges 
          }
        }]);

      if (saveError) throw saveError;
      window.location.href = "/agents";
    } catch (err: any) {
      console.error("ERRO AO SALVAR:", err);
      if (err.message.includes("Usuário não logado")) {
        alert("Ops! Parece que você não está logado. Faça login novamente.");
      } else {
        alert(`Erro ao salvar agente: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!builderMode) {
    return (
      <div className="min-h-screen py-12 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-foreground">
          <Link href="/agents" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mb-4 font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar para Meus Agentes
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 italic tracking-tight">Criar Novo Agente de IA</h1>
            <p className="text-xs text-muted-foreground font-medium">Escolha o tipo de agente que melhor atende às suas necessidades</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass p-8 rounded-[2.5rem] border border-border flex flex-col items-center text-center group cursor-pointer bg-card hover:bg-primary/5 transition-all"
              onClick={() => setBuilderMode('steps')}
            >
              <div className="w-16 h-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-2xl">
                <Zap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black mb-2 italic text-foreground">Agente por Etapas</h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-medium">
                Controle total! Configure fluxos personalizados e automações complexas.
              </p>
              <button className="w-full py-4 bg-primary text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                Iniciar Wizard
              </button>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass p-8 rounded-[2.5rem] border border-border flex flex-col items-center text-center group cursor-pointer bg-card hover:bg-green-500/5 transition-all"
              onClick={() => setBuilderMode('prompt')}
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-[1.5rem] flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all shadow-2xl">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black mb-2 italic text-foreground">Agente por Prompt</h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-medium">
                Velocidade total! Descreva seu agente e deixe a IA gerar a configuração.
              </p>
              <button className="w-full py-4 bg-green-500 text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-500/20">
                Criar por Prompt
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ========= MODO PROMPT (SIMPLIFICADO) =========
  if (builderMode === 'prompt') {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 text-foreground">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="flex justify-between items-center">
            <button 
              onClick={() => setBuilderMode(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black uppercase tracking-widest text-[9px] italic"
            >
              <ArrowLeft className="w-4 h-4" /> Cancelar
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-black text-xs uppercase tracking-widest">Criação Instantânea</span>
            </div>
          </header>

          <div className="space-y-4">
             <h1 className="text-4xl font-black italic tracking-tighter">Descreva seu Agente</h1>
             <p className="text-muted-foreground text-sm font-medium">Diga quem ele é e o que ele deve fazer. Nossa IA cuidará da lógica.</p>
          </div>

          <div className="space-y-8 bg-muted p-8 md:p-12 rounded-[3.5rem] border border-border shadow-2xl">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary italic ml-4">1. Escolha o Nicho (Tipo de Negócio)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {AGENT_TEMPLATES.map((tmpl) => (
                     <button
                       key={tmpl.id}
                       onClick={() => setFormData({ ...formData, category: tmpl.id })}
                       className={cn(
                         "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                         formData.category === tmpl.id 
                           ? "bg-primary/10 border-primary text-primary shadow-lg scale-105" 
                           : "bg-background border-border text-muted-foreground hover:border-primary/30"
                       )}
                     >
                       <span className="text-2xl">{tmpl.icon}</span>
                       <span className="text-[10px] font-bold uppercase tracking-tighter">{tmpl.name}</span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary italic ml-4">2. Nome do Agente</label>
                <input 
                  type="text"
                  placeholder="Ex: Recepcionista Clínica"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-2xl py-5 px-8 text-sm font-bold outline-none focus:border-primary transition-all"
                />
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center ml-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">3. Seu Script / Instruções</label>
                   <button 
                     onClick={() => {
                        if (!formData.category) {
                          alert("Por favor, selecione um nicho primeiro.");
                          return;
                        }
                        handleAIFill('system_prompt');
                     }}
                     disabled={isAILoading}
                     className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                   >
                     {isAILoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                     Mágica IA✨ (Gerar Script)
                   </button>
                </div>
                <textarea 
                  rows={8}
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                  placeholder="Ex: Crie um agente para uma clínica de estética que tira dúvidas sobre botox e preenchimento, e tenta agendar uma avaliação gratuita..."
                  className="w-full bg-background border border-border rounded-[2.5rem] py-6 px-8 text-sm font-medium leading-relaxed outline-none focus:border-primary transition-all resize-none shadow-inner"
                />
             </div>

             <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={loading || !formData.name || !formData.system_prompt}
                  className="w-full py-5 bg-green-500 text-white rounded-[1.5rem] font-black italic text-lg uppercase tracking-tight shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? "Criando Agente..." : "Finalizar e Ativar Agente"}
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans">
      <div className="w-64 border-r border-border p-6 hidden lg:block bg-muted/30">
        <div className="sticky top-6 space-y-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg italic tracking-tight underline decoration-primary decoration-4 underline-offset-4">New Agent Wizard</span>
          </div>

          <nav className="space-y-3">
            {STEPS.map((step, i) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                  i === currentStep ? "bg-primary/10 text-primary border border-primary/20 shadow-2xl scale-[1.02]" : 
                  i < currentStep ? "text-green-500 opacity-60" : "text-foreground/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${
                  i === currentStep ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40" : 
                  i < currentStep ? "border-green-500 bg-green-500/10 text-green-500" : "border-border bg-muted"
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4 font-black" /> : <step.icon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-[0.2em] font-black opacity-40">Passo {i + 1}</p>
                  <p className="font-bold text-xs tracking-tight">{step.name}</p>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full flex flex-col">
          <header className="flex justify-between items-center mb-10">
            <button 
              onClick={() => setBuilderMode(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black uppercase tracking-widest text-[9px] italic"
            >
              <ArrowLeft className="w-4 h-4" /> Cancelar
            </button>
            <div className="flex items-center gap-4">
              <div className="px-5 py-1.5 bg-muted rounded-full border border-border">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">Progresso: {Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
              </div>
            </div>
          </header>

          <section className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="space-y-8"
              >
                {currentStep === 0 && (
                  <div className="space-y-12">
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter">1. Idealização</h2>
                        <p className="text-muted-foreground text-sm font-medium max-w-2xl leading-relaxed">
                          Vamos definir a base estratégica da sua IA. Comece escolhendo o nicho.
                        </p>
                     </div>
                     
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                          {AGENT_TEMPLATES.slice(0, 6).map((template) => (
                            <motion.div 
                               key={template.id}
                               whileHover={{ scale: 1.02, y: -2 }}
                               onClick={() => {
                                 setSelectedTemplate(template);
                                 setFormData({ ...formData, category: template.id, name: template.name });
                               }}
                               className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden ${
                                 formData.category === template.id 
                                   ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20' 
                                   : 'bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                               }`}
                             >
                              <div className="text-4xl mb-4">{template.icon}</div>
                              <h4 className="font-bold text-lg tracking-tight mb-2 uppercase italic">{template.name}</h4>
                            </motion.div>
                          ))}
                        </div>

                        {formData.category && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-primary/10 border border-primary/30 p-8 rounded-[3rem] w-full md:w-64 text-center space-y-4"
                          >
                             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                               <Sparkles className="w-6 h-6 text-white" />
                             </div>
                             <h4 className="text-sm font-black italic uppercase text-primary">Atalho Mágico</h4>
                             <p className="text-[10px] text-muted-foreground font-medium italic">Deixe a IA preencher todos os detalhes conforme o nicho.</p>
                             <button 
                               onClick={() => handleAIFill('all')}
                               disabled={isAILoading}
                               className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                             >
                               {isAILoading ? "Gerando..." : "Mágica IA✨"}
                             </button>
                          </motion.div>
                        )}
                      </div>

                     {formData.category && (
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-8 bg-muted p-10 rounded-[3rem] border border-border"
                       >
                         <div className="space-y-6">
                             <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xl font-bold italic tracking-tight">O que sua IA fará? (Persona)</h3>
                               <button 
                                 type="button"
                                 onClick={() => handleAIFill('persona')}
                                 disabled={isAILoading}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                               >
                                 {isAILoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                 Sugerir com IA
                               </button>
                             </div>
                            <textarea 
                               rows={3}
                               className="w-full bg-background border border-border rounded-[2rem] p-6 text-sm outline-none focus:border-primary transition-all resize-none shadow-inner"
                               placeholder="Ex: Ela será uma recepcionista atenciosa que foca em agendar consultas..."
                               value={formData.persona}
                               onChange={(e) => setFormData({...formData, persona: e.target.value})}
                            />
                         </div>

                         <div className="space-y-6">
                           <h3 className="text-xl font-bold italic tracking-tight">Perguntas Rápidas</h3>
                           <div className="grid gap-6">
                               {(WIZARD_QUESTIONS[formData.category] || WIZARD_QUESTIONS.default).map((q, i) => (
                                 <div key={`${formData.category}-q-${i}`} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                       <label className="text-[10px] font-black uppercase tracking-widest text-primary italic opacity-60">{q}</label>
                                       <button 
                                         type="button"
                                         onClick={() => handleAIFill(`detail:${q}`)}
                                         disabled={isAILoading}
                                         className="text-[8px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-all flex items-center gap-1"
                                       >
                                         <Sparkles className="w-2.5 h-2.5" /> Sugerir
                                       </button>
                                    </div>
                                    <input 
                                      type="text"
                                      value={formData.business_details[q] || ''} className="w-full bg-background border border-border rounded-2xl p-4 text-sm outline-none focus:border-primary transition-all shadow-sm"
                                      onChange={(e) => {
                                        const details = { ...formData.business_details, [q]: e.target.value };
                                        setFormData({...formData, business_details: details});
                                      }}
                                    />
                                 </div>
                               ))}
                           </div>
                         </div>
                       </motion.div>
                     )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter">2. Planejamento</h2>
                        <p className="text-muted-foreground text-sm font-medium">Revise a estratégia proposta pela nossa IA.</p>
                     </div>

                     <div className="bg-primary/5 border border-primary/20 p-8 rounded-[3rem] space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between text-primary">
                            <div className="flex items-center gap-4">
                               <Wand2 className="w-6 h-6 animate-pulse" />
                               <h3 className="font-black italic uppercase tracking-widest text-sm">Resumo do Planejamento</h3>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleAIFill('system_prompt')}
                              disabled={isAILoading}
                              className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isAILoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              Otimizar com IA
                            </button>
                         </div>
                        <div className="bg-background p-6 rounded-2xl border border-border space-y-4">
                           <p className="text-sm leading-relaxed text-foreground/80">
                             Baseado no nicho <strong>{formData.category}</strong> e na sua descrição, 
                             estamos configurando um agente focado em {formData.persona || "atendimento geral"}.
                           </p>
                           <div className="space-y-2">
                              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">System Prompt Sugerido:</p>
                              <textarea 
                                value={formData.system_prompt || `Você é o ${formData.name}. Sua missão é ajudar clientes no setor de ${formData.category}...`}
                                onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                                className="w-full bg-muted/80 border border-border rounded-xl p-4 text-xs font-mono min-h-[150px] outline-none focus:border-primary transition-all"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Tom de Voz</h4>
                           <div className="flex flex-wrap gap-2">
                              {["Profissional", "Amigável", "Vendedor", "Sério"].map(tone => (
                                <button
                                  key={tone}
                                  onClick={() => setFormData({...formData, tone: tone})}
                                  className={cn(
                                    "px-6 py-3 rounded-full border-2 font-bold text-[10px] uppercase tracking-widest transition-all",
                                    formData.tone === tone ? "bg-primary border-primary text-primary-foreground shadow-lg" : "bg-muted border-border hover:border-primary/30 text-muted-foreground"
                                  )}
                                >
                                  {tone}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Idioma Principal</h4>
                           <select 
                             value={formData.language}
                             onChange={(e) => setFormData({...formData, language: e.target.value})}
                             className="w-full bg-muted border border-border rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary text-foreground"
                           >
                              <option value="Português">Português (Brasil)</option>
                              <option value="English">English (USA)</option>
                              <option value="Español">Español</option>
                           </select>
                        </div>
                     </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter">3. Conhecimento</h2>
                        <p className="text-muted-foreground text-sm font-medium">Alimente a IA com documentos e informações da sua empresa.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-muted border border-border p-8 rounded-[3rem] flex flex-col items-center text-center space-y-6 hover:bg-white/10 transition-all group">
                           <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                              <FileText className="w-8 h-8" />
                           </div>
                           <div className="space-y-2">
                              <h4 className="font-bold text-xl italic tracking-tight">Arquivos (PDF, TXT, DOCX)</h4>
                              <p className="text-xs text-muted-foreground font-medium">Envie manuais, catálogos ou scripts de vendas.</p>
                           </div>
                           <button className="px-6 py-3 bg-muted border border-border rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:border-primary transition-all">
                             Selecionar Arquivos
                           </button>
                        </div>

                        <div className="bg-muted border border-border p-8 rounded-[3rem] flex flex-col items-center text-center space-y-6 hover:bg-white/10 transition-all group">
                           <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-all">
                              <Globe className="w-8 h-8" />
                           </div>
                           <div className="space-y-2">
                              <h4 className="font-bold text-xl italic tracking-tight">URLs (Sites, FAQs)</h4>
                              <p className="text-xs text-muted-foreground font-medium">Extraia conhecimento diretamente do seu site.</p>
                           </div>
                           <div className="w-full flex gap-2">
                              <input 
                                type="text"
                                placeholder="https://seu-site.com"
                                className="flex-1 bg-background border border-border rounded-full px-4 py-3 text-xs outline-none focus:border-purple-500 transition-all"
                              />
                              <button className="p-3 bg-purple-500 rounded-full text-white hover:scale-110 transition-all">
                                 <Plus className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
                           Conteúdo Adicionado <div className="h-px flex-1 bg-muted" />
                        </h4>
                        <div className="bg-muted/30 rounded-2xl border border-border p-8 text-center">
                           <Info className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Nenhum conteúdo adicionado ainda</p>
                        </div>
                     </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-12 text-center py-6">
                     <div className="w-24 h-24 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-green-500/20 relative shadow-2xl">
                        <Rocket className="w-12 h-12 text-green-500 animate-bounce" />
                     </div>
                     <div className="space-y-2">
                       <h2 className="text-5xl font-black italic tracking-tighter">IA Pronta!</h2>
                       <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-[10px]">Review final antes de ativar sua inteligência</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        <div className="bg-muted p-8 rounded-[2.5rem] border border-border shadow-2xl">
                           <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Agente</p>
                           <h3 className="font-black text-xl italic uppercase tracking-tighter">{formData.name || 'Alpha'}</h3>
                        </div>
                        <div className="bg-muted p-8 rounded-[2.5rem] border border-border shadow-2xl">
                           <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Nicho</p>
                           <h3 className="font-black text-xl italic uppercase tracking-tighter">{formData.category}</h3>
                        </div>
                        <div className="bg-muted p-8 rounded-[2.5rem] border border-border shadow-2xl">
                           <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Status</p>
                           <h3 className="font-black text-xl italic uppercase tracking-tighter text-green-500">READY</h3>
                        </div>
                     </div>

                     <div className="bg-background p-10 rounded-[3rem] border border-border text-left space-y-6 max-w-3xl mx-auto">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Configuração de Fluxo</h4>
                        <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                           <CheckCircle2 className="w-5 h-5 text-green-500" /> Triagem Automática Ativada
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                           <CheckCircle2 className="w-5 h-5 text-green-500" /> Base de Conhecimento Vinculada
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                           <CheckCircle2 className="w-5 h-5 text-green-500" /> Integração WhatsApp Pronta
                        </div>
                     </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <footer className="mt-10 py-6 border-t border-border flex justify-between items-center bg-card px-6 rounded-t-[2.5rem]">
            <button 
              disabled={currentStep === 0}
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] italic text-muted-foreground hover:opacity-80 transition-all disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button 
              onClick={currentStep === STEPS.length - 1 ? handleSave : nextStep}
              disabled={loading}
              className={cn(
                "px-10 py-4 rounded-xl font-black italic text-sm shadow-2xl transition-all flex items-center gap-3 active:scale-95 disabled:grayscale",
                currentStep === STEPS.length - 1 ? "bg-green-500 text-white shadow-green-500/20" : "bg-primary text-white shadow-primary/20"
              )}
            >
              {loading ? "Processando..." : (currentStep === STEPS.length - 1 ? "Ativar Agora" : "Próxima Etapa")}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </footer>
        </div>
      </main>

      <style jsx global>{`
        .glass {
          background: hsl(var(--card) / 0.4);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          transition: all 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
