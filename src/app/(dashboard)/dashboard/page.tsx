"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Scissors,
  TrendingUp,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalClients: number;
  activeBarbers: number;
  todayBookings: number;
}

interface RecentBooking {
  id: string;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  barber_name: string;
}

const COMPANY_ID = "7567b91e-755d-4af5-bf68-ce46f885fdab"; // Gaeta

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-green-500/10 text-green-600 border border-green-500/20",
    aguardando: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
    cancelled: "bg-red-500/10 text-red-600 border border-red-500/20",
    completed: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  };
  const labels: Record<string, string> = {
    confirmed: "Confirmado",
    aguardando: "Pendente",
    cancelled: "Cancelado",
    completed: "Concluído",
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Sua Empresa");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        let { data: profile } = await supabase
          .from("na_profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        let companyId = profile?.company_id;

        if (!companyId) {
          console.warn("Perfil não encontrado no Dashboard! Iniciando Auto-Heal...");
          const { data: fallbackComp } = await supabase.from("na_companies").select("id").limit(1).single();
          if (fallbackComp?.id) {
            await supabase.from("na_profiles").upsert({
              id: user.id,
              company_id: fallbackComp.id,
              full_name: "Recuperado Vercel",
              role: "user"
            });
            companyId = fallbackComp.id;
          } else {
            setLoading(false); 
            return;
          }
        }

        const today = new Date().toISOString().split("T")[0];

        const [compRes, booksRes, clientsRes, barbersRes, todayRes] = await Promise.all([
          supabase.from("na_companies").select("name").eq("id", companyId).single(),
          supabase
            .from("na_bookings")
            .select("id,date,time,status,client_id")
            .eq("company_id", companyId)
            .order("date", { ascending: false })
            .limit(50),
          supabase
            .from("na_clients")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId),
          supabase
            .from("na_barbers")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId),
          supabase
            .from("na_bookings")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("date", today),
        ]);

        if (compRes.data?.name) setCompanyName(compRes.data.name);

        const books = booksRes.data || [];
        setStats({
          totalBookings: books.length,
          confirmedBookings: books.filter((b) => b.status === "confirmed").length,
          pendingBookings: books.filter((b) => b.status === "aguardando").length,
          totalClients: clientsRes.count || 0,
          activeBarbers: barbersRes.count || 0,
          todayBookings: todayRes.count || 0,
        });

        // Buscar os 5 mais recentes com detalhes
        const recentBooks = books.slice(0, 5);
        const clientIds = [...new Set(recentBooks.map((b) => b.client_id).filter(Boolean))];
        const recentIds = recentBooks.map((b) => b.id);

        const [detailedBooksRes, clientsRes2] = await Promise.all([
          supabase
            .from("na_bookings")
            .select("id, date, time, status, client_id, service_id, barber_id")
            .in("id", recentIds)
            .order("date", { ascending: false }),
          clientIds.length > 0
            ? supabase.from("na_clients").select("id, name, phone").in("id", clientIds)
            : Promise.resolve({ data: [] }),
        ]);

        const clientMap: Record<string, any> = {};
        ((clientsRes2 as any).data || []).forEach((c: any) => { clientMap[c.id] = c; });

        // Buscar nomes de serviços e barbeiros
        const serviceIds = [...new Set((detailedBooksRes.data || []).map((b) => b.service_id))].filter(Boolean);
        const barberIds = [...new Set((detailedBooksRes.data || []).map((b) => b.barber_id))].filter(Boolean);

        const [servRes, barbRes] = await Promise.all([
          serviceIds.length > 0 ? supabase.from("na_services").select("id, name").in("id", serviceIds) : Promise.resolve({ data: [] }),
          barberIds.length > 0 ? supabase.from("na_barbers").select("id, name").in("id", barberIds) : Promise.resolve({ data: [] }),
        ]);

        const servMap: Record<string, string> = {};
        ((servRes as any).data || []).forEach((s: any) => { servMap[s.id] = s.name; });
        const barbMap: Record<string, string> = {};
        ((barbRes as any).data || []).forEach((b: any) => { barbMap[b.id] = b.name; });

        if (detailedBooksRes.data) {
          setRecentBookings(
            detailedBooksRes.data.map((b: any) => {
              const client = clientMap[b.client_id];
              return {
                id: b.id,
                client_name: client ? client.name || client.phone : "Cliente",
                service_name: servMap[b.service_id] || "Serviço",
                barber_name: barbMap[b.barber_id] || "Profissional",
                date: b.date,
                time: b.time,
                status: b.status,
              };
            })
          );
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dash:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        {
          name: "Agendamentos Hoje",
          value: stats.todayBookings,
          icon: Calendar,
          color: "blue",
          sub: "na data de hoje",
        },
        {
          name: "Total Confirmados",
          value: stats.confirmedBookings,
          icon: CheckCircle2,
          color: "green",
          sub: "status confirmado",
        },
        {
          name: "Aguardando",
          value: stats.pendingBookings,
          icon: Clock,
          color: "yellow",
          sub: "pendentes de confirmação",
        },
        {
          name: "Clientes Cadastrados",
          value: stats.totalClients,
          icon: Users,
          color: "purple",
          sub: `${stats.activeBarbers} barbeiro(s) ativo(s)`,
        },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500 shadow-blue-500/20",
    green: "bg-green-500 shadow-green-500/20",
    yellow: "bg-yellow-500 shadow-yellow-500/20",
    purple: "bg-purple-500 shadow-purple-500/20",
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tighter italic uppercase text-foreground">
            {companyName}
          </h1>
          <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.3em]">
            Painel de Controle • Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 bg-muted p-2 rounded-2xl border border-border backdrop-blur-xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </span>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground text-sm">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-5 rounded-3xl border border-border hover:border-primary/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500 ${colorMap[stat.color]} text-white`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter flex items-center gap-1 bg-muted text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mb-1">
                  {stat.name}
                </p>
                <p className="text-xl font-black italic tracking-tighter text-foreground">
                  {stat.value}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold">Agendamentos Recentes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Últimos registros do sistema
                </p>
              </div>
              <Scissors className="w-5 h-5 text-primary" />
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">Nenhum agendamento ainda</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Os agendamentos feitos pelo WhatsApp aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-muted hover:bg-muted/80 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Scissors className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{b.client_name}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.service_name} • com {b.barber_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-muted-foreground">
                        {new Date(b.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">{b.time?.slice(0,5)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
