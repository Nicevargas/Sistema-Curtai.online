'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'admin master' || profile?.role === 'admim master') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="size-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="size-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
          <ShieldAlert className="size-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">Acesso Restrito</h1>
        <p className="text-slate-600 max-w-xs mb-8">
          Você não tem permissão para acessar esta área. Apenas administradores podem entrar aqui.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
