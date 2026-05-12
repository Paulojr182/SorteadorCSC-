import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Ticket, 
  Award, 
  History, 
  PlusCircle, 
  Play, 
  ArrowRight, 
  Settings 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { students, history } = useApp();

  const totalDrawnIds = new Set(history.flatMap(h => h.winners.map(w => w.id)));
  const totalDistinctWinners = totalDrawnIds.size;
  const totalDrawCount = history.length;

  const stats = [
    {
      label: 'Total de Estudantes',
      value: students.length,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      label: 'Total de Sorteios',
      value: totalDrawCount,
      icon: Ticket,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      label: 'Estudantes Premiados',
      value: totalDistinctWinners,
      icon: Award,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
  ];

  const quickActions = [
    {
      title: 'Realizar Sorteio',
      desc: 'Ir para a tela principal de animação e sorteio.',
      link: '/sorteio',
      icon: Play,
      variant: 'primary'
    },
    {
      title: 'Importar Lista',
      desc: 'Carregar planilha com novos participantes.',
      link: '/importar',
      icon: PlusCircle,
      variant: 'secondary'
    },
    {
      title: 'Ajustar Configurações',
      desc: 'Mudar animação, quantidade e regras.',
      link: '/configuracoes',
      icon: Settings,
      variant: 'secondary'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          Bem-vindo ao SorteadorCSC
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg mt-1">
          Gerencie seus estudantes e realize sorteios com estilo.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex items-center gap-5"
          >
            <div className={`${stat.bg} p-4 rounded-2xl`}>
              <stat.icon className={`${stat.color} w-8 h-8`} />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">{stat.label}</p>
              <h3 className="text-3xl font-bold dark:text-white tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl dark:text-white flex items-center gap-2">Ações Rápidas</h3>
          <div className="grid gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.link}
                to={action.link}
                className={`group p-6 rounded-3xl border transition-all relative overflow-hidden flex items-center justify-between ${
                  action.variant === 'primary'
                    ? "bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 rounded-xl ${
                    action.variant === 'primary' ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${action.variant === 'primary' ? "text-white" : "dark:text-white"}`}>{action.title}</h4>
                    <p className={`text-sm ${action.variant === 'primary' ? "text-indigo-100" : "text-zinc-500"}`}>{action.desc}</p>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1 ${
                   action.variant === 'primary' ? "text-white" : "text-zinc-400"
                }`} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent History mini list */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Histórico Recente
            </h3>
            {history.length > 0 && (
              <Link to="/historico" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                <Ticket className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhum sorteio recente</p>
              </div>
            ) : (
              history.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-bold dark:text-white">
                      {item.winners.length} {item.winners.length === 1 ? 'Ganhador' : 'Ganhadores'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(item.timestamp).toLocaleDateString('pt-BR')} às {new Date(item.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {item.winners.slice(0, 3).map((w, i) => (
                      <div key={w.id} className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                        {w.name.charAt(0)}
                      </div>
                    ))}
                    {item.winners.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        +{item.winners.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
