'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AdminGuard from '@/components/AdminGuard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  Mail, 
  Award, 
  Zap, 
  X, 
  ArrowLeft,
  BookOpen,
  User,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: string;
  level: number;
  status: string;
  points: number;
  streak: number;
  avatar_url: string | null;
  bio: string | null;
  journey_id: string | null;
  created_at?: string;
}

interface Journey {
  id: string;
  title: string;
}

export default function AdminCadastros() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [journeyFilter, setJourneyFilter] = useState('todas');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    role: 'usuario',
    status: 'Ativo',
    level: 1,
    points: 0,
    streak: 0,
    avatar_url: '',
    journey_id: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch journeys first for dropdowns/relations
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('id, title');
      
      if (journeysError) throw journeysError;
      if (journeysData) setJourneys(journeysData);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (profilesError) throw profilesError;
      if (profilesData) setProfiles(profilesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do banco.' });
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
      const dataToSave = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        bio: formData.bio.trim() || null,
        role: formData.role,
        status: formData.status,
        level: Number(formData.level),
        points: Number(formData.points),
        streak: Number(formData.streak),
        avatar_url: formData.avatar_url.trim() || null,
        journey_id: formData.journey_id || null
      };

      if (editingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', editingProfile.id);
        
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro atualizado com sucesso!' });
      } else {
        // Create brand new profile (generate a fresh UUID)
        const newId = typeof window !== 'undefined' && window.crypto?.randomUUID 
          ? window.crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const { error } = await supabase
          .from('profiles')
          .insert([{ id: newId, ...dataToSave }]);
        
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro criado com sucesso!' });
      }

      setShowModal(false);
      setEditingProfile(null);
      setFormData({
        name: '',
        email: '',
        bio: '',
        role: 'usuario',
        status: 'Ativo',
        level: 1,
        points: 0,
        streak: 0,
        avatar_url: '',
        journey_id: journeys[0]?.id || ''
      });
      fetchData();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar cadastro: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profile: Profile) => {
    if (!confirm(`Tem certeza de que deseja deletar o cadastro de "${profile.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Cadastro deletado com sucesso!' });
      fetchData();
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setMessage({ type: 'error', text: 'Erro ao deletar cadastro: ' + err.message });
    }
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      email: '',
      bio: '',
      role: 'usuario',
      status: 'Ativo',
      level: 1,
      points: 0,
      streak: 0,
      avatar_url: '',
      journey_id: journeys[0]?.id || ''
    });
    setShowModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      bio: profile.bio || '',
      role: profile.role || 'usuario',
      status: profile.status || 'Ativo',
      level: profile.level || 1,
      points: profile.points || 0,
      streak: profile.streak || 0,
      avatar_url: profile.avatar_url || '',
      journey_id: profile.journey_id || ''
    });
    setShowModal(true);
  };

  // Filter and Search logic
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.email && profile.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'todos' || 
      profile.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesJourney = 
      journeyFilter === 'todas' || 
      profile.journey_id === journeyFilter;

    return matchesSearch && matchesStatus && matchesJourney;
  });

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 relative pb-24 text-slate-800">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Painel Administrativo</span>
          </Link>

          {/* Title bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-display">Gerenciar Cadastros</h1>
              <p className="text-slate-500 text-sm">Crie, edite, visualize e exclua matrículas e perfis de alunos</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus className="size-5" />
              Novo Cadastro
            </button>
          </div>

          {/* Message alerts */}
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

          {/* Search and filter controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto shrink-0">
              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full sm:w-auto">
                <Filter className="size-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Journey Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full sm:w-auto">
                <BookOpen className="size-4 text-slate-400" />
                <select 
                  value={journeyFilter}
                  onChange={(e) => setJourneyFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="todas">Todas as Trilhas</option>
                  {journeys.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Profiles Table / Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {loading && profiles.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="size-10 border-4 border-primary border-t-transparent rounded-full mb-4"
                />
                <p className="text-slate-500 text-sm">Buscando cadastros no banco de dados...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-20 text-center">
                <Users className="size-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhum cadastro encontrado.</p>
                <p className="text-slate-400 text-xs mt-1">Experimente alterar os filtros ou pesquisar outro termo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="py-4 px-6">Usuário / Cadastro</th>
                      <th className="py-4 px-6">Permissão</th>
                      <th className="py-4 px-6 text-center">Progresso</th>
                      <th className="py-4 px-6">Curso Vinculado</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProfiles.map((profile) => {
                      const displayAvatar = (profile.avatar_url && profile.avatar_url.trim() !== '') 
                        ? profile.avatar_url 
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=7311d4&color=fff&bold=true`;
                      
                      const userJourney = journeys.find(j => j.id === profile.journey_id);

                      return (
                        <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* User info */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-4">
                              <div className="relative size-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                <Image 
                                  src={displayAvatar} 
                                  alt={profile.name} 
                                  fill 
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 text-sm truncate">{profile.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                  <Mail className="size-3 shrink-0" />
                                  {profile.email || <span className="italic text-slate-400">Sem e-mail</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-5 px-6">
                            {profile.role === 'admin' || profile.role === 'admin master' || profile.role === 'admim master' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                <Shield className="size-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                                Usuário
                              </span>
                            )}
                          </td>

                          {/* Progress/Gamification */}
                          <td className="py-5 px-6">
                            <div className="flex flex-col items-center justify-center gap-1 text-center">
                              <div className="flex items-center gap-1.5">
                                <Award className="size-3.5 text-amber-500" />
                                <span className="text-xs font-bold text-slate-800">{profile.points} pts</span>
                              </div>
                              <div className="flex items-center gap-2 text-[9px] font-medium text-slate-500 uppercase">
                                <span>Nível {profile.level}</span>
                                <span>•</span>
                                <div className="flex items-center gap-0.5">
                                  <Zap className="size-2.5 text-orange-500 fill-orange-500" />
                                  <span>{profile.streak} dias</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Linked Course */}
                          <td className="py-5 px-6 text-sm font-medium text-slate-700">
                            {userJourney ? (
                              <span className="text-slate-800 font-bold">{userJourney.title}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Sem curso vinculado</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-5 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              profile.status?.toLowerCase() === 'ativo'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {profile.status || 'Ativo'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openEditModal(profile)}
                                title="Editar Cadastro"
                                className="p-2 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-600 hover:text-primary transition-colors"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(profile)}
                                title="Excluir Cadastro"
                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add / Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-800"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    {editingProfile ? 'Editar Cadastro de Aluno' : 'Criar Novo Cadastro'}
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <X className="size-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Name */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: João da Silva"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Ex: joao@email.com"
                      />
                    </div>

                    {/* Linked Course/Journey */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Curso / Trilha Vinculada</label>
                      <select 
                        value={formData.journey_id}
                        onChange={(e) => setFormData({...formData, journey_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      >
                        <option value="">Nenhum curso vinculado</option>
                        {journeys.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Biografia / Descrição Curta</label>
                      <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50 min-h-[80px]"
                        placeholder="Fale um pouco sobre o aluno ou anote informações administrativas..."
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Permissão (Role)</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      >
                        <option value="usuario">Usuário Normal (Aluno)</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status da Matrícula</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>

                    {/* Level */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nível de Gamificação</label>
                      <input 
                        type="number"
                        min="1"
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Points */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pontos Acumulados</label>
                      <input 
                        type="number"
                        min="0"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Streak */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sequência de Dias (Streak)</label>
                      <input 
                        type="number"
                        min="0"
                        value={formData.streak}
                        onChange={(e) => setFormData({...formData, streak: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Avatar URL */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">URL do Avatar / Foto de Perfil</label>
                      <input 
                        type="text"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-primary/50"
                        placeholder="Link direto de imagem (opcional)"
                      />
                    </div>

                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {loading ? 'Salvando...' : editingProfile ? 'Salvar Alterações' : 'Confirmar Cadastro'}
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
