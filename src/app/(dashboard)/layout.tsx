"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X, 
  Bot,
  ChevronRight,
  LogOut,
  User,
  Zap,
  Calendar,
  TrendingUp,
  FileText,
  Layout,
  ChevronDown,
  CreditCard,
  Video,
  Headphones,
  PlusSquare
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface NavItem {
  name: string;
  icon: any;
  href: string;
  badge?: string;
  color?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "GERAL",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "#3b82f6" },
    ]
  },
  {
    title: "APRENDIZADO",
    items: [
      { name: "Vídeos Tutoriais", icon: Video, href: "/tutorials" },
    ]
  },
  {
    title: "ATENDIMENTO",
    items: [
      { name: "Central de Atendimento", icon: Headphones, href: "/support", color: "#06b6d4" },
    ]
  },
  {
    title: "AGENTES",
    items: [
      { name: "Meus Agentes", icon: Bot, href: "/agents", color: "#8b5cf6" },
      { name: "Criar Agente", icon: PlusSquare, href: "/agents/new", color: "#ec4899" },
      { name: "Agentes 2.0", icon: Zap, href: "/agents/flow", badge: "NOVO", color: "#f59e0b" },
    ]
  },
  {
    title: "APPS & INTEGRAÇÕES",
    items: [
      { name: "Integrações", icon: Zap, href: "/integrations", color: "#10b981" },
    ]
  },
  {
    title: "GESTÃO COMERCIAL",
    items: [
      { name: "Agenda", icon: Calendar, href: "/agenda", color: "#f43f5e" },
      { name: "Base de Clientes", icon: Users, href: "/contacts", color: "#3b82f6" },
      { name: "Pipeline CRM", icon: TrendingUp, href: "/crm", color: "#10b981" },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "Meu Plano", icon: FileText, href: "/billing" },
      { name: "Faturamento", icon: Layout, href: "/billing/invoice" },
      { name: "Minhas Assinaturas", icon: CreditCard, href: "/subscriptions" },
    ]
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { name: "Minha Empresa", icon: Settings, href: "/company", color: "#6366f1" },
      { name: "Configurações Globais", icon: Settings, href: "/settings", color: "#94a3b8" },
    ]
  },
  {
    title: "ADMINISTRAÇÃO",
    items: [
      { name: "Console Admin", icon: Zap, href: "/admin/users", badge: "PROPRIETÁRIO", color: "#8b5cf6" },
      { name: "Preços & Config", icon: Settings, href: "/admin/settings", color: "#64748b" },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Carregando...");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log("Logged UID:", user.id);
          const { data: profile, error } = await supabase
            .from('na_profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error("Profile fetch error:", error);
            setUserName("Erro Perfil");
          } else if (profile) {
            setUserRole(profile.role || 'member');
            setUserName(profile.full_name || 'Usuário');
          } else {
            console.log("Profile not found for user:", user.id);
            setUserName(user.email?.split('@')[0] || 'Usuário');
            setUserRole('user');
          }
        } else {
          // Usuário não está logado - redirecionar para login
          console.warn("Nenhum usuário detectado no Dashboard! Redirecionando...");
          router.push("/login");
        }
      } catch (err) {
        console.error("fetchRole caught error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRole();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const filteredSections = navSections.filter(section => {
    if (section.title === "ADMINISTRAÇÃO") {
      return userRole === 'master';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex overflow-hidden text-foreground font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            onMouseLeave={() => setSidebarOpen(false)}
            className="w-64 h-screen bg-card border-r border-border flex flex-col z-50 backdrop-blur-xl"
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <img src="/new_agent_icon.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-2xl" />
                 <div>
                   <h1 className="text-sm font-black tracking-tighter italic text-foreground leading-none">NEW</h1>
                   <h1 className="text-[9px] font-bold tracking-[0.3em] text-primary leading-none mt-1">AGENT</h1>
                 </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-5">
              {filteredSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="px-4 text-[8px] font-bold text-muted-foreground/70 tracking-[0.3em] uppercase mb-1 italic">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link 
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 relative group ${
                            isActive 
                              ? 'bg-primary/10 text-primary' 
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <item.icon 
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                            style={{ color: isActive ? 'currentColor' : (item.color || 'inherit') }}
                          />
                          <span className={`text-[12px] font-semibold tracking-tight ${isActive ? 'translate-x-0.5' : ''} transition-transform`}>
                            {item.name}
                          </span>
                          {isActive && (
                            <motion.div 
                              layoutId="active-pill"
                              className="absolute left-0 w-1 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                            />
                          )}
                          {item.badge && (
                            <span className="ml-auto text-[8px] font-bold bg-muted px-2 py-0.5 rounded-md border border-border text-muted-foreground uppercase tracking-widest group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-6 mt-auto border-t border-border bg-card">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-muted rounded-lg text-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-[11px] font-bold italic uppercase tracking-[0.2em] text-muted-foreground ml-2">
               {pathname.split('/').pop()?.replace('users', 'Painel Admin')}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-xl border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-transparent border-none outline-none text-[11px] w-40 font-medium text-foreground"
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              </button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />
            
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-[12px] font-bold text-foreground italic tracking-tight">
                    {userName}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                    {userRole === 'master' ? 'Proprietário Master' : 'Membro da Equipe'}
                  </p>
               </div>
               <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 p-[1.5px] shadow-lg shadow-primary/20">
                  <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                     <User className="w-4 h-4 text-primary" />
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Global Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-background relative">
           {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                 className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
               />
             </div>
           ) : children}
          {/* Subtle decoration elements */}
          <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="fixed top-[10%] left-[-5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        </main>
      </div>

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
