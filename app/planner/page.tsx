'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles, Calendar, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PlannerPage() {
  const [loading, setLoading] = useState(true);
  const [intentions, setIntentions] = useState([
    { id: 1, text: 'Manifestar clareza mental', completed: true },
    { id: 2, text: 'Atrair novas oportunidades de abundância', completed: false },
  ]);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoading(false);
      } else {
        window.location.href = '/login';
      }
    }
    checkAccess();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="size-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col relative pb-20">
      <Header />
      
      <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20">
              <Target className="size-6 text-accent-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">Planner Lei da Atração</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Co-criando sua realidade</p>
            </div>
          </div>
          <button className="size-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/80 transition-colors">
            <Plus className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Daily Intention */}
          <div className="bg-gradient-to-br from-accent-gold/10 to-orange-500/10 border border-accent-gold/20 rounded-3xl p-6">
            <h2 className="text-xs font-bold text-accent-gold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="size-4" />
              Intenção Dominante do Dia
            </h2>
            <p className="text-xl font-bold text-slate-900 font-display">
              &quot;Eu sou um imã para tudo o que é bom e próspero.&quot;
            </p>
          </div>

          {/* Intentions List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="size-4" />
              Minhas Manifestações
            </h3>
            
            <div className="space-y-3">
              {intentions.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200 group hover:bg-slate-100 transition-all"
                >
                  <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.completed ? 'bg-accent-gold border-accent-gold text-white' : 'border-slate-200 text-transparent group-hover:border-accent-gold/50'
                  }`}>
                    <CheckCircle2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
