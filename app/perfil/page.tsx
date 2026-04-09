'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { motion } from 'motion/react';
import { User, Award, Settings, LogOut, TrendingUp, Shield, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { getDirectDriveLink } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  level: number;
  role: string;
  status: string;
  points: number;
  streak: number;
  bio?: string;
  created_at?: string;
  journey_id?: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [achievements, setAchievements] = useState<{ id: string, title: string }[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editJourneyId, setEditJourneyId] = useState('');
  const [journeyTitle, setJourneyTitle] = useState<string | null>(null);
  const [availableJourneys, setAvailableJourneys] = useState<{ id: string, title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (isMounted && profileData && !profileError) {
            setProfile(profileData);
            setEditName(profileData.name || '');
            setEditBio(profileData.bio || '');
            setEditAvatar(profileData.avatar_url || '');
            setEditJourneyId(profileData.journey_id || 'fa512a52-9742-410f-a71b-0bd4013bec8d');

            // Fetch journey title
            const journeyId = profileData.journey_id || 'fa512a52-9742-410f-a71b-0bd4013bec8d';
            const { data: journeyData } = await supabase
              .from('journeys')
              .select('title')
              .eq('id', journeyId)
              .single();
            
            if (journeyData) {
              setJourneyTitle(journeyData.title);
            }

            // Fetch all available journeys for selection
            const { data: allJourneys } = await supabase
              .from('journeys')
              .select('id, title');
            
            if (allJourneys) {
              setAvailableJourneys(allJourneys);
            }

            // Fetch achievements count and titles
            const { data: progressData, error: progressError } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('completed', true);
            
            if (!progressError && progressData) {
              setAchievementsCount(progressData.length);
              
              const lessonIds = progressData.map(p => p.lesson_id);
              if (lessonIds.length > 0) {
                const { data: lessonsData } = await supabase
                  .from('content')
                  .select('id, title')
                  .in('id', lessonIds);
                
                if (lessonsData) {
                  setAchievements(lessonsData);
                }
              }
            }
          }
        } else {
          // If no user, redirect to login
          if (isMounted) window.location.href = '/login';
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          bio: editBio,
          avatar_url: editAvatar,
          journey_id: editJourneyId
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: editName,
        bio: editBio,
        avatar_url: editAvatar,
        journey_id: editJourneyId
      });

      // Update journey title locally
      const selectedJourney = availableJourneys.find(j => j.id === editJourneyId);
      if (selectedJourney) {
        setJourneyTitle(selectedJourney.title);
      }
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
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

  const displayAvatar = (profile?.avatar_url && profile.avatar_url.trim() !== '') 
    ? getDirectDriveLink(profile.avatar_url) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Buscador')}&background=7311d4&color=fff&bold=true`;

  return (
    <main className="min-h-screen bg-white relative pb-24">
      <Header />
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      <div className="absolute top-20 right-0 size-64 bg-accent-gold/5 blur-[100px] rounded-full -z-10" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            } text-sm flex items-center gap-3`}
          >
            {message.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Profile Info Column */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="relative group mb-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative size-40 rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl shadow-primary/20"
              >
                <Image 
                  src={displayAvatar} 
                  alt={profile?.name || 'Usuário'} 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-4 right-0 size-10 bg-primary rounded-full flex items-center justify-center border-4 border-white text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Settings className="size-5" />
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 font-display mb-2">
                    {profile?.name || 'Buscador Mistika'}
                  </h1>
                  {profile?.bio && (
                    <p className="text-base text-slate-600 italic leading-relaxed max-w-sm">
                      &quot;{profile.bio}&quot;
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {profile?.role === 'admin' || profile?.role === 'admin master' || profile?.role === 'admim master' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                      <Shield className="size-3 text-red-400" />
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                        Administrador
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                      <Shield className="size-3 text-primary" />
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                        {profile?.role || 'Iniciada'} • Nível {profile?.level || 1}
                      </p>
                    </div>
                  )}
                  
                  {journeyTitle && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <TrendingUp className="size-3 text-emerald-400" />
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                        Curso: {journeyTitle}
                      </p>
                    </div>
                  )}
                </div>

                {profile?.created_at && (
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mantra / Bio</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50 min-h-[80px]"
                    placeholder="Seu mantra pessoal..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">URL do Avatar</label>
                  <input 
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                    placeholder="Link da imagem"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Curso</label>
                  <select 
                    value={editJourneyId}
                    onChange={(e) => setEditJourneyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                  >
                    {availableJourneys.map(j => (
                      <option key={j.id} value={j.id} className="bg-white">{j.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Stats and Shortcuts Column */}
          <div className="lg:col-span-7 space-y-8">
            {!isEditing && (
              <>
                {profile?.role === 'admin' && (
                  <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                    <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Settings className="size-4" />
                      Painel Administrativo
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-800 flex items-center justify-between group">
                        <span>Gerenciar Membros</span>
                        <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-800 flex items-center justify-between group">
                        <span>Publicar Conteúdo</span>
                        <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}



                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Acesso Rápido</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => setShowAchievements(true)}
                      className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all hover:pl-6 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Award className="size-6 text-accent-gold" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-slate-800">Minhas Conquistas</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            {achievementsCount} {achievementsCount === 1 ? 'lição concluída' : 'lições concluídas'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button 
                      onClick={handleSignOut}
                      className="flex items-center justify-between p-5 rounded-3xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all hover:pl-6 group text-red-500"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LogOut className="size-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold">Sair da Conta</p>
                          <p className="text-[10px] text-red-500/50 uppercase tracking-widest">Encerrar sessão atual</p>
                        </div>
                      </div>
                      <ArrowRight className="size-5 text-red-500/30 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Award className="size-5 text-accent-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Minhas Conquistas</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Lições Concluídas</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAchievements(false)}
                className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 italic">Você ainda não concluiu nenhuma lição.</p>
                </div>
              ) : (
                achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4"
                  >
                    <div className="size-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">{achievement.title}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowAchievements(false)}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
