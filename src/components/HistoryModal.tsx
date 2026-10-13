import React, { useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import {
  X,
  History,
  Trash2,
  FolderOpen,
  Search,
  Store,
  Laptop,
  CheckCircle2,
  Clock,
  Calendar,
  FileDown,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { savedRecords, loadSavedChecklist, deleteSavedChecklist } = useChecklist();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredRecords = savedRecords.filter((rec) => {
    const matchesSearch =
      rec.machine.identificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.machine.loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.machine.tecnico.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || rec.machine.tipo === filterType;

    return matchesSearch && matchesType;
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(savedRecords, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_checklists_ti_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Histórico de Computadores Salvos
              </h3>
              <p className="text-xs text-slate-400">
                {savedRecords.length} atendimentos registrados localmente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar máquina, loja ou técnico..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="PDV">Apenas PDV</option>
              <option value="ESCRITORIO">Apenas Escritório</option>
            </select>

            {savedRecords.length > 0 && (
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                title="Exportar backup em arquivo JSON"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Backup JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {savedRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <History className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Nenhum atendimento salvo no histórico.</p>
              <p className="text-xs">
                Ao concluir ou salvar um checklist na aba de Resumo, ele aparecerá aqui.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Nenhum registro encontrado para essa busca.</p>
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">
                      {rec.machine.identificacao || 'Sem ID'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {rec.machine.tipo === 'PDV' ? (
                        <Store className="w-3 h-3 text-blue-600" />
                      ) : (
                        <Laptop className="w-3 h-3 text-indigo-600" />
                      )}
                      {rec.machine.tipo === 'PDV' ? 'PDV' : 'Escritório'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rec.status === 'Concluído'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status === 'Concluído' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {rec.status} ({rec.progressPercent}%)
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Loja: <strong className="text-slate-700">{rec.machine.loja || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Técnico: <strong className="text-slate-700">{rec.machine.tecnico || 'N/A'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(rec.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      loadSavedChecklist(rec.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Abrir
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Excluir atendimento da máquina "${rec.machine.identificacao}"?`)) {
                        deleteSavedChecklist(rec.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
