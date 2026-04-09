'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PenTool, Sparkles, ArrowLeft, Save, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EscritaPage() {
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    // Simulating save for now
    setTimeout(() => {
      setSaving(false);
      alert('Sua reflexão foi guardada com sucesso.');
    }, 1000);
  };

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
            <div className="size-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <PenTool className="size-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">Escrita Terapêutica</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Cura através das palavras</p>
            </div>
          </div>
          <button className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <History className="size-5" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-emerald-500 flex items-center gap-2">
              <Sparkles className="size-4" />
              Sugestão do Dia
            </h2>
            <p className="text-slate-700 text-sm italic">
              &quot;O que meu coração está tentando me dizer hoje que eu ainda não parei para ouvir?&quot;
            </p>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Deixe as palavras fluírem sem julgamentos..."
            className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:ring-0 resize-none min-h-[400px] text-lg leading-relaxed"
          />

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? 'Guardando...' : 'Guardar Reflexão'}
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
