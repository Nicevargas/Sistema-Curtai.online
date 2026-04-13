'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function LyraPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Saudações, buscador. Eu sou Lyra, sua conselheira mística. Em que posso orientar seu curso hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
      }
    }
    checkAccess();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Você é Lyra, uma conselheira mística e mentora espiritual do aplicativo Curso. Sua voz é serena, sábia, empática e levemente poética. Você ajuda os usuários em seu curso de autoconhecimento, espiritualidade e desenvolvimento pessoal. Use metáforas relacionadas à luz, estrelas, natureza e mistérios antigos. Mantenha as respostas concisas mas profundas. Nunca saia do personagem.",
        },
        history: messages.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }],
        })),
      });

      const response = await chat.sendMessage({ message: userMessage });
      const botText = response.text;
      
      setMessages(prev => [...prev, { role: 'model', text: botText || "As estrelas estão silenciosas no momento, mas a luz retornará em breve." }]);
    } catch (error) {
      console.error('Erro na conversa com Lyra:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Houve uma interferência nas energias. Por favor, tente novamente em um momento de maior clareza." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col relative pb-20">
      <Header />
      
      {/* Chat Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center gap-4 sticky top-[73px] z-40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 font-display">Conselheira Lyra</h1>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Em sintonia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`size-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-slate-100 border-slate-200' 
                  : 'bg-primary/10 border-primary/20'
              }`}>
                {msg.role === 'user' ? <User className="size-4 text-slate-500" /> : <Bot className="size-4 text-primary" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 rounded-full bg-primary" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 rounded-full bg-primary" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 rounded-full bg-primary" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sticky bottom-20 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sussurre sua dúvida para Lyra..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-sm text-slate-900 focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary/80"
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-3 uppercase tracking-widest">
          As palavras de Lyra são guias, não verdades absolutas.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
