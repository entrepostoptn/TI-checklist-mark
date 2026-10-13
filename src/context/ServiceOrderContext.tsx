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
  
  // Filters & State
  activeStatusFilter: ServiceOrderStatus | 'ALL';
  setActiveStatusFilter: (status: ServiceOrderStatus | 'ALL') => void;
  searchFilter: string;
  setSearchFilter: (query: string) => void;
  
  // Helpers
  getOrderById: (id: string) => ServiceOrder | undefined;
  exportOrdersJSON: () => void;
  importOrdersJSON: (jsonData: string) => boolean;
}

const STORAGE_KEY_ORDERS = 'it_service_orders_v1';

export const INITIAL_DEMO_ORDERS: ServiceOrder[] = [
  {
    id: 'os_101',
    numeroOs: 'OS-101',
    identificacao: 'PDV-02',
    patrimonio: 'PAT-0042',
    tipo: 'PDV',
    lojaOrigem: 'Loja 01 - Centro',
    lojaDestino: 'Loja 01 - Centro',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'REPARO_ESCRITORIO',
    prioridade: 'ALTA',
    defeitoRelatado: 'Travando na tela de inicialização do Windows e balança não respondendo.',
    diagnosticoTecnico: 'Setores defeituosos no SSD antigo. Necessária troca e formatação limpa com MGV e Full PDV.',
    servicosExecutados: 'Substituído SSD antigo por SSD 240GB Kingston.',
    pecasTrocadas: 'SSD 240GB Kingston SATA III',
    dataEntrada: '2026-10-12',
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
    identificacao: 'PDV-RES-01',
    patrimonio: 'PAT-0099',
    tipo: 'PDV',
    lojaOrigem: 'Estoque Central TI',
    tecnicoResponsavel: 'Marcos Oliveira',
    status: 'RESERVA',
    prioridade: 'MEDIA',
    defeitoRelatado: 'Máquina reserva de contingência para substituição rápida de frente de caixa.',
    diagnosticoTecnico: 'Hardware 100% testado. Imagem padrão instalada com MGV, SIU/Impressor e Full PDV.',
    servicosExecutados: 'Formatação completa, testes de porta serial/COM e estresse de memória.',
    dataEntrada: '2026-10-08',
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Balança Toledo configurada em IP 192.168.0.201. Pronta para envio em caso de pane.',
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'os_103',
    numeroOs: 'OS-103',
    identificacao: 'EST-RES-01',
    patrimonio: 'PAT-0105',
    tipo: 'ESCRITORIO',
    lojaOrigem: 'Estoque Central TI',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'RESERVA',
    prioridade: 'MEDIA',
    defeitoRelatado: 'Estação de trabalho reserva para gerência ou retaguarda.',
    diagnosticoTecnico: 'Sistema operacional ativado e suíte Office instalada e homologada.',
    servicosExecutados: 'Instalação Windows 11 Pro, Office 2021, impressora padrão e AnyDesk.',
    dataEntrada: '2026-10-05',
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Reservada no armário 2 da TI.',
    createdAt: '2026-10-05T14:00:00Z',
    updatedAt: '2026-10-05T15:00:00Z',
  },
  {
    id: 'os_104',
    numeroOs: 'OS-104',
    identificacao: 'CX-04',
    patrimonio: 'PAT-0078',
    tipo: 'PDV',
    lojaOrigem: 'Loja 03 - Shopping',
    lojaDestino: 'Loja 03 - Shopping',
    tecnicoResponsavel: 'Carlos Silva',
    status: 'PRONTA',
    prioridade: 'URGENTE',
    defeitoRelatado: 'Impressora Epson não cortava o papel e erro no módulo Impressor.',
    diagnosticoTecnico: 'Driver corrompido e spooler travado. Reinstalado driver TM-T20X e executado checklist completo.',
    servicosExecutados: 'Limpeza interna, reinstalação de drivers e teste final de homologação OK.',
    dataEntrada: '2026-10-10',
    dataConclusao: '2026-10-12',
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Homologada 100%. Aguardando motorista/gerente da Loja Shopping para retirada.',
    createdAt: '2026-10-10T11:30:00Z',
    updatedAt: '2026-10-12T16:00:00Z',
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
    return [];
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

  const addOrder = useCallback((orderData: Omit<ServiceOrder, 'id' | 'numeroOs' | 'createdAt' | 'updatedAt'>): ServiceOrder => {
    const nextSeq = orders.length + 101;
    const newOrder: ServiceOrder = {
      ...orderData,
      id: `os_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      numeroOs: `OS-${nextSeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Save to Firestore central DB
    syncSaveServiceOrder(newOrder).catch((err) => {
      console.error('Falha ao salvar OS no Firestore', err);
    });

    return newOrder;
  }, [orders.length]);

  const updateOrder = useCallback((id: string, patch: Partial<ServiceOrder>) => {
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
  }, [orders]);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    // Delete in Firestore
    syncDeleteServiceOrder(id).catch((err) => {
      console.error('Falha ao excluir OS no Firestore', err);
    });
  }, []);

  const changeOrderStatus = useCallback((id: string, status: ServiceOrderStatus) => {
    const current = orders.find((o) => o.id === id);
    if (!current) return;

    const updates: Partial<ServiceOrder> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === 'PRONTA' && !current.dataConclusao) {
      updates.dataConclusao = new Date().toISOString().split('T')[0];
    }

    const updatedOrder = { ...current, ...updates };

    setOrders((prev) =>
      prev.map((order) => (order.id === id ? updatedOrder : order))
    );

    syncSaveServiceOrder(updatedOrder).catch((err) => {
      console.error('Falha ao mudar status da OS no Firestore', err);
    });
  }, [orders]);

  const getOrderById = useCallback((id: string) => {
    return orders.find((o) => o.id === id);
  }, [orders]);

  // Statistics
  const stats = useMemo(() => {
    let reparo = 0;
    let reserva = 0;
    let pronta = 0;
    let operacao = 0;

    orders.forEach((o) => {
      if (o.status === 'REPARO_ESCRITORIO') reparo++;
      else if (o.status === 'RESERVA') reserva++;
      else if (o.status === 'PRONTA') pronta++;
      else if (o.status === 'EM_OPERACAO') operacao++;
    });

    return {
      reparoCount: reparo,
      reservaCount: reserva,
      prontaCount: pronta,
      operacaoCount: operacao,
      totalCount: orders.length,
    };
  }, [orders]);

  const exportOrdersJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
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
        activeStatusFilter,
        setActiveStatusFilter,
        searchFilter,
        setSearchFilter,
        getOrderById,
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
