"use client";

import React from "react";
import { FileText, Download, TrendingUp, Calendar, ArrowLeft, Search, MoreVertical } from "lucide-react";
import Link from "next/link";

export default function InvoicePage() {
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <Link href="/billing" className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
           </Link>
           <div>
              <h1 className="text-3xl font-black tracking-tight italic">Faturamento</h1>
              <p className="text-muted-foreground text-sm">Gerencie suas faturas e histórico de pagamentos</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Buscar fatura..." className="bg-transparent border-none outline-none text-xs w-32 xl:w-48" />
            </div>
            <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-2xl shadow-primary/20">
                Baixar Relatório
            </button>
        </div>
      </header>

      <div className="glass rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
         <div className="px-10 py-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <FileText className="w-5 h-5 text-primary" />
               <span className="font-bold text-sm uppercase tracking-widest italic">Histórico de Faturas</span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Últimos 12 meses</span>
         </div>

         <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                <FileText className="w-10 h-10 text-white/10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Nenhuma fatura encontrada</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Como você está em um período de teste ou plano gratuito, não há faturas geradas no momento.</p>
             </div>
         </div>
      </div>
    </div>
  );
}
