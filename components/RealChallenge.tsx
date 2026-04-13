'use client';

import { Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function RealChallenge() {
  return (
    <section className="px-4 py-6 lg:px-0 lg:py-0">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-slate-50 border border-amber-200 shadow-xl"
      >
        <div className="absolute -right-8 -top-8 size-32 bg-amber-100/50 rounded-full blur-3xl"></div>
        
        <div className="flex items-center gap-2 mb-3">
          <Award className="size-5 text-accent-gold" />
          <h2 className="text-accent-gold text-sm font-bold tracking-[0.2em] uppercase font-display">Atividade Prática</h2>
        </div>
        
        <p className="text-slate-900 text-xl font-display italic leading-snug mb-6">
          &quot;Diga &apos;Não&apos; a algo que drene sua energia e &apos;Sim&apos; a um desejo profundo que você costuma adiar.&quot;
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Recompensa</span>
            <span className="text-xs text-accent-gold font-bold">+50 Curso Points</span>
          </div>
          {/* Concluir button removed per user request */}
        </div>
      </motion.div>
    </section>
  );
}
