import React, { useState, useRef, useMemo } from 'react';
import { Upload, Trash2, Search, FileSpreadsheet, UserMinus, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { parseStudentsFile } from '../services/fileService';
import { cn } from '../utils/cn';

const ImportStudents: React.FC = () => {
  const { students, setStudents, clearStudents, deleteStudent } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.registration.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleFiles = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Por favor, selecione um arquivo .xlsx, .xls ou .csv');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Processando planilha...');
    
    try {
      const parsed = await parseStudentsFile(file);
      if (parsed.length === 0) {
        toast.error('Nenhum dado válido encontrado no arquivo.', { id: loadingToast });
        return;
      }

      // Combine, checking for duplicate registrations
      const existingRegistrations = new Set(students.map(s => s.registration));
      let addedCount = 0;
      let duplicateCount = 0;
      
      const newUniqueStudents = [...students];
      
      parsed.forEach(s => {
        if (!existingRegistrations.has(s.registration)) {
          newUniqueStudents.push(s);
          existingRegistrations.add(s.registration);
          addedCount++;
        } else {
          duplicateCount++;
        }
      });

      setStudents(newUniqueStudents);
      
      toast.success(
        `${addedCount} alunos importados com sucesso!${duplicateCount > 0 ? ` (${duplicateCount} duplicados ignorados)` : ''}`, 
        { id: loadingToast, duration: 4000 }
      );
    } catch (error) {
      console.error(error);
      toast.error('Erro ao ler o arquivo. Verifique a formatação.', { id: loadingToast });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Importar Estudantes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Suba sua planilha com Matrícula e Nome para popular a base de dados.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="xl:col-span-1 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative",
              isDragging ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.02]" : "border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files[0])}
              disabled={isLoading}
            />
            
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold dark:text-white mb-1">
              Carregar Planilha
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Arraste um arquivo ou clique para procurar.<br/>
              Suporta .xlsx, .csv, .xls
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h4 className="font-medium mb-4 flex items-center text-zinc-800 dark:text-zinc-200">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Dicas de formato
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside">
              <li>A planilha deve ter as colunas 'Nome' e 'Matrícula'.</li>
              <li>Tentamos identificar as colunas automaticamente.</li>
              <li>CPFs/IDs já existentes serão ignorados (sem duplicatas).</li>
            </ul>
          </div>
          
          {students.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja remover TODOS os estudantes?')) {
                  clearStudents();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Todos os Dados ({students.length})
            </button>
          )}
        </div>

        {/* Students Table List */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold dark:text-white">Estudantes</h2>
              <p className="text-sm text-zinc-500">{students.length} no total</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou RA..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 ring-0 focus:ring-2 ring-indigo-500/20 outline-none transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <UserMinus className="w-12 h-12 mb-3 opacity-50" />
                <p>{students.length === 0 ? 'Nenhum estudante importado ainda.' : 'Nenhum resultado encontrado.'}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-6 py-4">Matrícula</th>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-sm">{student.registration}</td>
                      <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">{student.name}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudents;
