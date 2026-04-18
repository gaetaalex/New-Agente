"use client";

import React from "react";
import { MessageSquare, Layout } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-160px)] flex items-center justify-center rounded-[3rem] glass border border-border border-dashed">
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <MessageSquare className="w-10 h-10 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Central de Mensagens</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Este módulo está em desenvolvimento. Em breve você poderá visualizar os chats em tempo real aqui.
        </p>
      </div>
    </div>
  );
}
