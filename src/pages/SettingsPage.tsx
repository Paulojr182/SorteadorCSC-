import React, { useState, useEffect } from 'react';
import { Settings, Users, Repeat, Gauge, Timer, PlayCircle, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RaffleSettings } from '../types';

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useApp();
  const [localSettings, setLocalSettings] = useState<RaffleSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(localSettings);
  };

  const handleChange = (field: keyof RaffleSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Configurações do Sorteio</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Personalize o comportamento do sorteador visual para sua apresentação.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          
          {/* Setting Row: Count */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg dark:text-white">Quantidade de Ganhadores</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Define quantos estudantes serão escolhidos em cada sorteio.</p>
            </div>
            <div className="w-full md:w-48">
              <input
                type="number"
                min={1}
                value={localSettings.winnerCount}
                onChange={(e) => handleChange('winnerCount', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-500 outline-none transition-all text-center font-bold text-lg"
              />
            </div>
          </div>

          {/* Setting Row: Repeat */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Repeat className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg dark:text-white">Permitir Repetições</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Permitir que alunos já sorteados em sessões anteriores ganhem novamente.</p>
            </div>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleChange('allowRepeat', true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                  localSettings.allowRepeat 
                    ? "bg-white dark:bg-zinc-700 shadow text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >Sim</button>
              <button
                type="button"
                onClick={() => handleChange('allowRepeat', false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                  !localSettings.allowRepeat 
                    ? "bg-white dark:bg-zinc-700 shadow text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >Não</button>
            </div>
          </div>

          {/* Setting Row: Animation Speed */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg dark:text-white">Velocidade da Animação</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Quão rápido os nomes giram na tela.</p>
            </div>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full md:w-auto">
              {(['slow', 'medium', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleChange('animationSpeed', speed)}
                  className={`px-4 py-2.5 capitalize rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                    localSettings.animationSpeed === speed
                      ? "bg-white dark:bg-zinc-700 shadow text-indigo-600 dark:text-indigo-400" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {speed === 'slow' ? 'Lenta' : speed === 'medium' ? 'Normal' : 'Rápida'}
                </button>
              ))}
            </div>
          </div>

          {/* Setting Row: Duration */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg dark:text-white">Tempo do Suspense</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Duração em segundos da roleta antes de revelar o vencedor.</p>
            </div>
            <div className="w-full md:w-48 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={localSettings.animationDuration}
                onChange={(e) => handleChange('animationDuration', parseInt(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="font-bold text-lg w-12 text-right">{localSettings.animationDuration}s</span>
            </div>
          </div>

          {/* Setting Row: Auto Draw */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <PlayCircle className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg dark:text-white">Modo de Início</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Iniciar o sorteio imediatamente ao abrir a tela de Sorteio?</p>
            </div>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleChange('autoDraw', true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                  localSettings.autoDraw 
                    ? "bg-white dark:bg-zinc-700 shadow text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >Automático</button>
              <button
                type="button"
                onClick={() => handleChange('autoDraw', false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                  !localSettings.autoDraw 
                    ? "bg-white dark:bg-zinc-700 shadow text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >Manual</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
