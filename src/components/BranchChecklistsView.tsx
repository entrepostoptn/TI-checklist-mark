import React, { useState, useMemo } from 'react';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useBranches } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import {
  BranchChecklist,
  ChecklistItemStatus,
  ChecklistOverallStatus,
  BranchChecklistItem,
} from '../types/branchChecklist';
import { BranchUnit } from '../types/branch';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ChevronRight,
  Eye,
  Save,
  RotateCcw,
  PlusCircle,
  Trash2,
  X,
  FileCheck,
  Calendar,
  UserCheck,
  AlertOctagon,
  Image,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface BranchChecklistsViewProps {
  initialBranchFilter?: string | null;
  onClearInitialBranchFilter?: () => void;
}

export const BranchChecklistsView: React.FC<BranchChecklistsViewProps> = ({
  initialBranchFilter,
  onClearInitialBranchFilter,
}) => {
  const {
    checklists,
    templates,
    stats,
    createChecklistFromTemplate,
    createCustomChecklist,
    updateChecklistItem,
    addItemToChecklist,
    removeItemFromChecklist,
    saveChecklistDraft,
    completeChecklist,
    reopenChecklist,
    deleteChecklist,
  } = useBranchChecklists();

  const { branches } = useBranches();
  const { user, permissions } = useAuth();

  // Filters
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialBranchFilter || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Active Checklist Execution
  const [executingChecklist, setExecutingChecklist] = useState<BranchChecklist | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [reopenTargetChecklist, setReopenTargetChecklist] = useState<BranchChecklist | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Geral');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [generalObservations, setGeneralObservations] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Checklist Form
  const [newChecklistForm, setNewChecklistForm] = useState({
    unidadeId: initialBranchFilter || (branches[0]?.id || ''),
    mode: 'TEMPLATE' as 'TEMPLATE' | 'CUSTOM',
    templateId: templates[0]?.id || '',
    customNome: '',
    customCategoria: 'Abertura Operacional',
  });

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set(checklists.map((c) => c.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [checklists]);

  // Filtered checklists
  const filteredChecklists = useMemo(() => {
    return checklists.filter((chk) => {
      if (selectedUnitId && chk.unidadeId !== selectedUnitId) return false;
      if (selectedStatus !== 'TODOS' && chk.status !== selectedStatus) return false;
      if (selectedCategory !== 'TODAS' && chk.categoria !== selectedCategory) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        chk.nome.toLowerCase().includes(lower) ||
        chk.unidadeNome.toLowerCase().includes(lower) ||
        chk.responsavelNome.toLowerCase().includes(lower) ||
        chk.categoria.toLowerCase().includes(lower)
      );
    });
  }, [checklists, selectedUnitId, selectedStatus, selectedCategory, searchTerm]);

  // Open checklist for execution/inspection
  const handleOpenExecution = (chk: BranchChecklist) => {
    setExecutingChecklist(chk);
    setGeneralObservations(chk.observacoesGerais || '');
    setValidationError(null);
  };

  // Quick Toast
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Create new checklist
  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistForm.mode === 'TEMPLATE') {
      const res = createChecklistFromTemplate(
        newChecklistForm.unidadeId,
        newChecklistForm.templateId,
        newChecklistForm.customNome || undefined
      );
      if (res.success && res.checklist) {
        setIsNewModalOpen(false);
        handleOpenExecution(res.checklist);
        triggerToast('Checklist criado com sucesso!');
      }
    } else {
      const res = createCustomChecklist({
        unidadeId: newChecklistForm.unidadeId,
        nome: newChecklistForm.customNome || 'Checklist Operacional Personalizado',
        categoria: newChecklistForm.customCategoria,
        itensIniciais: [
          { titulo: 'Conferência de equipamentos e rede local', categoria: 'TI & PDV' },
          { titulo: 'Verificação visual do padrão de atendimento', categoria: 'Operações' },
        ],
      });
      if (res.success && res.checklist) {
        setIsNewModalOpen(false);
        handleOpenExecution(res.checklist);
        triggerToast('Checklist personalizado criado!');
      }
    }
  };

  // Change item status
  const handleItemStatusChange = (itemId: string, newStatus: ChecklistItemStatus) => {
    if (!executingChecklist) return;
    updateChecklistItem(executingChecklist.id, itemId, { status: newStatus });

    // Update local modal state immediately
    setExecutingChecklist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itens: prev.itens.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)),
      };
    });
  };

  // Change item observation
  const handleItemObservationChange = (itemId: string, obs: string) => {
    if (!executingChecklist) return;
    updateChecklistItem(executingChecklist.id, itemId, { observacao: obs });

    setExecutingChecklist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itens: prev.itens.map((it) => (it.id === itemId ? { ...it, observacao: obs } : it)),
      };
    });
  };

  // Attach evidence (simulated or URL)
  const handleAttachEvidence = (itemId: string) => {
    const currentUrl = executingChecklist?.itens.find((i) => i.id === itemId)?.evidenciaUrl || '';
    const newUrl = window.prompt(
      'Informe o link ou URL da evidência/foto (ou deixe vazio para remover):',
      currentUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
    );
    if (newUrl !== null && executingChecklist) {
      updateChecklistItem(executingChecklist.id, itemId, { evidenciaUrl: newUrl.trim() || undefined });
      setExecutingChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itens: prev.itens.map((it) => (it.id === itemId ? { ...it, evidenciaUrl: newUrl.trim() || undefined } : it)),
        };
      });
    }
  };

  // Add Item to active checklist
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingChecklist || !newItemTitle.trim()) return;
    addItemToChecklist(executingChecklist.id, {
      titulo: newItemTitle.trim(),
      categoria: newItemCategory.trim() || 'Geral',
    });
    setNewItemTitle('');
    setIsAddingItem(false);

    // Refresh modal
    const updated = checklists.find((c) => c.id === executingChecklist.id);
    if (updated) setExecutingChecklist(updated);
  };

  // Remove Item
  const handleRemoveItem = (itemId: string) => {
    if (!executingChecklist) return;
    removeItemFromChecklist(executingChecklist.id, itemId);
    setExecutingChecklist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itens: prev.itens.filter((i) => i.id !== itemId),
      };
    });
  };

  // Save in progress (Retomar depois sem concluir)
  const handleSaveDraft = () => {
    if (!executingChecklist) return;
    const res = saveChecklistDraft(executingChecklist.id, generalObservations);
    if (res.success) {
      triggerToast('Progresso salvo com sucesso! Você pode retomar a qualquer momento.');
      setExecutingChecklist(null);
    }
  };

  // Complete checklist with validations
  const handleComplete = () => {
    if (!executingChecklist) return;
    setValidationError(null);

    const res = completeChecklist(executingChecklist.id, generalObservations);
    if (res.success) {
      triggerToast(
        res.hasNonConformity
          ? 'Checklist concluído com Não Conformidades registradas.'
          : 'Checklist concluído com sucesso e 100% conforme!'
      );
      setExecutingChecklist(null);
    } else {
      setValidationError(res.error || 'Erro ao finalizar.');
    }
  };

  // Confirm Reopen Checklist
  const handleConfirmReopen = () => {
    if (!reopenTargetChecklist) return;
    setReopenError(null);

    const res = reopenChecklist(reopenTargetChecklist.id, reopenReason);
    if (res.success) {
      triggerToast('Checklist reaberto com sucesso!');
      setReopenTargetChecklist(null);
      setReopenReason('');
    } else {
      setReopenError(res.error || 'Erro ao reabrir.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Header and Indicators (Requirement 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Checklists Operacionais & Filiais
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
              {checklists.length} registros
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Preenchimento de vistorias técnicas, aberturas de loja e conformidades da rede Mark Security.
          </p>
        </div>

        {permissions.podeCriarChecklists && (
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Checklist</span>
          </button>
        )}
      </div>

      {/* Indicators Strip (Requirement 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pendentes */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'PENDENTE' ? 'TODOS' : 'PENDENTE')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'PENDENTE'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white hover:bg-amber-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-700">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-900 mt-1">{stats.pendentes}</div>
        </button>

        {/* Em Andamento */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'EM_ANDAMENTO' ? 'TODOS' : 'EM_ANDAMENTO')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'EM_ANDAMENTO'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white hover:bg-blue-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-700">Em Andamento</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-blue-900 mt-1">{stats.emAndamento}</div>
        </button>

        {/* Concluídos */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'CONCLUIDO' ? 'TODOS' : 'CONCLUIDO')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'CONCLUIDO'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-900 mt-1">{stats.concluidos}</div>
        </button>

        {/* Não Conformidades */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'NAO_CONFORME' ? 'TODOS' : 'NAO_CONFORME')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'NAO_CONFORME'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white hover:bg-rose-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-700">Com Não Conformidade</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-900 mt-1">{stats.naoConformes}</div>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar checklist por título, unidade ou responsável..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Unit */}
            <select
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                onClearInitialBranchFilter?.();
              }}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todas as Unidades (Matriz + 43 Filiais)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.idOriginal} — {b.nomeFantasia} {b.tipo === 'MATRIZ' ? '(Matriz)' : ''}
                </option>
              ))}
            </select>

            {/* Filter Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TODAS">Todas Categorias</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(selectedUnitId || selectedStatus !== 'TODOS' || selectedCategory !== 'TODAS' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitId('');
                  setSelectedStatus('TODOS');
                  setSelectedCategory('TODAS');
                  setSearchTerm('');
                  onClearInitialBranchFilter?.();
                }}
                className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checklists Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChecklists.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 text-xs">
            Nenhum checklist localizado com os filtros selecionados.
          </div>
        ) : (
          filteredChecklists.map((chk) => {
            const totalItems = chk.itens.length;
            const conformes = chk.itens.filter((i) => i.status === 'CONFORME').length;
            const naoConformes = chk.itens.filter((i) => i.status === 'NAO_CONFORME').length;
            const pendentes = chk.itens.filter((i) => i.status === 'PENDENTE').length;
            const pct = totalItems > 0 ? Math.round(((totalItems - pendentes) / totalItems) * 100) : 0;

            const isDone = chk.status === 'CONCLUIDO' || chk.status === 'NAO_CONFORME';

            return (
              <div
                key={chk.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar with Unit and Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
                      <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{chk.unidadeNome}</span>
                    </span>

                    {/* Overall Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        chk.status === 'CONCLUIDO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : chk.status === 'NAO_CONFORME'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : chk.status === 'EM_ANDAMENTO'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {chk.status === 'CONCLUIDO'
                        ? 'Concluído (Conforme)'
                        : chk.status === 'NAO_CONFORME'
                        ? 'Não Conforme'
                        : chk.status === 'EM_ANDAMENTO'
                        ? 'Em Andamento'
                        : 'Pendente'}
                    </span>
                  </div>

                  {/* Checklist Title & Category */}
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                      {chk.nome}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{chk.categoria}</span>
                      {chk.templateVersao && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
                          v{chk.templateVersao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Progresso: {pct}%</span>
                      <span>
                        {totalItems - pendentes}/{totalItems} itens
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${(conformes / (totalItems || 1)) * 100}%` }}
                        title={`${conformes} Conformes`}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${(naoConformes / (totalItems || 1)) * 100}%` }}
                        title={`${naoConformes} Não Conformes`}
                      />
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Responsável:</span>
                      <span className="font-medium text-slate-800">{chk.responsavelNome}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Última atualização:</span>
                      <span className="font-mono text-slate-600">
                        {new Date(chk.dataAtualizacao).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(chk.dataAtualizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="bg-slate-50 p-3 px-5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenExecution(chk)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <span>{isDone ? 'Visualizar / Revisar' : 'Preencher / Continuar'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Reopen button (Only for Authorized users when checklist is concluded) */}
                  {isDone && permissions.podeReabrirChecklists && (
                    <button
                      type="button"
                      onClick={() => {
                        setReopenTargetChecklist(chk);
                        setReopenReason('');
                        setReopenError(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                      title="Reabrir checklist concluído (exclusivo para autorizados)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reabrir</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: PREENCHIMENTO COMPLETO DO CHECKLIST (Requirement 3) */}
      {executingChecklist && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                    {executingChecklist.unidadeNome}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• {executingChecklist.categoria}</span>
                  {executingChecklist.templateVersao && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                      Versão Snapshot: v{executingChecklist.templateVersao}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {executingChecklist.nome}
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Responsável: <b>{executingChecklist.responsavelNome}</b></span>
                  <span>•</span>
                  <span>Status: <b>{executingChecklist.status}</b></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExecutingChecklist(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* List of items to verify (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Itens a Verificar ({executingChecklist.itens.length})
                </span>

                <button
                  type="button"
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar Item Avulso</span>
                </button>
              </div>

              {/* Form to add single item */}
              {isAddingItem && (
                <form
                  onSubmit={handleAddItem}
                  className="p-3 bg-slate-50 border border-blue-200 rounded-xl space-y-2 text-xs animate-in fade-in"
                >
                  <div className="font-bold text-slate-800">Novo Item no Checklist:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Descrição do item a verificar..."
                      className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      placeholder="Categoria (ex: TI, Frios)"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(false)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                    >
                      Salvar Item
                    </button>
                  </div>
                </form>
              )}

              {/* Item Rows */}
              {executingChecklist.itens.map((item, idx) => {
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      item.status === 'CONFORME'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : item.status === 'NAO_CONFORME'
                        ? 'bg-rose-50/50 border-rose-200'
                        : item.status === 'NAO_APLICAVEL'
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : item.status === 'EM_ANDAMENTO'
                        ? 'bg-blue-50/30 border-blue-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.titulo}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.categoria}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector Buttons (Requirement 3: Pendente, Em andamento, Conforme, Não conforme, Não aplicável) */}
                      <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleItemStatusChange(item.id, 'PENDENTE')}
                          className={`flex-1 sm:flex-initial min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.status === 'PENDENTE'
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-xs'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          Pendente
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusChange(item.id, 'EM_ANDAMENTO')}
                          className={`flex-1 sm:flex-initial min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.status === 'EM_ANDAMENTO'
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-xs'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          Andamento
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusChange(item.id, 'CONFORME')}
                          className={`flex-1 sm:flex-initial min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.status === 'CONFORME'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          ✓ Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusChange(item.id, 'NAO_CONFORME')}
                          className={`flex-1 sm:flex-initial min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.status === 'NAO_CONFORME'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-300 shadow-xs'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          ✗ Não Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusChange(item.id, 'NAO_APLICAVEL')}
                          className={`min-h-[36px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.status === 'NAO_APLICAVEL'
                              ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          N/A
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer ml-1"
                          title="Remover este item do checklist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Observação e Evidência por Item */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={item.observacao || ''}
                          onChange={(e) => handleItemObservationChange(item.id, e.target.value)}
                          placeholder="Observação ou comentário detalhado deste item..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleAttachEvidence(item.id)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            item.evidenciaUrl
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>{item.evidenciaUrl ? 'Ver Evidência' : 'Anexar Foto'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Pre-visualização de evidência se houver */}
                    {item.evidenciaUrl && (
                      <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-emerald-700">Evidência anexada:</span>
                        <a
                          href={item.evidenciaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-sm flex items-center gap-1"
                        >
                          {item.evidenciaUrl} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Observações Gerais do Checklist */}
            <div className="pt-2 border-t border-slate-200 shrink-0">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Gerais do Checklist / Conclusão:
              </label>
              <textarea
                value={generalObservations}
                onChange={(e) => setGeneralObservations(e.target.value)}
                placeholder="Insira um parecer final ou observações globais sobre a unidade..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Reopening History Log if available */}
            {executingChecklist.historicoReabertura && executingChecklist.historicoReabertura.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs shrink-0">
                <span className="font-bold text-amber-900 block mb-1">
                  Histórico de Reabertura deste Checklist:
                </span>
                {executingChecklist.historicoReabertura.map((r, i) => (
                  <div key={i} className="text-amber-800 text-[11px]">
                    • Reaberto por <b>{r.responsavelNome}</b> em{' '}
                    {new Date(r.data).toLocaleString('pt-BR')} — Motivo: "{r.motivo}"
                  </div>
                ))}
              </div>
            )}

            {/* Footer Buttons: Salvar sem concluir, Finalizar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setExecutingChecklist(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer min-h-[42px] order-3 sm:order-1"
              >
                Fechar sem Salvar
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                {/* Salvar sem concluir (Retomar depois) */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar em Andamento</span>
                </button>

                {/* Finalizar Checklist com validações */}
                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar Checklist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Criar Novo Checklist */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-500" />
                <span>Novo Checklist Operacional</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChecklist} className="space-y-4 text-xs">
              {/* Unidade Vinculada */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione a Unidade Vinculada (Matriz ou Filial) *
                </label>
                <select
                  value={newChecklistForm.unidadeId}
                  onChange={(e) =>
                    setNewChecklistForm({ ...newChecklistForm, unidadeId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.idOriginal} — {b.nomeFantasia} ({b.tipo === 'MATRIZ' ? 'Matriz' : 'Filial'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Origem: Modelo ou Personalizado */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Checklist *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChecklistForm({ ...newChecklistForm, mode: 'TEMPLATE' })}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      newChecklistForm.mode === 'TEMPLATE'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Usar Modelo Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChecklistForm({ ...newChecklistForm, mode: 'CUSTOM' })}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      newChecklistForm.mode === 'CUSTOM'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Personalizado / Avulso
                  </button>
                </div>
              </div>

              {newChecklistForm.mode === 'TEMPLATE' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selecione o Modelo de Checklist *
                  </label>
                  <select
                    value={newChecklistForm.templateId}
                    onChange={(e) =>
                      setNewChecklistForm({ ...newChecklistForm, templateId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} (v{t.versao}) — {t.categoria} ({t.itens.length} itens)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome do Checklist *
                    </label>
                    <input
                      type="text"
                      value={newChecklistForm.customNome}
                      onChange={(e) =>
                        setNewChecklistForm({ ...newChecklistForm, customNome: e.target.value })
                      }
                      placeholder="Ex: Vistoria Especial de Balcão e PDVs"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Categoria *
                    </label>
                    <input
                      type="text"
                      value={newChecklistForm.customCategoria}
                      onChange={(e) =>
                        setNewChecklistForm({ ...newChecklistForm, customCategoria: e.target.value })
                      }
                      placeholder="Ex: TI & Infra, Auditoria Balança, etc."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Iniciar Preenchimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reabertura com Motivo Obrigatório (Requirement 3) */}
      {reopenTargetChecklist && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Reabertura de Checklist Concluído
                </h3>
                <p className="text-xs text-slate-500">
                  {reopenTargetChecklist.nome} ({reopenTargetChecklist.unidadeNome})
                </p>
              </div>
            </div>

            {reopenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {reopenError}
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              A reabertura de checklists concluídos é permitida apenas para usuários autorizados.
              Conforme as diretrizes de governança, o motivo e o usuário responsável pela reabertura serão gravados de forma permanente no histórico de auditoria.
            </p>

            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">
                Justificativa da Reabertura (Obrigatório) *
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo para reabrir este checklist..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReopenTargetChecklist(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
              >
                Confirmar Reabertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
