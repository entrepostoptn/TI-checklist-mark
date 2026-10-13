import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ServiceOrder, ServiceOrderStatus } from '../types/serviceOrder';

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

const INITIAL_DEMO_ORDERS: ServiceOrder[] = [
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
    dataEntrada: new Date().toISOString().split('T')[0],
    dataPrevisao: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checklistProgresso: 45,
    checklistConcluido: false,
    observacoes: 'Aguardando validação da carga MGV e comunicação da balança Toledo.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    dataEntrada: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Balança Toledo configurada em IP 192.168.0.201. Pronta para envio em caso de pane.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    dataEntrada: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Reservada no armário 2 da TI.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    dataEntrada: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    dataConclusao: new Date().toISOString().split('T')[0],
    checklistProgresso: 100,
    checklistConcluido: true,
    observacoes: 'Homologada 100%. Aguardando motorista/gerente da Loja Shopping para retirada.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ServiceOrderContext = createContext<ServiceOrderContextType | null>(null);

export const ServiceOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler ordens de serviço do localStorage', e);
    }
    return INITIAL_DEMO_ORDERS;
  });

  const [activeStatusFilter, setActiveStatusFilter] = useState<ServiceOrderStatus | 'ALL'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Erro ao salvar ordens de serviço', e);
    }
  }, [orders]);

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
    return newOrder;
  }, [orders.length]);

  const updateOrder = useCallback((id: string, patch: Partial<ServiceOrder>) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        return {
          ...order,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  }, []);

  const changeOrderStatus = useCallback((id: string, status: ServiceOrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const updates: Partial<ServiceOrder> = {
          status,
          updatedAt: new Date().toISOString(),
        };
        if (status === 'PRONTA' && !order.dataConclusao) {
          updates.dataConclusao = new Date().toISOString().split('T')[0];
        }
        return { ...order, ...updates };
      })
    );
  }, []);

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
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ordens_servico_ti_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [orders]);

  const importOrdersJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        setOrders(parsed);
        return true;
      }
    } catch (e) {
      console.error('Falha ao importar ordens de serviço', e);
    }
    return false;
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
