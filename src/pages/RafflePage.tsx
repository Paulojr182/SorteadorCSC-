import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Maximize, Minimize, Trophy, Users, Volume2, VolumeX, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Student } from '../types';
import { cn } from '../utils/cn';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RafflePage: React.FC = () => {
  const { students, settings, history, addHistory } = useApp();
  const [isRaffling, setIsRaffling] = useState(false);
  const [winners, setWinners] = useState<Student[]>([]);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + Math.random() * 100, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, [soundEnabled]);

  const playWin = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.5);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
      });
    } catch (e) {}
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

// Available pool

  // Use memo hack since hooks can't conditional rely on deps unless written inline
  function getAvailablePool() {
     if (settings.allowRepeat) return students;
     const wonIds = new Set(history.flatMap(h => h.winners.map(w => w.id)));
     return students.filter(s => !wonIds.has(s.id));
  }

  const startRaffle = () => {
    const pool = getAvailablePool();
    if (pool.length === 0) {
      toast.error('Não há estudantes disponíveis para sorteio!');
      return;
    }
    
    if (pool.length < settings.winnerCount) {
      toast.error(`Existem apenas ${pool.length} estudantes disponíveis.`);
      return;
    }

    setIsRaffling(true);
    setWinners([]);
    
    // Pick winners immediately but don't show yet
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffled.slice(0, settings.winnerCount);

    let intervalTime = settings.animationSpeed === 'fast' ? 50 : settings.animationSpeed === 'medium' ? 100 : 200;
    const durationMs = settings.animationDuration * 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < durationMs) {
        // Picking random from entire student list just for visuals
        const randomIndex = Math.floor(Math.random() * students.length);
        setDisplayStudent(students[randomIndex]);
        playTick();
        
        // De-accelerate close to end
        const remainingRatio = 1 - (elapsed / durationMs);
        let nextInterval = intervalTime;
        if (remainingRatio < 0.3) {
          nextInterval = intervalTime * (1 + (0.3 - remainingRatio) * 5);
        }

        intervalRef.current = window.setTimeout(animate, nextInterval);
      } else {
        finishRaffle(selectedWinners);
      }
    };

    animate();
  };

  const finishRaffle = (finalWinners: Student[]) => {
    setIsRaffling(false);
    setWinners(finalWinners);
    setDisplayStudent(finalWinners[0]);
    playWin();
    
    // Fire confetti
    const end = Date.now() + 3 * 1000;
    const colors = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Auto-save to history
    addHistory({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      winners: finalWinners,
      settings: { ...settings }
    });
  };

  // Optional: AutoDraw on initial mount if set
  useEffect(() => {
    if (settings.autoDraw && students.length > 0) {
      // Small delay so ui renders
      const t = setTimeout(() => {
         startRaffle();
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  const exportPdf = () => {
    if (winners.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Resultado do Sorteio', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    autoTable(doc, {
      startY: 35,
      head: [['Matrícula', 'Nome']],
      body: winners.map(w => [w.registration, w.name]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`sorteio_${Date.now()}.pdf`);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex flex-col transition-all duration-500 ease-in-out overflow-hidden",
        isFullscreen ? "fixed inset-0 z-[9999] bg-zinc-950 text-white p-8" : "h-[calc(100vh-10rem)] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl"
      )}
    >
      {/* Dynamic Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-fuchsia-500/10 to-orange-500/10 opacity-0 transition-opacity duration-1000",
        isRaffling && "opacity-100 animate-gradient-xy"
      )} />

      {/* Overlay Grid Dots for futuristic look */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]" />

      {/* Top Bar Controls */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Arena de Sorteio</h2>
            <p className="text-xs opacity-60 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {getAvailablePool().length} estudantes elegíveis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title={soundEnabled ? "Silenciar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Central Arena */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center">
        
        {/* State 1: Idle / Initial */}
        {!isRaffling && winners.length === 0 && (
          <div className="space-y-8 max-w-md animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full"></div>
              <Trophy className="w-24 h-24 mx-auto text-indigo-500 relative drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Pronto para Sortear?</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                {settings.winnerCount === 1 
                  ? '1 ganhador será escolhido aleatoriamente.' 
                  : `${settings.winnerCount} ganhadores serão escolhidos.`}
              </p>
            </div>
            <button
              onClick={startRaffle}
              disabled={students.length === 0}
              className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-2xl rounded-3xl shadow-2xl shadow-indigo-500/40 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-8 h-8 fill-current" />
              INICIAR SORTEIO
            </button>
            {students.length === 0 && (
              <p className="text-red-500 text-sm font-medium">⚠️ Importe estudantes primeiro.</p>
            )}
          </div>
        )}

        {/* State 2: Raffling Animation */}
        {isRaffling && (
          <div className="space-y-4 w-full max-w-4xl px-4 transition-all duration-300">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-bold tracking-widest uppercase animate-pulse">
              SORTEANDO...
            </span>
            
            <div className="relative min-h-[200px] flex flex-col items-center justify-center perspective-1000">
              <div className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight break-words text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 leading-tight transition-all transform scale-110">
                {displayStudent?.name || "---"}
              </div>
              <div className="text-xl md:text-2xl font-mono mt-4 opacity-60">
                {displayStudent?.registration}
              </div>
            </div>
          </div>
        )}

        {/* State 3: Final Result */}
        {!isRaffling && winners.length > 0 && (
          <div className="space-y-10 w-full max-w-4xl p-4 overflow-y-auto max-h-full scrollbar-hide animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Winner Header & Main Display (First Winner prominently displayed if only 1, or overall grid if multiple) */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-lg font-extrabold ring-4 ring-green-500/10 shadow-lg animate-bounce mb-4">
                <Trophy className="w-6 h-6" />
                {winners.length === 1 ? "VENCEDOR ENCONTRADO!" : "VENCEDORES ENCONTRADOS!"}
              </div>

              <div className={cn(
                "grid gap-6 mt-6 justify-center",
                winners.length === 1 ? "grid-cols-1" : winners.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              )}>
                {winners.map((winner) => (
                  <div 
                    key={winner.id}
                    className={cn(
                      "bg-white dark:bg-zinc-900 border-2 border-indigo-500/30 dark:border-indigo-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group",
                      winners.length === 1 ? "scale-110 md:scale-125 mx-auto max-w-lg w-full my-12" : ""
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-fuchsia-500/5 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <span className="block text-zinc-500 dark:text-zinc-400 text-sm font-mono mb-1"># {winner.registration}</span>
                      <h2 className={cn(
                        "font-black tracking-tight text-zinc-900 dark:text-white break-words",
                        winners.length === 1 ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                      )}>
                        {winner.name}
                      </h2>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in delay-500 duration-1000 relative z-20">
              <button 
                onClick={startRaffle}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Novo Sorteio
              </button>
              
              <button 
                onClick={exportPdf}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-bold transition-all"
              >
                <FileText className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RafflePage;
