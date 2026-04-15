'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AdminGuard from '@/components/AdminGuard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Map, Users, Clock, Layers, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDirectDriveLink } from '@/lib/utils';
import { uploadImage } from '@/lib/storage';

interface Journey {
  id: string;
  title: string;
  steps: number;
  duration: string;
  participants: number;
  archetype: string;
  image_url: string | null;
  created_at: string;
}

export default function AdminJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    steps: 1,
    duration: '',
    participants: 0,
    archetype: 'Curso',
    image_url: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setJourneys(data);
    } catch (err) {
      console.error('Error fetching journeys:', err);
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
      let finalImageUrl = formData.image_url;

      // Se houver um arquivo selecionado, faz o upload primeiro
      if (selectedFile) {
        setUploading(true);
        const { url, error: uploadError } = await uploadImage(selectedFile, 'capa', 'journeys');
        setUploading(false);
        
        if (uploadError) throw uploadError;
        if (url) finalImageUrl = url;
      }

      const dataToSave = { ...formData, image_url: finalImageUrl };

      if (editingJourney) {
        const { error } = await supabase
          .from('journeys')
          .update(dataToSave)
          .eq('id', editingJourney.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Jornada atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('journeys')
          .insert([dataToSave]);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Jornada adicionada com sucesso!' });
      }

      setShowAddModal(false);
      setEditingJourney(null);
      setSelectedFile(null);
      setFormData({
        title: '',
        steps: 1,
        duration: '',
        participants: 0,
        archetype: 'Curso',
        image_url: ''
      });
      fetchData();
    } catch (err: any) {
      console.error('Error saving journey:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar jornada: ' + err.message });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta jornada? Isso pode afetar usuários vinculados a ela.')) return;
    
    try {
      const { error } = await supabase.from('journeys').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Jornada excluída com sucesso!' });
      fetchData();
    } catch (err: any) {
      console.error('Error deleting journey:', err);
      setMessage({ type: 'error', text: 'Erro ao excluir jornada.' });
    }
  };

  const openEditModal = (journey: Journey) => {
    setEditingJourney(journey);
    setFormData({
      title: journey.title,
      steps: journey.steps,
      duration: journey.duration,
      participants: journey.participants,
      archetype: journey.archetype,
      image_url: journey.image_url || ''
    });
    setShowAddModal(true);
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white relative pb-24">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar ao Dashboard</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-display">Gerenciar Jornadas</h1>
              <p className="text-slate-500 text-sm">Crie e edite as jornadas de aprendizado do curso</p>
            </div>
            <button 
              onClick={() => {
                setEditingJourney(null);
                setFormData({
                  title: '',
                  steps: 1,
                  duration: '',
                  participants: 0,
                  archetype: 'Curso',
                  image_url: ''
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="size-5" />
              Nova Jornada
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && journeys.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
              ))
            ) : journeys.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <Map className="size-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma jornada cadastrada.</p>
              </div>
            ) : (
              journeys.map((journey) => (
                <motion.div 
                  key={journey.id}
                  layout
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="relative h-40 bg-slate-100">
                    <Image 
                      src={getDirectDriveLink(journey.image_url) || `https://picsum.photos/seed/${journey.id}/800/400`} 
                      alt={journey.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary uppercase tracking-widest">
                      {journey.archetype}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-4 line-clamp-1">{journey.title}</h3>
                    
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                        <Layers className="size-4 text-primary mb-1" />
                        <span className="text-[10px] font-bold text-slate-900">{journey.steps}</span>
                        <span className="text-[8px] text-slate-500 uppercase">Aulas</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                        <Clock className="size-4 text-primary mb-1" />
                        <span className="text-[10px] font-bold text-slate-900">{journey.duration}</span>
                        <span className="text-[8px] text-slate-500 uppercase">Duração</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                        <Users className="size-4 text-primary mb-1" />
                        <span className="text-[10px] font-bold text-slate-900">{journey.participants}</span>
                        <span className="text-[8px] text-slate-500 uppercase">Alunos</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => openEditModal(journey)}
                        className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(journey.id)}
                        className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
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
                    {editingJourney ? 'Editar Jornada' : 'Nova Jornada'}
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
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Título da Jornada</label>
                      <input 
                        required
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: Jornada da Prosperidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Arquétipo / Categoria</label>
                      <input 
                        required
                        type="text"
                        value={formData.archetype}
                        onChange={(e) => setFormData({...formData, archetype: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: Curso, Mentoria, Workshop"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Número de Aulas</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        value={formData.steps}
                        onChange={(e) => setFormData({...formData, steps: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Duração Estimada</label>
                      <input 
                        required
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: 21 dias, 4 semanas"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alunos Ativos (Simulado)</label>
                      <input 
                        required
                        type="number"
                        min="0"
                        value={formData.participants}
                        onChange={(e) => setFormData({...formData, participants: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Imagem de Capa (Upload)</label>
                      <div className="flex items-center gap-4">
                        <div className="relative size-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {(selectedFile || formData.image_url) ? (
                            <Image 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : getDirectDriveLink(formData.image_url)}
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ou URL da Imagem (Drive/Link Externo)</label>
                      <input 
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Link da imagem (opcional se fizer upload)"
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
                      {uploading ? 'Enviando Imagem...' : loading ? 'Salvando...' : editingJourney ? 'Atualizar Jornada' : 'Criar Jornada'}
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
