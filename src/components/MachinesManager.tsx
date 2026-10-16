import React, { useState, useMemo } from 'react';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useBranches } from '../context/BranchContext';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';
import {
  Equipment,
  EquipmentStatus,
  EQUIPMENT_STATUS_LABELS,
  LOCATION_LABELS,
} from '../types/equipment';
import { MachineType } from '../types/checklist';
import { EquipmentModal } from './EquipmentModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { ConfirmModal } from './ConfirmModal';
import { formatDateBR, formatDateTimeBR } from '../utils/dateFormatter';
import {
  Monitor,
  Laptop,
  Store,
  Building2,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Wrench,
  ClipboardCheck,
  Eye,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  HardDrive,
  ExternalLink,
  Shield,
  Download,
  Terminal,
  Activity,
  FolderOpen,
  Hash,
} from 'lucide-react';

interface MachinesManagerProps {
  onStartChecklistForMachine: (machineData: {
    identificacao: string;
    loja: string;
    tecnico: string;
    tipo: MachineType;
  }) => void;
  onOpenServiceOrderForMachine: (equipment: Equipment) => void;
}

export const MachinesManager: React.FC<MachinesManagerProps> = ({
  onStartChecklistForMachine,
  onOpenServiceOrderForMachine,
}) => {
  const {
    equipments,
    stats,
    updateEquipment,
    deleteEquipment,
    exportAllDataJSON,
    movements,
    hardwareChanges,
    addMovement,
  } = useEquipment();

  const { orders } = useServiceOrders();
  const { checklists } = useBranchChecklists();
  const { branches } = useBranches();
  const { addAuditLog } = useAudit();
  const { user, permissions } = useAuth();

  // Navigation: 'STORES_OVERVIEW' | 'STORE_MACHINES'
  const [currentView, setCurrentView] = useState<'STORES_OVERVIEW' | 'STORE_MACHINES'>('STORES_OVERVIEW');
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<Equipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Transfer modal
  const [equipmentToTransfer, setEquipmentToTransfer] = useState<Equipment | null>(null);
  const [transferTargetStore, setTransferTargetStore] = useState('');
  const [transferTargetSector, setTransferTargetSector] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy helper with visual feedback
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group machines by store
  const storeMachineSummary = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        storeName: string;
        total: number;
        operacionais: number;
        manutencao: number;
        desativadas: number;
        filiais: Set<string>;
      }
    > = {};

    equipments.forEach((eq) => {
      const store = eq.lojaOrigem || eq.lojaNome || 'Matriz / Loja 01';
      if (!summaryMap[store]) {
        summaryMap[store] = {
          storeName: store,
          total: 0,
          operacionais: 0,
          manutencao: 0,
          desativadas: 0,
          filiais: new Set(),
        };
      }

      summaryMap[store].total += 1;
      if (eq.status === 'EM_USO') {
        summaryMap[store].operacionais += 1;
      } else if (
        eq.status === 'EM_MANUTENCAO' ||
        eq.status === 'AGUARDANDO_MANUTENCAO' ||
        eq.status === 'DISPONIVEL_RETIRADA' ||
        eq.status === 'RETIRADO'
      ) {
        summaryMap[store].manutencao += 1;
      } else if (eq.status === 'DESATIVADO') {
        summaryMap[store].desativadas += 1;
      }

      if (eq.filialNome) {
        summaryMap[store].filiais.add(eq.filialNome);
      }
    });

    return Object.values(summaryMap).sort((a, b) => b.total - a.total);
  }, [equipments]);

  // Overall KPIs
  const globalKpis = useMemo(() => {
    const total = equipments.length;
    const operacionais = equipments.filter((e) => e.status === 'EM_USO').length;
    const manutencao = equipments.filter(
      (e) =>
        e.status === 'EM_MANUTENCAO' ||
        e.status === 'AGUARDANDO_MANUTENCAO' ||
        e.status === 'DISPONIVEL_RETIRADA' ||
        e.status === 'RETIRADO'
    ).length;
    const desativadas = equipments.filter((e) => e.status === 'DESATIVADO').length;

    return { total, operacionais, manutencao, desativadas };
  }, [equipments]);

  // Filtered equipments for Store View or Global Search
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      // If store view is active, match the store
      if (currentView === 'STORE_MACHINES' && selectedStoreName) {
        const eqStore = eq.lojaOrigem || eq.lojaNome || 'Matriz / Loja 01';
        if (eqStore !== selectedStoreName) return false;
      }

      // Filter by status
      if (filterStatus !== 'ALL' && eq.status !== filterStatus) return false;

      // Filter by type
      if (filterType !== 'ALL' && eq.tipo !== filterType) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = eq.nome.toLowerCase().includes(term);
        const matchesPatrimonio = eq.patrimonio.toLowerCase().includes(term);
        const matchesSerial = eq.numeroSerie?.toLowerCase().includes(term) ?? false;
        const matchesAnydesk = eq.anydeskId?.toLowerCase().includes(term) ?? false;
        const matchesTeamviewer = eq.teamviewerId?.toLowerCase().includes(term) ?? false;
        const matchesStore =
          eq.lojaOrigem?.toLowerCase().includes(term) ||
          eq.lojaNome?.toLowerCase().includes(term) ||
          false;
        const matchesFilial = eq.filialNome?.toLowerCase().includes(term) ?? false;
        const matchesWindows = eq.nomeWindows?.toLowerCase().includes(term) ?? false;
        const matchesSetor = eq.setor?.toLowerCase().includes(term) ?? false;

        return (
          matchesName ||
          matchesPatrimonio ||
          matchesSerial ||
          matchesAnydesk ||
          matchesTeamviewer ||
          matchesStore ||
          matchesFilial ||
          matchesWindows ||
          matchesSetor
        );
      }

      return true;
    });
  }, [equipments, currentView, selectedStoreName, filterStatus, filterType, searchTerm]);

  // Group machines in current store by Filial & Sector
  const groupedStoreMachines = useMemo(() => {
    const groups: Record<
      string,
      {
        filial: string;
        machines: Equipment[];
      }
    > = {};

    filteredEquipments.forEach((eq) => {
      const filialKey = eq.filialNome || eq.lojaOrigem || eq.lojaNome || 'Unidade Principal';
      if (!groups[filialKey]) {
        groups[filialKey] = {
          filial: filialKey,
          machines: [],
        };
      }
      groups[filialKey].machines.push(eq);
    });

    return Object.values(groups);
  }, [filteredEquipments]);

  // Handle transfer submit
  const handleExecuteTransfer = () => {
    if (!equipmentToTransfer || !transferTargetStore.trim()) return;

    const oldStore = equipmentToTransfer.lojaOrigem || equipmentToTransfer.lojaNome || 'Não informada';
    const oldSector = equipmentToTransfer.setor || 'Não informado';

    updateEquipment(equipmentToTransfer.id, {
      lojaOrigem: transferTargetStore.trim(),
      lojaNome: transferTargetStore.trim(),
      setor: transferTargetSector.trim() || oldSector,
      updatedAt: new Date().toISOString(),
    });

    // Register movement
    addMovement({
      equipamentoId: equipmentToTransfer.id,
      equipamentoNome: equipmentToTransfer.nome,
      patrimonio: equipmentToTransfer.patrimonio,
      dataHoraEntrada: new Date().toISOString().substring(0, 16),
      lojaOrigem: oldStore,
      destino: `${transferTargetStore.trim()}${transferTargetSector ? ` — Setor: ${transferTargetSector.trim()}` : ''}`,
      responsavelEntrega: user?.nome || 'Técnico TI',
      tecnicoResponsavel: user?.nome || 'Técnico TI',
      motivoEnvio: `Transferência de Unidade: de ${oldStore} (${oldSector}) para ${transferTargetStore.trim()} (${transferTargetSector || 'Setor padrão'})`,
      problemaRelatado: transferReason || 'Remanejamento de patrimônio entre lojas',
      resultadoAtendimento: 'CONCLUIDO_SUCESSO',
      observacoes: `Transferido por ${user?.nome || 'Administrador'}. Motivo: ${transferReason || 'Operacional'}`,
    });

    addAuditLog({
      tipoRegistro: 'CONFIGURACAO',
      acao: 'EDICAO',
      usuarioId: user?.id || 'admin',
      usuarioNome: user?.nome || 'Administrador',
      unidadeNome: transferTargetStore.trim(),
      campoModificado: 'lojaOrigem',
      valorAnterior: oldStore,
      valorNovo: transferTargetStore.trim(),
      motivo: transferReason || 'Transferência de Equipamento entre Lojas',
      detalhes: `Equipamento ${equipmentToTransfer.nome} (${equipmentToTransfer.patrimonio}) transferido de ${oldStore} (${oldSector}) para ${transferTargetStore.trim()} (${transferTargetSector || 'Setor padrão'})`,
    });

    setEquipmentToTransfer(null);
    setTransferTargetStore('');
    setTransferTargetSector('');
    setTransferReason('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Title */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Monitor className="w-4 h-4 text-blue-600" />
            <span>Módulo Independente — Requisito 14</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Máquinas, Patrimônio & Acesso Remoto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Controle individual de cada máquina da empresa, identificação por loja e filial, fichas técnicas completas,
            IDs de AnyDesk/TeamViewer integrados e histórico de manutenção.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={exportAllDataJSON}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
            title="Exportar inventário completo em JSON"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEquipmentToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Máquina</span>
          </button>
        </div>
      </div>

      {/* Global KPIs Cards (Requisito 14.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Cadastradas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{globalKpis.total}</div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Equipamentos no Firestore</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700">Operacionais</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{globalKpis.operacionais}</div>
          <span className="text-[10px] sm:text-xs text-emerald-600/80 font-medium">Em produção nas lojas</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700">Em Manutenção</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">{globalKpis.manutencao}</div>
          <span className="text-[10px] sm:text-xs text-amber-600/80 font-medium">Bancada ou aguardando</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600">Desativadas</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-700">{globalKpis.desativadas}</div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Baixadas ou substituídas</span>
        </div>
      </div>

      {/* Filter and Search Bar (Responsive Mobile) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por Loja, Máquina, Caixa, Patrimônio, Serial ou AnyDesk..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 min-h-[42px] cursor-pointer"
            >
              <option value="ALL">Status: Todos</option>
              <option value="EM_USO">Operacional (Em Uso)</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="AGUARDANDO_MANUTENCAO">Aguardando Manutenção</option>
              <option value="DISPONIVEL_RETIRADA">Disponível Retirada</option>
              <option value="DESATIVADO">Desativado / Sucata</option>
            </select>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tipo: Todos</option>
            <option value="PDV">PDV (Caixa)</option>
            <option value="COMPUTADOR">Computador ADM</option>
            <option value="NOTEBOOK">Notebook</option>
            <option value="SERVIDOR">Servidor</option>
            <option value="BALANCA">Balança</option>
            <option value="IMPRESSORA">Impressora</option>
            <option value="DVR">DVR / Câmeras</option>
            <option value="SWITCH">Switch de Rede</option>
            <option value="ROTEADOR">Roteador</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Tela Inicial — Visão Geral das Máquinas por Loja (Requisito 14.1) */}
      {currentView === 'STORES_OVERVIEW' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span>Visão Geral das Máquinas por Loja</span>
              </h2>
              <p className="text-xs text-slate-500">
                Selecione uma loja para gerenciar os caixas, computadores e periféricos vinculados a ela.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {storeMachineSummary.length} {storeMachineSummary.length === 1 ? 'Loja com equipamentos' : 'Lojas com equipamentos'}
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Loja / Unidade</th>
                  <th className="py-3 px-3 text-center">Máquinas Cadastradas</th>
                  <th className="py-3 px-3 text-center">Operacionais</th>
                  <th className="py-3 px-3 text-center">Em Manutenção</th>
                  <th className="py-3 px-3 text-center">Desativadas</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {storeMachineSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Store className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Nenhuma loja com equipamentos cadastrados.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEquipmentToEdit(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cadastrar Primeiro Equipamento
                      </button>
                    </td>
                  </tr>
                ) : (
                  storeMachineSummary.map((item) => (
                    <tr
                      key={item.storeName}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedStoreName(item.storeName);
                        setCurrentView('STORE_MACHINES');
                      }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {item.storeName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span>Filiais detectadas:</span>
                              <span className="font-semibold text-slate-700">
                                {item.filiais.size > 0 ? Array.from(item.filiais).join(', ') : 'Matriz principal'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                          {item.total}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.operacionais}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.manutencao}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                          {item.desativadas}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStoreName(item.storeName);
                            setCurrentView('STORE_MACHINES');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Ver máquinas</span>
                          <span className="text-xs">→</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Requisito 14.5 & Responsividade Mobile) */}
          <div className="block md:hidden space-y-3">
            {storeMachineSummary.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                Nenhuma loja com equipamentos cadastrados.
              </div>
            ) : (
              storeMachineSummary.map((item) => (
                <div
                  key={item.storeName}
                  onClick={() => {
                    setSelectedStoreName(item.storeName);
                    setCurrentView('STORE_MACHINES');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{item.storeName}</h3>
                        <p className="text-[11px] text-slate-500">
                          {item.filiais.size > 0 ? Array.from(item.filiais)[0] : 'Matriz'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg shrink-0">
                      {item.total} {item.total === 1 ? 'máquina' : 'máquinas'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50/80 p-2 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Operacionais</span>
                      <span className="font-bold text-emerald-700">{item.operacionais}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Manutenção</span>
                      <span className="font-bold text-amber-700">{item.manutencao}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Desativadas</span>
                      <span className="font-bold text-slate-600">{item.desativadas}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer"
                  >
                    <span>Ver Máquinas desta Loja</span>
                    <span>→</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Tela da Loja — Máquinas Cadastradas (Requisito 14.2) */}
      {currentView === 'STORE_MACHINES' && (
        <div className="space-y-4">
          {/* Breadcrumb / Return Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('STORES_OVERVIEW');
                  setSelectedStoreName(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Todas as Lojas</span>
              </button>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Loja Selecionada
                </span>
                <h2 className="text-base font-black text-slate-900 truncate max-w-[260px] sm:max-w-md">
                  {selectedStoreName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEquipmentToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer min-h-[40px] shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Máquina nesta Loja</span>
              </button>
            </div>
          </div>

          {/* Grouped machines by Filial and Section */}
          {groupedStoreMachines.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Monitor className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
              <h3 className="font-bold text-slate-700 text-sm">Nenhuma máquina encontrada para esta loja.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Verifique os filtros selecionados ou cadastre a primeira máquina para vincular a esta unidade.
              </p>
            </div>
          ) : (
            groupedStoreMachines.map((group) => (
              <div key={group.filial} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">{group.filial}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {group.machines.length} {group.machines.length === 1 ? 'equipamento' : 'equipamentos'}
                  </span>
                </div>

                {/* Machine Cards Grid (Clean, responsive & touch-friendly) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.machines.map((machine) => {
                    const statusConfig = EQUIPMENT_STATUS_LABELS[machine.status] || {
                      label: machine.status,
                      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
                      dotColor: 'bg-slate-500',
                    };

                    const isAnydesk = machine.anydeskId && machine.anydeskId.trim().length > 0;
                    const isTeamviewer = machine.teamviewerId && machine.teamviewerId.trim().length > 0;

                    return (
                      <div
                        key={machine.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 space-y-3 flex flex-col justify-between"
                      >
                        {/* Top: Icon, Identity, Status */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  machine.tipo === 'PDV'
                                    ? 'bg-blue-100 text-blue-700'
                                    : machine.tipo === 'SERVIDOR'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {machine.tipo === 'PDV' ? (
                                  <Store className="w-5 h-5" />
                                ) : machine.tipo === 'SERVIDOR' ? (
                                  <Activity className="w-5 h-5" />
                                ) : (
                                  <Laptop className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{machine.nome}</h4>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <span className="font-bold text-blue-700">{machine.patrimonio}</span>
                                  {machine.numeroSerie && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[100px]">{machine.numeroSerie}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${statusConfig.badgeBg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Machine Sector / Position (Requisito 14.2 & 14.5) */}
                          <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Posição / Setor</span>
                              <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]">
                                {machine.numeroCaixa || machine.posicaoCaixa || machine.setor || 'Frente de Caixa'}
                              </span>
                            </div>

                            {machine.nomeWindows && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Hostname</span>
                                <span className="font-mono text-slate-700 font-medium truncate max-w-[170px]">
                                  {machine.nomeWindows}
                                </span>
                              </div>
                            )}

                            {/* Remote Access Widget (Requisito 14.3 C & 14.4) */}
                            <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-red-500" />
                                <span>AnyDesk:</span>
                              </span>

                              {isAnydesk ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                    {machine.anydeskId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(machine.anydeskId!, machine.id)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Copiar ID AnyDesk"
                                  >
                                    {copiedId === machine.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Não configurado</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Buttons (Requisito 14.5) */}
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedEquipmentForDetail(machine)}
                            className="w-full py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Ver Ficha</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenServiceOrderForMachine(machine)}
                            className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px] shadow-2xs"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Abrir OS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onStartChecklistForMachine({
                                identificacao: machine.nome,
                                loja: machine.lojaOrigem || machine.lojaNome || 'Loja',
                                tecnico: user?.nome || 'Técnico',
                                tipo: (machine.tipo === 'PDV' ? 'PDV' : 'COMPUTADOR') as MachineType,
                              })
                            }
                            className="w-full py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px] border border-amber-200"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Checklist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEquipmentToTransfer(machine)}
                            className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px] border border-slate-200"
                            title="Transferir máquina para outra loja"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Transferir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Ficha Completa do Patrimônio (Requisito 14.3) */}
      {selectedEquipmentForDetail && (
        <EquipmentDetailModal
          equipment={selectedEquipmentForDetail}
          isOpen={Boolean(selectedEquipmentForDetail)}
          onClose={() => setSelectedEquipmentForDetail(null)}
          onEditEquipment={(eq) => {
            setSelectedEquipmentForDetail(null);
            setEquipmentToEdit(eq);
            setIsModalOpen(true);
          }}
          onStartChecklist={onStartChecklistForMachine}
          onNewServiceOrder={onOpenServiceOrderForMachine}
        />
      )}

      {/* MODAL 2: Cadastro / Edição de Equipamento */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEquipmentToEdit(null);
        }}
        equipmentToEdit={equipmentToEdit}
      />

      {/* MODAL 3: Transferência de Equipamento entre Lojas (Requisito 14.2 & 14.4) */}
      {equipmentToTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Transferir Equipamento</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {equipmentToTransfer.nome} — {equipmentToTransfer.patrimonio}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEquipmentToTransfer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700">Loja Atual:</span>{' '}
              {equipmentToTransfer.lojaOrigem || equipmentToTransfer.lojaNome || 'Não informada'}
              <br />
              <span className="font-bold text-slate-700">Setor / Caixa Atual:</span>{' '}
              {equipmentToTransfer.posicaoCaixa || equipmentToTransfer.setor || 'Frente de Caixa'}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Loja / Unidade Destino *
                </label>
                <input
                  type="text"
                  list="stores-list-transfer"
                  value={transferTargetStore}
                  onChange={(e) => setTransferTargetStore(e.target.value)}
                  placeholder="Selecione ou digite o nome da loja..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                />
                <datalist id="stores-list-transfer">
                  {branches.map((b) => (
                    <option key={b.id} value={b.nomeFantasia} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Setor ou Número de Caixa
                </label>
                <input
                  type="text"
                  value={transferTargetSector}
                  onChange={(e) => setTransferTargetSector(e.target.value)}
                  placeholder="Ex: Caixa 03, Balcão Frios, Sala ADM"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Transferência
                </label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ex: Substituição temporária, remanejamento definitivo..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEquipmentToTransfer(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!transferTargetStore.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer min-h-[42px] shadow-xs"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
