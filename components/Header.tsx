'use client';

import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-primary/10"
    >
      <div className="max-w-5xl mx-auto flex items-center p-4 pb-2 justify-between">
        <div className="text-slate-900 flex size-12 shrink-0 items-center justify-start">
        </div>
        <div className="relative h-10 w-32">
          <Image 
            src="https://curtai.online/logoCurtai.png" 
            alt="Mistika Logo" 
            fill 
            className="object-contain"
            priority
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-12 bg-transparent text-slate-900 p-0 hover:bg-slate-100 transition-colors">
            
          </button>
        </div>
      </div>
    </motion.header>
  );
}
