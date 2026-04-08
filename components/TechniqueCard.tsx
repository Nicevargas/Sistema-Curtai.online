'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function TechniqueCard() {
  return (
    <section className="px-4 py-6 bg-slate-50 border-y border-slate-200 sm:rounded-2xl sm:border-x sm:mx-0">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-accent-gold" />
        <h2 className="text-slate-900 text-xl font-bold tracking-tight font-display">Técnica Prática</h2>
      </div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
      >
        <h3 className="text-primary font-bold mb-2 text-lg font-display">A Ancoragem do Despertar</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4 italic font-display">
          Utilize este exercício logo ao acordar para alinhar sua frequência com a nova identidade que deseja manifestar.
        </p>
        
        <ul className="space-y-4">
          <li className="flex gap-4 text-sm items-start">
            <span className="flex-none size-6 rounded-full bg-amber-50 text-accent-gold flex items-center justify-center text-xs font-bold border border-amber-200">1</span>
            <span className="text-slate-800">Respire profundamente 3 vezes, focando no centro do seu peito.</span>
          </li>
          <li className="flex gap-4 text-sm items-start">
            <span className="flex-none size-6 rounded-full bg-amber-50 text-accent-gold flex items-center justify-center text-xs font-bold border border-amber-200">2</span>
            <span className="text-slate-800">Visualize uma luz violeta envolvendo seu corpo físico e sutil.</span>
          </li>
        </ul>
      </motion.div>
    </section>
  );
}
