import React, { useState, useMemo } from 'react';
import { useBranches } from '../context/BranchContext';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { BranchUnit, BranchStatus, BranchType } from '../types/branch';
import { ServiceOrder } from '../types/serviceOrder';
import {
  Building2,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit2,
  Power,
  ClipboardList,
  History,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  FileSpreadsheet,
  ArrowUpDown,
  Building,
  RotateCcw,
  Wrench,
  ChevronRight,
  ArrowLeft,
  Clock,
  Layers,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface BranchesManagerProps {
  onOpenChecklistForBranch: (branch: BranchUnit) => void;
  onOpenAuditForBranch: (branchId: string) => void;
  onOpenServiceOrderForBranch?: (branch: BranchUnit) => void;
  onOpenMachinesForBranch?: (branch: BranchUnit) => void;
}

type NavigationLevel = 'MATRIZES_OVERVIEW' | 'FILIAIS_LIST' | 'ALL_UNITS';

export const BranchesManager: React.FC<BranchesManagerProps> = ({
  onOpenChecklistForBranch,
  onOpenAuditForBranch,
  onOpenServiceOrderForBranch,
  onOpenMachinesForBranch,
}) => {
  const {
    branches,
    filterOptions,
    setFilterOptions,
    activeCount,
    inactiveCount,
    totalCount,
    matriz,
    addBranch,
    updateBranch,
    toggleBranchStatus,
    exportBranchesToCsv,
    clearFilters,
  } = useBranches();

  const { logs } = useAudit();
  const { user, permissions } = useAuth();
  const { orders } = useServiceOrders();
  const { checklists } = useBranchChecklists();

  // Navigation hierarchy: Matrizes -> Selecionar Matriz -> Visualizar Filiais -> Selecionar Filial -> Consultar / Abrir Atendimentos
  const [navLevel, setNavLevel] = useState<NavigationLevel>('MATRIZES_OVERVIEW');
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);

  // Selected filial for detailed actions (Consultar / Abrir Atendimentos, Checklists, Histórico)
  const [selectedBranchForActions, setSelectedBranchForActions] = useState<BranchUnit | null>(null);
  const [actionsActiveTab, setActionsActiveTab] = useState<'ATENDIMENTOS' | 'CHECKLISTS' | 'HISTORICO' | 'DADOS'>('ATENDIMENTOS');

  // Modals state
  const [selectedBranchForView, setSelectedBranchForView] = useState<BranchUnit | null>(null);
  const [branchToEdit, setBranchToEdit] = useState<BranchUnit | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [branchToToggle, setBranchToToggle] = useState<BranchUnit | null>(null);
  const [toggleReason, setToggleReason] = useState('');
  const [branchHistoryModal, setBranchHistoryModal] = useState<BranchUnit | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    idOriginal: '',
    tipo: 'FILIAL' as BranchType,
    matrizVinculadaId: '',
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    cep: '',
    endereco: '',
    municipio: 'São Paulo',
    uf: 'SP',
    telefone: '',
    status: 'ativa' as BranchStatus,
    responsavelLocal: '',
    observacoes: '',
    pendenteConferencia: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Registered matrices
  const registeredMatrices = useMemo(() => {
    const list = branches.filter((b) => b.tipo === 'MATRIZ');
    if (list.length === 0 && matriz) return [matriz];
    return list;
  }, [branches, matriz]);

  // Current active selected matrix
  const currentMatrix = useMemo(() => {
    if (!selectedMatrixId) return registeredMatrices[0] || matriz;
    return branches.find((b) => b.id === selectedMatrixId) || registeredMatrices[0] || matriz;
  }, [selectedMatrixId, registeredMatrices, branches, matriz]);

  // Filiais linked to the currently selected matrix
  const filiaisForCurrentMatrix = useMemo(() => {
    if (!currentMatrix) return [];
    return branches.filter((b) => {
      if (b.tipo === 'MATRIZ') return false;
      // Se não possui matrizVinculadaId explícita, associa à matriz principal padrão
      if (!b.matrizVinculadaId) {
        return currentMatrix.idOriginal === 'MATRIZ' || currentMatrix.id === matriz.id;
      }
      return b.matrizVinculadaId === currentMatrix.id;
    });
  }, [branches, currentMatrix, matriz]);

  // Filtered branches list depending on view mode
  const activeBranchList = useMemo(() => {
    if (navLevel === 'FILIAIS_LIST') {
      return filiaisForCurrentMatrix;
    }
    return branches;
  }, [navLevel, filiaisForCurrentMatrix, branches]);

  // Apply search and status filters to active list
  const displayedBranches = useMemo(() => {
    return activeBranchList.filter((b) => {
      // Search
      if (filterOptions.busca.trim()) {
        const query = filterOptions.busca.toLowerCase().trim();
        const cleanCnpj = query.replace(/\D/g, '');
        const matchNome = b.nomeFantasia.toLowerCase().includes(query);
        const matchCnpj = cleanCnpj ? b.cnpj.replace(/\D/g, '').includes(cleanCnpj) : false;
        const matchRazao = b.razaoSocial.toLowerCase().includes(query);
        const matchId = b.idOriginal.toLowerCase().includes(query);
        if (!matchNome && !matchCnpj && !matchRazao && !matchId) return false;
      }

      // Status
      if (filterOptions.status === 'ATIVAS' && b.status !== 'ativa') return false;
      if (filterOptions.status === 'INATIVAS' && b.status !== 'inativa') return false;

      // Municipio
      if (filterOptions.municipio && b.municipio !== filterOptions.municipio) return false;

      // UF
      if (filterOptions.uf && b.uf !== filterOptions.uf) return false;

      return true;
    }).sort((a, b) => {
      const dir = filterOptions.ordemDirecao === 'asc' ? 1 : -1;
      if (filterOptions.ordenarPor === 'nome') {
        return a.nomeFantasia.localeCompare(b.nomeFantasia) * dir;
      }
      if (filterOptions.ordenarPor === 'cidade') {
        return a.municipio.localeCompare(b.municipio) * dir;
      }
      if (filterOptions.ordenarPor === 'atualizacao') {
        return (new Date(a.atualizadoEm).getTime() - new Date(b.atualizadoEm).getTime()) * dir;
      }
      // Ordenação padrão por código / ID
      const numA = parseInt(a.idOriginal.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.idOriginal.replace(/\D/g, '') || '0', 10);
      return (numA - numB) * dir;
    });
  }, [activeBranchList, filterOptions]);

  // List of unique cities & UFs for filter dropdowns
  const uniqueCities = useMemo(() => {
    const set = new Set(branches.map((b) => b.municipio).filter(Boolean));
    return Array.from(set).sort();
  }, [branches]);

  const uniqueUfs = useMemo(() => {
    const set = new Set(branches.map((b) => b.uf).filter(Boolean));
    return Array.from(set).sort();
  }, [branches]);

  // Atendimentos (OS) vinculados à filial selecionada
  const branchOrders = useMemo(() => {
    if (!selectedBranchForActions) return [];
    const bId = selectedBranchForActions.id;
    const bNome = selectedBranchForActions.nomeFantasia.toLowerCase();
    const bCode = selectedBranchForActions.idOriginal;

    return orders.filter((os: ServiceOrder) => {
      const matchLojaId = os.lojaId === bId;
      const matchLojaNome =
        (os.lojaNome && os.lojaNome.toLowerCase().includes(bNome)) ||
        (os.lojaOrigem && os.lojaOrigem.toLowerCase().includes(bNome)) ||
        (os.lojaNome && os.lojaNome.includes(`Loja ${bCode}`));
      return matchLojaId || matchLojaNome;
    });
  }, [selectedBranchForActions, orders]);

  // Checklists vinculados à filial selecionada
  const branchChecklistsList = useMemo(() => {
    if (!selectedBranchForActions) return [];
    return checklists.filter((chk) => chk.unidadeId === selectedBranchForActions.id);
  }, [selectedBranchForActions, checklists]);

  // Histórico de auditoria vinculado à filial selecionada
  const branchAuditLogs = useMemo(() => {
    if (!selectedBranchForActions) return [];
    return logs.filter((l) => l.unidadeId === selectedBranchForActions.id);
  }, [selectedBranchForActions, logs]);

  // Abrir modal de cadastro
  const handleOpenAdd = (defaultType: BranchType = 'FILIAL') => {
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      idOriginal: defaultType === 'MATRIZ' ? 'MATRIZ-02' : String(branches.length + 1).padStart(2, '0'),
      tipo: defaultType,
      matrizVinculadaId: defaultType === 'FILIAL' ? (currentMatrix?.id || '') : '',
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      cep: '',
      endereco: '',
      municipio: 'São Paulo',
      uf: 'SP',
      telefone: '',
      status: 'ativa',
      responsavelLocal: '',
      observacoes: '',
      pendenteConferencia: false,
    });
    setIsAddModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEdit = (branch: BranchUnit) => {
    setFormError(null);
    setFormSuccess(null);
    setBranchToEdit(branch);
    setFormData({
      idOriginal: branch.idOriginal,
      tipo: branch.tipo,
      matrizVinculadaId: branch.matrizVinculadaId || (currentMatrix?.id || ''),
      cnpj: branch.cnpj,
      razaoSocial: branch.razaoSocial,
      nomeFantasia: branch.nomeFantasia,
      cep: branch.cep,
      endereco: branch.endereco,
      municipio: branch.municipio,
      uf: branch.uf,
      telefone: branch.telefone || '',
      status: branch.status,
      responsavelLocal: branch.responsavelLocal || '',
      observacoes: branch.observacoes || '',
      pendenteConferencia: !!branch.pendenteConferencia,
    });
  };

  // Salvar cadastro
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nomeFantasia.trim()) {
      setFormError('O Nome Fantasia é obrigatório e deve conter exclusivamente o nome fantasia.');
      return;
    }
    if (!formData.cnpj.trim()) {
      setFormError('O CNPJ é obrigatório para cadastrar a unidade.');
      return;
    }

    const linkedMatrix = registeredMatrices.find((m) => m.id === formData.matrizVinculadaId) || currentMatrix;

    const res = addBranch({
      idOriginal: formData.idOriginal.trim() || String(branches.length + 1).padStart(2, '0'),
      tipo: formData.tipo,
      matrizVinculadaId: formData.tipo === 'FILIAL' ? linkedMatrix?.id : undefined,
      matrizVinculadaNome: formData.tipo === 'FILIAL' ? linkedMatrix?.nomeFantasia : undefined,
      cnpj: formData.cnpj.trim(),
      razaoSocial: formData.razaoSocial.trim() || formData.nomeFantasia.trim(),
      nomeFantasia: formData.nomeFantasia.trim(),
      cep: formData.cep.trim(),
      endereco: formData.endereco.trim(),
      municipio: formData.municipio.trim(),
      uf: formData.uf.trim().toUpperCase(),
      telefone: formData.telefone.trim(),
      status: formData.status,
      responsavelLocal: formData.responsavelLocal.trim(),
      observacoes: formData.observacoes.trim(),
      pendenteConferencia: formData.pendenteConferencia,
    });

    if (res.success) {
      setFormSuccess('Unidade cadastrada com sucesso!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess(null);
      }, 700);
    } else {
      setFormError(res.error || 'Erro ao cadastrar filial.');
    }
  };

  // Salvar edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchToEdit) return;
    setFormError(null);

    if (!formData.nomeFantasia.trim()) {
      setFormError('O Nome Fantasia é obrigatório.');
      return;
    }
    if (!formData.cnpj.trim()) {
      setFormError('O CNPJ é obrigatório.');
      return;
    }

    const linkedMatrix = registeredMatrices.find((m) => m.id === formData.matrizVinculadaId) || currentMatrix;

    const res = updateBranch(branchToEdit.id, {
      idOriginal: formData.idOriginal.trim(),
      tipo: formData.tipo,
      matrizVinculadaId: formData.tipo === 'FILIAL' ? linkedMatrix?.id : undefined,
      matrizVinculadaNome: formData.tipo === 'FILIAL' ? linkedMatrix?.nomeFantasia : undefined,
      cnpj: formData.cnpj.trim(),
      razaoSocial: formData.razaoSocial.trim() || formData.nomeFantasia.trim(),
      nomeFantasia: formData.nomeFantasia.trim(),
      cep: formData.cep.trim(),
      endereco: formData.endereco.trim(),
      municipio: formData.municipio.trim(),
      uf: formData.uf.trim().toUpperCase(),
      telefone: formData.telefone.trim(),
      status: formData.status,
      responsavelLocal: formData.responsavelLocal.trim(),
      observacoes: formData.observacoes.trim(),
      pendenteConferencia: formData.pendenteConferencia,
    });

    if (res.success) {
      setFormSuccess('Dados atualizados com sucesso!');
      setTimeout(() => {
        setBranchToEdit(null);
        setFormSuccess(null);
        if (selectedBranchForActions?.id === branchToEdit.id) {
          setSelectedBranchForActions((prev) => (prev ? { ...prev, ...formData } : null));
        }
      }, 600);
    } else {
      setFormError(res.error || 'Erro ao atualizar dados.');
    }
  };

  // Confirmar alternância de status
  const handleConfirmToggle = () => {
    if (!branchToToggle) return;
    toggleBranchStatus(branchToToggle.id, toggleReason || undefined);
    if (selectedBranchForActions?.id === branchToToggle.id) {
      setSelectedBranchForActions((prev) =>
        prev ? { ...prev, status: prev.status === 'ativa' ? 'inativa' : 'ativa' } : null
      );
    }
    setBranchToToggle(null);
    setToggleReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation (Requirement 3: Matrizes -> Selecionar Matriz -> Visualizar Filiais) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setNavLevel('MATRIZES_OVERVIEW');
                setSelectedMatrixId(null);
              }}
              className={`text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                navLevel === 'MATRIZES_OVERVIEW'
                  ? 'text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Matrizes Mark Security</span>
            </button>

            {navLevel === 'FILIAIS_LIST' && currentMatrix && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Filiais: {currentMatrix.nomeFantasia}</span>
                </span>
              </>
            )}

            {navLevel === 'ALL_UNITS' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Visão Global (Todas as {totalCount} Unidades)
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {navLevel === 'MATRIZES_OVERVIEW' &&
              'Visão geral das matrizes operacionais cadastradas. Selecione uma matriz para visualizar suas filiais vinculadas.'}
            {navLevel === 'FILIAIS_LIST' &&
              `Exibindo filiais vinculadas à matriz ${currentMatrix?.nomeFantasia}. Selecione uma filial para consultar ou abrir atendimentos.`}
            {navLevel === 'ALL_UNITS' &&
              'Consulta irrestrita de todas as unidades da rede Mark Security.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {navLevel !== 'MATRIZES_OVERVIEW' && (
            <button
              type="button"
              onClick={() => {
                setNavLevel('MATRIZES_OVERVIEW');
                setSelectedMatrixId(null);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar às Matrizes</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportBranchesToCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Exportar dados para planilha Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          {permissions.podeCriarFiliais && (
            <button
              type="button"
              onClick={() => handleOpenAdd(navLevel === 'MATRIZES_OVERVIEW' ? 'MATRIZ' : 'FILIAL')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{navLevel === 'MATRIZES_OVERVIEW' ? 'Nova Matriz' : 'Nova Filial'}</span>
            </button>
          )}
        </div>
      </div>

      {/* LEVEL 1: VISÃO GERAL DE MATRIZES */}
      {navLevel === 'MATRIZES_OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredMatrices.map((mat) => {
              const filiaisCount = branches.filter(
                (b) => b.tipo === 'FILIAL' && (b.matrizVinculadaId === mat.id || (!b.matrizVinculadaId && mat.idOriginal === 'MATRIZ'))
              ).length;

              return (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 uppercase tracking-wide flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Matriz Corporativa</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{mat.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {mat.nomeFantasia}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        CNPJ: {mat.cnpj} • Código: {mat.idOriginal}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{mat.endereco} — {mat.municipio}/{mat.uf}</span>
                      </div>
                      {mat.responsavelLocal && (
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">Responsável: {mat.responsavelLocal}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-600">
                      <b className="text-slate-900 font-bold">{filiaisCount}</b> filiais vinculadas
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatrixId(mat.id);
                          setNavLevel('FILIAIS_LIST');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Visualizar Filiais</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {permissions.podeEditarFiliais && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mat)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Editar dados da matriz"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link to see all branches */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setNavLevel('ALL_UNITS')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 underline cursor-pointer"
            >
              Ou visualizar todas as {totalCount} unidades da rede Mark Security em tabela única
            </button>
          </div>
        </div>
      )}

      {/* LEVEL 2: LISTAGEM DE FILIAIS VINCULADAS */}
      {(navLevel === 'FILIAIS_LIST' || navLevel === 'ALL_UNITS') && (
        <div className="space-y-4">
          {/* Status Counters Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Todas */}
            <button
              type="button"
              onClick={() => setFilterOptions((p) => ({ ...p, status: 'TODAS' }))}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterOptions.status === 'TODAS'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold opacity-70">Filiais Vinculadas</div>
                <div className="text-lg font-black">{activeBranchList.length}</div>
              </div>
              <Building2 className={`w-5 h-5 ${filterOptions.status === 'TODAS' ? 'text-blue-400' : 'text-slate-400'}`} />
            </button>

            {/* Ativas */}
            <button
              type="button"
              onClick={() => setFilterOptions((p) => ({ ...p, status: 'ATIVAS' }))}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterOptions.status === 'ATIVAS'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Filiais Ativas</span>
                </div>
                <div className="text-lg font-black text-emerald-800">
                  {activeBranchList.filter((b) => b.status === 'ativa').length}
                </div>
              </div>
              <span className="text-sm">🟢</span>
            </button>

            {/* Inativas */}
            <button
              type="button"
              onClick={() => setFilterOptions((p) => ({ ...p, status: 'INATIVAS' }))}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterOptions.status === 'INATIVAS'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-white hover:bg-rose-50/40 text-slate-800 border-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Filiais Inativas</span>
                </div>
                <div className="text-lg font-black text-rose-800">
                  {activeBranchList.filter((b) => b.status === 'inativa').length}
                </div>
              </div>
              <span className="text-sm">🔴</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterOptions.busca}
                onChange={(e) => setFilterOptions((p) => ({ ...p, busca: e.target.value }))}
                placeholder="Buscar por nome fantasia, CNPJ ou código..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <select
                value={filterOptions.municipio}
                onChange={(e) => setFilterOptions((p) => ({ ...p, municipio: e.target.value }))}
                className="flex-1 sm:flex-initial px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 max-w-full"
              >
                <option value="">Todas as Cidades</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterOptions.uf}
                onChange={(e) => setFilterOptions((p) => ({ ...p, uf: e.target.value }))}
                className="w-24 sm:w-auto px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">UF</option>
                {uniqueUfs.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              {(filterOptions.busca || filterOptions.municipio || filterOptions.uf || filterOptions.status !== 'TODAS') && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Limpar Filtros"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile View: High-efficiency, touch-friendly store cards */}
          <div className="block sm:hidden space-y-2.5">
            {displayedBranches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                Nenhuma filial encontrada para os filtros aplicados.
              </div>
            ) : (
              displayedBranches.map((branch) => {
                const isSelected = selectedBranchForActions?.id === branch.id;
                const isInactive = branch.status === 'inativa';

                return (
                  <div
                    key={branch.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                        : isInactive
                        ? 'bg-slate-50/70 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                          {branch.idOriginal}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {branch.nomeFantasia}
                        </h4>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          branch.status === 'ativa'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span>{branch.status === 'ativa' ? '🟢' : '🔴'}</span>
                        <span>{branch.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-400">CNPJ:</span>
                        <span>{branch.cnpj}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branch.endereco} — {branch.municipio}/{branch.uf}</span>
                      </div>
                      {branch.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{branch.telefone}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Touch Actions (Min height 40px for mobile thumb tap) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBranchForActions(branch);
                          setActionsActiveTab('ATENDIMENTOS');
                        }}
                        className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Atendimentos / OS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenChecklistForBranch(branch)}
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-amber-50 active:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        title="Abrir checklist"
                      >
                        <ClipboardList className="w-4 h-4 text-amber-700" />
                        <span>Checklist</span>
                      </button>

                      {permissions.podeEditarFiliais && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(branch)}
                          className="min-h-[42px] min-w-[42px] p-2 rounded-xl border border-slate-200 text-slate-600 active:bg-slate-100 flex items-center justify-center cursor-pointer"
                          title="Editar dados cadastrais"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table of Branches */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-14 text-center">ID</th>
                    <th className="py-3 px-3">Nome Fantasia da Unidade</th>
                    <th className="py-3 px-3">CNPJ</th>
                    <th className="py-3 px-3">Município / UF</th>
                    <th className="py-3 px-3 hidden md:table-cell">Telefone</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBranches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma filial encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    displayedBranches.map((branch) => {
                      const isSelected = selectedBranchForActions?.id === branch.id;
                      const isInactive = branch.status === 'inativa';

                      return (
                        <tr
                          key={branch.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            isSelected ? 'bg-blue-50/70' : isInactive ? 'bg-slate-50/60 opacity-80' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-500">
                            {branch.idOriginal}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{branch.nomeFantasia}</span>
                              {branch.tipo === 'MATRIZ' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                                  Matriz
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {branch.endereco}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                            {branch.cnpj}
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            {branch.municipio}/{branch.uf}
                          </td>

                          <td className="py-3 px-3 text-slate-500 hidden md:table-cell">
                            {branch.telefone || '—'}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                branch.status === 'ativa'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span>{branch.status === 'ativa' ? '🟢' : '🔴'}</span>
                              <span>{branch.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Direct Consultar/Abrir Atendimentos (Requirement 3) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBranchForActions(branch);
                                  setActionsActiveTab('ATENDIMENTOS');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Consultar ou abrir atendimentos da filial"
                              >
                                <Wrench className="w-3 h-3 text-blue-600" />
                                <span>Atendimentos</span>
                              </button>

                              {/* Checklist */}
                              <button
                                type="button"
                                onClick={() => onOpenChecklistForBranch(branch)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                                title="Abrir checklist da unidade"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                              </button>

                              {/* Editar */}
                              {permissions.podeEditarFiliais && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(branch)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                                  title="Editar dados cadastrais"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Ativar/Inativar */}
                              {permissions.podeInativarFiliais && branch.tipo !== 'MATRIZ' && (
                                <button
                                  type="button"
                                  onClick={() => setBranchToToggle(branch)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    branch.status === 'ativa'
                                      ? 'text-rose-500 hover:bg-rose-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={branch.status === 'ativa' ? 'Inativar unidade' : 'Ativar unidade'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3: MODAL / PAINEL DA FILIAL SELECIONADA (CONSULTAR OU ABRIR ATENDIMENTOS) */}
      {selectedBranchForActions && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {selectedBranchForActions.nomeFantasia}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedBranchForActions.status === 'ativa'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedBranchForActions.status === 'ativa' ? '🟢 Ativa' : '🔴 Inativa'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                  Código: {selectedBranchForActions.idOriginal} • CNPJ: {selectedBranchForActions.cnpj} • {selectedBranchForActions.municipio}/{selectedBranchForActions.uf}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBranchForActions(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 overflow-x-auto bg-white">
              <button
                type="button"
                onClick={() => setActionsActiveTab('ATENDIMENTOS')}
                className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  actionsActiveTab === 'ATENDIMENTOS'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Atendimentos / OS ({branchOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActionsActiveTab('CHECKLISTS')}
                className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  actionsActiveTab === 'CHECKLISTS'
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Checklists ({branchChecklistsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActionsActiveTab('HISTORICO')}
                className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  actionsActiveTab === 'HISTORICO'
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Auditoria ({branchAuditLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActionsActiveTab('DADOS')}
                className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  actionsActiveTab === 'DADOS'
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Ficha Cadastral</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
              {/* TAB 1: ATENDIMENTOS E ORDENS DE SERVIÇO */}
              {actionsActiveTab === 'ATENDIMENTOS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Ordens de serviço de manutenção, suporte e reparo vinculadas a esta unidade.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenServiceOrderForBranch) {
                          onOpenServiceOrderForBranch(selectedBranchForActions);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Abrir Novo Atendimento / OS</span>
                    </button>
                  </div>

                  {branchOrders.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      Nenhuma ordem de serviço aberta para esta filial até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {branchOrders.map((os) => (
                        <div
                          key={os.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {os.numeroOs}
                              </span>
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                {os.identificacao || 'Atendimento Geral'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 truncate">
                              Defeito: {os.defeitoRelatado || 'Não especificado'} • Técnico: {os.tecnicoResponsavel}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                os.status === 'CONCLUIDA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : os.status === 'EM_ANDAMENTO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {os.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CHECKLISTS */}
              {actionsActiveTab === 'CHECKLISTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Vistorias e conformidades preenchidas para esta filial.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenChecklistForBranch(selectedBranchForActions);
                        setSelectedBranchForActions(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Preencher Checklist</span>
                    </button>
                  </div>

                  {branchChecklistsList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      Nenhum checklist registrado para esta filial.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {branchChecklistsList.map((chk) => (
                        <div
                          key={chk.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">{chk.nome}</div>
                            <div className="text-[11px] text-slate-500">
                              Responsável: {chk.responsavelNome} • Atualizado em {new Date(chk.dataAtualizacao).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              chk.status === 'CONCLUIDO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {chk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HISTORICO */}
              {actionsActiveTab === 'HISTORICO' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Registro de modificações cadastrais e alterações de status desta filial.
                  </p>

                  {branchAuditLogs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      Nenhum histórico registrado para esta unidade.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {branchAuditLogs.map((l) => (
                        <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-bold text-slate-900">{l.acao}</span>
                            <span className="text-[11px] text-slate-400">{new Date(l.dataHora).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-slate-600">{l.detalhes}</p>
                          {l.motivo && (
                            <p className="text-[11px] text-slate-500 italic">Motivo: {l.motivo}</p>
                          )}
                          <div className="text-[10px] text-slate-400">Usuário: {l.usuarioNome}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FICHA CADASTRAL */}
              {actionsActiveTab === 'DADOS' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Razão Social</span>
                      <span className="font-semibold text-slate-800">{selectedBranchForActions.razaoSocial}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Nome Fantasia</span>
                      <span className="font-bold text-slate-900">{selectedBranchForActions.nomeFantasia}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">CNPJ</span>
                      <span className="font-mono text-slate-800">{selectedBranchForActions.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">CEP</span>
                      <span className="text-slate-800">{selectedBranchForActions.cep}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Endereço</span>
                      <span className="text-slate-800">{selectedBranchForActions.endereco} — {selectedBranchForActions.municipio}/{selectedBranchForActions.uf}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Telefone</span>
                      <span className="text-slate-800">{selectedBranchForActions.telefone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsável Local</span>
                      <span className="text-slate-800">{selectedBranchForActions.responsavelLocal || '—'}</span>
                    </div>
                  </div>

                  {permissions.podeEditarFiliais && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEdit(selectedBranchForActions);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Cadastro Completo</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR UNIDADE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{formData.tipo === 'MATRIZ' ? 'Cadastrar Nova Matriz' : 'Cadastrar Nova Filial'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Unidade
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value as BranchType }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FILIAL">Filial</option>
                    <option value="MATRIZ">Matriz Corporativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / ID da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.idOriginal}
                    onChange={(e) => setFormData((p) => ({ ...p, idOriginal: e.target.value }))}
                    placeholder="Ex: 45 ou CD-02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {formData.tipo === 'FILIAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matriz Vinculada
                  </label>
                  <select
                    value={formData.matrizVinculadaId || currentMatrix?.id}
                    onChange={(e) => setFormData((p) => ({ ...p, matrizVinculadaId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {registeredMatrices.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nomeFantasia} ({m.municipio}/{m.uf})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia (Exclusivamente o nome da unidade)
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData((p) => ({ ...p, nomeFantasia: e.target.value }))}
                  placeholder="Ex: Mark Security — Loja 44 Campinas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social (Mantida separada do nome fantasia)
                </label>
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData((p) => ({ ...p, razaoSocial: e.target.value }))}
                  placeholder="Ex: Mark Security Tecnologia e Operações Ltda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ (Identificador Principal Único)
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData((p) => ({ ...p, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 4000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Município
                  </label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => setFormData((p) => ({ ...p, municipio: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.uf}
                    onChange={(e) => setFormData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-center uppercase focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as BranchStatus }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ativa">Ativa (🟢 Operação Normal)</option>
                  <option value="inativa">Inativa (🔴 Desativada / Reforma)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  Cadastrar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR UNIDADE */}
      {branchToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Editar Unidade — {branchToEdit.nomeFantasia}</span>
              </h3>
              <button
                type="button"
                onClick={() => setBranchToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / ID da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.idOriginal}
                    onChange={(e) => setFormData((p) => ({ ...p, idOriginal: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Unidade
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as BranchStatus }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ativa">Ativa (🟢)</option>
                    <option value="inativa">Inativa (🔴)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData((p) => ({ ...p, nomeFantasia: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData((p) => ({ ...p, razaoSocial: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData((p) => ({ ...p, cnpj: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Município
                  </label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => setFormData((p) => ({ ...p, municipio: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.uf}
                    onChange={(e) => setFormData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-center uppercase focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBranchToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ATIVAR / INATIVAR FILIAL (COM JUSTIFICATIVA OBRIGATÓRIA) */}
      {branchToToggle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  branchToToggle.status === 'ativa'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {branchToToggle.status === 'ativa' ? 'Inativar Filial' : 'Reativar Filial'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unidade: <b>{branchToToggle.nomeFantasia}</b> (ID: {branchToToggle.idOriginal})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {branchToToggle.status === 'ativa'
                ? 'A unidade será sinalizada como inativa (🔴), mas permanecerá disponível no histórico e consultas. Nunca é excluída do sistema.'
                : 'A unidade voltará a operar normalmente (🟢) e estará habilitada para novas rotinas e chamados.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo da Alteração (Obrigatório para Auditoria)
              </label>
              <textarea
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                placeholder="Ex: Reforma predial temporária, encerramento de ponto ou reativação operacional..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBranchToToggle(null);
                  setToggleReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!toggleReason.trim()}
                onClick={handleConfirmToggle}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  branchToToggle.status === 'ativa'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Confirmar {branchToToggle.status === 'ativa' ? 'Inativação' : 'Reativação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
