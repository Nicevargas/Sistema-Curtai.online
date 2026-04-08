'use client';

import Header from '@/components/Header';
import FeaturedLesson from '@/components/FeaturedLesson';
import EvolutionDiary from '@/components/EvolutionDiary';
import BottomNav from '@/components/BottomNav';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Play, X, Sparkles, Clock, Users, MessageSquare, Users2, PenTool, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDirectDriveLink, getEmbedVideoUrl } from '@/lib/utils';

interface JourneyItem {
  id: string;
  title: string;
  archetype: string;
  image_url: string | null;
  duration: string;
  steps: number;
  user_id?: string;
}

interface LessonData {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  capa_url: string;
  pdf_url: string;
  duracao?: string;
  categoria?: string;
  dia?: string | number;
}

export default function Page() {
  const [featuredJourneys, setFeaturedJourneys] = useState<JourneyItem[]>([]);
  const [featuredLesson, setFeaturedLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isRestrictedAppsUnlocked, setIsRestrictedAppsUnlocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndFetchData() {
      console.log('Iniciando busca de dados...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        if (isMounted) window.location.href = '/login';
        return;
      }

      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, level, journey_id')
          .eq('id', user.id)
          .maybeSingle();

        const journeyId = profile?.journey_id || 'fa512a52-9742-410f-a71b-0bd4013bec8d';

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true);
        
        const completedIds = new Set(progressData?.map(p => p.lesson_id) || []);

        // Fetch Welcome Lesson
        setLessonLoading(true);
        let welcomeData: LessonData | null = null;

        // 1. Try lessons table for Boas-vindas
        const { data: lessonWelcome } = await supabase
          .from('lessons')
          .select('*')
          .or('categoria.eq.Boas-vindas,categoria.eq.Boas Vindas,categoria.eq.boas-vindas')
          .limit(1)
          .maybeSingle();
        
        if (lessonWelcome) {
          welcomeData = lessonWelcome;
        } else {
          // 2. Try content table - more robust search
          const { data: allContent } = await supabase
            .from('content')
            .select('*');
          
          if (allContent) {
            const welcomeItem = allContent.find(item => {
              const arch = (item.arquetipo || item.archetype || '').toLowerCase();
              return arch === 'boas-vindas' || arch === 'boas vindas';
            });

            if (welcomeItem) {
              welcomeData = {
                id: welcomeItem.id,
                titulo: welcomeItem.titulo || welcomeItem.title || 'Boas-vindas',
                descricao: welcomeItem.descricao || welcomeItem.description || '',
                video_url: welcomeItem.media_url || welcomeItem.video_url || '',
                capa_url: welcomeItem.thumbnail_url || welcomeItem.capa_url || welcomeItem.image_url || '',
                pdf_url: welcomeItem.pdf_url || '',
                categoria: 'Boas-vindas'
              };
            }
          }
        }
        
        // Logic: If no progress, show welcome. If progress, show next lesson.
        if (completedIds.size === 0 && welcomeData) {
          setFeaturedLesson(welcomeData);
        } else {
          // Fetch all lessons for the user's journey to find the next one
          const { data: allLessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('journey_id', journeyId)
            .order('dia', { ascending: true })
            .order('created_at', { ascending: true });

          let nextLesson = allLessons?.find(l => !completedIds.has(l.id));

          // If no lessons found for this journey, try all lessons as fallback
          if (!nextLesson && (!allLessons || allLessons.length === 0)) {
            const { data: fallbackLessons } = await supabase
              .from('lessons')
              .select('*')
              .order('dia', { ascending: true })
              .order('created_at', { ascending: true });
            
            nextLesson = fallbackLessons?.find(l => !completedIds.has(l.id));
          }

          if (nextLesson) {
            setFeaturedLesson(nextLesson);
          } else if (welcomeData) {
            setFeaturedLesson(welcomeData);
          } else if (allLessons && allLessons.length > 0) {
            setFeaturedLesson(allLessons[0]);
          }
        }
        setLessonLoading(false);

        // Fetch Recommended Journeys
        const { data: journeysData } = await supabase
          .from('journeys')
          .select('*')
          .limit(6);

        if (isMounted && journeysData) {
          setFeaturedJourneys(journeysData);
        }

        // Check Lyra Unlock Status (7 days after registration)
        const registrationDate = new Date(user.created_at);
        const currentDate = new Date();
        const diffTime = currentDate.getTime() - registrationDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 7) {
          setIsRestrictedAppsUnlocked(true);
        } else {
          setIsRestrictedAppsUnlocked(false);
          setDaysRemaining(Math.max(1, 7 - diffDays));
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuthAndFetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-white relative pb-24">
      <Header />
      <div className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:pt-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            <FeaturedLesson lesson={featuredLesson} loading={lessonLoading} />

            {/* Action Cards Section */}
            <section className="px-4 sm:px-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Counselor Lyra Card */}
                {isRestrictedAppsUnlocked ? (
                  <Link href="/lyra">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -4 }}
                      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-accent-purple/20 border border-primary/20 p-6 h-full group"
                    >
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 size-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                          <MessageSquare className="size-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Conselheira Lyra</h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Inicie uma conversa sagrada e receba orientações personalizadas para seu curso.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                          Conversar Agora
                          <Sparkles className="size-3" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <div className="cursor-not-allowed">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 h-full group grayscale opacity-60"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Em Breve</span>
                      </div>
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                          <MessageSquare className="size-6 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-2 font-display">Conselheira Lyra</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                          Esta mentora mística estará disponível para você em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          Aguardando Alinhamento
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Escrita Terapêutica Card */}
                {isRestrictedAppsUnlocked ? (
                  <Link href="/escrita">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -4 }}
                      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 p-6 h-full group"
                    >
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 size-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
                          <PenTool className="size-6 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Escrita Terapêutica</h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Liberte suas emoções e organize seus pensamentos através do poder da escrita guiada.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                          Começar a Escrever
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <div className="cursor-not-allowed">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 h-full group grayscale opacity-60"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Em Breve</span>
                      </div>
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                          <PenTool className="size-6 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-2 font-display">Escrita Terapêutica</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                          Esta ferramenta de cura estará disponível para você em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          Aguardando Alinhamento
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Planner Lei da Atração Card */}
                {isRestrictedAppsUnlocked ? (
                  <Link href="/planner">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -4 }}
                      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-gold/20 to-orange-500/20 border border-accent-gold/20 p-6 h-full group"
                    >
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 size-32 bg-accent-gold/10 rounded-full blur-3xl group-hover:bg-accent-gold/20 transition-colors" />
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-accent-gold/20 flex items-center justify-center mb-4">
                          <Target className="size-6 text-accent-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Planner Lei da Atração</h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Manifeste seus desejos e planeje sua realidade com as leis universais.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-accent-gold uppercase tracking-widest">
                          Manifestar Agora
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <div className="cursor-not-allowed">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 h-full group grayscale opacity-60"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Em Breve</span>
                      </div>
                      <div className="relative z-10">
                        <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                          <Target className="size-6 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-2 font-display">Planner Lei da Atração</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                          Este guia de manifestação estará disponível para você em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          Aguardando Alinhamento
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Community Card */}
                <Link href="/comunidade">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4 }}
                    className="relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-6 h-full group"
                  >
                    <div className="relative z-10">
                      <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Users2 className="size-6 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Comunidade Mistika</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Explore os principais assuntos discutidos pela egrégora e conecte-se com outros buscadores.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Ver Discussões
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </section>
          </div>
          
          {/* Sidebar Column on Desktop */}
          <div className="lg:col-span-4 space-y-6 px-4 lg:px-0">
            <div className="sticky top-24 space-y-6">
              <EvolutionDiary />
            </div>
          </div>
        </div>
      </div>
      <BottomNav />

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={getEmbedVideoUrl(activeVideo) || ''}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="size-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
