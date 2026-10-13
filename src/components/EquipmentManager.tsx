import React, { useState } from 'react';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import {
  Equipment,
  EquipmentStatus,
  EQUIPMENT_STATUS_LABELS,
  LOCATION_LABELS,
} from '../types/equipment';
import { MachineType } from '../types/checklist';
import { EquipmentModal } from './EquipmentModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { formatDateBR, formatDateTimeBR, formatShortDateTimeBR, calculateDaysBetween } from '../utils/dateFormatter';
import {
  Laptop,
  Store,
  Plus,
  Search,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileDown,
  Filter,
  Layers,
  Calendar,
  Building2,
  HardDrive,
  Cpu,
  Eye,
  Trash2,
  Edit2,
  RotateCcw,
} from 'lucide-react';

interface EquipmentManagerProps {
  onStartChecklistForMachine: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
  onOpenServiceOrderForMachine: (equipment: Equipment) => void;
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  onStartChecklistForMachine,
  onOpenServiceOrderForMachine,
}) => {
  const {
    equipments,
    stats,
    deleteEquipment,
    exportAllDataJSON,
    movements,
  } = useEquipment();

  const { orders } = useServiceOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'ALL'>('ALL');
  const [filterStore, setFilterStore] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<Equipment | null>(null);

  // Unique list of stores for filter
  const storesList = Array.from(new Set(equipments.map((e) => e.lojaOrigem).filter(Boolean)));

  // Recurrent problem machines count (machines with 2 or more OSs or movements)
  const recurrentCount = equipments.filter((eq) => {
    const eqOrders = orders.filter((o) => o.equipamentoId === eq.id || o.identificacao === eq.nome);
    const eqMovements = movements.filter((m) => m.equipamentoId === eq.id);
    return eqOrders.length >= 2 || eqMovements.length >= 2;
  }).length;

  const openOrdersCount = orders.filter((o) => o.status === 'REPARO_ESCRITORIO').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'PRONTA' || o.status === 'EM_OPERACAO').length;

  // Filtered equipments
  const filteredEquipments = equipments.filter((eq) => {
    const matchesStatus = filterStatus === 'ALL' || eq.status === filterStatus;
    const matchesStore = filterStore === 'ALL' || eq.lojaOrigem === filterStore;
    const matchesType = filterType === 'ALL' || eq.tipo === filterType;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      eq.nome.toLowerCase().includes(term) ||
      eq.patrimonio.toLowerCase().includes(term) ||
      eq.numeroSerie.toLowerCase().includes(term) ||
      eq.lojaOrigem.toLowerCase().includes(term) ||
      eq.marcaModelo.toLowerCase().includes(term) ||
      (eq.tecnicoResponsavel && eq.tecnicoResponsavel.toLowerCase().includes(term));

    return matchesStatus && matchesStore && matchesType && matchesSearch;
  });

  const handleCreateNew = () => {
    setEquipmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (eq: Equipment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEquipmentToEdit(eq);
    setIsModalOpen(true);
  };

  const handleDelete = (eq: Equipment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o cadastro da máquina "${eq.nome}" (${eq.patrimonio})?`)) {
      deleteEquipment(eq.id);
      if (selectedEquipmentForDetail?.id === eq.id) {
        setSelectedEquipmentForDetail(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Objective Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div
          onClick={() => setFilterStatus('ALL')}
          className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all text-center"
        >
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Máquinas</span>
          <span className="text-xl font-black text-slate-900 block mt-0.5">{stats.totalEquipamentos}</span>
        </div>

        <div
          onClick={() => setFilterStatus('AGUARDANDO_MANUTENCAO')}
          className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all text-center ${
            filterStatus === 'AGUARDANDO_MANUTENCAO'
              ? 'bg-amber-500/15 border-amber-500'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-amber-700 block">Aguardando</span>
          <span className="text-xl font-black text-amber-800 block mt-0.5">{stats.aguardandoManutencao}</span>
        </div>

        <div
          onClick={() => setFilterStatus('EM_MANUTENCAO')}
          className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all text-center ${
            filterStatus === 'EM_MANUTENCAO'
              ? 'bg-orange-500/15 border-orange-500'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-orange-700 block">Em Manutenção</span>
          <span className="text-xl font-black text-orange-800 block mt-0.5">{stats.emManutencao}</span>
        </div>

        <div
          onClick={() => setFilterStatus('DISPONIVEL_RETIRADA')}
          className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all text-center ${
            filterStatus === 'DISPONIVEL_RETIRADA'
              ? 'bg-blue-500/15 border-blue-500'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-blue-700 block">P/ Retirada</span>
          <span className="text-xl font-black text-blue-800 block mt-0.5">{stats.disponivelRetirada}</span>
        </div>

        <div
          onClick={() => setFilterStatus('EM_USO')}
          className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all text-center ${
            filterStatus === 'EM_USO'
              ? 'bg-emerald-500/15 border-emerald-500'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Em Uso Loja</span>
          <span className="text-xl font-black text-emerald-800 block mt-0.5">{stats.emUso}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase text-blue-600 block">OS Abertas</span>
          <span className="text-xl font-black text-slate-800 block mt-0.5">{openOrdersCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Concluídas</span>
          <span className="text-xl font-black text-slate-800 block mt-0.5">{completedOrdersCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase text-red-600 block">Recorrentes</span>
          <span className="text-xl font-black text-red-700 block mt-0.5">{recurrentCount}</span>
        </div>
      </div>

      {/* Control Bar: Search & Action Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-600" />
              <span>Controle de Equipamentos & Patrimônio</span>
            </h2>
            <p className="text-xs text-slate-500">
              {filteredEquipments.length} de {equipments.length} máquinas exibidas. Clique em qualquer máquina para abrir a ficha completa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportAllDataJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Exportar inventário e histórico completo em JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Exportar Dados</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Equipamento
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, patrimônio, Service Tag, modelo ou técnico..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600 font-medium"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Status</option>
              <option value="EM_USO">Em Uso na Loja</option>
              <option value="AGUARDANDO_MANUTENCAO">Aguardando Manutenção</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="DISPONIVEL_RETIRADA">Disponível para Retirada</option>
              <option value="RETIRADO">Retirado / A Caminho</option>
              <option value="DESATIVADO">Desativado / Sucata</option>
            </select>
          </div>

          <div>
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Todas as Lojas</option>
              {storesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Tabela de Acompanhamento Padronizada */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Equipamento</th>
                <th className="py-3 px-3">Patrimônio</th>
                <th className="py-3 px-3">Número de Série</th>
                <th className="py-3 px-3">Loja</th>
                <th className="py-3 px-3">Última Entrada</th>
                <th className="py-3 px-3">Última Manutenção</th>
                <th className="py-3 px-3">Última Retirada</th>
                <th className="py-3 px-3">Status Atual</th>
                <th className="py-3 px-3">Técnico</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Laptop className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum equipamento encontrado com os filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                filteredEquipments.map((eq) => {
                  const statusInfo = EQUIPMENT_STATUS_LABELS[eq.status];
                  const isRetiradaPendente = eq.status === 'DISPONIVEL_RETIRADA';

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => setSelectedEquipmentForDetail(eq)}
                      className={`hover:bg-blue-50/60 transition-colors cursor-pointer group ${
                        isRetiradaPendente ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Equipamento */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              eq.tipo === 'PDV' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {eq.tipo === 'PDV' ? <Store className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                              {eq.nome}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {eq.marcaModelo || eq.tipo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Patrimônio */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {eq.patrimonio}
                      </td>

                      {/* Número de Série */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {eq.numeroSerie}
                      </td>

                      {/* Loja */}
                      <td className="py-3 px-3 font-semibold text-slate-800 truncate max-w-[140px]">
                        {eq.lojaOrigem}
                      </td>

                      {/* Última Entrada */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatShortDateTimeBR(eq.dataUltimaEntrada)}
                      </td>

                      {/* Última Manutenção */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatDateBR(eq.dataUltimaManutencao)}
                      </td>

                      {/* Última Retirada */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatShortDateTimeBR(eq.dataUltimaRetirada)}
                      </td>

                      {/* Status Atual */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusInfo.badgeBg} ${statusInfo.textBadge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Técnico Responsável */}
                      <td className="py-3 px-3 text-slate-700 truncate max-w-[110px]">
                        {eq.tecnicoResponsavel || '-'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedEquipmentForDetail(eq)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Abrir Ficha Completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleEdit(eq, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar Cadastro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(eq, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir Equipamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal de Criação / Edição do Equipamento */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipmentToEdit={equipmentToEdit}
      />

      {/* Modal da Ficha Completa do Equipamento (Dossiê) */}
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
    </div>
  );
};
