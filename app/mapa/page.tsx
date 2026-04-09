'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Sparkles, Info, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as d3 from 'd3';
import Link from 'next/link';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  type: 'course' | 'lesson';
  completed: boolean;
}

interface LinkData extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export default function MapaPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }

        // Fetch user profile to get journey_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('journey_id')
          .eq('id', user.id)
          .single();

        const journeyId = profile?.journey_id || 'fa512a52-9742-410f-a71b-0bd4013bec8d';

        // Fetch journey details
        const { data: journey } = await supabase
          .from('journeys')
          .select('title, archetype')
          .eq('id', journeyId)
          .single();

        // Fetch content (lessons)
        const { data: content } = await supabase
          .from('content')
          .select('id, title')
          .eq('archetype', journey?.archetype || 'Curso')
          .order('created_at', { ascending: true });

        // Fetch progress
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true);

        const completedIds = new Set(progress?.map(p => p.lesson_id) || []);

        if (content && journey) {
          const nodes: Node[] = [
            { id: journeyId, title: journey.title, type: 'course', completed: false, x: 400, y: 300 },
            ...content.map((c, i) => ({
              id: c.id,
              title: c.title,
              type: 'lesson' as const,
              completed: completedIds.has(c.id)
            }))
          ];

          const links: LinkData[] = content.map(c => ({
            source: journeyId,
            target: c.id
          }));

          renderGraph(nodes, links);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const renderGraph = (nodes: Node[], links: LinkData[]) => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 200;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, LinkData>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d) => setSelectedNode(d));

    node.append('circle')
      .attr('r', d => d.type === 'course' ? 40 : 25)
      .attr('fill', d => d.completed ? '#10b981' : d.type === 'course' ? '#7311d4' : '#ffffff')
      .attr('stroke', d => d.type === 'course' ? '#7311d4' : '#e2e8f0')
      .attr('stroke-width', 3)
      .attr('class', 'cursor-pointer transition-all hover:scale-110 shadow-lg');

    node.append('text')
      .attr('dy', d => d.type === 'course' ? 60 : 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#64748b')
      .attr('class', 'uppercase tracking-widest pointer-events-none')
      .text(d => d.title.length > 15 ? d.title.substring(0, 12) + '...' : d.title);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col relative pb-24">
      <Header />
      
      <div className="flex-1 relative overflow-hidden">
        {/* Map Controls/Info */}
        <div className="absolute top-6 left-6 z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Share2 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">Mapa de Vértices</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Sua jornada visual</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="size-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}

        {/* Node Detail Overlay */}
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-28 left-6 right-6 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-2xl z-20 max-w-md mx-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${
                  selectedNode.completed ? 'bg-emerald-500' : 'bg-primary'
                }`}>
                  <Sparkles className="size-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {selectedNode.type === 'course' ? 'Curso Principal' : 'Aula / Desafio'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-display">{selectedNode.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <Info className="size-4" />
              </button>
            </div>
            
            <div className="flex gap-3">
              {selectedNode.type === 'lesson' ? (
                <Link 
                  href="/jornada"
                  className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center hover:bg-primary/80 transition-all"
                >
                  Ver Detalhes
                </Link>
              ) : (
                <Link 
                  href="/"
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center hover:bg-slate-200 transition-all"
                >
                  Voltar ao Início
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
