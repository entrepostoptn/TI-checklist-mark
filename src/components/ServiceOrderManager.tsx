import React, { useState, useMemo } from 'react';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useClients } from '../context/ClientContext';
import { useEquipment } from '../context/EquipmentContext';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderPriority, STATUS_LABELS, PRIORITY_CONFIG } from '../types/serviceOrder';
import { MachineType } from '../types/checklist';
import { ServiceOrderFastModal } from './ServiceOrderFastModal';
import { ServiceOrderModal } from './ServiceOrderModal';
import { ServiceOrderPrintBadge } from './ServiceOrderPrintBadge';
import { ConfirmModal } from './ConfirmModal';
import { formatDateBR, formatDateTimeBR } from '../utils/dateFormatter';
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
  Clock,
  MapPin,
  Phone,
  Navigation,
  Building2,
  Filter,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface ServiceOrderManagerProps {
  onStartChecklistForMachine: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
  onNavigateToClients?: () => void;
}

export const ServiceOrderManager: React.FC<ServiceOrderManagerProps> = ({
  onStartChecklistForMachine,
  onNavigateToClients,
}) => {
  const {
    orders,
    reparoCount,
    reservaCount,
    prontaCount,
    operacaoCount,
    abertasCount,
    emAndamentoCount,
    concluidasCount,
    criticasCount,
    totalCount,
    activeStatusFilter,
    setActiveStatusFilter,
    searchFilter,
    setSearchFilter,
    changeOrderStatus,
    deleteOrder,
    exportOrdersJSON,
  } = useServiceOrders();

  const { clients, stores } = useClients();
  const { equipments } = useEquipment();

  // Modals state
  const [isFastModalOpen, setIsFastModalOpen] = useState(false);
  const [isLegacyEditModalOpen, setIsLegacyEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    deleteOrder(orderToDelete.id);
    setOrderToDelete(null);
  };

  // Field Technician Filters (Item 7 do prompt)
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [storeFilter, setStoreFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [techFilter, setTechFilter] = useState<string>('ALL');

  // Critical / Pending Tickets Alert
  const criticalOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.prioridade === 'CRITICA' || o.prioridade === 'URGENTE') &&
        o.status !== 'CONCLUIDA' &&
        o.status !== 'PRONTA' &&
        o.status !== 'CANCELADA'
    );
  }, [orders]);

  // Unique technicians for filter dropdown
  const techniciansList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.tecnicoResponsavel) set.add(o.tecnicoResponsavel);
    });
    return Array.from(set);
  }, [orders]);

  // Stores available for currently selected client filter
  const storesForFilter = useMemo(() => {
    if (clientFilter === 'ALL') return stores;
    return stores.filter((s) => s.clienteId === clientFilter);
  }, [stores, clientFilter]);

  // Filtered orders applying all operational desk filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (activeStatusFilter !== 'ALL') {
        if (activeStatusFilter === 'ABERTA') {
          if (o.status !== 'ABERTA' && o.status !== 'REPARO_ESCRITORIO') return false;
        } else if (activeStatusFilter === 'CONCLUIDA') {
          if (o.status !== 'CONCLUIDA' && o.status !== 'PRONTA') return false;
        } else if (o.status !== activeStatusFilter) {
          return false;
        }
      }

      // Client filter
      if (clientFilter !== 'ALL') {
        if (o.clienteId !== clientFilter) {
          const client = clients.find((c) => c.id === clientFilter);
          const clientName = client?.nomeFantasia || client?.razaoSocial || '';
          if (!o.clienteNome || !o.clienteNome.toLowerCase().includes(clientName.toLowerCase())) {
            return false;
          }
        }
      }

      // Store filter
      if (storeFilter !== 'ALL') {
        const store = stores.find((s) => s.id === storeFilter);
        const storeName = store?.nome || '';
        if (o.lojaId !== storeFilter && o.lojaOrigem !== storeName && o.lojaNome !== storeName) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (priorityFilter === 'CRITICA') {
          if (o.prioridade !== 'CRITICA' && o.prioridade !== 'URGENTE') return false;
        } else if (o.prioridade !== priorityFilter) {
          return false;
        }
      }

      // Tech filter
      if (techFilter !== 'ALL' && o.tecnicoResponsavel !== techFilter) {
        return false;
      }

      // Search term
      if (searchFilter.trim()) {
        const term = searchFilter.toLowerCase();
        const matchesIdent = o.identificacao.toLowerCase().includes(term);
        const matchesNum = o.numeroOs.toLowerCase().includes(term);
        const matchesLoja = (o.lojaNome || o.lojaOrigem || '').toLowerCase().includes(term);
        const matchesCliente = (o.clienteNome || '').toLowerCase().includes(term);
        const matchesTech = (o.tecnicoResponsavel || '').toLowerCase().includes(term);
        const matchesDefeito = (o.defeitoRelatado || '').toLowerCase().includes(term);
        const matchesPatrimonio = (o.patrimonio || '').toLowerCase().includes(term);
        if (
          !matchesIdent &&
          !matchesNum &&
          !matchesLoja &&
          !matchesCliente &&
          !matchesTech &&
          !matchesDefeito &&
          !matchesPatrimonio
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeStatusFilter, clientFilter, storeFilter, priorityFilter, techFilter, searchFilter, clients, stores]);

  const handleEdit = (order: ServiceOrder) => {
    setOrderToEdit(order);
    setIsLegacyEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Field Desk Operational Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wide">
                Painel Operacional TI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                Atendimento em Campo & Bancada
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-400" />
              <span>Desk de Ordens de Serviço</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Abra ordens de serviço rapidamente com seleção guiada de cliente, filial e equipamento. Acesse rotas no mapa, contatos e histórico técnico de qualquer loja.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto">
            {onNavigateToClients && (
              <button
                type="button"
                onClick={onNavigateToClients}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm rounded-xl border border-slate-600 transition-all cursor-pointer min-h-[44px]"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Ver Clientes & Lojas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFastModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova OS</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-700 text-xs">
          <div
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'ABERTA' ? 'ALL' : 'ABERTA')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeStatusFilter === 'ABERTA'
                ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-300'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span>Abertas / Pendentes</span>
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white mt-0.5">{abertasCount}</div>
            <div className="text-[10px] text-blue-300 font-medium">Aguardando atendimento</div>
          </div>

          <div
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'EM_ANDAMENTO' ? 'ALL' : 'EM_ANDAMENTO')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeStatusFilter === 'EM_ANDAMENTO'
                ? 'bg-amber-600/30 border-amber-400 ring-1 ring-amber-300'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span>Em Andamento</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{emAndamentoCount}</div>
            <div className="text-[10px] text-amber-300 font-medium">Técnico atendendo</div>
          </div>

          <div
            onClick={() => setPriorityFilter(priorityFilter === 'CRITICA' ? 'ALL' : 'CRITICA')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              priorityFilter === 'CRITICA'
                ? 'bg-red-600/30 border-red-400 ring-1 ring-red-300'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span>Críticas / Urgentes</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-black text-red-400 mt-0.5">{criticasCount}</div>
            <div className="text-[10px] text-red-300 font-medium">Interrupção de loja/PDV</div>
          </div>

          <div
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'CONCLUIDA' ? 'ALL' : 'CONCLUIDA')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeStatusFilter === 'CONCLUIDA'
                ? 'bg-emerald-600/30 border-emerald-400 ring-1 ring-emerald-300'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span>Concluídas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{concluidasCount}</div>
            <div className="text-[10px] text-emerald-300 font-medium">Resolvidas com sucesso</div>
          </div>
        </div>
      </div>

      {/* Critical Orders Alert Banner (Item 7 do prompt: Destacar ordens críticas) */}
      {criticalOrders.length > 0 && priorityFilter !== 'CRITICA' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-red-950">
                Atenção: {criticalOrders.length} Ordem(ns) de Serviço Crítica(s) Pendente(s)
              </div>
              <div className="text-xs text-red-800 mt-0.5">
                Existem terminais de frente de caixa ou links de loja com pane relatada necessitando atenção imediata.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPriorityFilter('CRITICA')}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl self-start sm:self-auto cursor-pointer shrink-0 shadow-xs"
          >
            Filtrar Apenas Críticas
          </button>
        </div>
      )}

      {/* Operational Desk Toolbar & Multi-filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('ABERTA')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStatusFilter === 'ABERTA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Abertas ({abertasCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('EM_ANDAMENTO')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStatusFilter === 'EM_ANDAMENTO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Em Andamento ({emAndamentoCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('AGUARDANDO_PECA')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStatusFilter === 'AGUARDANDO_PECA'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Aguardando Peça
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('CONCLUIDA')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStatusFilter === 'CONCLUIDA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Concluídas ({concluidasCount})
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportOrdersJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Exportar backup em JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFastModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Abrir OS</span>
            </button>
          </div>
        </div>

        {/* Granular Filters row: Search, Client, Store, Tech, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar OS, equipamento, loja..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Client */}
          <div>
            <select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setStoreFilter('ALL');
              }}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeFantasia || c.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Store */}
          <div>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Todas as Lojas</option>
              {storesForFilter.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tech */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Todos os Técnicos</option>
              {techniciansList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Priority */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Todas as Prioridades</option>
              <option value="CRITICA">🔴 Apenas Crítica / Urgente</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="NORMAL">🔵 Normal</option>
              <option value="BAIXA">⚪ Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid (Field Desk Cards) */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Wrench className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma ordem de serviço encontrada com estes filtros
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {searchFilter || clientFilter !== 'ALL' || storeFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Tente limpar os filtros para visualizar todas as ordens de serviço.'
              : 'Clique em "Nova Ordem de Serviço" para abrir um chamado para uma filial.'}
          </p>
          <button
            type="button"
            onClick={() => setIsFastModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Nova Ordem de Serviço</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS['ABERTA'];
            const priorityConfig = PRIORITY_CONFIG[order.prioridade] || PRIORITY_CONFIG['NORMAL'];

            // Find store details for direct map routes & contacts
            const matchedStore = stores.find(
              (s) =>
                s.id === order.lojaId ||
                s.nome.toLowerCase() === (order.lojaNome || order.lojaOrigem || '').toLowerCase()
            );

            // Find equipment if attached
            const matchedEq = order.equipamentoId ? equipments.find((e) => e.id === order.equipamentoId) : null;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                  order.prioridade === 'CRITICA' || order.prioridade === 'URGENTE'
                    ? 'border-red-300 ring-1 ring-red-100'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Top: Header Badges & Priority */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        {order.numeroOs}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityConfig.badgeBg} ${priorityConfig.textBadge} ${priorityConfig.border}`}
                      >
                        {priorityConfig.label}
                      </span>

                      {order.semEquipamento && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          Rede / Loja Geral
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.badgeBg} ${statusConfig.textBadge}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title & Machine Name */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center justify-between">
                      <span className="truncate">{order.identificacao}</span>
                      {order.patrimonio && (
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {order.patrimonio}
                        </span>
                      )}
                    </h3>

                    {/* Client & Store Line */}
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">
                        {order.lojaNome || order.lojaOrigem}
                      </span>
                      {order.clienteNome && (
                        <span className="text-slate-400 text-[11px]">
                          ({order.clienteNome})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Store Address & Direct GPS Button (Item 7 do prompt: informações de deslocamento) */}
                  {matchedStore && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          {matchedStore.endereco}, <strong>{matchedStore.cidade} - {matchedStore.estado}</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                        {matchedStore.telefone ? (
                          <a
                            href={`tel:${matchedStore.telefone.replace(/\D/g, '')}`}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{matchedStore.telefone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Sem telefone</span>
                        )}

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${matchedStore.nome}, ${matchedStore.endereco}, ${matchedStore.cidade}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold"
                          title="Abrir rota no Google Maps para deslocamento"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Abrir Rota GPS</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Defect description */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Problema Relatado:
                    </span>
                    <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                      {order.defeitoRelatado || 'Atendimento técnico geral'}
                    </p>
                  </div>

                  {/* Diagnostic or Procedure performed */}
                  {order.procedimentosExecutados && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 line-clamp-2">
                      <strong>Procedimentos:</strong> {order.procedimentosExecutados}
                    </div>
                  )}

                  {/* Meta data: Tech & Opening date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="truncate">
                      Técnico: <strong className="text-slate-800">{order.tecnicoResponsavel || 'Geral'}</strong>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {order.dataHoraAbertura ? formatDateTimeBR(order.dataHoraAbertura) : formatDateBR(order.dataEntrada)}
                    </span>
                  </div>
                </div>

                {/* Bottom: Fast Status Advance & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Status:
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) => changeOrderStatus(order.id, e.target.value as ServiceOrderStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-blue-600 outline-none"
                    >
                      <option value="ABERTA">🔵 Aberta / Pendente</option>
                      <option value="EM_ANDAMENTO">🟡 Em Andamento</option>
                      <option value="AGUARDANDO_PECA">🟠 Aguardando Peça</option>
                      <option value="AGUARDANDO_TERCEIROS">🟣 Aguardando Terceiros</option>
                      <option value="CONCLUIDA">🟢 Concluída / Encerrada</option>
                      <option value="CANCELADA">⚪ Cancelada</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    {/* Launch Checklist Button (if machine is PC/PDV) */}
                    <button
                      type="button"
                      onClick={() =>
                        onStartChecklistForMachine({
                          identificacao: order.identificacao,
                          loja: order.lojaNome || order.lojaOrigem || 'Não informada',
                          tecnico: order.tecnicoResponsavel,
                          tipo: (order.tipo as any) === 'PDV' ? 'PDV' : 'ESCRITORIO',
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                      title="Executar checklist técnico"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Checklist</span>
                    </button>

                    {/* Print Cabinet Badge */}
                    <button
                      type="button"
                      onClick={() => setOrderToPrint(order)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Imprimir Etiqueta / Comprovante"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Edit Order */}
                    <button
                      type="button"
                      onClick={() => handleEdit(order)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Editar detalhes completos da OS"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Order */}
                    <button
                      type="button"
                      onClick={() => setOrderToDelete(order)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

      {/* MODAL 1: Fast 4-Step OS Opening Wizard (Item 5 do prompt) */}
      {isFastModalOpen && (
        <ServiceOrderFastModal
          isOpen={isFastModalOpen}
          onClose={() => setIsFastModalOpen(false)}
        />
      )}

      {/* MODAL 2: Legacy Edit Modal */}
      {isLegacyEditModalOpen && (
        <ServiceOrderModal
          isOpen={isLegacyEditModalOpen}
          onClose={() => {
            setIsLegacyEditModalOpen(false);
            setOrderToEdit(null);
          }}
          orderToEdit={orderToEdit}
          onOpenChecklistForMachine={onStartChecklistForMachine}
        />
      )}

      {/* MODAL 3: Print Thermal/A4 Cabinet Badge */}
      {orderToPrint && (
        <ServiceOrderPrintBadge
          order={orderToPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}

      {/* Confirmação de Exclusão de OS (In-App) */}
      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        title={`Excluir Ordem de Serviço "${orderToDelete?.numeroOs}"?`}
        message={`Tem certeza que deseja remover esta ordem de serviço (${orderToDelete?.clienteNome || 'Cliente'} - ${orderToDelete?.lojaNome || 'Loja'})?`}
        confirmText="Excluir OS"
        onConfirm={handleConfirmDeleteOrder}
        onCancel={() => setOrderToDelete(null)}
        variant="danger"
      />
    </div>
  );
};
