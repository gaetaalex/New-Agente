"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  User, 
  Bot, 
  X, 
  Loader2, 
  RotateCcw,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentTestChatProps {
  agent: {
    id: string;
    name: string;
    system_prompt: string;
    avatar_url?: string;
  };
  onClose: () => void;
}

export default function AgentTestChat({ agent, onClose }: AgentTestChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá! Eu sou o **${agent.name}**. Como posso te ajudar hoje?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, message: input })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na chamada da API');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erro no teste de IA:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "❌ Erro ao conectar com o motor de IA. Verifique os logs da Edge Function.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Chat reiniciado. Como posso ajudar?`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-background border border-border rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-[200] flex flex-col overflow-hidden backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-primary/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
               <Bot className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-sm text-foreground leading-none">{agent.name}</h3>
               <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 block">Modo Teste</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
             <button 
               onClick={clearChat}
               className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
               title="Limpar Chat"
             >
                <RotateCcw className="w-4 h-4" />
             </button>
             <button 
               onClick={onClose}
               className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
             >
                <X className="w-5 h-5" />
             </button>
         </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
         {messages.map((msg) => (
           <div 
             key={msg.id}
             className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
           >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-muted' : 'bg-primary'
                  }`}>
                     {msg.role === 'user' ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 text-foreground border border-primary/20 rounded-tr-none' 
                      : 'bg-muted text-foreground border border-border rounded-tl-none font-medium'
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.startsWith('> ') ? (
                          <span className="italic opacity-70 block border-l-2 border-primary/40 pl-3 py-1 bg-muted/50 rounded-r-lg">
                            {line.substring(2)}
                          </span>
                        ) : line.includes('**') ? (
                          line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="text-primary">{part}</strong> : part)
                        ) : line}
                      </p>
                    ))}
                 </div>
              </div>
           </div>
         ))}
         {isTyping && (
           <div className="flex justify-start">
              <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                     <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted p-4 rounded-2xl rounded-tl-none border border-border flex items-center gap-1">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-muted/30">
         <form 
           onSubmit={handleSend}
           className="relative"
         >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem para testar..."
              className="w-full bg-background border border-border rounded-2xl py-4 pl-6 pr-14 outline-none focus:border-primary/50 text-sm font-medium transition-all text-foreground"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
               {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
         </form>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">Powered by New Agent Core</span>
          </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}
