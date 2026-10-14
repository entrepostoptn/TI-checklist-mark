import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { Client, Store } from '../types/client';
import { Equipment, EquipmentType } from '../types/equipment';
import { MachineType } from '../types/checklist';
import { ConfirmModal } from './ConfirmModal';
import { PataNegraMatrixModal } from './PataNegraMatrixModal';
import {
  Building2,
  Store as StoreIcon,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  Laptop,
  Wrench,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Filter,
  X,
  Navigation,
  Sparkles,
  Server,
  Printer,
  Scale,
  Video,
  Router,
  Network,
} from 'lucide-react';

interface ClientManagerProps {
  onOpenNewServiceOrderForStore?: (store: Store, equipment?: Equipment) => void;
  onOpenEquipmentDetail?: (equipment: Equipment) => void;
  onStartChecklist?: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
  onOpenServiceOrderForEquipment?: (equipment: Equipment) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  onOpenNewServiceOrderForStore,
  onOpenEquipmentDetail,
  onStartChecklist,
}) => {
  const {
    clients,
    stores,
    addClient,
    updateClient,
    deleteClient,
    inactivateClient,
    addStore,
    updateStore,
    deleteStore,
    toggleStoreStatus,
    batchUpsertStores,
    seedPataNegraData,
    stats,
  } = useClients();

  const { equipments, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const { orders } = useServiceOrders();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(() => {
    // Default open first client if exists
    return clients.length > 0 ? clients[0].id : null;
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [preselectedClientIdForStore, setPreselectedClientIdForStore] = useState<string | undefined>(undefined);

  const [isPataNegraMatrixOpen, setIsPataNegraMatrixOpen] = useState(false);

  const [isNewEquipmentModalOpen, setIsNewEquipmentModalOpen] = useState(false);
  const [editingEquipmentForStore, setEditingEquipmentForStore] = useState<Equipment | null>(null);
  const [targetStoreForEquipment, setTargetStoreForEquipment] = useState<Store | null>(null);

  // In-app Confirm Modal State (replaces window.confirm)
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    type: 'client' | 'store' | 'equipment';
    id: string;
    title: string;
    message: string;
    confirmText?: string;
    extraCount?: number;
  } | null>(null);

  // Feedback Toast / Alert
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter === 'ATIVO' && c.status !== 'ativo') return false;
      if (statusFilter === 'INATIVO' && c.status !== 'inativo') return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();

      const matchesClient =
        c.razaoSocial.toLowerCase().includes(lower) ||
        (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(lower)) ||
        (c.codigo && c.codigo.toLowerCase().includes(lower)) ||
        (c.cnpj && c.cnpj.includes(lower)) ||
        (c.responsavel && c.responsavel.toLowerCase().includes(lower));

      // Also check if any of client's stores match
      const clientStores = stores.filter((s) => s.clienteId === c.id);
      const matchesStore = clientStores.some(
        (s) =>
          s.nome.toLowerCase().includes(lower) ||
          s.codigoLoja.toLowerCase().includes(lower) ||
          s.cidade.toLowerCase().includes(lower) ||
          s.endereco.toLowerCase().includes(lower)
      );

      return matchesClient || matchesStore;
    });
  }, [clients, stores, searchTerm, statusFilter]);

  // Active selected store object
  const activeSelectedStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return stores.find((s) => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  // Pata Negra Client Memo
  const pataNegraClient = useMemo(() => {
    return clients.find(
      (c) =>
        c.id === 'cli_pata_negra' ||
        (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes('pata')) ||
        c.razaoSocial.toLowerCase().includes('pata')
    );
  }, [clients]);

  // Equipments for selected store
  const storeEquipments = useMemo(() => {
    if (!activeSelectedStore) return [];
    return equipments.filter(
      (e) =>
        e.lojaId === activeSelectedStore.id ||
        (e.lojaNome && e.lojaNome.toLowerCase() === activeSelectedStore.nome.toLowerCase()) ||
        (e.lojaOrigem && e.lojaOrigem.toLowerCase() === activeSelectedStore.nome.toLowerCase())
    );
  }, [equipments, activeSelectedStore]);

  // Orders for selected store
  const storeOrders = useMemo(() => {
    if (!activeSelectedStore) return [];
    return orders.filter(
      (o) =>
        o.lojaId === activeSelectedStore.id ||
        (o.lojaNome && o.lojaNome.toLowerCase() === activeSelectedStore.nome.toLowerCase()) ||
        (o.lojaOrigem && o.lojaOrigem.toLowerCase() === activeSelectedStore.nome.toLowerCase())
    );
  }, [orders, activeSelectedStore]);

  // Open modals
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleOpenAddStore = (clientId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingStore(null);
    setPreselectedClientIdForStore(clientId);
    setIsStoreModalOpen(true);
  };

  const handleOpenEditStore = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStore(store);
    setPreselectedClientIdForStore(store.clienteId);
    setIsStoreModalOpen(true);
  };

  const handleOpenAddEquipmentToStore = (store: Store) => {
    setTargetStoreForEquipment(store);
    setEditingEquipmentForStore(null);
    setIsNewEquipmentModalOpen(true);
  };

  const handleOpenEditEquipmentInStore = (eq: Equipment, store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetStoreForEquipment(store);
    setEditingEquipmentForStore(eq);
    setIsNewEquipmentModalOpen(true);
  };

  const handleRequestDeleteClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    const clientStores = stores.filter((s) => s.clienteId === client.id);
    setConfirmDeleteState({
      isOpen: true,
      type: 'client',
      id: client.id,
      title: `Excluir Cliente "${client.nomeFantasia || client.razaoSocial}"?`,
      message:
        clientStores.length > 0
          ? `Este cliente possui ${clientStores.length} filial(is) vinculada(s). Ao confirmar, o cliente e todas as suas lojas vinculadas serão excluídos do sistema.`
          : 'Tem certeza que deseja excluir permanentemente o cadastro deste cliente matriz?',
      confirmText: clientStores.length > 0 ? 'Excluir Cliente e Filiais' : 'Confirmar Exclusão',
      extraCount: clientStores.length,
    });
  };

  const handleRequestDeleteStore = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteState({
      isOpen: true,
      type: 'store',
      id: store.id,
      title: `Excluir Filial "${store.nome}"?`,
      message: `Tem certeza que deseja remover esta loja (Código: ${store.codigoLoja}, ${store.cidade} - ${store.estado})?`,
      confirmText: 'Excluir Loja',
    });
  };

  const handleRequestDeleteEquipment = (eq: Equipment, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteState({
      isOpen: true,
      type: 'equipment',
      id: eq.id,
      title: `Excluir Equipamento "${eq.nome}"?`,
      message: `Tem certeza que deseja excluir o cadastro de "${eq.nome}" (Patrimônio: ${eq.patrimonio})?`,
      confirmText: 'Excluir Equipamento',
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteState) return;
    const { type, id } = confirmDeleteState;

    if (type === 'client') {
      const res = deleteClient(id, true);
      if (!res.success) {
        showFeedback(res.error || 'Erro ao excluir cliente', 'error');
      } else {
        showFeedback('Cliente e filiais vinculadas excluídos com sucesso.');
        if (expandedClientId === id) setExpandedClientId(null);
      }
    } else if (type === 'store') {
      deleteStore(id);
      if (selectedStoreId === id) setSelectedStoreId(null);
      showFeedback('Filial excluída com sucesso.');
    } else if (type === 'equipment') {
      deleteEquipment(id);
      showFeedback('Equipamento excluído com sucesso.');
    }

    setConfirmDeleteState(null);
  };

  const handleSaveEquipment = (
    data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      const res = updateEquipment(editId, data);
      if (!res.success) {
        showFeedback(res.error || 'Erro ao atualizar equipamento', 'error');
      } else {
        showFeedback('Equipamento atualizado com sucesso!');
        setIsNewEquipmentModalOpen(false);
        setEditingEquipmentForStore(null);
      }
    } else {
      const res = addEquipment(data);
      if (!res.success) {
        showFeedback(res.error || 'Erro ao cadastrar equipamento', 'error');
      } else {
        showFeedback(`Equipamento "${res.equipment?.nome}" cadastrado com sucesso!`);
        setIsNewEquipmentModalOpen(false);
        setEditingEquipmentForStore(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md border animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & KPIs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold tracking-wide uppercase">
                Estrutura Organizacional & Inventário
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                100% Sincronizado
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-400" />
              Gestão de Clientes, Matrizes & Filiais
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Cadastre clientes matrizes e suas respectivas lojas ou filiais. Gerencie o inventário de equipamentos diretamente por loja e abra ordens de serviço sem necessidade de pré-cadastros avulsos.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                const res = seedPataNegraData();
                showFeedback(res.message);
                const ptn = clients.find(
                  (c) =>
                    c.id === 'cli_pata_negra' ||
                    (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes('pata negra')) ||
                    c.razaoSocial.toLowerCase().includes('pata negra')
                );
                if (ptn) setExpandedClientId(ptn.id);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
              title="Garantir e abrir cadastro do Cliente Pata Negra e suas 6 filiais"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Cliente Pata Negra</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddClient}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cliente Matriz</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddStore()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm rounded-xl border border-slate-600 shadow-md transition-all cursor-pointer"
            >
              <StoreIcon className="w-4 h-4 text-emerald-400" />
              <span>Nova Loja / Filial</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/80 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="text-slate-400">Total de Clientes</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{stats.totalClientes}</div>
            <div className="text-[10px] text-emerald-400 font-medium">{stats.clientesAtivos} ativos</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="text-slate-400">Lojas & Filiais</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{stats.totalLojas}</div>
            <div className="text-[10px] text-blue-400 font-medium">{stats.lojasAtivas} em atendimento</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="text-slate-400">Equipamentos em Loja</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{equipments.length}</div>
            <div className="text-[10px] text-slate-400">PDVs, balanças, impressoras</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="text-slate-400">OSs Registradas</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{orders.length}</div>
            <div className="text-[10px] text-amber-300 font-medium">Histórico permanente</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, loja, código, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'TODOS' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ATIVO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ATIVO' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INATIVO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'INATIVO' ? 'bg-white shadow-xs text-slate-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Clients & Stores List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Tree (Hierarquia de Matriz e Filiais) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Clientes & Redes Cadastradas ({filteredClients.length})</span>
            <span>Clique para expandir lojas</span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Nenhum cliente encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.'
                  : 'Cadastre o primeiro cliente matriz para começar a estruturar lojas e equipamentos.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddClient}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                + Cadastrar Cliente Matriz
              </button>
            </div>
          ) : (
            filteredClients.map((client) => {
              const clientStores = stores.filter((s) => s.clienteId === client.id);
              const isExpanded = expandedClientId === client.id;
              const activeStoresCount = clientStores.filter((s) => s.status === 'ativo').length;

              // Total equipment across all stores of this client
              const clientEquipmentsCount = equipments.filter(
                (e) =>
                  e.clienteId === client.id ||
                  clientStores.some((s) => s.id === e.lojaId || s.nome.toLowerCase() === (e.lojaNome || '').toLowerCase())
              ).length;

              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isExpanded ? 'border-blue-400 shadow-md ring-1 ring-blue-200' : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Client Header Card */}
                  <div
                    onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {client.nomeFantasia || client.razaoSocial}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {client.codigo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              client.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {client.nomeFantasia && client.razaoSocial !== client.nomeFantasia && (
                          <div className="text-xs text-slate-500 truncate mt-0.5">{client.razaoSocial}</div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                          {client.cnpj && <span>CNPJ: <strong className="text-slate-700 font-mono">{client.cnpj}</strong></span>}
                          {client.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {client.telefone}
                            </span>
                          )}
                          {client.responsavel && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {client.responsavel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditClient(client, e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar dados do cliente"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRequestDeleteClient(client, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar for Client */}
                  <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">
                      Filiais cadastradas: <strong className="text-blue-700 font-bold">{clientStores.length}</strong> ({activeStoresCount} ativas)
                    </span>
                    <span className="font-medium">
                      Equipamentos: <strong className="text-emerald-700 font-bold">{clientEquipmentsCount}</strong>
                    </span>
                  </div>

                  {/* Expanded Stores List (Filiais da Matriz) */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-100/70 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                      {/* Header da lista de filiais */}
                      <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-600 flex-wrap gap-2">
                        <span>Lojas e Filiais vinculadas</span>
                        <div className="flex items-center gap-2">
                          {(client.id === 'cli_pata_negra' ||
                            client.nomeFantasia?.toLowerCase().includes('pata') ||
                            client.razaoSocial.toLowerCase().includes('pata')) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPataNegraMatrixOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                            >
                              <StoreIcon className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Matriz Lojas 1 a 43</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleOpenAddStore(client.id, e)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold text-xs cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar Loja</span>
                          </button>
                        </div>
                      </div>

                      {clientStores.length === 0 ? (
                        <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                          Nenhuma filial cadastrada para este cliente.
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={(e) => handleOpenAddStore(client.id, e)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                            >
                              + Cadastrar Loja 01
                            </button>
                          </div>
                        </div>
                      ) : (
                        clientStores.map((store) => {
                          const isStoreSelected = selectedStoreId === store.id;
                          const isAtiva = store.status === 'ativo';
                          const storeEqCount = equipments.filter(
                            (e) => e.lojaId === store.id || (e.lojaNome && e.lojaNome.toLowerCase() === store.nome.toLowerCase())
                          ).length;
                          const storeOpenOsCount = orders.filter(
                            (o) =>
                              (o.lojaId === store.id || (o.lojaNome && o.lojaNome.toLowerCase() === store.nome.toLowerCase())) &&
                              o.status !== 'CONCLUIDA' &&
                              o.status !== 'PRONTA' &&
                              o.status !== 'CANCELADA'
                          ).length;

                          return (
                            <div
                              key={store.id}
                              onClick={() => setSelectedStoreId(store.id)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isStoreSelected
                                  ? 'bg-blue-50/90 border-blue-400 shadow-sm ring-1 ring-blue-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                              } ${!isAtiva ? 'opacity-90 bg-slate-50/60' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <StoreIcon className={`w-4 h-4 shrink-0 ${isStoreSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                                    {/* Nome Fantasia da Filial */}
                                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{store.nome}</span>
                                    {/* ID da Empresa (Código da Loja) */}
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                      ID: {store.codigoLoja}
                                    </span>
                                    {/* Indicador Visual Circular: Bolinha Verde / Bolinha Vermelha com Toggle rápido */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStoreStatus(store.id);
                                        showFeedback(
                                          `Loja ${store.codigoLoja} alterada para: ${
                                            isAtiva ? 'Inativa (🔴 Bolinha Vermelha)' : 'Ativa (🟢 Bolinha Verde)'
                                          }`
                                        );
                                      }}
                                      title="Clique para alternar o status: Ativa (Bolinha Verde) / Inativa (Bolinha Vermelha)"
                                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs transition-all cursor-pointer ${
                                        isAtiva
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                          : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                      }`}
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ring-2 shadow-xs ${
                                          isAtiva ? 'bg-emerald-500 ring-emerald-200' : 'bg-rose-500 ring-rose-200'
                                        }`}
                                      />
                                      <span>{isAtiva ? 'Ativa' : 'Inativa'}</span>
                                    </button>
                                  </div>

                                  {/* Endereço, Município, CEP e Telefone */}
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                                    <div className="flex items-center gap-1 truncate max-w-md">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{store.endereco}, {store.cidade} - {store.estado}</span>
                                    </div>
                                    {store.cep && <span className="font-mono text-slate-400 text-[10px]">(CEP: {store.cep})</span>}
                                    {store.telefone && (
                                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                                        {store.telefone}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2">
                                    <span className="inline-flex items-center gap-1">
                                      <Laptop className="w-3.5 h-3.5 text-blue-600" />
                                      <strong>{storeEqCount}</strong> equipamentos
                                    </span>
                                    {storeOpenOsCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                        {storeOpenOsCount} OS aberta(s)
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Sem OS pendente</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditStore(store, e)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar loja"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleRequestDeleteStore(store, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Excluir loja"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Store Detail & In-Store Equipment Inventory (Inventário da Loja) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSelectedStore ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
              {/* Store Header Details */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                        Loja Cód. {activeSelectedStore.codigoLoja}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">
                        Matriz: {activeSelectedStore.clienteNome}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {activeSelectedStore.nome}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenNewServiceOrderForStore && (
                      <button
                        type="button"
                        onClick={() => onOpenNewServiceOrderForStore(activeSelectedStore)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Abrir OS nesta Loja</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenAddEquipmentToStore(activeSelectedStore)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Equipamento</span>
                    </button>
                  </div>
                </div>

                {/* Full Address, Manager & Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/80 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <span>
                        {activeSelectedStore.endereco}
                        {activeSelectedStore.cep ? ` — CEP: ${activeSelectedStore.cep}` : ''}
                        <br />
                        <strong>{activeSelectedStore.cidade} - {activeSelectedStore.estado}</strong>
                      </span>
                    </div>
                    {/* External GPS Action */}
                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${activeSelectedStore.nome}, ${activeSelectedStore.endereco}, ${activeSelectedStore.cidade}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-100 font-semibold underline"
                      >
                        <Navigation className="w-3 h-3 text-blue-400" />
                        <span>Abrir Rota no Google Maps</span>
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    {activeSelectedStore.responsavelLocal && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Responsável: <strong>{activeSelectedStore.responsavelLocal}</strong></span>
                      </div>
                    )}
                    {activeSelectedStore.telefone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Telefone: <strong>{activeSelectedStore.telefone}</strong></span>
                      </div>
                    )}
                    {activeSelectedStore.horarioFuncionamento && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{activeSelectedStore.horarioFuncionamento}</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeSelectedStore.observacoes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                    <strong>Observações de Acesso / Atendimento:</strong> {activeSelectedStore.observacoes}
                  </div>
                )}
              </div>

              {/* Section 4: Equipamentos da Loja (Item 4 do prompt) */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-blue-600" />
                      <span>Equipamentos da Loja ({storeEquipments.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Inventário fixo de PDVs, computadores, balanças, impressoras, câmeras e rede desta filial.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddEquipmentToStore(activeSelectedStore)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Equipamento</span>
                  </button>
                </div>

                {storeEquipments.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                    <Laptop className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">Nenhum equipamento cadastrado nesta loja</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Registre os computadores de frente de caixa, balanças, impressoras ou DVR desta filial.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddEquipmentToStore(activeSelectedStore)}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                    >
                      + Cadastrar Primeiro Equipamento
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {storeEquipments.map((eq) => {
                      const getDeviceIcon = () => {
                        switch (eq.tipo) {
                          case 'PDV':
                            return <StoreIcon className="w-4 h-4 text-blue-600" />;
                          case 'IMPRESSORA':
                            return <Printer className="w-4 h-4 text-amber-600" />;
                          case 'BALANCA':
                            return <Scale className="w-4 h-4 text-emerald-600" />;
                          case 'DVR':
                          case 'CAMERA':
                            return <Video className="w-4 h-4 text-purple-600" />;
                          case 'SWITCH':
                          case 'ROTEADOR':
                            return <Router className="w-4 h-4 text-indigo-600" />;
                          case 'SERVIDOR':
                            return <Server className="w-4 h-4 text-slate-700" />;
                          default:
                            return <Laptop className="w-4 h-4 text-blue-600" />;
                        }
                      };

                      return (
                        <div
                          key={eq.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-2.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 rounded-lg bg-slate-100">{getDeviceIcon()}</div>
                                <div>
                                  <div className="font-extrabold text-xs text-slate-900 leading-tight">{eq.nome}</div>
                                  <div className="font-mono text-[10px] text-slate-500 font-bold">{eq.patrimonio}</div>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  eq.status === 'EM_USO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : eq.status === 'EM_MANUTENCAO'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {eq.status === 'EM_USO' ? 'Em Uso' : eq.status === 'EM_MANUTENCAO' ? 'Em Manutenção' : eq.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 mt-2">
                              {eq.marcaModelo && (
                                <div><strong className="text-slate-800">Modelo:</strong> {eq.marcaModelo}</div>
                              )}
                              {eq.posicaoCaixa && (
                                <div className="text-blue-700 font-medium"><strong className="text-slate-800">Posição:</strong> {eq.posicaoCaixa}</div>
                              )}
                              {eq.enderecoIp && (
                                <div><strong className="text-slate-800">IP:</strong> <span className="font-mono bg-slate-100 px-1 rounded">{eq.enderecoIp}</span></div>
                              )}
                              {eq.numeroSerie && (
                                <div><strong className="text-slate-800">Serial:</strong> <span className="font-mono">{eq.numeroSerie}</span></div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {onOpenEquipmentDetail && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEquipmentDetail(eq)}
                                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] cursor-pointer"
                                >
                                  Detalhes
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditEquipmentInStore(eq, activeSelectedStore, e)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Editar dados deste equipamento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRequestDeleteEquipment(eq, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Excluir este equipamento da loja"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {onOpenNewServiceOrderForStore && (
                              <button
                                type="button"
                                onClick={() => onOpenNewServiceOrderForStore(activeSelectedStore, eq)}
                                className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 font-bold text-[11px] rounded-md transition-colors cursor-pointer shrink-0"
                              >
                                + Abrir OS
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Section: Ordens de Serviço Recentes da Loja */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span>Ordens de Serviço desta Loja ({storeOrders.length})</span>
                    </h4>
                  </div>

                  {storeOrders.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      Nenhuma ordem de serviço registrada para esta loja até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {storeOrders.slice(0, 5).map((os) => (
                        <div
                          key={os.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {os.numeroOs}
                              </span>
                              <span className="font-bold text-slate-900">
                                {os.identificacao || os.equipamentoNome || 'Atendimento Loja'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  os.status === 'CONCLUIDA' || os.status === 'PRONTA'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {os.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {os.defeitoRelatado}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 text-right shrink-0">
                            <div>{os.dataEntrada}</div>
                            <div className="font-medium text-slate-600">{os.tecnicoResponsavel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 space-y-3">
              <StoreIcon className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Selecione uma filial para gerenciar seu inventário</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique em qualquer loja na coluna da esquerda para visualizar os computadores, PDVs, impressoras e balanças instalados, ou adicionar novos equipamentos e ordens de serviço.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Cadastrar / Editar Cliente Matriz */}
      {isClientModalOpen && (
        <ClientFormModal
          client={editingClient}
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={(data) => {
            if (editingClient) {
              const res = updateClient(editingClient.id, data);
              if (res.success) {
                showFeedback(`Cliente ${data.nomeFantasia || data.razaoSocial} atualizado com sucesso!`);
                setIsClientModalOpen(false);
              } else {
                showFeedback(res.error || 'Erro ao atualizar cliente', 'error');
              }
            } else {
              const res = addClient(data);
              if (res.success && res.client) {
                showFeedback(`Cliente ${res.client.nomeFantasia || res.client.razaoSocial} cadastrado com sucesso!`);
                setExpandedClientId(res.client.id);
                setIsClientModalOpen(false);
              } else {
                showFeedback(res.error || 'Erro ao cadastrar cliente', 'error');
              }
            }
          }}
        />
      )}

      {/* MODAL 2: Cadastrar / Editar Loja / Filial */}
      {isStoreModalOpen && (
        <StoreFormModal
          store={editingStore}
          clients={clients}
          preselectedClientId={preselectedClientIdForStore}
          isOpen={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          onSave={(data) => {
            if (editingStore) {
              const res = updateStore(editingStore.id, data);
              if (res.success) {
                showFeedback(`Loja ${data.nome} atualizada com sucesso!`);
                setIsStoreModalOpen(false);
              } else {
                showFeedback(res.error || 'Erro ao atualizar loja', 'error');
              }
            } else {
              const res = addStore(data);
              if (res.success && res.store) {
                showFeedback(`Loja ${res.store.nome} cadastrada com sucesso!`);
                setSelectedStoreId(res.store.id);
                setExpandedClientId(res.store.clienteId);
                setIsStoreModalOpen(false);
              } else {
                showFeedback(res.error || 'Erro ao cadastrar loja', 'error');
              }
            }
          }}
        />
      )}

      {/* MODAL 3: Cadastrar / Editar Equipamento na Loja */}
      {isNewEquipmentModalOpen && targetStoreForEquipment && (
        <NewStoreEquipmentModal
          store={targetStoreForEquipment}
          equipmentToEdit={editingEquipmentForStore}
          isOpen={isNewEquipmentModalOpen}
          onClose={() => {
            setIsNewEquipmentModalOpen(false);
            setEditingEquipmentForStore(null);
          }}
          onSave={handleSaveEquipment}
        />
      )}

      {/* MODAL 4: Matriz Especial de Filiais Pata Negra (1 a 43) */}
      {isPataNegraMatrixOpen && (
        <PataNegraMatrixModal
          isOpen={isPataNegraMatrixOpen}
          onClose={() => setIsPataNegraMatrixOpen(false)}
          pataNegraClient={pataNegraClient}
          stores={stores}
          onOpenAddStore={(clientId) => handleOpenAddStore(clientId || pataNegraClient?.id)}
          onOpenEditStore={(st) => handleOpenEditStore(st, { stopPropagation: () => {} } as any)}
          onRequestDeleteStore={(st) => handleRequestDeleteStore(st, { stopPropagation: () => {} } as any)}
          onToggleStatus={(storeId) => toggleStoreStatus(storeId)}
          onBatchUpsert={(list) => batchUpsertStores(list)}
        />
      )}

      {/* MODAL 5: Confirmação de Exclusão In-App (Seguro para iframe) */}
      {confirmDeleteState && (
        <ConfirmModal
          isOpen={confirmDeleteState.isOpen}
          title={confirmDeleteState.title}
          message={confirmDeleteState.message}
          confirmText={confirmDeleteState.confirmText || 'Confirmar Exclusão'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteState(null)}
          variant="danger"
        />
      )}
    </div>
  );
};

// ============================================================================
// Subcomponent 1: ClientFormModal
// ============================================================================
interface ClientFormModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ client, isOpen, onClose, onSave }) => {
  const [razaoSocial, setRazaoSocial] = useState(client?.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(client?.nomeFantasia || '');
  const [cnpj, setCnpj] = useState(client?.cnpj || '');
  const [codigo, setCodigo] = useState(client?.codigo || '');
  const [telefone, setTelefone] = useState(client?.telefone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [responsavel, setResponsavel] = useState(client?.responsavel || '');
  const [observacoes, setObservacoes] = useState(client?.observacoes || '');
  const [status, setStatus] = useState<'ativo' | 'inativo'>(client?.status || 'ativo');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim() && !nomeFantasia.trim()) {
      setFormError('Informe ao menos a Razão Social ou Nome Fantasia.');
      return;
    }
    setFormError(null);

    onSave({
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      cnpj: cnpj.trim() || undefined,
      codigo: codigo.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      responsavel: responsavel.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-base">
              {client ? 'Editar Cliente Matriz' : 'Novo Cliente Matriz'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-red-500 hover:text-red-800 ml-2">
                ✕
              </button>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nome Fantasia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mark Security"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Razão Social / Nome da Empresa</label>
            <input
              type="text"
              placeholder="Ex: Mark Security Soluções Tecnológicas Ltda"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Código Interno</label>
              <input
                type="text"
                placeholder="Ex: MARK-01 (ou deixe em branco)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400">Gerado automaticamente se vazio.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNPJ (quando aplicável)</label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                placeholder="(11) 4198-7000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="contato@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Responsável Geral</label>
              <input
                type="text"
                placeholder="Ex: Eduardo Martins"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold bg-white"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observações Gerais</label>
            <textarea
              rows={2}
              placeholder="Instruções de atendimento, particularidades do cliente..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
            >
              {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Subcomponent 2: StoreFormModal
// ============================================================================
interface StoreFormModalProps {
  store: Store | null;
  clients: Client[];
  preselectedClientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const StoreFormModal: React.FC<StoreFormModalProps> = ({
  store,
  clients,
  preselectedClientId,
  isOpen,
  onClose,
  onSave,
}) => {
  const [clienteId, setClienteId] = useState(store?.clienteId || preselectedClientId || (clients[0]?.id || ''));
  const [nome, setNome] = useState(store?.nome || '');
  const [codigoLoja, setCodigoLoja] = useState(store?.codigoLoja || '');
  const [cnpj, setCnpj] = useState(store?.cnpj || '');
  const [endereco, setEndereco] = useState(store?.endereco || '');
  const [cidade, setCidade] = useState(store?.cidade || 'Barueri');
  const [estado, setEstado] = useState(store?.estado || 'SP');
  const [cep, setCep] = useState(store?.cep || '');
  const [telefone, setTelefone] = useState(store?.telefone || '');
  const [responsavelLocal, setResponsavelLocal] = useState(store?.responsavelLocal || '');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState(store?.horarioFuncionamento || '08:00 às 20:00');
  const [observacoes, setObservacoes] = useState(store?.observacoes || '');
  const [status, setStatus] = useState<'ativo' | 'inativo'>(store?.status || 'ativo');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setFormError('Selecione o cliente matriz.');
      return;
    }
    if (!nome.trim()) {
      setFormError('Informe o Nome Fantasia / Identificação da filial.');
      return;
    }
    setFormError(null);

    const client = clients.find((c) => c.id === clienteId);

    onSave({
      clienteId,
      clienteNome: client?.nomeFantasia || client?.razaoSocial,
      nome: nome.trim(),
      codigoLoja: codigoLoja.trim(),
      cnpj: cnpj.trim() || undefined,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim().toUpperCase(),
      cep: cep.trim() || undefined,
      telefone: telefone.trim() || undefined,
      responsavelLocal: responsavelLocal.trim() || undefined,
      horarioFuncionamento: horarioFuncionamento.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StoreIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">
              {store ? 'Editar Filial / Loja' : 'Cadastrar Nova Filial / Loja'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-red-500 hover:text-red-800 ml-2">
                ✕
              </button>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Cliente Matriz Responsável <span className="text-red-500">*</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold bg-white"
            >
              <option value="">Selecione o Cliente Matriz...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nomeFantasia || c.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nome Fantasia (Exibição da Filial) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Loja 01 — Alphaville Barueri"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
              />
              <span className="text-[10px] text-slate-400">Identificação exibida na interface.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ID Empresa (Código 1 a 43)</label>
              <input
                type="text"
                placeholder="Ex: 01"
                value={codigoLoja}
                onChange={(e) => setCodigoLoja(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">Exato da loja.</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Endereço Completo</label>
            <input
              type="text"
              required
              placeholder="Rua, Número, Bairro (Ex: Rua Campos Sales, 320 - Centro)"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                required
                placeholder="Ex: Barueri"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                placeholder="SP"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CEP</label>
              <input
                type="text"
                placeholder="06401-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Responsável Local (Gerente)</label>
              <input
                type="text"
                placeholder="Ex: Roberto Alves"
                value={responsavelLocal}
                onChange={(e) => setResponsavelLocal(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefone da Loja</label>
              <input
                type="text"
                placeholder="(11) 4198-7101"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                placeholder="Ex: Seg a Sáb 08:00 às 22:00"
                value={horarioFuncionamento}
                onChange={(e) => setHorarioFuncionamento(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status da Loja (Indicador)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold bg-white"
              >
                <option value="ativo">🟢 Ativa (Bolinha Verde — Em Operação)</option>
                <option value="inativo">🔴 Inativa (Bolinha Vermelha — Preservada)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observações de Acesso ou Atendimento</label>
            <textarea
              rows={2}
              placeholder="Instruções de acesso ao mezanino de TI, chaves, portaria, contatos..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
            >
              {store ? 'Salvar Alterações' : 'Cadastrar Loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Subcomponent 3: NewStoreEquipmentModal (Item 4 do prompt)
// ============================================================================
interface NewStoreEquipmentModalProps {
  store: Store;
  equipmentToEdit?: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
}

export const NewStoreEquipmentModal: React.FC<NewStoreEquipmentModalProps> = ({
  store,
  equipmentToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [tipo, setTipo] = useState<EquipmentType>(equipmentToEdit?.tipo || 'PDV');
  const [nome, setNome] = useState(equipmentToEdit?.nome || 'PDV 01');
  const [patrimonio, setPatrimonio] = useState(equipmentToEdit?.patrimonio || '');
  const [posicaoCaixa, setPosicaoCaixa] = useState(equipmentToEdit?.posicaoCaixa || 'Frente de Caixa 01');
  const [marca, setMarca] = useState(equipmentToEdit?.marca || 'Dell');
  const [modelo, setModelo] = useState(equipmentToEdit?.modelo || 'OptiPlex 3050 Micro');
  const [numeroSerie, setNumeroSerie] = useState(equipmentToEdit?.numeroSerie || '');
  const [enderecoIp, setEnderecoIp] = useState(equipmentToEdit?.enderecoIp || '');
  const [sistemaOperacional, setSistemaOperacional] = useState(equipmentToEdit?.sistemaOperacional || 'Windows 10 Pro 64-bit');
  const [dataInstalacao, setDataInstalacao] = useState(
    equipmentToEdit?.dataInstalacao || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<Equipment['status']>(equipmentToEdit?.status || 'EM_USO');
  const [observacoes, setObservacoes] = useState(equipmentToEdit?.observacoes || '');

  React.useEffect(() => {
    if (equipmentToEdit) {
      setTipo(equipmentToEdit.tipo || 'PDV');
      setNome(equipmentToEdit.nome || '');
      setPatrimonio(equipmentToEdit.patrimonio || '');
      setPosicaoCaixa(equipmentToEdit.posicaoCaixa || '');
      setMarca(equipmentToEdit.marca || '');
      setModelo(equipmentToEdit.modelo || '');
      setNumeroSerie(equipmentToEdit.numeroSerie || '');
      setEnderecoIp(equipmentToEdit.enderecoIp || '');
      setSistemaOperacional(equipmentToEdit.sistemaOperacional || '');
      setDataInstalacao(equipmentToEdit.dataInstalacao || new Date().toISOString().split('T')[0]);
      setStatus(equipmentToEdit.status || 'EM_USO');
      setObservacoes(equipmentToEdit.observacoes || '');
    } else {
      setTipo('PDV');
      setNome('PDV 01');
      setPatrimonio('');
      setPosicaoCaixa('Frente de Caixa 01');
      setMarca('Dell');
      setModelo('OptiPlex 3050 Micro');
      setNumeroSerie('');
      setEnderecoIp('');
      setSistemaOperacional('Windows 10 Pro 64-bit');
      setDataInstalacao(new Date().toISOString().split('T')[0]);
      setStatus('EM_USO');
      setObservacoes('');
    }
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  // Adapt presets based on type
  const handleTypeChange = (newType: EquipmentType) => {
    setTipo(newType);
    switch (newType) {
      case 'PDV':
        setNome('PDV 01');
        setPosicaoCaixa('Frente de Caixa');
        setMarca('Dell');
        setModelo('OptiPlex 3050 Micro');
        setSistemaOperacional('Windows 10 Pro 64-bit');
        break;
      case 'IMPRESSORA':
        setNome('Impressora Térmica Não Fiscal');
        setPosicaoCaixa('Caixa 01');
        setMarca('Epson');
        setModelo('TM-T20X USB/Serial');
        setSistemaOperacional('');
        setEnderecoIp('');
        break;
      case 'BALANCA':
        setNome('Balança Computadora de Mesa');
        setPosicaoCaixa('Balcão Açougue / Hortifruti');
        setMarca('Toledo');
        setModelo('Prix 5 Plus');
        setEnderecoIp('192.168.0.201');
        setSistemaOperacional('');
        break;
      case 'DVR':
        setNome('DVR de Câmeras CFTV');
        setPosicaoCaixa('Rack Sala TI');
        setMarca('Hikvision');
        setModelo('16 Canais AcuSense');
        setEnderecoIp('192.168.1.200');
        setSistemaOperacional('Firmware Hikvision');
        break;
      case 'SWITCH':
        setNome('Switch Core Gigabit');
        setPosicaoCaixa('Rack Mezanino');
        setMarca('Intelbras');
        setModelo('24 Portas Gigabit');
        setEnderecoIp('192.168.1.2');
        setSistemaOperacional('');
        break;
      case 'ROTEADOR':
        setNome('Roteador Principal');
        setPosicaoCaixa('Rack Mezanino');
        setMarca('MikroTik');
        setModelo('RB750Gr3');
        setEnderecoIp('192.168.1.1');
        setSistemaOperacional('RouterOS');
        break;
      case 'COMPUTADOR':
        setNome('Computador Administrativo');
        setPosicaoCaixa('Escritório / Retaguarda');
        setMarca('Dell');
        setModelo('Vostro 3681');
        setSistemaOperacional('Windows 11 Pro 64-bit');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      return;
    }

    onSave(
      {
        nome: nome.trim(),
        patrimonio: patrimonio.trim() || (undefined as any),
        tipo,
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        marcaModelo: `${marca.trim()} ${modelo.trim()}`.trim(),
        numeroSerie: numeroSerie.trim() || undefined,
        clienteId: store.clienteId,
        clienteNome: store.clienteNome,
        lojaId: store.id,
        lojaNome: store.nome,
        lojaOrigem: store.nome,
        posicaoCaixa: posicaoCaixa.trim() || undefined,
        localizacaoAtual: 'LOJA',
        status,
        enderecoIp: enderecoIp.trim() || undefined,
        sistemaOperacional: sistemaOperacional.trim() || undefined,
        dataInstalacao: dataInstalacao || undefined,
        dataPrimeiroCadastro: equipmentToEdit?.dataPrimeiroCadastro || new Date().toISOString().split('T')[0],
        tecnicoResponsavel: equipmentToEdit?.tecnicoResponsavel || 'Carlos Silva',
        observacoes: observacoes.trim() || undefined,
      },
      equipmentToEdit?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] text-blue-300 font-bold uppercase tracking-wider">
              {store.nome}
            </div>
            <h3 className="font-extrabold text-base mt-0.5">
              {equipmentToEdit ? 'Editar Equipamento da Loja' : 'Registrar Equipamento na Loja'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Tipo do equipamento */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tipo de Equipamento</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 font-bold">
              {(
                [
                  ['PDV', 'PDV'],
                  ['COMPUTADOR', 'Computador'],
                  ['IMPRESSORA', 'Impressora'],
                  ['BALANCA', 'Balança'],
                  ['DVR', 'DVR/CFTV'],
                  ['SWITCH', 'Switch'],
                  ['ROTEADOR', 'Roteador'],
                  ['OUTRO', 'Outro'],
                ] as [EquipmentType, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleTypeChange(val)}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                    tipo === val
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome / Identificação <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: PDV 01, Balança Prix 5"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Posição / Caixa na Loja</label>
              <input
                type="text"
                placeholder="Ex: Caixa 01, Açougue, Mezanino"
                value={posicaoCaixa}
                onChange={(e) => setPosicaoCaixa(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ex: Dell, Toledo, Epson"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ex: Prix 5 Plus, OptiPlex"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Código Interno / Patrimônio</label>
              <input
                type="text"
                placeholder="Auto se vazio (Ex: EQ-0105)"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Número de Série (se disponível)</label>
              <input
                type="text"
                placeholder="Service Tag / Serial"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Campos adaptáveis conforme o tipo */}
          {(tipo === 'BALANCA' || tipo === 'DVR' || tipo === 'SWITCH' || tipo === 'ROTEADOR' || tipo === 'PDV' || tipo === 'COMPUTADOR') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço IP (quando aplicável)</label>
                <input
                  type="text"
                  placeholder="Ex: 192.168.0.201"
                  value={enderecoIp}
                  onChange={(e) => setEnderecoIp(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono bg-white"
                />
              </div>

              {(tipo === 'PDV' || tipo === 'COMPUTADOR' || tipo === 'ROTEADOR' || tipo === 'DVR') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sistema Operacional / Firmware</label>
                  <input
                    type="text"
                    placeholder="Ex: Windows 10 Pro 64-bit"
                    value={sistemaOperacional}
                    onChange={(e) => setSistemaOperacional(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data de Instalação</label>
              <input
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Atual</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="EM_USO">Ativo (Em Produção na Loja)</option>
                <option value="EM_MANUTENCAO">Em Manutenção</option>
                <option value="AGUARDANDO_MANUTENCAO">Aguardando Manutenção</option>
                <option value="DESATIVADO">Baixado / Sucata</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observações Técnicas</label>
            <textarea
              rows={2}
              placeholder="Detalhes de portas, cabos, fontes, softwares específicos instalados..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
            >
              {equipmentToEdit ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
