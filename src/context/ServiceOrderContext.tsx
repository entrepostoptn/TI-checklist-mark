import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ServiceOrder, ServiceOrderStatus } from '../types/serviceOrder';
import {
  subscribeToServiceOrders,
  syncSaveServiceOrder,
  syncDeleteServiceOrder,
  checkAndInitializeDatabase,
} from '../services/firestoreSync';

interface ServiceOrderContextType {
  orders: ServiceOrder[];
  addOrder: (order: Omit<ServiceOrder, 'id' | 'numeroOs' | 'createdAt' | 'updatedAt'>) => ServiceOrder;
  updateOrder: (id: string, patch: Partial<ServiceOrder>) => void;
  deleteOrder: (id: string) => void;
  changeOrderStatus: (id: string, status: ServiceOrderStatus) => void;

  // Status counts
  reparoCount: number;
  reservaCount: number;
  prontaCount: number;
  operacaoCount: number;
  totalCount: number;
  abertasCount: number;
  emAndamentoCount: number;
  concluidasCount: number;
  criticasCount: number;

  // Filters & State
  activeStatusFilter: ServiceOrderStatus | 'ALL';
  setActiveStatusFilter: (status: ServiceOrderStatus | 'ALL') => void;
  searchFilter: string;
  setSearchFilter: (query: string) => void;

  // Helpers
  getOrderById: (id: string) => ServiceOrder | undefined;
  getOrdersByEquipmentId: (equipamentoId: string) => ServiceOrder[];
  getOrdersByStoreId: (storeId: string) => ServiceOrder[];
  getOrdersByClientId: (clientId: string) => ServiceOrder[];
  exportOrdersJSON: () => void;
  importOrdersJSON: (jsonData: string) => boolean;
}

const STORAGE_KEY_ORDERS = 'it_service_orders_v2';

export const INITIAL_DEMO_ORDERS: ServiceOrder[] = [
  {
    id: 'os_101',
    numeroOs: 'OS-101',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    equipamentoId: 'eq_2',
    equipamentoNome: 'PDV-02',
    identificacao: 'PDV-02',
    patrimonio: 'PAT-0042',
    numeroSerie: 'BRJ9045-DEL',
    tipo: 'PDV',
    lojaOrigem: 'Loja 01 — Barueri',
    lojaDestino: 'Loja 01 — Barueri',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    categoriaAtendimento: 'PDV & Frente de Caixa',
    tipoServico: 'corretivo',
    defeitoRelatado: 'Travando na tela de inicialização do Windows e balança não respondendo na frente de caixa.',
    diagnosticoTecnico: 'Setores defeituosos no SSD antigo. Necessária troca e formatação limpa com MGV e Full PDV.',
    procedimentosExecutados: 'Substituído SSD antigo por SSD 240GB Kingston e imagem padrão instalada.',
    servicosExecutados: 'Substituído SSD antigo por SSD 240GB Kingston.',
    pecasTrocadas: 'SSD 240GB Kingston SATA III',
    dataEntrada: '2026-10-12',
    dataHoraAbertura: '2026-10-12T09:15:00Z',
    dataPrevisao: '2026-10-14',
    checklistProgresso: 45,
    checklistConcluido: false,
    observacoes: 'Aguardando validação da carga MGV e comunicação da balança Toledo.',
    createdAt: '2026-10-12T09:15:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'os_102',
    numeroOs: 'OS-102',
    clienteId: 'cli_interno',
    clienteNome: 'Estoque Central TI',
    lojaId: 'store_estoque_central',
    lojaNome: 'Bancada TI & Estoque Central',
    equipamentoId: 'eq_reserva_1',
    equipamentoNome: 'PDV-RES-01',
    identificacao: 'PDV-RES-01',
    patrimonio: 'PAT-0099',
    numeroSerie: 'BRJ1182-DEL',
    tipo: 'PDV',
    lojaOrigem: 'Bancada TI & Estoque Central',
    tecnicoResponsavel: 'Marcos Oliveira',
    status: 'CONCLUIDA',
    prioridade: 'NORMAL',
    categoriaAtendimento: 'Bancada / Reserva',
    tipoServico: 'preventivo',
    defeitoRelatado: 'Máquina reserva de contingência para substituição rápida de frente de caixa.',
    diagnosticoTecnico: 'Hardware 100% testado. Imagem padrão instalada com MGV, SIU/Impressor e Full PDV.',
    procedimentosExecutados: 'Formatação completa, testes de porta serial/COM e estresse de memória.',
    servicosExecutados: 'Formatação completa, testes de porta serial/COM e estresse de memória.',
    solucaoAplicada: 'Máquina homologada com sucesso. Disponível na gaveta de reserva.',
    dataEntrada: '2026-10-08',
    dataHoraAbertura: '2026-10-08T10:00:00Z',
    dataConclusao: '2026-10-08',
    dataHoraConclusao: '2026-10-08T15:30:00Z',
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Balança Toledo configurada em IP 192.168.0.201. Pronta para envio em caso de pane.',
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'os_103',
    numeroOs: 'OS-103',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_matriz',
    lojaNome: 'Matriz Administrativa — Barueri',
    semEquipamento: true,
    identificacao: 'Rede & Firewall MikroTik',
    tipo: 'ROTEADOR',
    lojaOrigem: 'Matriz Administrativa — Barueri',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'ABERTA',
    prioridade: 'CRITICA',
    categoriaAtendimento: 'Rede e Infraestrutura',
    tipoServico: 'corretivo',
    defeitoRelatado: 'Queda de conexão no link secundário da Matriz causando interrupção intermitente.',
    diagnosticoTecnico: 'Flap na porta Ether2 conectada ao modem de contingência Claro.',
    procedimentosExecutados: 'Testado cabo patch cord cat6 e verificada tabela de rotas do RouterOS.',
    dataEntrada: '2026-10-13',
    dataHoraAbertura: '2026-10-13T08:30:00Z',
    checklistProgresso: 20,
    checklistConcluido: false,
    observacoes: 'Chamado aberto diretamente para infraestrutura da loja sem equipamento de usuário final.',
    createdAt: '2026-10-13T08:30:00Z',
    updatedAt: '2026-10-13T08:30:00Z',
  },
  {
    id: 'os_104',
    numeroOs: 'OS-104',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    equipamentoId: 'eq_bal_1',
    equipamentoNome: 'Balança Prix 5 Plus Toledo',
    identificacao: 'Balança Prix 5 Plus',
    patrimonio: 'PAT-BAL-01',
    numeroSerie: 'TOL-PR5-99120',
    tipo: 'BALANCA',
    lojaOrigem: 'Loja 01 — Barueri',
    lojaDestino: 'Loja 01 — Barueri',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    categoriaAtendimento: 'Balança e Automação',
    tipoServico: 'configuracao',
    defeitoRelatado: 'Balança do açougue não aceita carga de produtos do MGV após alteração cadastral.',
    diagnosticoTecnico: 'IP da balança 192.168.0.201 estava em conflito com novo repetidor Wi-Fi.',
    procedimentosExecutados: 'Alterado IP para faixa estática reservada e retransmitida carga completa com 450 itens.',
    dataEntrada: '2026-10-13',
    dataHoraAbertura: '2026-10-13T10:00:00Z',
    checklistProgresso: 60,
    checklistConcluido: false,
    observacoes: 'Aguardando validação do operador do açougue após a reemissão das etiquetas.',
    createdAt: '2026-10-13T10:00:00Z',
    updatedAt: '2026-10-13T11:00:00Z',
  },
];

const ServiceOrderContext = createContext<ServiceOrderContextType | null>(null);

export const ServiceOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler ordens do cache local', e);
    }
    return INITIAL_DEMO_ORDERS;
  });

  const [activeStatusFilter, setActiveStatusFilter] = useState<ServiceOrderStatus | 'ALL'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Real-time Firestore Subscription for Service Orders
  useEffect(() => {
    // 1. One-time check/seed if Firestore is brand new
    checkAndInitializeDatabase([], INITIAL_DEMO_ORDERS, [], []).catch(() => {});

    // 2. Real-time subscription to service_orders collection
    const unsub = subscribeToServiceOrders(
      (remoteOrders) => {
        setOrders(remoteOrders);
        try {
          localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(remoteOrders));
        } catch {
          // ignore
        }
      },
      (err) => console.warn('Service orders sync snapshot error:', err)
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const addOrder = useCallback(
    (orderData: Omit<ServiceOrder, 'id' | 'numeroOs' | 'createdAt' | 'updatedAt'>): ServiceOrder => {
      // Find highest existing numeric suffix
      let highestNum = 100;
      orders.forEach((o) => {
        const match = o.numeroOs?.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > highestNum) highestNum = num;
        }
      });
      const nextNum = highestNum + 1;

      const newOrder: ServiceOrder = {
        ...orderData,
        id: `os_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        numeroOs: `OS-${nextNum}`,
        dataHoraAbertura: orderData.dataHoraAbertura || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Save to Firestore central DB
      syncSaveServiceOrder(newOrder).catch((err) => {
        console.error('Falha ao salvar OS no Firestore', err);
      });

      return newOrder;
    },
    [orders]
  );

  const updateOrder = useCallback(
    (id: string, patch: Partial<ServiceOrder>) => {
      const current = orders.find((o) => o.id === id);
      if (!current) return;

      const updatedOrder: ServiceOrder = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order))
      );

      // Save to Firestore central DB
      syncSaveServiceOrder(updatedOrder).catch((err) => {
        console.error('Falha ao atualizar OS no Firestore', err);
      });
    },
    [orders]
  );

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    // Delete in Firestore
    syncDeleteServiceOrder(id).catch((err) => {
      console.error('Falha ao excluir OS no Firestore', err);
    });
  }, []);

  const changeOrderStatus = useCallback(
    (id: string, status: ServiceOrderStatus) => {
      const current = orders.find((o) => o.id === id);
      if (!current) return;

      const updates: Partial<ServiceOrder> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if ((status === 'CONCLUIDA' || status === 'PRONTA') && !current.dataConclusao) {
        updates.dataConclusao = new Date().toISOString().split('T')[0];
        updates.dataHoraConclusao = new Date().toISOString();
      }

      const updatedOrder = { ...current, ...updates };

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order))
      );

      syncSaveServiceOrder(updatedOrder).catch((err) => {
        console.error('Falha ao mudar status da OS no Firestore', err);
      });
    },
    [orders]
  );

  const getOrderById = useCallback(
    (id: string) => {
      return orders.find((o) => o.id === id);
    },
    [orders]
  );

  const getOrdersByEquipmentId = useCallback(
    (equipamentoId: string) => {
      return orders.filter((o) => o.equipamentoId === equipamentoId);
    },
    [orders]
  );

  const getOrdersByStoreId = useCallback(
    (storeId: string) => {
      return orders.filter(
        (o) => o.lojaId === storeId || o.lojaOrigem === storeId
      );
    },
    [orders]
  );

  const getOrdersByClientId = useCallback(
    (clientId: string) => {
      return orders.filter((o) => o.clienteId === clientId);
    },
    [orders]
  );

  // Statistics
  const stats = useMemo(() => {
    let reparo = 0;
    let reserva = 0;
    let pronta = 0;
    let operacao = 0;
    let abertas = 0;
    let emAndamento = 0;
    let concluidas = 0;
    let criticas = 0;

    orders.forEach((o) => {
      if (o.status === 'REPARO_ESCRITORIO') reparo++;
      else if (o.status === 'RESERVA') reserva++;
      else if (o.status === 'PRONTA') pronta++;
      else if (o.status === 'EM_OPERACAO') operacao++;

      if (o.status === 'ABERTA' || o.status === 'REPARO_ESCRITORIO') abertas++;
      if (o.status === 'EM_ANDAMENTO') emAndamento++;
      if (o.status === 'CONCLUIDA' || o.status === 'PRONTA') concluidas++;

      const isPendente = o.status !== 'CONCLUIDA' && o.status !== 'PRONTA' && o.status !== 'CANCELADA';
      if (isPendente && (o.prioridade === 'CRITICA' || o.prioridade === 'URGENTE' || o.prioridade === 'ALTA')) {
        criticas++;
      }
    });

    return {
      reparoCount: reparo,
      reservaCount: reserva,
      prontaCount: pronta,
      operacaoCount: operacao,
      totalCount: orders.length,
      abertasCount: abertas,
      emAndamentoCount: emAndamento,
      concluidasCount: concluidas,
      criticasCount: criticas,
    };
  }, [orders]);

  const exportOrdersJSON = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(orders, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ordens_de_servico_ti_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [orders]);

  const importOrdersJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        setOrders(parsed);
        parsed.forEach((order: ServiceOrder) => {
          syncSaveServiceOrder(order).catch(() => {});
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erro ao importar JSON de ordens', e);
      return false;
    }
  }, []);

  return (
    <ServiceOrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        changeOrderStatus,
        reparoCount: stats.reparoCount,
        reservaCount: stats.reservaCount,
        prontaCount: stats.prontaCount,
        operacaoCount: stats.operacaoCount,
        totalCount: stats.totalCount,
        abertasCount: stats.abertasCount,
        emAndamentoCount: stats.emAndamentoCount,
        concluidasCount: stats.concluidasCount,
        criticasCount: stats.criticasCount,
        activeStatusFilter,
        setActiveStatusFilter,
        searchFilter,
        setSearchFilter,
        getOrderById,
        getOrdersByEquipmentId,
        getOrdersByStoreId,
        getOrdersByClientId,
        exportOrdersJSON,
        importOrdersJSON,
      }}
    >
      {children}
    </ServiceOrderContext.Provider>
  );
};

export const useServiceOrders = () => {
  const context = useContext(ServiceOrderContext);
  if (!context) {
    throw new Error('useServiceOrders deve ser usado dentro de um ServiceOrderProvider');
  }
  return context;
};
