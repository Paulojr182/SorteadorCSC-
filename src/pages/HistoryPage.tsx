import React, { useState } from 'react';
import { History, Trash2, FileText, ChevronDown, ChevronUp, Calendar, Users, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RaffleHistory } from '../types';
import { cn } from '../utils/cn';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HistoryPage: React.FC = () => {
  const { history, clearHistory, deleteHistoryItem } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const exportSinglePdf = (item: RaffleHistory) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório de Sorteio', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${formatDate(item.timestamp)}`, 14, 30);
    doc.text(`Quantidade solicitada: ${item.settings.winnerCount}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Matrícula', 'Nome']],
      body: item.winners.map(w => [w.registration, w.name]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`historico_sorteio_${item.id.substring(0, 8)}.pdf`);
  };

  const exportFullHistory = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Histórico Completo de Sorteios', 14, 22);
    
    let currentY = 30;
    
    history.forEach((item, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Sorteio #${index + 1} - ${formatDate(item.timestamp)}`, 14, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Matrícula', 'Ganhador']],
        body: item.winners.map(w => [w.registration, w.name]),
        margin: { left: 14 },
        tableWidth: 180,
        theme: 'grid'
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`historico_completo_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Histórico</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Consulte os registros de todos os sorteios realizados.</p>
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-3">
            <button 
              onClick={exportFullHistory}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Exportar Tudo
            </button>
            <button 
              onClick={() => window.confirm('Deseja limpar TODO o histórico?') && clearHistory()}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>
        )}
      </header>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
          <History className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold dark:text-white mb-1">Nenhum sorteio registrado</h3>
          <p className="text-zinc-500 mb-6">Os resultados aparecerão aqui automaticamente após você realizar um sorteio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div 
                  className={cn(
                    "p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-white dark:bg-zinc-900 z-10 relative",
                    isExpanded && "border-b border-zinc-100 dark:border-zinc-800"
                  )}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">
                        {formatDate(item.timestamp)}
                      </h3>
                      <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {item.winners.length} {item.winners.length === 1 ? 'Ganhador' : 'Ganhadores'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => exportSinglePdf(item)}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-indigo-600 transition-colors"
                      title="Baixar PDF"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-600 transition-colors"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors md:ml-2"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Lista de Sorteados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.winners.map(winner => (
                        <div key={winner.id} className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate dark:text-zinc-100">{winner.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">{winner.registration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
