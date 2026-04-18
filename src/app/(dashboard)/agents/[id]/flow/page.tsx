"use client";

import React, { useState, useCallback, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Panel,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Plus, 
  Save, 
  Play, 
  MessageSquare, 
  Zap, 
  Calendar, 
  Search, 
  Settings,
  Info,
  User, 
  ChevronLeft,
  Settings2,
  Workflow,
  X,
  Sparkles,
  ArrowLeft,
  Clock,
  Layout,
  MousePointer2,
  ChevronDown,
  HelpCircle,
  Hash,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MoreVertical,
  Undo2,
  Redo2,
  Maximize2,
  Loader2,
  Trash2,
  Globe,
  Database,
  Image as ImageIcon,
  Eye,
  Check,
  MessageCircle,
  ArrowRight,
  Users,
  CreditCard,
  Bot,
  UserPlus,
  ArrowLeftRight as TransferIcon
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Custom Nodes ---

const InitialNode = ({ data }: any) => (
  <div className="bg-[#10b981]/5 border border-[#10b981]/30 p-5 rounded-[2.5rem] min-w-[240px] shadow-[0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-xl relative transition-all group hover:border-[#10b981]/60">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-[#10b981] rounded-2xl flex items-center justify-center shadow-lg shadow-[#10b981]/20 group-hover:scale-110 transition-transform">
        <Play className="w-6 h-6 text-white fill-white" />
      </div>
      <div>
         <span className="font-black text-[15px] text-foreground block leading-tight italic tracking-tight">{data.label || 'Início do Fluxo'}</span>
         <span className="text-[9px] text-[#10b981] font-black uppercase tracking-[0.2em] opacity-80 mt-1 block">
            {data.triggerKeyword ? `Gatilho: ${data.triggerKeyword}` : 'Gatilho de Entrada'}
         </span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#10b981] !border-2 !border-background !rounded-full hover:scale-150 transition-transform" />
  </div>
);

const ActionNode = ({ data, selected }: any) => {
  const Icon = data.iconComponent || (
    data.nodeId === 'booking' ? Calendar : 
    data.nodeId === 'n8n' ? Workflow :
    data.nodeId === 'wa' ? MessageSquare : 
    data.nodeId === 'ai' ? Sparkles : 
    data.nodeId === 'transfer' ? TransferIcon :
    data.nodeId === 'link' ? Globe :
    data.nodeId === 'pay' ? CreditCard :
    data.nodeId === 'lead' ? UserPlus :
    data.nodeId === 'faq' ? HelpCircle :
    MessageSquare
  );
  
  return (
    <div className={cn(
      "bg-card border p-5 rounded-[2.5rem] min-w-[280px] shadow-2xl backdrop-blur-xl relative transition-all group",
      selected ? "border-primary ring-4 ring-primary/10 scale-[1.02]" : "border-border hover:border-primary/20"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", 
            data.color || (
              data.nodeId === 'booking' || data.nodeId === 'availability' ? 'bg-[#10b981] shadow-emerald-500/20' : 
              data.nodeId === 'faq' ? 'bg-[#3b82f6] shadow-blue-500/20' :
              data.nodeId === 'lead' ? 'bg-[#f59e0b] shadow-amber-500/20' :
              data.nodeId === 'media' ? 'bg-[#d946ef] shadow-pink-500/20' :
              data.nodeId === 'transfer' ? 'bg-red-500 shadow-red-500/20' :
              data.nodeId === 'pay' ? 'bg-sky-500 shadow-sky-500/20' :
              data.nodeId === 'n8n' ? 'bg-[#ff6d5a] shadow-orange-500/20' :
              "bg-primary shadow-primary/20"
            )
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
             <span className="font-black text-[15px] text-foreground block leading-tight tracking-tight italic">{data.label || 'Ação'}</span>
             <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-1 block",
                data.nodeId === 'booking' ? 'text-emerald-500' : 
                data.nodeId === 'n8n' ? 'text-[#ff6d5a]' : 
                data.nodeId === 'transfer' ? 'text-red-500' :
                data.nodeId === 'link' ? 'text-blue-500' :
                'text-primary'
              )}>
                 {data.nodeId === 'booking' ? `Capacidade • Scheduling` : 
                  data.nodeId === 'n8n' ? `Integração • Automation` :
                  data.nodeId === 'transfer' ? `Ação • Transferência` :
                  data.nodeId === 'link' ? `Ação • Enviar Link` :
                  data.nodeId === 'pay' ? `Ação • Pagamento` :
                  `Ação • ${data.type || data.nodeId || "Node"}`}
              </span>
          </div>
        </div>
        {selected && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      <div className="p-4 bg-muted/30 rounded-3xl border border-border text-[11px] text-muted-foreground leading-relaxed min-h-[60px] flex flex-col justify-center italic">
         {data.nodeId === 'booking' ? (
           <div className="space-y-1">
              <p className="font-bold text-foreground/70">Destino: <span className="text-emerald-500">{data.bookingDest === 'google' ? 'Google Agenda' : 'Agenda Interna'}</span></p>
              <p className="text-[10px] opacity-60 text-muted-foreground">Horários: {data.hoursCount || 5} • {data.maxDays || 30} dias</p>
           </div>
         ) : data.nodeId === 'n8n' ? (
           <div className="space-y-1">
              <p className="font-bold text-foreground/70 truncate">Webhook: <span className="text-[#ff6d5a]">{data.webhookUrl || 'Não configurado'}</span></p>
              <p className="text-[10px] opacity-60 text-muted-foreground">Método: {data.method || 'POST'}</p>
           </div>
         ) : (
           <p className="line-clamp-2">
             {data.message || data.prompt || data.question || data.apiUrl || data.waMessage || data.preview || 'Clique para configurar...'}
           </p>
         )}
      </div>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-primary !border-2 !border-background !rounded-full hover:scale-150 transition-transform" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-background !rounded-full hover:scale-150 transition-transform" />
    </div>
  );
};

const ConditionNode = ({ data, selected }: any) => (
  <div className={cn(
    "bg-card border p-5 rounded-[2.5rem] min-w-[280px] shadow-2xl backdrop-blur-xl relative transition-all group",
    selected ? "border-orange-500 ring-4 ring-orange-500/10 scale-[1.02]" : "border-border hover:border-orange-500/20"
  )}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
           <Filter className="w-6 h-6 text-white" />
        </div>
        <div>
           <span className="font-black text-[15px] text-foreground block leading-tight tracking-tight italic">{data.label || 'Condição'}</span>
           <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.2em] opacity-80 mt-1 block">Condição • {data.conditionType || 'Lógica'}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2">
       <div className="flex-1 p-2.5 bg-green-500/10 rounded-xl border border-green-500/20 text-[9px] font-black tracking-widest text-center text-green-500 italic">SIM</div>
       <div className="flex-1 p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-[9px] font-black tracking-widest text-center text-red-500 italic">NÃO</div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-orange-500 !border-2 !border-background !rounded-full hover:scale-150 transition-transform" />
    <Handle type="source" position={Position.Left} id="no" className="!w-3 !h-3 !bg-red-500 !border-2 !border-background -left-1.5 !rounded-full hover:scale-150 transition-transform" />
    <Handle type="source" position={Position.Right} id="yes" className="!w-3 !h-3 !bg-green-500 !border-2 !border-background -right-1.5 !rounded-full hover:scale-150 transition-transform" />
  </div>
);


const nodeTypes = {
  initial: InitialNode,
  action: ActionNode,
  condition: ConditionNode,
};

function FlowEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState('actions');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("Carregando...");
 
  const currentNode = selectedNode 
    ? nodes.find(n => n.id === selectedNode.id) || selectedNode 
    : null;

  useEffect(() => {
    loadAgent();
  }, [id]);

  const loadAgent = async () => {
    try {
      const { data, error } = await supabase
        .from('na_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setAgentName(data.name);
      if (data.flow) {
        setNodes(data.flow.nodes || []);
        setEdges(data.flow.edges || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
    } finally {
      setLoading(false);
    }
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const nodeId = event.dataTransfer.getData('application/nodeid');

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: Math.random().toString(),
        type,
        position,
        data: { 
          label: label || 'Novo Nó', 
          nodeId: nodeId || '',
          type: 'Manual',
          color: type === 'condition' ? 'bg-orange-500' : 
                 (nodeId === 'booking' ? 'bg-emerald-500' : 
                 (nodeId === 'transfer' ? 'bg-red-500' :
                 (nodeId === 'link' ? 'bg-blue-500' :
                 (nodeId === 'pay' ? 'bg-sky-500' : 
                 (nodeId === 'n8n' ? 'bg-[#ff6d5a]' : 'bg-primary')))))
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    setNodes((nds) => nds.filter((node) => !deletedNodes.find((dn) => dn.id === node.id)));
    if (selectedNode && deletedNodes.find((dn) => dn.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleAbandonChanges = () => {
    if (confirm("Deseja descartar as alterações não salvas?")) {
      router.push('/agents');
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('na_agents')
        .update({ flow: { nodes, edges } })
        .eq('id', id);

      if (error) throw error;
      alert('✅ Fluxo salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar fluxo:', error);
      alert('Erro ao salvar: ' + (error?.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-background text-foreground overflow-hidden z-[100]">
      {/* Header */}
      <header className="h-12 border-b border-border px-4 flex items-center justify-between bg-card/80 backdrop-blur-3xl z-40 relative text-foreground">
        <div className="flex items-center gap-4">
            <Link href="/agents" className="w-9 h-9 border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-all group">
                <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-all" />
             </Link>
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                   <h1 className="text-sm font-bold tracking-tight text-foreground italic">{agentName}</h1>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase tracking-widest">v2.0 Beta</span>
               </div>
               <div className="flex items-center gap-1.5 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Editor de Fluxo Inteligente</p>
               </div>
            </div>
        </div>

        <div className="flex items-center gap-4 text-foreground">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border">
               <button className="w-8 h-8 hover:bg-muted rounded-lg flex items-center justify-center transition-all opacity-40 hover:opacity-100"><Undo2 className="w-4 h-4 text-foreground" /></button>
               <button className="w-8 h-8 hover:bg-muted rounded-lg flex items-center justify-center transition-all opacity-40 hover:opacity-100"><Redo2 className="w-4 h-4 text-foreground" /></button>
               <div className="w-[1px] h-4 bg-border mx-1" />
               <button className="w-8 h-8 hover:bg-muted rounded-lg flex items-center justify-center transition-all opacity-40 hover:opacity-100"><Maximize2 className="w-4 h-4 text-foreground" /></button>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border shadow-sm">
                <button 
                  onClick={handleAbandonChanges}
                  className="px-4 py-2 hover:bg-red-500/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-foreground hover:text-red-500 border border-transparent hover:border-red-500/20 select-none"
                >
                  Descartar
                </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "px-6 py-2 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all outline-none",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} 
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar - Component Library */}
         <aside className="w-[260px] border-r border-border bg-card flex flex-col z-30 shadow-2xl overflow-hidden h-full">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
               <div className="flex items-center gap-2">
                  <h2 className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Bibliotecas</h2>
                  <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary italic">A</div>
               </div>
               <button onClick={() => setIsLibraryModalOpen(true)} className="p-1.5 hover:bg-muted rounded-lg border border-border transition-all group">
                  <Plus className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
               </button>
            </div>

            <div className="p-2 border-b border-border flex gap-1 bg-muted/5">
               {['actions', 'conditions', 'capabilities'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all border",
                      activeTab === tab 
                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm shadow-primary/5" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab === 'actions' ? 'Ações' : tab === 'conditions' ? 'Condições' : 'Capacidades'}
                  </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0 bg-card">
               {/* Actions Tab */}
               {activeTab === 'actions' && [
                  { id: 'ai', name: 'Mensagem com IA', desc: 'Resposta gerada por IA', icon: Sparkles, color: 'bg-primary', type: 'action' },
                  { id: 'msg', name: 'Mensagem', desc: 'Resposta pré-definida', icon: MessageCircle, color: 'bg-blue-400', type: 'action' },
                  { id: 'transfer', name: 'Transferência', desc: 'Passar para humano', icon: UserPlus, color: 'bg-red-500', type: 'action' },
                  { id: 'link', name: 'Enviar Link', desc: 'Enviar link externo', icon: Globe, color: 'bg-blue-500', type: 'action' },
                  { id: 'pay', name: 'Pagamento', desc: 'Solicitar pagamento', icon: CreditCard, color: 'bg-sky-500', type: 'action', pro: true },
                  { id: 'wa', name: 'WhatsApp', desc: 'Enviar WhatsApp', icon: MessageSquare, color: 'bg-[#25D366]', type: 'action' },
                  { id: 'n8n', name: 'n8n Workflow', desc: 'Acionar workflow externo', icon: Workflow, color: 'bg-[#ff6d5a]', type: 'action', pro: true },
               ].map((item) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', item.type);
                      e.dataTransfer.setData('application/label', item.name);
                      e.dataTransfer.setData('application/nodeid', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-muted/20 border border-border rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-muted/40 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all shrink-0", item.color)}>
                           <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                           <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-[11px] tracking-tight text-foreground">{item.name}</h4>
                              {item.pro && (
                                 <div className="px-1 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[6px] font-black text-orange-500 uppercase">PRO</div>
                              )}
                           </div>
                           <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wide">{item.desc}</p>
                        </div>
                     </div>
                  </div>
               ))}

               {/* Conditions Tab */}
               {activeTab === 'conditions' && [
                  { id: 'hours', name: 'Horário', desc: 'Dentro/Fora de serviço', icon: Clock, color: 'bg-indigo-500', type: 'condition' },
                  { id: 'logic', name: 'Lógica', desc: 'Verificar variável', icon: Settings2, color: 'bg-orange-500', type: 'condition' },
                  { id: 'intent', name: 'Filtro (IA)', desc: 'Validar intenção do user', icon: Zap, color: 'bg-amber-500', type: 'condition' },
                  { id: 'status', name: 'Status do Lead', desc: 'Check status no CRM', icon: Users, color: 'bg-cyan-500', type: 'condition' },
               ].map((item) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', item.type);
                      e.dataTransfer.setData('application/label', item.name);
                      e.dataTransfer.setData('application/nodeid', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-muted/20 border border-border rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-muted/40 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all shrink-0", item.color)}>
                           <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[11px] tracking-tight text-foreground">{item.name}</h4>
                           <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wide">{item.desc}</p>
                        </div>
                     </div>
                  </div>
               ))}

               {/* Capabilities Tab */}
               {activeTab === 'capabilities' && [
                  { id: 'booking', name: 'Agendamento', desc: 'Agendar e Remarcar', icon: Calendar, color: 'bg-[#10b981]', type: 'capability' },
                  { id: 'availability', name: 'Disponibilidade', desc: 'Consultar horários', icon: Clock, color: 'bg-[#10b981]', type: 'capability' },
                  { id: 'faq', name: 'Dúvidas e FAQ', desc: 'Responder com RAG', icon: HelpCircle, color: 'bg-[#3b82f6]', type: 'capability' },
                  { id: 'consult_order', name: 'Consulta Pedido', desc: 'Status de pedidos', icon: Search, color: 'bg-violet-500', type: 'capability' },
                  { id: 'balance', name: 'Consulta Saldo', desc: 'Saldo do cliente', icon: CreditCard, color: 'bg-sky-500', type: 'capability' },
                  { id: 'lead', name: 'Captura de Lead', desc: 'Salvar no Pipeline', icon: UserPlus, color: 'bg-amber-500', type: 'capability' },
               ].map((item) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', item.type);
                      e.dataTransfer.setData('application/label', item.name);
                      e.dataTransfer.setData('application/nodeid', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-muted/20 border border-border rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-muted/40 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all shrink-0", item.color)}>
                           <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[11px] tracking-tight text-foreground">{item.name}</h4>
                           <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wide">{item.desc}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </aside>

         {/* Canvas Area */}
         <main className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              onNodesDelete={onNodesDelete}
              fitView
              colorMode="light"
              className="bg-background"
            >
              <Background variant={BackgroundVariant.Dots} color="#e2e8f0" gap={40} size={1} />
              <Controls className="!bg-card !border-border !fill-muted-foreground !rounded-2xl !p-2 !shadow-2xl" />
              
              {currentNode && (
                <div className="absolute top-4 right-4 w-[340px] flex-shrink-0 bg-card/98 backdrop-blur-3xl border border-border rounded-[2.5rem] shadow-2xl z-50 overflow-hidden flex flex-col h-[calc(100%-2rem)]">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", 
                        currentNode.type === 'initial' ? 'bg-[#10b981]' : (currentNode.type === 'condition' ? 'bg-orange-500' : (currentNode.data.color as string) || 'bg-primary')
                      )}>
                        {currentNode.type === 'initial' ? <Play className="w-5 h-5 text-white fill-white" /> : 
                         currentNode.type === 'condition' ? <Filter className="w-5 h-5 text-white" /> : 
                         <Bot className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-foreground leading-none italic">{currentNode.data.label as string}</h3>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5">
                          {currentNode.type === 'initial' ? 'Trigger' : currentNode.type === 'condition' ? 'Lógica' : 'Ação'} • ID {currentNode.id.substring(0, 4)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="w-10 h-10 rounded-2xl bg-card border border-border hover:bg-muted flex items-center justify-center transition-all group active:scale-90">
                      <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  </div>
 
                  {/* Tabs */}
                  <div className="flex p-1.5 border-b border-border bg-muted/10 shrink-0">
                    {['parameters', 'settings'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, activePanelTab: tab } } : n))}
                        className={cn(
                          "flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-xl",
                          (currentNode.data.activePanelTab || 'parameters') === tab 
                            ? "bg-primary text-white shadow-xl" 
                            : "text-muted-foreground/40 hover:text-foreground"
                        )}
                      >
                        {tab === 'parameters' ? 'Parâmetros' : 'Avançado'}
                      </button>
                    ))}
                  </div>
 
                  {/* Main Content Area */}
                  <div key={currentNode.id} className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
                    <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {((currentNode.data.activePanelTab || 'parameters') === 'settings') ? (
                         <div className="space-y-6">
                            <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-4">
                               <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                     <span className="text-[10px] text-white/50 font-black uppercase tracking-widest block">Continuar no Erro</span>
                                     <span className="text-[8px] text-white/20">Ignora falhas neste nó</span>
                                  </div>
                                  <div className="w-10 h-5 bg-muted rounded-full relative cursor-pointer" onClick={() => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, continueOnFail: !(currentNode.data.continueOnFail ?? false) } } : n))}>
                                     <div className={cn("w-3.5 h-3.5 bg-background rounded-full absolute top-0.5 transition-all shadow-sm", currentNode.data.continueOnFail ? "right-0.5 bg-primary" : "left-0.5")} />
                                  </div>
                               </div>
                               <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                     <span className="text-[10px] text-foreground/50 font-black uppercase tracking-widest block">Retry Instantâneo</span>
                                     <span className="text-[8px] text-muted-foreground">Tenta novamente 1x em erro</span>
                                  </div>
                                  <div className="w-10 h-5 bg-muted rounded-full relative cursor-pointer" onClick={() => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, retryOnFail: !(currentNode.data.retryOnFail ?? false) } } : n))}>
                                     <div className={cn("w-3.5 h-3.5 bg-background rounded-full absolute top-0.5 transition-all text-foreground", currentNode.data.retryOnFail ? "right-0.5 bg-primary" : "left-0.5")} />
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-2">Notas Operacionais</label>
                               <textarea 
                                 rows={4} 
                                 className="w-full bg-white/5 border border-white/5 rounded-3xl py-4 px-5 text-sm text-white/70 outline-none focus:border-white/20 transition-all placeholder:text-white/10" 
                                 placeholder="Notas internas sobre este nó..."
                                 defaultValue={(currentNode.data.notes as string) || ''}
                                 onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, notes: e.target.value } } : n))}
                               />
                            </div>
                         </div>
                      ) : (
                         <div className="space-y-6">
                            {/* Nome Customizável */}
                            <div className="space-y-2 text-center pb-2">
                              <input
                                type="text"
                                className="w-full bg-transparent border-none py-2 px-3 outline-none text-xl font-black text-white text-center italic tracking-tight placeholder:opacity-20 translate-y-2 focus:translate-y-0 transition-all"
                                placeholder="Nome da Ação..."
                                defaultValue={currentNode.data.label as string}
                                onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                              />
                            </div>

                            {/* Campos Específicos */}
                            <div className="p-1 bg-muted/5 border border-white/5 rounded-[2rem] overflow-hidden">
                                <div className="p-5 space-y-5">
                                    {(currentNode.type === 'initial') && (
                                      <div className="space-y-2">
                                         <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Keyword de Ativação</label>
                                         <input 
                                           type="text" 
                                           placeholder="Ex: #promo" 
                                           className="w-full bg-muted/30 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40"
                                           defaultValue={currentNode.data.triggerKeyword as string || ''}
                                           onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, triggerKeyword: e.target.value } } : n))}
                                         />
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'ai' || currentNode.data.type === 'AI Response' || currentNode.data.type === 'AI Intelligence') && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">System Prompt (Personalidade)</label>
                                          <textarea
                                            rows={10}
                                            placeholder="Você é um assistente da barbearia..."
                                            className="w-full bg-muted/30 border border-border rounded-3xl py-4 px-5 text-sm text-foreground outline-none focus:border-primary/40 leading-relaxed placeholder:text-muted-foreground/20"
                                            defaultValue={(currentNode.data.prompt as string) || (currentNode.data.systemMessage as string) || ''}
                                            onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, prompt: e.target.value, systemMessage: e.target.value } } : n))}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                           <div className="space-y-2">
                                              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Modelo</label>
                                              <select className="w-full bg-muted/30 border border-border rounded-[1.2rem] py-2.5 px-3 text-[10px] font-bold text-foreground outline-none transition-all cursor-pointer">
                                                 <option>GPT-4o (Premium)</option>
                                                 <option>Claude 3.5 Sonnet</option>
                                              </select>
                                           </div>
                                           <div className="space-y-2">
                                              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Criatividade</label>
                                              <input type="range" className="w-full accent-primary" />
                                           </div>
                                        </div>
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'wa' || currentNode.data.nodeId === 'msg') && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Texto da Mensagem</label>
                                          <textarea rows={6} className="w-full bg-muted/30 border border-border rounded-3xl py-4 px-5 text-sm text-foreground outline-none focus:border-green-500/40 placeholder:text-muted-foreground/20" defaultValue={(currentNode.data.message as string) || (currentNode.data.waMessage as string) || ''} onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, message: e.target.value } } : n))} />
                                        </div>
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'transfer') && (
                                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                               <TransferIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-[10px] text-red-500 font-bold leading-relaxed italic">Este nó encerra a automação e transfere a conversa para o painel de atendimento humano.</p>
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Departamento de Destino</label>
                                            <select className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-red-500/40 appearance-none cursor-pointer transition-all">
                                              <option value="suporte">Suporte Técnico</option>
                                              <option value="vendas">Vendas / Comercial</option>
                                              <option value="financeiro">Financeiro</option>
                                            </select>
                                         </div>

                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Nome da Empresa / Barbearia</label>
                                            <input 
                                              type="text" 
                                              placeholder="Ex: Barbearia Gaeta" 
                                              className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-emerald-500/40"
                                              defaultValue={currentNode.data.companyName as string || ''}
                                              onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, companyName: e.target.value } } : n))}
                                            />
                                         </div>
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'link') && (
                                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                         <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                               <Globe className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-[10px] text-blue-500 font-bold leading-relaxed italic">Envia um link clicável com preview para o cliente.</p>
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">URL do Link</label>
                                            <input type="url" placeholder="https://..." className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-blue-500/40" />
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Texto do Link</label>
                                            <input type="text" placeholder="Ex: Clique aqui para acessar" className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-blue-500/40" />
                                         </div>
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'pay') && (
                                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                         <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-[2rem] flex items-center gap-4">
                                            <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                                               <CreditCard className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-[10px] text-sky-500 font-bold leading-relaxed italic">Gera uma cobrança via PIX ou Link de Pagamento.</p>
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Valor (R$)</label>
                                            <input type="number" placeholder="0,00" className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-sky-500/40" />
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Descrição da Cobrança</label>
                                            <input type="text" placeholder="Ex: Pagamento do Serviço" className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-sky-500/40" />
                                         </div>

                                         <div className="space-y-4">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Horário de Funcionamento</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] text-muted-foreground uppercase opacity-50 ml-1">Início</span>
                                                    <input 
                                                        type="time" 
                                                        className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs font-bold text-foreground outline-none focus:border-emerald-500/30 transition-colors" 
                                                        defaultValue={currentNode.data.workStart as string || '09:00'} 
                                                        onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, workStart: e.target.value } } : n))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] text-muted-foreground uppercase opacity-50 ml-1">Fim</span>
                                                    <input 
                                                        type="time" 
                                                        className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs font-bold text-foreground outline-none focus:border-emerald-500/30 transition-colors" 
                                                        defaultValue={currentNode.data.workEnd as string || '18:00'} 
                                                        onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, workEnd: e.target.value } } : n))}
                                                    />
                                                </div>
                                            </div>
                                         </div>
                                       </div>
                                     )}

                                       {(currentNode.data.nodeId === 'booking') && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-4">
                                           <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                              <Calendar className="w-5 h-5 text-white" />
                                           </div>
                                           <p className="text-[10px] text-emerald-600 font-bold leading-relaxed italic">O agente pode agendar novos horários, verificar disponibilidade e processar cancelamentos automaticamente.</p>
                                        </div>

                                        <div className="space-y-2">
                                           <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Onde salvar os agendamentos?</label>
                                           <select 
                                             className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-emerald-500/40 appearance-none cursor-pointer transition-all"
                                             defaultValue={(currentNode.data.bookingDest as string) || 'internal'}
                                             onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, bookingDest: e.target.value } } : n))}
                                           >
                                             <option value="internal">Agenda Interna</option>
                                             <option value="google">Google Agenda</option>
                                           </select>
                                        </div>

                                        <div className="p-5 bg-muted/5 border border-border rounded-[2.5rem] space-y-5 shadow-inner">
                                           <div className="flex items-center justify-between group">
                                              <div className="space-y-0.5">
                                                 <span className="text-[10px] text-foreground/50 font-black uppercase tracking-widest block group-hover:text-emerald-500 transition-colors">Agendar no mesmo dia?</span>
                                              </div>
                                              <button className={cn("w-10 h-5 rounded-full relative transition-all", currentNode.data.allowSameDay ? "bg-emerald-500/40" : "bg-muted shadow-inner")} onClick={() => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, allowSameDay: !(currentNode.data.allowSameDay ?? false) } } : n))}>
                                                 <div className={cn("w-3 h-3 rounded-full absolute top-1 transition-all", currentNode.data.allowSameDay ? "right-1 bg-emerald-500" : "left-1 bg-foreground/20")} />
                                              </button>
                                           </div>
                                           <div className="flex items-center justify-between group">
                                              <div className="space-y-0.5">
                                                 <span className="text-[10px] text-foreground/50 font-black uppercase tracking-widest block group-hover:text-emerald-500 transition-colors">Verificar Disponibilidade?</span>
                                              </div>
                                              <button className={cn("w-10 h-5 rounded-full relative transition-all", (currentNode.data.verifyAvailability ?? true) ? "bg-emerald-500/40" : "bg-muted shadow-inner")} onClick={() => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, verifyAvailability: !(currentNode.data.verifyAvailability ?? true) } } : n))}>
                                                 <div className={cn("w-3 h-3 rounded-full absolute top-1 transition-all", (currentNode.data.verifyAvailability ?? true) ? "right-1 bg-emerald-500" : "left-1 bg-foreground/20")} />
                                              </button>
                                           </div>
                                        </div>
                                      </div>
                                    )}

                                    {(currentNode.data.nodeId === 'n8n') && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                         <div className="p-4 bg-[#ff6d5a]/10 border border-[#ff6d5a]/20 rounded-[2rem] flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#ff6d5a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff6d5a]/20">
                                               <Workflow className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-[10px] text-[#ff6d5a] font-bold leading-relaxed italic">Acione automações complexas enviando dados deste agente para um webhook do n8n.</p>
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Webhook URL (n8n)</label>
                                            <input 
                                              type="url" 
                                              placeholder="https://n8n.seudominio.com/webhook/..."
                                              className="w-full bg-muted/30 border border-border rounded-2xl py-3.5 px-5 text-xs font-bold text-foreground outline-none focus:border-[#ff6d5a]/40 transition-all font-mono"
                                              defaultValue={currentNode.data.webhookUrl as string || ''}
                                              onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, webhookUrl: e.target.value } } : n))}
                                            />
                                         </div>
                                      </div>
                                    )}

                                    {/* FAQ Node */}
                                    {(currentNode.data.nodeId === 'faq') && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center gap-4">
                                           <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                              <HelpCircle className="w-5 h-5 text-white" />
                                           </div>
                                           <p className="text-[10px] text-primary font-bold leading-relaxed italic">O agente usará a Base de Conhecimento para responder dúvidas frequentes dos clientes.</p>
                                        </div>
                                        <div className="space-y-2">
                                           <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Contexto Específico (Opcional)</label>
                                           <textarea 
                                             placeholder="Ex: Focar apenas em preços e horários..."
                                             className="w-full bg-muted/30 border border-border rounded-2xl py-4 px-5 text-xs font-bold text-foreground outline-none focus:border-primary/40 transition-all min-h-[120px] resize-none placeholder:text-muted-foreground/20"
                                             defaultValue={currentNode.data.faqContext as string || ''}
                                             onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, faqContext: e.target.value } } : n))}
                                           />
                                        </div>
                                      </div>
                                    )}

                                    {/* Lead Capture Node */}
                                    {(currentNode.data.nodeId === 'lead') && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-4">
                                           <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                              <UserPlus className="w-5 h-5 text-white" />
                                           </div>
                                           <p className="text-[10px] text-amber-600 font-bold leading-relaxed italic">Capture dados do cliente e salve automaticamente no Pipeline do CRM.</p>
                                        </div>
                                        <div className="space-y-2">
                                           <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Campos para Capturar</label>
                                           <div className="grid grid-cols-1 gap-2">
                                              {['Nome', 'Email', 'Telefone', 'Empresa', 'Interesse'].map(f => (
                                                <div key={f} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl">
                                                  <label className="text-[10px] font-bold text-foreground/60">{f}</label>
                                                  <div className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                  </div>
                                                </div>
                                              ))}
                                           </div>
                                        </div>
                                      </div>
                                    )}

                                    {(currentNode.type === 'condition') && (
                                      <div className="space-y-4">
                                         <div className="space-y-2">
                                           <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block ml-2">Lógica de Verificação</label>
                                           <select className="w-full bg-muted/30 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-orange-500/40 appearance-none cursor-pointer transition-all" defaultValue={(currentNode.data.conditionType as string) || 'keyword'} onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, conditionType: e.target.value } } : n))}>
                                             <option value="keyword">Contém Palavra-Chave</option>
                                             <option value="hours">Horário Comercial</option>
                                             <option value="intent">Intenção (Natural Language)</option>
                                             <option value="logic">Lógica Customizada</option>
                                             <option value="status">Status no CRM</option>
                                           </select>
                                         </div>
                                         <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                            <p className="text-[10px] text-orange-600 font-bold italic">O fluxo será desviado para a saída VERDE se a condição for satisfeita, caso contrário seguirá pela saída VERMELHA.</p>
                                         </div>
                                      </div>
                                    )}
                                </div>
                            </div>
                         </div>
                      )}
                    </div>
 
                    {/* Rodapé Interno */}
                    <div className="p-6 border-t border-border bg-muted/20 space-y-4 shrink-0">
                      {currentNode.type !== 'initial' && (
                        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Tempo de Espera (ms)</label>
                          <input type="number" step="500" min="0" className="w-24 bg-background border border-border rounded-xl py-1.5 px-3 text-[11px] font-black text-primary text-right outline-none" defaultValue={currentNode.data.delay as number || 0} onChange={(e) => setNodes(nds => nds.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, delay: parseInt(e.target.value) } } : n))} />
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                         <button onClick={deleteSelectedNode} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/20 transition-all active:scale-95" title="Excluir Nó">
                            <Trash2 className="w-5 h-5" />
                         </button>
                         <button onClick={handleSave} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Atualizar Agente
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ReactFlow>
         </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .react-flow__edge-path {
          stroke-dasharray: 5;
          animation: dash 20s linear infinite;
        }

        @keyframes dash {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          border-radius: 4px !important;
          transition: all 0.2s;
        }
        .react-flow__handle:hover {
          transform: scale(1.5);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .react-flow__node {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}

export default function DynamicFlowPage(props: { params: Promise<{ id: string }> }) {
  return (
    <ReactFlowProvider>
      <FlowEditor params={props.params} />
    </ReactFlowProvider>
  );
}
