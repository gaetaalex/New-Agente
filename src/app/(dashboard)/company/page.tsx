"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Clock, 
  Calendar, 
  Clock3, 
  ChevronRight, 
  Save, 
  Plus, 
  Trash2, 
  Settings2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { active: day !== "Domingo", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "21:00" }] }
    }), {})
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, companies(*)')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.companies) {
        setCompanyId(profile.company_id);
        const company = profile.companies as any;
        const settings = company.settings || {};
        if (settings.opening_hours) {
          setSchedule(settings.opening_hours);
        }
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          settings: {
            opening_hours: schedule
          }
        })
        .eq('id', companyId);

      if (error) throw error;
      alert("Horários salvos com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar horários: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...schedule[day].slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], slots: newSlots }
    });
  };

  const toggleDay = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], active: !schedule[day].active }
    });
  };

  const addSlot = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], slots: [...schedule[day].slots, { start: "00:00", end: "00:00" }] }
    });
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], slots: schedule[day].slots.filter((_: any, i: number) => i !== index) }
    });
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Building2 className="w-6 h-6 text-primary" />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight italic text-foreground">Horários de Funcionamento</h1>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.1em] opacity-60">Gerencie a disponibilidade da sua empresa</p>
           </div>

        </div>

        <button 
           onClick={handleSave}
           disabled={saving}
           className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
        >
           {saving ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Save className="w-4 h-4" />} 
           {saving ? 'Salvando...' : 'Salvar Horários'}
        </button>

      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
           <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
<>

      <div className="glass rounded-[3rem] border border-border overflow-hidden shadow-2xl">
         <div className="px-10 py-6 bg-primary/10 border-b border-primary/20 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-primary uppercase tracking-widest italic">Horários Regulares</span>
         </div>


         <div className="p-2 md:p-10 space-y-6">
            {DAYS.map((day) => (
               <motion.div 
                 key={day}
                 className={`p-6 md:p-8 rounded-[2rem] border transition-all ${
                   schedule[day].active ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50 opacity-50"
                 }`}
               >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                     <span className="font-black text-lg tracking-tight italic text-foreground">{day}</span>
                     <div className="flex items-center gap-10">
                        {schedule[day].active && (
                           <div className="flex flex-col gap-4 flex-1">
                              {schedule[day].slots.map((slot: any, i: number) => (
                                 <div key={i} className="flex items-center gap-3">
                                    <div className="flex items-center gap-3 bg-background border border-border p-2 rounded-xl shadow-sm">
                                       <input 
                                         type="time" 
                                         value={slot.start} 
                                         onChange={(e) => updateSlot(day, i, 'start', e.target.value)}
                                         className="w-20 bg-transparent text-center font-bold text-sm outline-none border-none text-foreground"
                                       />
                                       <span className="text-[10px] text-muted-foreground font-black">às</span>
                                       <input 
                                         type="time" 
                                         value={slot.end} 
                                         onChange={(e) => updateSlot(day, i, 'end', e.target.value)}
                                         className="w-20 bg-transparent text-center font-bold text-sm outline-none border-none text-foreground"
                                       />
                                       <Clock3 className="w-4 h-4 text-muted-foreground/20 ml-2" />
                                    </div>

                                    <button 
                                      onClick={() => removeSlot(day, i)}
                                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500 transition-all group"
                                    >
                                       <Trash2 className="w-4 h-4 text-red-500 group-hover:text-white" />
                                    </button>
                                    {i === schedule[day].slots.length - 1 && (
                                       <button 
                                         onClick={() => addSlot(day)}
                                         className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center hover:bg-green-500 transition-all group"
                                       >
                                          <Plus className="w-4 h-4 text-green-500 group-hover:text-white" />
                                       </button>
                                    )}
                                 </div>
                              ))}
                           </div>
                        )}
                        <div 
                          onClick={() => toggleDay(day)}
                          className={`w-14 h-7 rounded-full relative transition-all cursor-pointer p-1 shadow-inner ${schedule[day].active ? "bg-primary" : "bg-muted"}`}
                        >
                           <div className={`w-5 h-5 bg-background rounded-full transition-all shadow-xl ${schedule[day].active ? "translate-x-7" : "translate-x-0"}`} />
                        </div>
                     </div>
                  </div>
               </motion.div>
            ))}
         </div>
      </div>

      <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-center gap-6">
         <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-sm">
            <Info className="w-7 h-7 text-blue-500" />
         </div>
         <div className="flex-1">
            <h4 className="font-bold text-blue-500 text-sm italic">Dica de Configuração</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">Os horários definidos aqui servem como base para a verificação de disponibilidade dos seus agentes de IA. Lembre-se de configurar feriados e exceções na aba específica.</p>
          </div>
       </div>
    </>
      )}
    </div>
  );
}

const Info = ({ className }: any) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
