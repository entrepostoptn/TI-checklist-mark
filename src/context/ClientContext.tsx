import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Client, Store } from '../types/client';
import {
  subscribeToClients,
  subscribeToStores,
  syncSaveClient,
  syncDeleteClient,
  syncSaveStore,
  syncDeleteStore,
  checkAndInitializeClientsAndStores,
} from '../services/firestoreSync';

interface ClientContextType {
  clients: Client[];
  stores: Store[];

  // CRUD Clientes
  addClient: (
    data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ) => { success: boolean; error?: string; client?: Client };
  updateClient: (id: string, patch: Partial<Client>) => { success: boolean; error?: string };
  deleteClient: (id: string) => { success: boolean; error?: string };

  // CRUD Lojas / Filiais
  addStore: (
    data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>
  ) => { success: boolean; error?: string; store?: Store };
  updateStore: (id: string, patch: Partial<Store>) => { success: boolean; error?: string };
  deleteStore: (id: string) => { success: boolean; error?: string };

  // Consultas e Filtros
  getClientById: (id: string) => Client | undefined;
  getStoreById: (id: string) => Store | undefined;
  getStoresByClientId: (clientId: string) => Store[];
  searchClients: (term: string) => Client[];
  searchStores: (term: string, clientId?: string) => Store[];

  // KPIs
  stats: {
    totalClientes: number;
    clientesAtivos: number;
    totalLojas: number;
    lojasAtivas: number;
  };
}

const STORAGE_KEY_CLIENTS = 'it_clients_v2';
const STORAGE_KEY_STORES = 'it_stores_v2';

export const INITIAL_DEMO_CLIENTS: Client[] = [
  {
    id: 'cli_mark',
    codigo: 'MARK-01',
    razaoSocial: 'Mark Security Soluções Tecnológicas Ltda',
    nomeFantasia: 'Mark Security',
    cnpj: '34.892.124/0001-80',
    telefone: '(11) 4198-7000',
    email: 'ti@marksecurity.com.br',
    responsavel: 'Eduardo Martins',
    observacoes: 'Cliente corporativo com rede de lojas na Grande São Paulo e parque de PDVs.',
    status: 'ativo',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cli_interno',
    codigo: 'TI-00',
    razaoSocial: 'Departamento de TI Corporativo & Suporte',
    nomeFantasia: 'Estoque Central TI',
    cnpj: '',
    telefone: '(11) 4198-7099',
    email: 'suporte@ti.corporativo.com',
    responsavel: 'Carlos Silva (Líder TI)',
    observacoes: 'Bancada central de manutenção, homologação e reserva técnica.',
    status: 'ativo',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
];

export const INITIAL_DEMO_STORES: Store[] = [
  {
    id: 'store_mark_matriz',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    nome: 'Matriz Administrativa — Barueri',
    codigoLoja: '00',
    cnpj: '34.892.124/0001-80',
    endereco: 'Av. Alphaville, 779 - 14º Andar - Alphaville Industrial',
    cidade: 'Barueri',
    estado: 'SP',
    cep: '06455-010',
    telefone: '(11) 4198-7001',
    responsavelLocal: 'Mariana Costa (Diretoria)',
    horarioFuncionamento: 'Seg a Sex: 08:00 às 18:00',
    observacoes: 'Acesso pela portaria principal. Requer crachá de visitante para piso técnico.',
    status: 'ativo',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'store_mark_01',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    nome: 'Loja 01 — Barueri',
    codigoLoja: '01',
    cnpj: '34.892.124/0002-61',
    endereco: 'Rua Campos Sales, 320 - Centro',
    cidade: 'Barueri',
    estado: 'SP',
    cep: '06401-000',
    telefone: '(11) 4198-7101',
    responsavelLocal: 'Roberto Alves (Gerente Geral)',
    horarioFuncionamento: 'Seg a Sáb: 08:00 às 22:00 | Dom: 09:00 às 18:00',
    observacoes: 'Terminal de frente de caixa com 4 PDVs, balanças Toledo e link dedicado.',
    status: 'ativo',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'store_mark_02',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    nome: 'Loja 02 — Osasco',
    codigoLoja: '02',
    cnpj: '34.892.124/0003-42',
    endereco: 'Av. dos Autonomistas, 1820 - Centro',
    cidade: 'Osasco',
    estado: 'SP',
    cep: '06020-010',
    telefone: '(11) 3681-4400',
    responsavelLocal: 'Juliana Prado (Gerente Operacional)',
    horarioFuncionamento: 'Seg a Sáb: 08:00 às 22:00 | Dom: 10:00 às 19:00',
    observacoes: 'Rack de rede localizado no mezanino técnico atrás do caixa 01.',
    status: 'ativo',
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'store_mark_03',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    nome: 'Loja 03 — Carapicuíba',
    codigoLoja: '03',
    cnpj: '34.892.124/0004-23',
    endereco: 'Av. Rui Barbosa, 650 - Centro',
    cidade: 'Carapicuíba',
    estado: 'SP',
    cep: '06311-000',
    telefone: '(11) 4184-9000',
    responsavelLocal: 'Marcos Vinícius (Subgerente)',
    horarioFuncionamento: 'Seg a Sáb: 08:00 às 20:00',
    observacoes: 'Acesso rápido para atendimento técnico de emergência.',
    status: 'ativo',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'store_mark_04',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    nome: 'Loja 04 — Itapevi',
    codigoLoja: '04',
    cnpj: '34.892.124/0005-04',
    endereco: 'Rua Leopoldina de Camargo, 140 - Centro',
    cidade: 'Itapevi',
    estado: 'SP',
    cep: '06653-000',
    telefone: '(11) 4141-8890',
    responsavelLocal: 'Patrícia Lima (Supervisora)',
    horarioFuncionamento: 'Seg a Sáb: 08:00 às 20:00',
    observacoes: 'Loja com 3 PDVs em linha e leitor de código de barras serial.',
    status: 'ativo',
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'store_estoque_central',
    clienteId: 'cli_interno',
    clienteNome: 'Estoque Central TI',
    nome: 'Bancada TI & Estoque Central',
    codigoLoja: 'TI-CENTRAL',
    endereco: 'Laboratório Técnico de TI - Bancada 01',
    cidade: 'Barueri',
    estado: 'SP',
    cep: '06401-000',
    telefone: '(11) 4198-7099',
    responsavelLocal: 'Equipe de Manutenção e Montagem',
    horarioFuncionamento: 'Seg a Sex: 08:00 às 18:00',
    observacoes: 'Local físico onde ficam armazenadas as máquinas prontas e reservas.',
    status: 'ativo',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
];

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage with Demo Fallback
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_DEMO_CLIENTS;
  });

  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STORES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_DEMO_STORES;
  });

  // 2. Real-time Firestore Sync
  useEffect(() => {
    // Check & initialize Firestore if empty
    checkAndInitializeClientsAndStores(INITIAL_DEMO_CLIENTS, INITIAL_DEMO_STORES);

    const unsubClients = subscribeToClients((syncedClients) => {
      if (syncedClients && syncedClients.length > 0) {
        setClients(syncedClients);
        try {
          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(syncedClients));
        } catch {
          // ignore
        }
      }
    });

    const unsubStores = subscribeToStores((syncedStores) => {
      if (syncedStores && syncedStores.length > 0) {
        setStores(syncedStores);
        try {
          localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(syncedStores));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      unsubClients();
      unsubStores();
    };
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
    } catch {
      // ignore
    }
  }, [stores]);

  // 3. Client CRUD with Uniqueness Validation
  const addClient = useCallback(
    (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const trimmedCodigo = (data.codigo || '').trim().toUpperCase();
      const trimmedRazao = (data.razaoSocial || '').trim();

      if (!trimmedRazao) {
        return { success: false, error: 'O nome da empresa ou razão social é obrigatório.' };
      }

      // Check duplicate code if provided
      if (trimmedCodigo) {
        const duplicate = clients.find(
          (c) => (c.codigo || '').trim().toUpperCase() === trimmedCodigo
        );
        if (duplicate) {
          return {
            success: false,
            error: `Já existe um cliente cadastrado com o código "${trimmedCodigo}" (${duplicate.razaoSocial}).`,
          };
        }
      }

      // Check duplicate CNPJ if provided
      if (data.cnpj && data.cnpj.trim().length > 5) {
        const cleanCnpj = data.cnpj.replace(/\D/g, '');
        const duplicateCnpj = clients.find(
          (c) => c.cnpj && c.cnpj.replace(/\D/g, '') === cleanCnpj
        );
        if (duplicateCnpj) {
          return {
            success: false,
            error: `Já existe um cliente cadastrado com este CNPJ (${duplicateCnpj.razaoSocial}).`,
          };
        }
      }

      const generatedCode =
        trimmedCodigo ||
        `CLI-${String(clients.length + 1).padStart(3, '0')}`;

      const newClient: Client = {
        ...data,
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        codigo: generatedCode,
        razaoSocial: trimmedRazao,
        nomeFantasia: data.nomeFantasia?.trim() || trimmedRazao,
        status: data.status || 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setClients((prev) => [newClient, ...prev]);
      syncSaveClient(newClient);

      return { success: true, client: newClient };
    },
    [clients]
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) => {
      const existing = clients.find((c) => c.id === id);
      if (!existing) {
        return { success: false, error: 'Cliente não encontrado.' };
      }

      // Check duplicate code if changed
      if (patch.codigo && patch.codigo.trim().toUpperCase() !== (existing.codigo || '').trim().toUpperCase()) {
        const trimmed = patch.codigo.trim().toUpperCase();
        const duplicate = clients.find(
          (c) => c.id !== id && (c.codigo || '').trim().toUpperCase() === trimmed
        );
        if (duplicate) {
          return {
            success: false,
            error: `O código "${trimmed}" já está em uso por outro cliente.`,
          };
        }
      }

      const updated: Client = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      syncSaveClient(updated);

      // If client name changed, also update cache in stores
      if (patch.razaoSocial || patch.nomeFantasia) {
        const clientDisplayName = patch.nomeFantasia || patch.razaoSocial || existing.nomeFantasia || existing.razaoSocial;
        setStores((prev) =>
          prev.map((s) => {
            if (s.clienteId === id) {
              const updatedStore = {
                ...s,
                clienteNome: clientDisplayName,
                updatedAt: new Date().toISOString(),
              };
              syncSaveStore(updatedStore);
              return updatedStore;
            }
            return s;
          })
        );
      }

      return { success: true };
    },
    [clients]
  );

  const deleteClient = useCallback(
    (id: string) => {
      // Check if client has stores
      const attachedStores = stores.filter((s) => s.clienteId === id);
      if (attachedStores.length > 0) {
        return {
          success: false,
          error: `Não é possível excluir o cliente pois ele possui ${attachedStores.length} loja(s)/filiais vinculadas. Remova ou transfira as lojas primeiro.`,
        };
      }

      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'inativo' } : c)));
      // Also delete or mark inactive in firestore
      syncDeleteClient(id);

      return { success: true };
    },
    [stores]
  );

  // 4. Store CRUD with Contextual Duplicate Validation
  const addStore = useCallback(
    (data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!data.clienteId) {
        return { success: false, error: 'O cliente matriz deve ser selecionado.' };
      }

      const trimmedNome = (data.nome || '').trim();
      if (!trimmedNome) {
        return { success: false, error: 'O nome ou identificação da loja é obrigatório.' };
      }

      const client = clients.find((c) => c.id === data.clienteId);
      const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente';

      // Check duplicate store code inside the same client context
      const trimmedCodigo = (data.codigoLoja || '').trim().toUpperCase();
      if (trimmedCodigo) {
        const duplicate = stores.find(
          (s) =>
            s.clienteId === data.clienteId &&
            s.codigoLoja.trim().toUpperCase() === trimmedCodigo
        );
        if (duplicate) {
          return {
            success: false,
            error: `O código de loja "${trimmedCodigo}" já existe para o cliente ${clientName} (${duplicate.nome}).`,
          };
        }
      }

      const autoCodigo =
        trimmedCodigo ||
        String(stores.filter((s) => s.clienteId === data.clienteId).length + 1).padStart(2, '0');

      const newStore: Store = {
        ...data,
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nome: trimmedNome,
        codigoLoja: autoCodigo,
        clienteNome: clientName,
        status: data.status || 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setStores((prev) => [newStore, ...prev]);
      syncSaveStore(newStore);

      return { success: true, store: newStore };
    },
    [clients, stores]
  );

  const updateStore = useCallback(
    (id: string, patch: Partial<Store>) => {
      const existing = stores.find((s) => s.id === id);
      if (!existing) {
        return { success: false, error: 'Loja não encontrada.' };
      }

      // Validate store code uniqueness if changed
      if (patch.codigoLoja && patch.codigoLoja.trim().toUpperCase() !== existing.codigoLoja.trim().toUpperCase()) {
        const trimmed = patch.codigoLoja.trim().toUpperCase();
        const targetClientId = patch.clienteId || existing.clienteId;
        const duplicate = stores.find(
          (s) =>
            s.id !== id &&
            s.clienteId === targetClientId &&
            s.codigoLoja.trim().toUpperCase() === trimmed
        );
        if (duplicate) {
          return {
            success: false,
            error: `O código de loja "${trimmed}" já está em uso em outra loja deste cliente.`,
          };
        }
      }

      // If client changed, update clientNome
      let updatedClientNome = existing.clienteNome;
      if (patch.clienteId && patch.clienteId !== existing.clienteId) {
        const targetClient = clients.find((c) => c.id === patch.clienteId);
        updatedClientNome = targetClient?.nomeFantasia || targetClient?.razaoSocial || 'Cliente';
      }

      const updated: Store = {
        ...existing,
        ...patch,
        clienteNome: updatedClientNome,
        updatedAt: new Date().toISOString(),
      };

      setStores((prev) => prev.map((s) => (s.id === id ? updated : s)));
      syncSaveStore(updated);

      return { success: true };
    },
    [clients, stores]
  );

  const deleteStore = useCallback((id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
    syncDeleteStore(id);
    return { success: true };
  }, []);

  // 5. Query helpers
  const getClientById = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  const getStoreById = useCallback(
    (id: string) => stores.find((s) => s.id === id),
    [stores]
  );

  const getStoresByClientId = useCallback(
    (clientId: string) => stores.filter((s) => s.clienteId === clientId),
    [stores]
  );

  const searchClients = useCallback(
    (term: string) => {
      if (!term.trim()) return clients;
      const lower = term.toLowerCase();
      return clients.filter(
        (c) =>
          c.razaoSocial.toLowerCase().includes(lower) ||
          (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(lower)) ||
          (c.codigo && c.codigo.toLowerCase().includes(lower)) ||
          (c.cnpj && c.cnpj.includes(lower)) ||
          (c.responsavel && c.responsavel.toLowerCase().includes(lower))
      );
    },
    [clients]
  );

  const searchStores = useCallback(
    (term: string, clientId?: string) => {
      let pool = stores;
      if (clientId) {
        pool = pool.filter((s) => s.clienteId === clientId);
      }
      if (!term.trim()) return pool;
      const lower = term.toLowerCase();
      return pool.filter(
        (s) =>
          s.nome.toLowerCase().includes(lower) ||
          s.codigoLoja.toLowerCase().includes(lower) ||
          s.cidade.toLowerCase().includes(lower) ||
          s.endereco.toLowerCase().includes(lower) ||
          (s.responsavelLocal && s.responsavelLocal.toLowerCase().includes(lower))
      );
    },
    [stores]
  );

  // 6. KPIs
  const stats = useMemo(() => {
    const totalClientes = clients.length;
    const clientesAtivos = clients.filter((c) => c.status === 'ativo').length;
    const totalLojas = stores.length;
    const lojasAtivas = stores.filter((s) => s.status === 'ativo').length;

    return {
      totalClientes,
      clientesAtivos,
      totalLojas,
      lojasAtivas,
    };
  }, [clients, stores]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        stores,
        addClient,
        updateClient,
        deleteClient,
        addStore,
        updateStore,
        deleteStore,
        getClientById,
        getStoreById,
        getStoresByClientId,
        searchClients,
        searchStores,
        stats,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};
