"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  Calendar,
  Zap,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  Target,
  BarChart3,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const stats = [
  { label: "Agendamentos efetuados", value: "0", change: "0%", icon: Calendar, color: "bg-blue-500" },
  { label: "Agendamentos via IA", value: "0", change: "0%", icon: Zap, color: "bg-green-500" },
  { label: "Taxa de Conversão", value: "0%", change: "0%", icon: Target, color: "bg-purple-500" },
  { label: "Atendimentos Manuais", value: "0", change: "0%", icon: Users, color: "bg-orange-500" },
];

const mockData = [
  { name: "01/04", agendamentos: 0 },
  { name: "02/04", agendamentos: 0 },
  { name: "03/04", agendamentos: 0 },
  { name: "04/04", agendamentos: 0 },
  { name: "05/04", agendamentos: 0 },
  { name: "06/04", agendamentos: 0 },
  { name: "07/04", agendamentos: 0 },
];

const pieData = [
  { name: "Confirmados", value: 400 },
  { name: "Pendentes", value: 300 },
  { name: "Cancelados", value: 100 },
];

const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

export default function DashboardPage() {
  return (
    <div className="space-y-10 p-2 md:p-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
           <p className="text-muted-foreground text-sm">Visão geral do desempenho dos seus agentes</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
           <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">Hoje</button>
           <button className="px-6 py-2.5 hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground">Mês</button>
           <button className="px-6 py-2.5 hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground">Total</button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-[2.5rem] border border-white/5 group hover:border-primary/30 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all`}>
                 <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                 <ArrowUpRight className="w-3 h-3 text-green-500" />
                 <span className="text-[10px] font-black text-green-500">{stat.change}</span>
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-1">{stat.value}</h3>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">{stat.label}</p>

            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-all">
               <stat.icon className="w-32 h-32" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Monthly Analysis */}
         <div className="lg:col-span-2 glass p-10 rounded-[3rem] border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                     <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-black italic tracking-tight">Análise Mensal <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest ml-4 not-italic opacity-50">Evolução de Agendamentos</span></h2>
               </div>
               <button className="text-xs font-bold text-muted-foreground hover:text-white transition-all flex items-center gap-2">
                 Ver Detalhes <MoreHorizontal className="w-4 h-4" />
               </button>
            </div>

            <div className="h-[400px] w-full mt-12 pr-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <defs>
                      <linearGradient id="colorAgend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                      dy={20}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="agendamentos" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorAgend)" 
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pie Chart Analysis */}
         <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-black italic tracking-tight mb-8">Status de Confirmação</h2>
            <div className="h-[300px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">0</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Total GERAL</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full mt-8">
               {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                     </div>
                     <span className="text-xs font-black">0%</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* IA Comms */}
          <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-8">
            <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
               <Sparkles className="w-5 h-5 text-purple-500" /> IA & Comunicação
            </h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                    <Bar dataKey="agendamentos" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Distribution */}
          <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-8">
            <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
               <UserPlus className="w-5 h-5 text-green-500" /> Gestão de Contatos
            </h3>
            <div className="space-y-4">
               {[1, 2, 3].map((item) => (
                  <div key={item} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between opacity-50">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                           <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                           <div className="h-4 w-32 bg-white/10 rounded-md mb-2" />
                           <div className="h-2 w-20 bg-white/5 rounded-md" />
                        </div>
                     </div>
                     <MoreHorizontal className="w-5 h-5 text-white/10" />
                  </div>
               ))}
               <div className="text-center pt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Nenhum lead registrado recentemente</span>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
}
