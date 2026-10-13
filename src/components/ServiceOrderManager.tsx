import React, { useState } from 'react';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { ServiceOrder, ServiceOrderStatus, STATUS_LABELS } from '../types/serviceOrder';
import { MachineType } from '../types/checklist';
import { ServiceOrderModal } from './ServiceOrderModal';
import { ServiceOrderPrintBadge } from './ServiceOrderPrintBadge';
import {
  Wrench,
  Package,
  CheckCircle2,
  Store,
  Laptop,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileDown,
  Layers,
  Clock,
  Send,
  RotateCcw,
} from 'lucide-react';

interface ServiceOrderManagerProps {
  onStartChecklistForMachine: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
}

export const ServiceOrderManager: React.FC<ServiceOrderManagerProps> = ({
  onStartChecklistForMachine,
}) => {
  const {
    orders,
    reparoCount,
    reservaCount,
    prontaCount,
    operacaoCount,
    totalCount,
    activeStatusFilter,
    setActiveStatusFilter,
    searchFilter,
    setSearchFilter,
    changeOrderStatus,
    deleteOrder,
    exportOrdersJSON,
  } = useServiceOrders();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatusFilter === 'ALL' || o.status === activeStatusFilter;
    const matchesType = filterType === 'ALL' || o.tipo === filterType;
    const term = searchFilter.toLowerCase();
    const matchesSearch =
      o.identificacao.toLowerCase().includes(term) ||
      o.numeroOs.toLowerCase().includes(term) ||
      o.lojaOrigem.toLowerCase().includes(term) ||
      (o.lojaDestino && o.lojaDestino.toLowerCase().includes(term)) ||
      o.tecnicoResponsavel.toLowerCase().includes(term) ||
      o.defeitoRelatado.toLowerCase().includes(term);

    return matchesStatus && matchesType && matchesSearch;
  });

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ServiceOrder) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Máquinas no Escritório para Reparo */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'REPARO_ESCRITORIO' ? 'ALL' : 'REPARO_ESCRITORIO')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            activeStatusFilter === 'REPARO_ESCRITORIO'
              ? 'bg-amber-500/15 border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/20'
              : 'bg-white hover:bg-amber-50/50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              No Escritório (Reparo)
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              {reparoCount}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{reparoCount}</span>
            <span className="text-xs text-slate-500 font-medium">em manutenção</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Máquinas na bancada para formatação, troca de peças ou MGV.
          </p>
        </div>

        {/* 2. Máquinas Reservas (Estoque de Backup) */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'RESERVA' ? 'ALL' : 'RESERVA')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            activeStatusFilter === 'RESERVA'
              ? 'bg-blue-500/15 border-blue-500 shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-white hover:bg-blue-50/50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              Máquinas Reservas
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              {reservaCount}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{reservaCount}</span>
            <span className="text-xs text-slate-500 font-medium">estoque pronto</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Backups 100% configurados para substituição imediata em lojas.
          </p>
        </div>

        {/* 3. Prontas para Entrega */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'PRONTA' ? 'ALL' : 'PRONTA')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            activeStatusFilter === 'PRONTA'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Prontas para Entrega
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              {prontaCount}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{prontaCount}</span>
            <span className="text-xs text-slate-500 font-medium">liberadas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Equipamentos homologados aguardando retirada ou transporte.
          </p>
        </div>

        {/* 4. Em Operação nas Lojas */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'EM_OPERACAO' ? 'ALL' : 'EM_OPERACAO')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            activeStatusFilter === 'EM_OPERACAO'
              ? 'bg-purple-500/15 border-purple-500 shadow-purple-500/10 ring-2 ring-purple-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-purple-600" />
              Em Operação (Lojas)
            </span>
            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
              {operacaoCount}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{operacaoCount}</span>
            <span className="text-xs text-slate-500 font-medium">em funcionamento</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Equipamentos instalados e rodando nos caixas ou retaguarda.
          </p>
        </div>
      </div>

      {/* Control Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setActiveStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('REPARO_ESCRITORIO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStatusFilter === 'REPARO_ESCRITORIO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              No Escritório ({reparoCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('RESERVA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStatusFilter === 'RESERVA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Reservas ({reservaCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('PRONTA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStatusFilter === 'PRONTA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Prontas ({prontaCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('EM_OPERACAO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStatusFilter === 'EM_OPERACAO'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Na Loja ({operacaoCount})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportOrdersJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Exportar backup das ordens de serviço em JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              type="button"
              onClick={handleNewOrder}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Nova Ordem de Serviço
            </button>
          </div>
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar máquina, OS, loja, técnico..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600 text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="PDV">Apenas PDV</option>
              <option value="ESCRITORIO">Apenas Escritório</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Wrench className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma máquina encontrada neste filtro
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {searchFilter
              ? 'Tente ajustar os termos de busca ou remover os filtros aplicados.'
              : 'Cadastre a primeira máquina para gerenciar o estoque de reservas e reparos.'}
          </p>
          <button
            type="button"
            onClick={handleNewOrder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Máquina / OS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_LABELS[order.status];

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Top: Header & Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {order.numeroOs}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {order.tipo === 'PDV' ? (
                          <Store className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Laptop className="w-3 h-3 text-indigo-600" />
                        )}
                        {order.tipo === 'PDV' ? 'PDV' : 'Escritório'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.badgeBg} ${statusConfig.textBadge}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Machine Identification Main Title */}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-between">
                      <span>{order.identificacao}</span>
                      {order.patrimonio && (
                        <span className="text-xs font-mono font-medium text-slate-400">
                          {order.patrimonio}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{order.lojaOrigem}</span>
                      {order.lojaDestino && (
                        <>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-blue-600 font-semibold">{order.lojaDestino}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Defect / Problem Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Motivo / Defeito:
                    </span>
                    <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                      {order.defeitoRelatado || 'Revisão preventiva de rotina'}
                    </p>
                  </div>

                  {/* Services done if any */}
                  {order.servicosExecutados && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 line-clamp-2">
                      <strong>Serviço:</strong> {order.servicosExecutados}
                    </div>
                  )}

                  {/* Meta data (Tech & Date) */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="truncate max-w-[150px]">
                      Técnico: <strong className="text-slate-700">{order.tecnicoResponsavel || 'Geral'}</strong>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {order.dataEntrada}
                    </span>
                  </div>
                </div>

                {/* Bottom: Quick Status Changer & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  {/* Status Quick Changer Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Status:
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) => changeOrderStatus(order.id, e.target.value as ServiceOrderStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-blue-600"
                    >
                      <option value="REPARO_ESCRITORIO">🟡 Em Reparo (Escritório)</option>
                      <option value="RESERVA">🔵 Máquina Reserva</option>
                      <option value="PRONTA">🟢 Pronta para Entrega</option>
                      <option value="EM_OPERACAO">🟣 Em Operação na Loja</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5">
                    {/* Launch Checklist Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onStartChecklistForMachine({
                          identificacao: order.identificacao,
                          loja: order.lojaOrigem,
                          tecnico: order.tecnicoResponsavel,
                          tipo: order.tipo,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                      title="Preencher e executar o Checklist Operacional desta máquina"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Checklist</span>
                    </button>

                    {/* Print Badge Button */}
                    <button
                      type="button"
                      onClick={() => setOrderToPrint(order)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                      title="Imprimir Etiqueta para o Gabinete"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleEdit(order)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 transition-colors"
                      title="Editar OS"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Deseja remover a ordem de serviço da máquina "${order.identificacao}"?`)) {
                          deleteOrder(order.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Excluir OS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderToEdit={orderToEdit}
        onOpenChecklistForMachine={onStartChecklistForMachine}
      />

      {/* Modal de Impressão de Etiqueta do Gabinete */}
      <ServiceOrderPrintBadge
        order={orderToPrint}
        onClose={() => setOrderToPrint(null)}
      />
    </div>
  );
};
