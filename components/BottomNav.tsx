'use client';

import { Home, Sparkles, Users, User, ShieldCheck, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    }
    checkAdmin();
  }, []);

  const navItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Sparkles, label: 'Curso', href: '/jornada' },
    { icon: Share2, label: 'Mapa', href: '/mapa' },
    { icon: Users, label: 'Comunidade', href: '/comunidade' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin', href: '/perfil' }] : []),
    { icon: User, label: 'Perfil', href: '/perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-slate-200 bg-white/90 backdrop-blur-xl px-4 pb-6 pt-3">
      <div className="flex w-full max-w-md gap-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={index}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <item.icon className={`size-6 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 size-1 bg-primary rounded-full shadow-[0_0_8px_rgba(115,17,212,0.8)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
