import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Settings, Ticket, History, Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';
import { useApp } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useApp();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Importar Estudantes', path: '/importar', icon: UserPlus },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
    { name: 'Realizar Sorteio', path: '/sorteio', icon: Ticket },
    { name: 'Histórico', path: '/historico', icon: History },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen sticky top-0 transition-colors duration-300 z-50">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Ticket className="w-8 h-8 text-violet-600 dark:text-violet-400 mr-2" />
        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
          SorteadorCSC
        </span>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                )} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            Tema {darkMode ? 'Escuro' : 'Claro'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
