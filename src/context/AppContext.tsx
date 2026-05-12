import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Student, RaffleSettings, RaffleHistory } from '../types';
import { toast } from 'react-hot-toast';

interface AppContextProps {
  students: Student[];
  settings: RaffleSettings;
  history: RaffleHistory[];
  setStudents: (students: Student[]) => void;
  setSettings: (settings: RaffleSettings) => void;
  addHistory: (entry: RaffleHistory) => void;
  clearHistory: () => void;
  clearStudents: () => void;
  deleteStudent: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultSettings: RaffleSettings = {
  winnerCount: 1,
  allowRepeat: false,
  animationSpeed: 'medium',
  animationDuration: 3,
  autoDraw: false
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

// AppContext definition

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudentsState] = useState<Student[]>([]);
  const [settings, setSettingsState] = useState<RaffleSettings>(defaultSettings);
  const [history, setHistoryState] = useState<RaffleHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setStudentsState(data.students || []);
          if (data.settings) {
             setSettingsState(data.settings);
          }
          setHistoryState(data.history || []);
        }
      } catch (err) {
        console.error("Failed to connect to backend:", err);
        toast.error("Erro ao conectar ao servidor. Usando modo local temporário.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const setStudents = async (newStudents: Student[]) => {
    // Optimistically set locally
    setStudentsState(newStudents);
    // Wait, this takes an array usually when appending.
    // Let's send the newly imported students to the backend.
    // But wait, the handler in component actually merges. 
    // To make this safe, we find what was added, or just pass the delta.
    // Actually, replacing wholesale is easier but backend handles 'insert ignore'.
    // Let's just sync total list. Wait, our POST /api/students appends with INSERT IGNORE.
    // I will pass the payload from the components directly to server later? No, cleaner here.
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudents) // In component it calculates final list, so we can re-fetch all or trust server.
      });
      if (res.ok) {
        const all = await res.json();
        setStudentsState(all);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const setSettings = async (newSettings: RaffleSettings) => {
    setSettingsState(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      toast.success('Configurações salvas!');
    } catch (e) {
      console.error(e);
    }
  };

  const addHistory = async (entry: RaffleHistory) => {
    setHistoryState([entry, ...history]);
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistoryState([]);
      toast.success('Histórico limpo!');
    } catch (e) {}
  };

  const clearStudents = async () => {
    try {
      await fetch('/api/students', { method: 'DELETE' });
      setStudentsState([]);
      toast.success('Lista de estudantes limpa!');
    } catch (e) {}
  };

  const deleteStudent = async (id: string) => {
    setStudentsState(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const deleteHistoryItem = async (id: string) => {
    setHistoryState(prev => prev.filter(h => h.id !== id));
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center text-indigo-600 font-bold">Carregando...</div>;
  }

  return (
    <AppContext.Provider value={{
      students, settings, history,
      setStudents, setSettings, addHistory, clearHistory,
      clearStudents, deleteStudent, deleteHistoryItem,
      darkMode, toggleDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
