import React, { useState, useMemo } from 'react';
import { useBranches } from '../context/BranchContext';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';
import { BranchUnit, BranchStatus } from '../types/branch';
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
} from 'lucide-react';

interface BranchesManagerProps {
  onOpenChecklistForBranch: (branch: BranchUnit) => void;
  onOpenAuditForBranch: (branchId: string) => void;
}

export const BranchesManager: React.FC<BranchesManagerProps> = ({
  onOpenChecklistForBranch,
  onOpenAuditForBranch,
}) => {
  const {
    branches,
    filteredBranches,
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
    tipo: 'FILIAL' as 'MATRIZ' | 'FILIAL',
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

  // List of unique cities & UFs for filter dropdowns
  const uniqueCities = useMemo(() => {
    const set = new Set(branches.map((b) => b.municipio).filter(Boolean));
    return Array.from(set).sort();
  }, [branches]);

  const uniqueUfs = useMemo(() => {
    const set = new Set(branches.map((b) => b.uf).filter(Boolean));
    return Array.from(set).sort();
  }, [branches]);

  // Open add modal
  const handleOpenAdd = () => {
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      idOriginal: String(branches.length + 1).padStart(2, '0'),
      tipo: 'FILIAL',
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

  // Open edit modal
  const handleOpenEdit = (branch: BranchUnit) => {
    setFormError(null);
    setFormSuccess(null);
    setBranchToEdit(branch);
    setFormData({
      idOriginal: branch.idOriginal,
      tipo: branch.tipo,
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

  // Save Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.nomeFantasia.trim()) {
      setFormError('O Nome Fantasia é obrigatório e deve conter exclusivamente o nome fantasia.');
      return;
    }
    if (!formData.cnpj.trim()) {
      setFormError('O CNPJ é obrigatório como identificador principal para evitar duplicidades.');
      return;
    }

    const res = addBranch(formData);
    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.error || 'Erro ao cadastrar filial.');
    }
  };

  // Save Edit
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

    const res = updateBranch(branchToEdit.id, formData);
    if (res.success) {
      setBranchToEdit(null);
    } else {
      setFormError(res.error || 'Erro ao atualizar filial.');
    }
  };

  // Confirm Status Toggle (Ativar / Inativar)
  const handleConfirmToggle = () => {
    if (!branchToToggle) return;
    toggleBranchStatus(branchToToggle.id, toggleReason || undefined);
    setBranchToToggle(null);
    setToggleReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Matriz e Filiais Pata Negra
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
              {totalCount} unidades
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão cadastral centralizada da Matriz Corporativa e das filiais ativas e inativas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportBranchesToCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            title="Exportar dados para planilha Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV/Excel</span>
          </button>

          {permissions.podeCriarFiliais && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Filial</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Todas */}
        <button
          type="button"
          onClick={() => setFilterOptions((p) => ({ ...p, status: 'TODAS' }))}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            filterOptions.status === 'TODAS'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div>
            <div className="text-[11px] uppercase font-bold opacity-70">Todas as Unidades</div>
            <div className="text-xl font-black">{totalCount}</div>
          </div>
          <Building2 className={`w-6 h-6 ${filterOptions.status === 'TODAS' ? 'text-amber-400' : 'text-slate-400'}`} />
        </button>

        {/* Ativas */}
        <button
          type="button"
          onClick={() => setFilterOptions((p) => ({ ...p, status: 'ATIVAS' }))}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            filterOptions.status === 'ATIVAS'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div>
            <div className="text-[11px] uppercase font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unidades Ativas</span>
            </div>
            <div className="text-xl font-black text-emerald-800">{activeCount}</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            🟢
          </div>
        </button>

        {/* Inativas */}
        <button
          type="button"
          onClick={() => setFilterOptions((p) => ({ ...p, status: 'INATIVAS' }))}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            filterOptions.status === 'INATIVAS'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-white hover:bg-rose-50/40 text-slate-800 border-slate-200'
          }`}
        >
          <div>
            <div className="text-[11px] uppercase font-bold text-rose-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Unidades Inativas</span>
            </div>
            <div className="text-xl font-black text-rose-800">{inactiveCount}</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
            🔴
          </div>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterOptions.busca}
              onChange={(e) => setFilterOptions((p) => ({ ...p, busca: e.target.value }))}
              placeholder="Buscar por Nome Fantasia, CNPJ, Código (ex: 01, 43), Endereço..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {filterOptions.busca && (
              <button
                type="button"
                onClick={() => setFilterOptions((p) => ({ ...p, busca: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cidade */}
            <select
              value={filterOptions.municipio}
              onChange={(e) => setFilterOptions((p) => ({ ...p, municipio: e.target.value }))}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todos Municípios</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* UF */}
            <select
              value={filterOptions.uf}
              onChange={(e) => setFilterOptions((p) => ({ ...p, uf: e.target.value }))}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todas UFs</option>
              {uniqueUfs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>

            {/* Ordenação */}
            <select
              value={`${filterOptions.ordenarPor}_${filterOptions.ordemDirecao}`}
              onChange={(e) => {
                const [by, dir] = e.target.value.split('_');
                setFilterOptions((p) => ({
                  ...p,
                  ordenarPor: by as any,
                  ordemDirecao: dir as any,
                }));
              }}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="codigo_asc">Ordenar: Código (01 a 43)</option>
              <option value="nome_asc">Ordenar: Nome Fantasia (A-Z)</option>
              <option value="cidade_asc">Ordenar: Município (A-Z)</option>
              <option value="atualizacao_desc">Ordenar: Mais Recentes</option>
            </select>

            {(filterOptions.busca || filterOptions.municipio || filterOptions.uf || filterOptions.status !== 'TODAS') && (
              <button
                type="button"
                onClick={clearFilters}
                className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table: Matriz e Filiais (Requirement 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nome Fantasia</th>
                <th className="py-3 px-4">CNPJ</th>
                <th className="py-3 px-4">Município / UF</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Última Atualização</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma unidade encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isMatriz = branch.tipo === 'MATRIZ';
                  const isActive = branch.status === 'ativa';
                  const updatedDate = new Date(branch.atualizadoEm).toLocaleDateString('pt-BR');

                  return (
                    <tr
                      key={branch.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? 'bg-slate-50/40 text-slate-500' : ''
                      } ${isMatriz ? 'bg-amber-50/30 font-semibold' : ''}`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              isMatriz
                                ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-600'
                                : isActive
                                ? 'bg-slate-800 text-slate-100'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            {branch.idOriginal}
                          </span>
                          {isMatriz && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                              Matriz
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nome Fantasia */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span className={!isActive ? 'text-slate-600' : ''}>
                            {branch.nomeFantasia}
                          </span>
                          {branch.pendenteConferencia && (
                            <span className="text-[10px] text-amber-600 font-normal flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Pendente de conferência manual
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CNPJ */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {branch.cnpj}
                      </td>

                      {/* Município / UF */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {branch.municipio} / {branch.uf}
                          </span>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {branch.telefone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{branch.telefone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status (Discreet visual identification: green vs red indicator) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-rose-500'
                            }`}
                          />
                          <span>{isActive ? 'Ativa' : 'Inativa'}</span>
                        </span>
                      </td>

                      {/* Última Atualização */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {updatedDate}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Detalhes */}
                          <button
                            type="button"
                            onClick={() => setSelectedBranchForView(branch)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha Cadastral Completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Checklist Específico da Filial (Requirement 2) */}
                          <button
                            type="button"
                            onClick={() => onOpenChecklistForBranch(branch)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Abrir Checklist Desta Unidade"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>

                          {/* Histórico Individual de Modificações (Requirement 2) */}
                          <button
                            type="button"
                            onClick={() => setBranchHistoryModal(branch)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Histórico Individual de Modificações"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Editar Filial */}
                          {permissions.podeEditarFiliais && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(branch)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar Dados Cadastrais"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Ativar / Inativar (Preserva unidade sem excluir) */}
                          {permissions.podeInativarFiliais && (
                            <button
                              type="button"
                              onClick={() => {
                                setBranchToToggle(branch);
                                setToggleReason('');
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isActive
                                  ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={isActive ? 'Inativar Unidade' : 'Reativar Unidade'}
                            >
                              <Power className="w-4 h-4" />
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

      {/* MODAL 1: Ficha Detalhada da Unidade */}
      {selectedBranchForView && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedBranchForView.status === 'ativa'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedBranchForView.idOriginal}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedBranchForView.nomeFantasia}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{selectedBranchForView.tipo === 'MATRIZ' ? 'Matriz Corporativa' : 'Filial'}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedBranchForView.cnpj}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBranchForView(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                  Razão Social (Oficial)
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedBranchForView.razaoSocial}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                  Status Operacional
                </span>
                <span
                  className={`font-bold mt-0.5 inline-flex items-center gap-1.5 ${
                    selectedBranchForView.status === 'ativa' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedBranchForView.status === 'ativa' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {selectedBranchForView.status === 'ativa' ? 'Ativa (Em Operação)' : 'Inativa (Desativada)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                  Endereço Completo & Localização
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedBranchForView.endereco}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  CEP: {selectedBranchForView.cep} • {selectedBranchForView.municipio} - {selectedBranchForView.uf}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                  Telefone de Contato
                </span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {selectedBranchForView.telefone || 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                  Responsável Local
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedBranchForView.responsavelLocal || 'Não informado'}
                </span>
              </div>

              {selectedBranchForView.observacoes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                    Observações Operacionais
                  </span>
                  <p className="text-slate-700 mt-1 italic">
                    {selectedBranchForView.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const b = selectedBranchForView;
                  setSelectedBranchForView(null);
                  onOpenChecklistForBranch(b);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Abrir Checklists da Unidade</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranchForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Cadastrar / Editar Filial (Strict field rules) */}
      {(isAddModalOpen || branchToEdit) && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                {branchToEdit ? 'Editar Dados da Filial' : 'Cadastrar Nova Filial'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setBranchToEdit(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={branchToEdit ? handleSaveEdit : handleSaveAdd}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* ID da Empresa */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID da Empresa (Código Original) *
                  </label>
                  <input
                    type="text"
                    value={formData.idOriginal}
                    onChange={(e) => setFormData({ ...formData, idOriginal: e.target.value })}
                    placeholder="Ex: 01, 44..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Status da Unidade */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status da Unidade *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BranchStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ativa">🟢 Ativa (Em operação)</option>
                    <option value="inativa">🔴 Inativa (Desativada - Preservar dados)</option>
                  </select>
                </div>
              </div>

              {/* Nome Fantasia (Exclusivamente nome fantasia) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Fantasia (Exclusivamente o nome da unidade) *
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  placeholder="Ex: Pata Negra — Loja 44 Campinas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Regra: Não incluir CNPJ, endereço ou razão social dentro do nome fantasia.
                </span>
              </div>

              {/* Razão Social (Separada) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Razão Social (Pessoa Jurídica) *
                </label>
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  placeholder="Ex: Entreposto Pata Negra Comércio de Alimentos Ltda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* CNPJ (Identificador Principal contra duplicatas) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    CNPJ (Identificador Principal) *
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 4198-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Endereço, CEP, Município, UF */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua / Avenida, Número, Bairro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Município</label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    placeholder="Barueri"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setBranchToEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {branchToEdit ? 'Salvar Alterações' : 'Cadastrar Filial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmação de Ativação / Inativação com Motivo */}
      {branchToToggle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  branchToToggle.status === 'ativa'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {branchToToggle.status === 'ativa' ? 'Inativar Filial' : 'Reativar Filial'}
                </h3>
                <p className="text-xs text-slate-500">
                  {branchToToggle.nomeFantasia} (ID: {branchToToggle.idOriginal})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {branchToToggle.status === 'ativa'
                ? 'A unidade será marcada como INATIVA. Conforme as regras do sistema, ela NÃO será excluída e permanecerá disponível para consulta e histórico operacional.'
                : 'A unidade voltará a constar como ATIVA no painel operacional.'}
            </p>

            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">
                Motivo da Alteração (Obrigatório para Auditoria):
              </label>
              <input
                type="text"
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                placeholder="Ex: Reforma preventiva, encerramento de contrato, etc."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBranchToToggle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer ${
                  branchToToggle.status === 'ativa'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {branchToToggle.status === 'ativa' ? 'Confirmar Inativação' : 'Confirmar Reativação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Histórico Individual de Modificações da Filial (Requirement 2) */}
      {branchHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Histórico de Modificações — {branchHistoryModal.nomeFantasia}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {branchHistoryModal.idOriginal} • CNPJ: {branchHistoryModal.cnpj}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBranchHistoryModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logs filtrados para esta filial */}
            <div className="max-h-80 overflow-y-auto space-y-2.5 text-xs pr-1">
              {logs.filter((l) => l.unidadeId === branchHistoryModal.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Nenhuma modificação registrada até o momento para esta unidade.
                </div>
              ) : (
                logs
                  .filter((l) => l.unidadeId === branchHistoryModal.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px]">
                            {log.acao}
                          </span>
                          <span>{log.usuarioNome}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.dataHora).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {log.detalhes || `${log.campoModificado}: ${log.valorNovo}`}
                      </div>
                      {log.motivo && (
                        <div className="text-[11px] text-slate-500 italic">
                          Motivo: "{log.motivo}"
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBranchHistoryModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
