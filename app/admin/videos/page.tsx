'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AdminGuard from '@/components/AdminGuard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Video, Trash2, Edit2, Search, Filter, Play, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDirectDriveLink } from '@/lib/utils';
import { uploadImage } from '@/lib/storage';

interface Lesson {
  id: string;
  journey_id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  capa_url: string;
  pdf_url: string;
  dia: number;
  categoria: string;
  created_at: string;
}

interface Journey {
  id: string;
  title: string;
}

export default function AdminDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJourneyFilter, setSelectedJourneyFilter] = useState('todos');

  // Form State
  const [formData, setFormData] = useState({
    journey_id: '',
    titulo: '',
    descricao: '',
    video_url: '',
    capa_url: '',
    pdf_url: '',
    dia: 1,
    categoria: 'Aula'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: journeysData } = await supabase.from('journeys').select('id, title');
      const { data: lessonsData } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
      
      if (journeysData) setJourneys(journeysData);
      if (lessonsData) setLessons(lessonsData);
      
      if (journeysData && journeysData.length > 0) {
        let initialJourneyId = journeysData[0].id;
        
        // Verificar se há journey_id na url para pré-filtrar
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const jId = params.get('journey_id');
          if (jId && journeysData.some(j => j.id === jId)) {
            initialJourneyId = jId;
            setSelectedJourneyFilter(jId);
          }
        }
        
        setFormData(prev => ({ 
          ...prev, 
          journey_id: prev.journey_id || initialJourneyId 
        }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let finalCapaUrl = formData.capa_url;

      // Se houver um arquivo selecionado, faz o upload primeiro
      if (selectedFile) {
        setUploading(true);
        const { url, error: uploadError } = await uploadImage(selectedFile, 'capa', 'lessons');
        setUploading(false);
        
        if (uploadError) throw uploadError;
        if (url) finalCapaUrl = url;
      }

      const dataToSave = { ...formData, capa_url: finalCapaUrl };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(dataToSave)
          .eq('id', editingLesson.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Aula atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([dataToSave]);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Aula adicionada com sucesso!' });
      }

      setShowAddModal(false);
      setEditingLesson(null);
      setSelectedFile(null);
      setFormData({
        journey_id: journeys[0]?.id || '',
        titulo: '',
        descricao: '',
        video_url: '',
        capa_url: '',
        pdf_url: '',
        dia: 1,
        categoria: 'Aula'
      });
      fetchData();
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar aula: ' + err.message });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
    
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Aula excluída com sucesso!' });
      fetchData();
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      setMessage({ type: 'error', text: 'Erro ao excluir aula.' });
    }
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      journey_id: lesson.journey_id,
      titulo: lesson.titulo,
      descricao: lesson.descricao,
      video_url: lesson.video_url,
      capa_url: lesson.capa_url,
      pdf_url: lesson.pdf_url,
      dia: lesson.dia,
      categoria: lesson.categoria
    });
    setShowAddModal(true);
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lesson.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJourney = selectedJourneyFilter === 'todos' || lesson.journey_id === selectedJourneyFilter;
    return matchesSearch && matchesJourney;
  });

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white relative pb-24 text-slate-800">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar ao Dashboard</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-display">Gerenciar Aulas</h1>
              <p className="text-slate-500 text-sm">Adicione e gerencie as aulas de cada curso</p>
            </div>
            <button 
              onClick={() => {
                setEditingLesson(null);
                setFormData({
                  journey_id: selectedJourneyFilter !== 'todos' ? selectedJourneyFilter : (journeys[0]?.id || ''),
                  titulo: '',
                  descricao: '',
                  video_url: '',
                  capa_url: '',
                  pdf_url: '',
                  dia: 1,
                  categoria: 'Aula'
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="size-5" />
              Adicionar Nova Aula
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar aula por título ou descrição..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 focus:outline-none focus:border-primary/50 transition-colors shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 w-full md:w-auto shrink-0 shadow-sm">
              <Filter className="size-4 text-slate-400" />
              <select 
                value={selectedJourneyFilter}
                onChange={(e) => setSelectedJourneyFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer max-w-[250px] py-1"
              >
                <option value="todos">Todos os Cursos</option>
                {journeys.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-2xl border ${
                message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
              } text-sm flex items-center gap-3`}
            >
              {message.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
              {message.text}
            </motion.div>
          )}

          {/* Lessons Table/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && lessons.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
              ))
            ) : filteredLessons.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-3xl">
                <Video className="size-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhuma aula encontrada para esta busca.</p>
                <p className="text-slate-400 text-xs mt-1">Experimente alterar os filtros ou cadastrar uma nova aula.</p>
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const lessonJourney = journeys.find(j => j.id === lesson.journey_id);
                return (
                  <motion.div 
                    key={lesson.id}
                    layout
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden group hover:shadow-xl transition-all"
                  >
                    <div className="relative aspect-video bg-slate-100">
                      <Image 
                        src={getDirectDriveLink(lesson.capa_url) || 'https://picsum.photos/seed/course/800/450'} 
                        alt={lesson.titulo}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="size-12 text-white fill-white" />
                      </div>
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                        Dia {lesson.dia}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{lesson.titulo}</h3>
                          {lessonJourney && (
                            <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md mt-1 inline-block truncate max-w-full">
                              {lessonJourney.title}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">{lesson.categoria}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-6 mt-2">{lesson.descricao}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditModal(lesson)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(lesson.id)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <a 
                          href={lesson.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                  </h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <Plus className="size-6 rotate-45" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Curso / Jornada</label>
                      <select 
                        required
                        value={formData.journey_id}
                        onChange={(e) => setFormData({...formData, journey_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      >
                        {journeys.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Título da Aula</label>
                      <input 
                        required
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: Introdução à Lei da Atração"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                      <textarea 
                        required
                        value={formData.descricao}
                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50 min-h-[100px]"
                        placeholder="O que será ensinado nesta aula?"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">URL do Vídeo (Drive/YouTube)</label>
                      <input 
                        required
                        type="text"
                        value={formData.video_url}
                        onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Link do vídeo"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Imagem de Capa (Upload)</label>
                      <div className="flex items-center gap-4">
                        <div className="relative size-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {(selectedFile || formData.capa_url) ? (
                            <Image 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : getDirectDriveLink(formData.capa_url)}
                              alt="Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                              <Plus className="size-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          <p className="text-[10px] text-slate-400 italic">Recomendado: 1280x720px (16:9)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ou URL da Capa (Drive/Link Externo)</label>
                      <input 
                        type="text"
                        value={formData.capa_url}
                        onChange={(e) => setFormData({...formData, capa_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Link da imagem (opcional se fizer upload)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dia do Curso</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        value={formData.dia}
                        onChange={(e) => setFormData({...formData, dia: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                      <input 
                        required
                        type="text"
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: Aula, Meditação, PDF"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">URL do PDF (Opcional)</label>
                      <input 
                        type="text"
                        value={formData.pdf_url}
                        onChange={(e) => setFormData({...formData, pdf_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Link do material complementar"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || uploading}
                      className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {uploading ? 'Enviando Imagem...' : loading ? 'Salvando...' : editingLesson ? 'Atualizar Aula' : 'Publicar Aula'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <BottomNav />
      </main>
    </AdminGuard>
  );
}
