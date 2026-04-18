"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Globe,
  Database
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/new_agent_logo.png" alt="New Agent" className="h-10 object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium hover:text-primary transition-colors cursor-pointer text-white/70">Funcionalidades</button>
            <button onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium hover:text-primary transition-colors cursor-pointer text-white/70">Soluções</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium hover:text-primary transition-colors cursor-pointer text-white/70">Preços</button>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium">Entrar</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="px-6 py-20 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 uppercase tracking-wider"
          >
            <Sparkles className="w-3 h-3" />
            A Revolução No-Code dos Agentes de IA
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
          >
            Crie Agentes de IA que <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              Vendem e Agendam
            </span> por Você
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Transforme seu WhatsApp em uma máquina de vendas. Agentes inteligentes integrados ao seu CRM e Google Agenda, sem precisar de uma linha de código.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 group">
              Criar meu Agente Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#demo" className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground rounded-full text-lg font-bold hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
              Ver Demonstração
            </Link>
          </motion.div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass rounded-3xl p-4 md:p-8 aspect-video md:aspect-[21/9] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                  <div className="w-3 h-3 rounded-full bg-green-400/50" />
                </div>
                <div className="h-2 w-48 bg-white/10 rounded-full" />
              </div>
              
              <div className="grid grid-cols-12 gap-6 h-full">
                <div className="col-span-3 space-y-4">
                  <div className="h-10 w-full bg-primary/20 rounded-xl animate-pulse" />
                  <div className="h-10 w-full bg-white/5 rounded-xl" />
                  <div className="h-10 w-full bg-white/5 rounded-xl" />
                  <div className="h-10 w-full bg-white/5 rounded-xl" />
                </div>
                <div className="col-span-9 grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="h-2 w-20 bg-white/10 rounded-full" />
                      <div className="h-4 w-full bg-white/10 rounded-full" />
                    </div>
                  ))}
                  <div className="col-span-3 bg-white/5 rounded-2xl p-6 border border-white/5 h-40 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                        <div className="h-4 w-12 bg-primary/30 rounded-full" />
                    </div>
                    <div className="flex items-end gap-2 h-full pb-10">
                        {[40, 60, 45, 90, 75, 85, 100].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/40 rounded-t-lg transition-all hover:bg-primary" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic mb-6 italic uppercase">Tudo o que você precisa em <br /><span className="text-primary italic">uma única plataforma</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Economize centenas de horas de trabalho manual com automações inteligentes que realmente funcionam.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                {
                  title: "Agente WhatsApp",
                  icon: <MessageSquare className="w-6 h-6" />,
                  desc: "IA treinada no seu conteúdo que responde clientes em segundos, 24 horas por dia."
                },
                {
                  title: "CRM Inteligente",
                  icon: <Users className="w-6 h-6" />,
                  desc: "Organização automática de leads. O agente detecta a intenção e move o cliente no funil."
                },
                {
                  title: "Agenda Nativa",
                  icon: <Calendar className="w-6 h-6" />,
                  desc: "Integração direta com Google Agenda para marcação de horários sem conflitos."
                },
                {
                  title: "Base de Conhecimento",
                  icon: <Database className="w-6 h-6" />,
                  desc: "Suba PDFs, sites ou arquivos e sua IA aprenderá tudo sobre seu produto ou serviço."
                },
                {
                  title: "Vendas Automáticas",
                  icon: <Zap className="w-6 h-6" />,
                  desc: "IA capaz de enviar links de pagamento e fechar carrinhos abandonados no WhatsApp."
                },
                {
                  title: "Multi-Canais",
                  icon: <Globe className="w-6 h-6" />,
                  desc: "Gerencie múltiplos números e agentes a partir de um único painel central."
                }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-3xl glass transition-all hover:border-primary/50 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-8 text-left">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Soluções para cada <span className="text-primary whitespace-nowrap">Nicho de Mercado</span></h2>
              <p className="text-muted-foreground text-lg leading-relaxed">Nossa tecnologia se adapta ao seu modelo de negócio, seja você um prestador de serviços ou um e-commerce de grande escala.</p>
              
              <div className="space-y-6">
                 {[
                   { title: "Saúde & Estética", text: "Agendamentos automáticos e lembretes de consulta via WhatsApp." },
                   { title: "Imobiliárias", text: "Qualificação de leads e envio de catálogos de imóveis 24/7." },
                   { title: "Educação", text: "Suporte a alunos e venda de cursos com IA treinada em seu conteúdo." },
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 items-start bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                         <Zap className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="font-bold text-white mb-1">{item.title}</h4>
                         <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
               <div className="relative glass p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                  {/* Simulação de conversa interface */}
                  <div className="space-y-4">
                     <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                        <p className="text-xs text-secondary-foreground font-medium">Olá! Gostaria de agendar um horário para amanhã na Barbearia Gaeta.</p>
                     </div>
                     <div className="bg-primary p-4 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-lg shadow-primary/20">
                        <p className="text-xs text-white font-bold italic">Claro! Amanhã temos disponibilidade às 14h, 15h e 17h. Qual horário fica melhor para você? ✂️</p>
                     </div>
                     <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none max-w-[60%]">
                        <p className="text-xs text-secondary-foreground font-medium">Às 15h, por favor.</p>
                     </div>
                     <div className="bg-primary p-4 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-lg shadow-primary/20">
                        <p className="text-xs text-white font-bold italic">Perfeito! Seu agendamento para às 15h foi confirmado. Acabei de adicionar ao seu calendário. ✅</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 bg-primary/5">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic mb-8 italic uppercase">Preços <span className="text-primary italic">Transparentes</span></h2>
            <p className="text-muted-foreground mb-12 max-w-xl mx-auto">Comece gratuitamente e escale conforme seu negócio cresce.</p>
            
            {/* Billing Toggle */}
            <div className="flex justify-center mb-16">
              <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    billingCycle === 'monthly' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Faturamento Mensal
                </button>
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
                    billingCycle === 'annual' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Faturamento Anual
                  <span className="absolute -top-3 -right-3 bg-green-500 text-[8px] px-2 py-1 rounded-full text-white">-20%</span>
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
               <div className="glass p-12 rounded-[3.5rem] border border-white/10 hover:border-white/20 transition-all text-left space-y-8">
                  <h3 className="text-2xl font-black italic">Starter</h3>
                  <div className="text-5xl font-black italic">Grátis</div>
                  <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1 Agente Ativo</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 100 Contatos/mês</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Agenda Nativa</li>
                     <li className="flex items-center gap-2 opacity-30"><CheckCircle2 className="w-4 h-4" /> WhatsApp Ilimitado</li>
                  </ul>
                  <Link href="/signup" className="block w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-center font-bold hover:bg-white/10 transition-all">Começar Agora</Link>
               </div>
               
               <div className="glass p-12 rounded-[3.5rem] border-2 border-primary/50 text-left space-y-8 relative overflow-hidden group">
                  <div className="absolute top-6 right-6 px-3 py-1 bg-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Popular</div>
                  <h3 className="text-2xl font-black italic">Plano PRO</h3>
                  <div className="flex items-baseline gap-2">
                     <div className="text-5xl font-black italic leading-none">
                       {billingCycle === 'monthly' ? 'R$ 199,99' : 'R$ 159,99'}
                     </div>
                     <div className="text-sm font-bold text-muted-foreground">/mês</div>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      Cobrado anualmente (R$ 1.919,90/ano)
                    </div>
                  )}
                  <ul className="space-y-4 text-sm font-bold">
                     <li className="flex items-center gap-2 text-white"><CheckCircle2 className="w-4 h-4 text-primary" /> Agentes Ilimitados</li>
                     <li className="flex items-center gap-2 text-white"><CheckCircle2 className="w-4 h-4 text-primary" /> WhatsApp Ilimitado</li>
                     <li className="flex items-center gap-2 text-white"><CheckCircle2 className="w-4 h-4 text-primary" /> Mensagens Ilimitadas</li>
                     <li className="flex items-center gap-2 text-white"><CheckCircle2 className="w-4 h-4 text-primary" /> Suporte Prioritário</li>
                  </ul>
                  <Link href="/signup" className="block w-full py-4 bg-primary text-white rounded-2xl text-center font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Assinar PRO Agora</Link>
               </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-6 text-center">
            <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[4rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-primary/10">
                    <Sparkles className="w-32 h-32" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8 relative z-10">Pronto para colocar seu <br />atendimento no automático?</h2>
                <p className="text-muted-foreground mb-12 text-lg max-w-xl mx-auto relative z-10">
                    Comece hoje gratuitamente e descubra como a Inteligência Artificial pode escalar o seu negócio.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                    <Link href="/signup" className="px-10 py-5 bg-primary text-white rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl shadow-primary/30">
                        Criar meu Agente Grátis
                    </Link>
                    <Link href="/contact" className="px-10 py-5 bg-white/5 border border-white/10 rounded-full text-xl font-bold hover:bg-white/10 transition-all">
                        Falar com Especialista
                    </Link>
                </div>
                <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground opacity-60">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Sem cartão de crédito</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Setup em 5 minutos</span>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all">
                <Bot className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground tracking-tight">NEW AGENT <span className="opacity-50 font-normal">CLONE</span></span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
                <Link href="#">Termos</Link>
                <Link href="#">Privacidade</Link>
                <Link href="#">Suporte</Link>
            </div>
            <div className="text-sm text-muted-foreground/50">
                &copy; 2026 Plataforma de Agentes IA. Todos os direitos reservados.
            </div>
        </div>
      </footer>
    </div>
  );
}
