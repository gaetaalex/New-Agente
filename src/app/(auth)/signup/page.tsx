"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Mail, Lock, Loader2, User, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company_name: formData.companyName,
          }
        }
      });

      if (authError) throw authError;

      // Supabase retorna user sem session quando o email já existe e está confirmado
      // Nesse caso, identities fica vazio — usuário deve fazer login
      if (authData.user && authData.user.identities?.length === 0) {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass p-10 rounded-[3rem] text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Conta criada!</h2>
          <p className="text-muted-foreground mb-8">
            Enviamos um e-mail de confirmação para <b>{formData.email}</b>. 
            Verifique sua caixa de entrada (e spam) para ativar sua conta.
          </p>
          <Link href="/login" className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold">
            Ir para Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-8">
            <img src="/new_agent_logo.png" alt="New Agent" className="h-12 object-contain" />
          </Link>
          <h1 className="text-3xl font-bold">Comece agora gratuitamente</h1>
          <p className="text-muted-foreground mt-2">Crie sua conta em menos de 1 minuto</p>
        </div>

        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleSignup} className="grid md:grid-cols-2 gap-6">
            {error && (
              <div className="col-span-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-sm font-medium px-1">Seu Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-sm font-medium px-1">Nome da Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all"
                  placeholder="Ex: Gaeta Barbearia"
                />
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium px-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all"
                  placeholder="empresa@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium px-1">Senha (mínimo 6 caracteres)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="col-span-2 bg-primary text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar Minha Conta Grátis
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
