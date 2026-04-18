"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Phone,
  User,
  Scissors,
  X,
  Calendar as CalIcon,
  Search,
  Check,
  Loader2,
  Globe,
  RefreshCw,
  RefreshCcw,
  Settings2 as GearIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [calendars, setCalendars] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [newCalendar, setNewCalendar] = useState({ name: "", type: "local", shared: false });
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} — ${end.getDate()} de ${start.toLocaleDateString('pt-BR', { month: 'short' })}. de ${start.getFullYear()}`;
  }, [weekDays]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('na_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        
        const { data: calData } = await supabase
          .from('na_calendars')
          .select('*')
          .eq('company_id', profile.company_id);
        setCalendars(calData || []);

        const { data: bookData } = await supabase
          .from("na_bookings")
          .select(`
            *,
            na_leads (name, phone),
            na_services (name, price, duration_minutes),
            na_barbers (name)
          `)
          .eq('company_id', profile.company_id);
        setBookings(bookData || []);
      }
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendar.name || !companyId) return;

    try {
      const { error } = await supabase
        .from('na_calendars')
        .insert([{
          name: newCalendar.name,
          type: newCalendar.type,
          company_id: companyId
        }]);

      if (error) throw error;
      
      setIsCalendarModalOpen(false);
      setNewCalendar({ name: "", type: "local", shared: false });
      fetchData();
    } catch (err) {
      console.error("Erro ao criar calendário:", err);
    }
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentDate.getMonth() + direction);
    else if (view === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
    else newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  if (loading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 animate-in fade-in duration-700 p-2">
      {/* Sidebar de Agendas */}
      <aside className="w-full md:w-64 glass rounded-[2rem] border border-border flex flex-col overflow-hidden shadow-2xl">
         <div className="p-4 space-y-4">
            <button 
              onClick={() => setIsCalendarModalOpen(true)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
               <Plus className="w-3.5 h-3.5" /> Nova agenda
            </button>

            {/* Calendário Mini UI dinâmica */}
            <div className="space-y-3 p-3 bg-muted border border-border rounded-2xl">
               <div className="flex items-center justify-between px-1">
                  <h3 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground italic truncate capitalize">{monthLabel}</h3>
                  <div className="flex gap-1 text-muted-foreground">
                     <button onClick={() => navigate(-1)} className="p-1 hover:text-primary transition-colors"><ChevronLeft className="w-3 h-3" /></button>
                     <button onClick={() => navigate(1)} className="p-1 hover:text-primary transition-colors"><ChevronRight className="w-3 h-3" /></button>
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center">
                  {['D','S','T','Q1','Q2','S1','S2'].map((d, i) => (
                    <span key={d} className="text-[7px] font-black text-white/20">{d}</span>
                  ))}
                  {Array.from({length: getFirstDayOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))}, (_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({length: getDaysInMonth(currentDate)}, (_, i) => {
                    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i+1);
                    const isToday = new Date().toDateString() === d.toDateString();
                    const isSelected = currentDate.toDateString() === d.toDateString();
                    return (
                      <button 
                        key={i} 
                        onClick={() => setCurrentDate(d)}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all hover:bg-muted-foreground/10",
                          isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isToday ? "border border-primary/40 text-primary" : "text-muted-foreground"
                        )}
                      >
                        {i+1}
                      </button>
                    );
                  })}
               </div>
            </div>

            <div className="space-y-2">
               <h3 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2 italic">Minhas agendas</h3>
               <div className="space-y-1 overflow-y-auto max-h-[150px] custom-scrollbar pr-1">
                  {calendars.length === 0 ? (
                    <div className="p-3 text-center border border-dashed border-border rounded-xl">
                       <p className="text-[8px] text-muted-foreground italic">Cada empresa tem sua agenda</p>
                    </div>
                  ) : (
                    calendars.map(cal => (
                      <button 
                        key={cal.id}
                        onClick={() => setSelectedCalendarId(cal.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all border text-left",
                          selectedCalendarId === cal.id ? "bg-primary/10 border-primary/10 shadow-lg" : "hover:bg-muted border-transparent"
                        )}
                      >
                         <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cal.type === 'google' ? 'bg-primary' : 'bg-emerald-500')} />
                         <span className={cn("text-[10px] font-bold truncate transition-colors", selectedCalendarId === cal.id ? "text-primary" : "text-muted-foreground")}>{cal.name}</span>
                         {cal.type === 'google' && <Globe className="w-2.5 h-2.5 ml-auto text-primary/40" />}
                      </button>
                    ))
                  )}
                </div>
            </div>
         </div>
      </aside>

      {/* Grid do Calendário Principal */}
      <main className="flex-1 glass rounded-[2rem] border border-border flex flex-col overflow-hidden shadow-2xl relative">
         <header className="p-4 border-b border-border flex flex-wrap items-center justify-between bg-muted/30 gap-4">
            <div className="flex items-center gap-3">
               <div className="flex bg-muted p-1 rounded-xl border border-border">
                  <button onClick={() => setView('month')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", view === 'month' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Mês</button>
                  <button onClick={() => setView('week')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", view === 'week' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Semana</button>
                  <button onClick={() => setView('day')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", view === 'day' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Dia</button>
               </div>
               <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <h2 className="text-[11px] font-black italic text-foreground uppercase tracking-tight mx-2 whitespace-nowrap min-w-[120px] text-center">
                    {view === 'week' ? weekRangeLabel : view === 'month' ? monthLabel : currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </h2>
                  <button onClick={() => navigate(1)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-2 transition-all border border-border"
                  >
                    Hoje
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="relative group hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30" />
                  <input type="text" placeholder="Buscar agendamento..." className="bg-muted border border-border rounded-lg py-1.5 pl-8 pr-3 text-[9px] font-bold text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 w-40 transition-all" />
               </div>
               <button className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border"><Filter className="w-3.5 h-3.5" /></button>
            </div>
         </header>

         <div className="flex-1 overflow-auto custom-scrollbar bg-card">
            <div className="min-w-[800px] h-full flex flex-col">
               <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
                  <div className="h-10 border-r border-border" />
                  {weekDays.map(day => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <div key={day.toISOString()} className={cn(
                        "h-10 flex flex-col items-center justify-center border-r border-border",
                        isToday ? "bg-primary/5" : ""
                      )}>
                         <span className={cn("text-[8px] font-black uppercase tracking-widest", isToday ? "text-primary" : "text-muted-foreground/60")}>
                           {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                         </span>
                         <span className={cn("text-[10px] font-bold tracking-tighter", isToday ? "text-foreground" : "text-muted-foreground/40")}>
                           {day.getDate()}/{day.getMonth()+1}
                         </span>
                      </div>
                    );
                  })}
               </div>

               {Array.from({length: 14}, (_, i) => {
                 const hour = i + 8;
                 return (
                   <div key={hour} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/10">
                      <div className="h-20 border-r border-border flex items-center justify-center bg-muted/30">
                         <span className="text-[9px] font-black text-muted-foreground/40 italic">{hour.toString().padStart(2, '0')}:00</span>
                      </div>
                      {weekDays.map((date, j) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayBookings = bookings.filter(b => b.date === dateStr && b.time?.startsWith(hour.toString().padStart(2, '0')));
                        
                        return (
                          <div key={j} className="h-20 border-r border-border p-1 group relative">
                             {dayBookings.map((b, idx) => (
                               <motion.div 
                                 key={b.id}
                                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                 className="absolute inset-x-1 top-1 bottom-1 bg-primary/10 border border-primary/20 rounded-xl p-2 cursor-pointer hover:bg-primary/20 transition-all z-[1] group/item overflow-hidden shadow-lg"
                               >
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-[7px] font-black text-primary uppercase tracking-tighter truncate">{b.na_services?.name || 'Serviço'}</p>
                                    <Clock className="w-2.5 h-2.5 text-primary/40 shrink-0" />
                                  </div>
                                  <p className="text-[10px] font-bold text-foreground tracking-tight truncate leading-none mb-1">{b.na_leads?.name || 'Cliente'}</p>
                                  <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest truncate">{b.na_barbers?.name || 'Equipe'}</p>
                               </motion.div>
                             ))}
                             <div className="w-full h-full rounded-xl hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-border group-hover:shadow-inner">
                                <Plus className="w-4 h-4 text-muted-foreground/10 opacity-0 group-hover:opacity-100 transition-all rotate-45 group-hover:rotate-0" />
                             </div>
                          </div>
                        );
                      })}
                   </div>
                 );
               })}
            </div>
         </div>
      </main>

      <AnimatePresence>
        {isCalendarModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="glass w-full max-w-sm rounded-[2.5rem] border border-border shadow-2xl overflow-hidden"
             >
                <div className="p-8 space-y-8">
                   <div className="flex items-center justify-between">
                      <div>
                         <h2 className="text-xl font-black italic tracking-tighter uppercase text-foreground leading-none">Nova Agenda</h2>
                         <p className="text-[9px] font-black uppercase tracking-widest text-primary mt-2">Expanda sua capacidade</p>
                      </div>
                      <button onClick={() => setIsCalendarModalOpen(false)} className="p-3 bg-muted border border-border rounded-2xl hover:rotate-90 transition-all">
                         <X className="w-5 h-5 text-muted-foreground/60" />
                      </button>
                   </div>

                   <form onSubmit={handleCreateCalendar} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-2 italic">Nome Identificador</label>
                         <input 
                           type="text" required placeholder="Ex: Unidade Centro"
                           className="w-full bg-muted border border-border rounded-2xl py-4 px-6 outline-none focus:border-primary/40 text-[12px] font-bold text-foreground placeholder:text-muted-foreground/30 transition-all shadow-inner"
                           value={newCalendar.name}
                           onChange={(e) => setNewCalendar({...newCalendar, name: e.target.value})}
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           type="button"
                           onClick={() => setNewCalendar({...newCalendar, type: 'local'})}
                           className={cn("p-6 rounded-3xl border transition-all flex flex-col items-center gap-3", newCalendar.type === 'local' ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5 rotate-1" : "bg-muted border-border hover:bg-muted/80")}
                         >
                            <CalendarIcon className={cn("w-6 h-6", newCalendar.type === 'local' ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", newCalendar.type === 'local' ? "text-emerald-500" : "text-muted-foreground/40")}>Interna</span>
                         </button>
                         <button 
                            type="button"
                            onClick={() => setNewCalendar({...newCalendar, type: 'google'})}
                            className={cn("p-6 rounded-3xl border transition-all flex flex-col items-center gap-3", newCalendar.type === 'google' ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5 -rotate-1" : "bg-muted border-border hover:bg-muted/80")}
                         >
                            <Globe className={cn("w-6 h-6", newCalendar.type === 'google' ? 'text-primary' : 'text-muted-foreground/40')} />
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", newCalendar.type === 'google' ? "text-primary" : "text-muted-foreground/40")}>Google</span>
                         </button>
                      </div>

                      <button type="submit" className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 italic border-t border-white/10">
                        Confirmar Criação
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
