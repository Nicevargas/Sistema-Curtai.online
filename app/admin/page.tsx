'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AdminGuard from '@/components/AdminGuard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { 
  Users, 
  Video, 
  Map, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight, 
  Activity,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    lessons: 0,
    journeys: 0,
    posts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: usersCount },
          { count: lessonsCount },
          { count: journeysCount },
          { count: postsCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('journeys').select('*', { count: 'exact', head: true }),
          supabase.from('community_posts').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          users: usersCount || 0,
          lessons: lessonsCount || 0,
          journeys: journeysCount || 0,
          posts: postsCount || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Seg', acessos: 400, posts: 24 },
    { name: 'Ter', acessos: 300, posts: 13 },
    { name: 'Qua', acessos: 200, posts: 98 },
    { name: 'Qui', acessos: 278, posts: 39 },
    { name: 'Sex', acessos: 189, posts: 48 },
    { name: 'Sáb', acessos: 239, posts: 38 },
    { name: 'Dom', acessos: 349, posts: 43 },
  ];

  const statCards = [
    { label: 'Usuários Totais', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aulas Publicadas', value: stats.lessons, icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cursos Ativos', value: stats.journeys, icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Posts na Comunidade', value: stats.posts, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white relative pb-24">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <LayoutDashboard className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-display">Dashboard Administrativo</h1>
              <p className="text-slate-500 text-sm">Visão geral do sistema e métricas de engajamento</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`size-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Acessos Semanais
                </h3>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12% vs ontem</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7311d4" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#7311d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="acessos" stroke="#7311d4" fillOpacity={1} fill="url(#colorAcessos)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Atividade na Comunidade
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Últimos 7 dias</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="posts" fill="#7311d4" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/videos">
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between group cursor-pointer h-full"
               >
                 <div>
                   <h3 className="text-xl font-bold mb-2">Gerenciar Aulas</h3>
                   <p className="text-slate-400 text-sm">Adicione, edite ou remova aulas e materiais</p>
                 </div>
                 <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors shrink-0 ml-4">
                   <ArrowRight className="size-6" />
                 </div>
               </motion.div>
             </Link>
 
             <Link href="/admin/journeys">
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="bg-primary rounded-3xl p-8 text-white flex items-center justify-between group cursor-pointer h-full"
               >
                 <div>
                   <h3 className="text-xl font-bold mb-2">Gerenciar Cursos</h3>
                   <p className="text-white/70 text-sm">Controle os cursos, jornadas, durações e capas</p>
                 </div>
                 <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-colors shrink-0 ml-4">
                   <ArrowRight className="size-6" />
                 </div>
               </motion.div>
             </Link>

            <Link href="/admin/cadastros">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-indigo-600 rounded-3xl p-8 text-white flex items-center justify-between group cursor-pointer h-full"
              >
                <div>
                  <h3 className="text-xl font-bold mb-2">Gerenciar Cadastros</h3>
                  <p className="text-indigo-200 text-sm">Crie, edite e gerencie cadastros e perfis de alunos</p>
                </div>
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors shrink-0 ml-4">
                  <ArrowRight className="size-6" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        <BottomNav />
      </main>
    </AdminGuard>
  );
}
