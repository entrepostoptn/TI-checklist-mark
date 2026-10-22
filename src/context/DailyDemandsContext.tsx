import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  DailyDemand,
  DailyDemandCategory,
  DailyDemandStatus,
  DailyDemandPriority,
  DailyDemandProgressUpdate,
} from '../types/dailyDemand';
import {
  subscribeToDailyDemands,
  syncSaveDailyDemand,
  syncDeleteDailyDemand,
} from '../services/firestoreSync';
import { useAuth } from './AuthContext';

interface DailyDemandsContextType {
  demands: DailyDemand[];
  addDemand: (
    data: Omit<DailyDemand, 'id' | 'createdAt' | 'updatedAt' | 'andamentos' | 'dataAbertura'> & {
      andamentoInicial?: string;
    }
  ) => DailyDemand;
  updateDemand: (id: string, patch: Partial<DailyDemand>) => void;
  addProgressUpdate: (
    id: string,
    descricao: string,
    novoStatus?: DailyDemandStatus,
    autor?: string
  ) => void;
  changeDemandStatus: (id: string, newStatus: DailyDemandStatus, motivo?: string) => void;
  deleteDemand: (id: string) => void;
  getDemandById: (id: string) => DailyDemand | undefined;
  
  // Quick metrics
  stats: {
    totalAbertos: number;
    emAndamento: number;
    aguardandoTerceiro: number;
    concluidos: number;
    total: number;
  };
}

const STORAGE_KEY_DEMANDS = 'it_daily_demands_v1';

// Initial realistic demo data for day-to-day tickets (Vivo, Acessos, etc.)
const INITIAL_DEMO_DEMANDS: DailyDemand[] = [
  {
    id: 'dem_1',
    titulo: 'Chamado Vivo Fibra — Queda intermitente do Link Principal',
    categoria: 'CHAMADO_OPERADORA',
    protocoloExterno: '20261020-884912',
    operadoraOuEmpresa: 'Vivo Empresas',
    lojaId: 'branch_ptn_03',
    lojaNome: 'Mark Security — Loja 03 Carapicuíba',
    descricao: 'Link de fibra ótica oscilando desde as 07h. Frente de caixa caindo para contingência 4G. Solicitado técnico presencial com urgência.',
    status: 'AGUARDANDO_TERCEIRO',
    prioridade: 'ALTA',
    tecnicoResponsavel: 'Carlos Silva',
    prazoEstimado: 'Hoje até 14:30 (Janela técnica Vivo)',
    dataAbertura: '2026-10-20T08:15:00Z',
    andamentos: [
      {
        id: 'and_1',
        dataHora: '2026-10-20T08:15:00Z',
        autor: 'Carlos Silva',
        descricao: 'Chamado aberto na central Vivo 10315. Protocolo gerado: 20261020-884912. Informado sinal óptico atenuado em -29dBm na porta GPON.',
        novoStatus: 'ABERTO',
      },
      {
        id: 'and_2',
        dataHora: '2026-10-20T09:40:00Z',
        autor: 'Carlos Silva',
        descricao: 'Supervisão técnica da Vivo confirmou deslocamento de equipe de campo para revisão da caixa TAR na rua.',
        novoStatus: 'AGUARDANDO_TERCEIRO',
      },
    ],
    contatoLocal: 'Renata Oliveira (Supervisora Loja 03) - Ramal 103',
    createdAt: '2026-10-20T08:15:00Z',
    updatedAt: '2026-10-20T09:40:00Z',
  },
  {
    id: 'dem_2',
    titulo: 'Acesso Remoto AnyDesk — Suporte Totvs / Conciliação TEF',
    categoria: 'ACESSO_REMOTO',
    protocoloExterno: 'CH-TOTVS-44190',
    operadoraOuEmpresa: 'Totvs Moda & Food',
    lojaId: 'branch_ptn_matriz',
    lojaNome: 'Mark Security — Matriz Corporativa & Retaguarda',
    descricao: 'Analista de sistemas da Totvs solicitou acesso ao servidor de retaguarda para rodar script de correção de lote de cupons TEF rejeitados.',
    status: 'EM_ANDAMENTO',
    prioridade: 'MEDIA',
    tecnicoResponsavel: 'Matheus Guarnieri',
    prazoEstimado: 'Hoje às 11:00',
    dataAbertura: '2026-10-20T09:00:00Z',
    andamentos: [
      {
        id: 'and_3',
        dataHora: '2026-10-20T09:00:00Z',
        autor: 'Matheus Guarnieri',
        descricao: 'Anotada demanda de acesso remoto. Gerada senha temporária AnyDesk monitorada.',
        novoStatus: 'ABERTO',
      },
      {
        id: 'and_4',
        dataHora: '2026-10-20T09:30:00Z',
        autor: 'Matheus Guarnieri',
        descricao: 'Analista conectado via AnyDesk (ID 541 829 104). Executando verificação de integridade no PostgreSQL.',
        novoStatus: 'EM_ANDAMENTO',
      },
    ],
    linkAcessoRemoto: 'AnyDesk ID: 541 829 104',
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-20T09:30:00Z',
  },
  {
    id: 'dem_3',
    titulo: 'Chamado Claro — Ativação de Roteador Backup 4G',
    categoria: 'CHAMADO_OPERADORA',
    protocoloExterno: 'CLR-20261019-332',
    operadoraOuEmpresa: 'Claro Empresas',
    lojaId: 'branch_ptn_02',
    lojaNome: 'Mark Security — Loja 02 Osasco (Vila Yara)',
    descricao: 'Chip de redundância Claro bloqueado por falta de cadastro de APN corporativa. Solicitado desbloqueio da linha M2M.',
    status: 'CONCLUIDO',
    prioridade: 'MEDIA',
    tecnicoResponsavel: 'Renan Mendes',
    dataAbertura: '2026-10-19T14:00:00Z',
    dataConclusao: '2026-10-19T17:30:00Z',
    andamentos: [
      {
        id: 'and_5',
        dataHora: '2026-10-19T14:00:00Z',
        autor: 'Renan Mendes',
        descricao: 'Contato com o gerente de contas Claro para reativação da linha de dados M2M.',
        novoStatus: 'EM_ANDAMENTO',
      },
      {
        id: 'and_6',
        dataHora: '2026-10-19T17:30:00Z',
        autor: 'Renan Mendes',
        descricao: 'Linha reativada e testada no Mikrotik de contingência. Failover funcionando 100%.',
        novoStatus: 'CONCLUIDO',
      },
    ],
    createdAt: '2026-10-19T14:00:00Z',
    updatedAt: '2026-10-19T17:30:00Z',
  },
];

const DailyDemandsContext = createContext<DailyDemandsContextType | null>(null);

export const DailyDemandsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [demands, setDemands] = useState<DailyDemand[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEMANDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEMO_DEMANDS;
  });

  // Salvar no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(demands));
    } catch {}
  }, [demands]);

  // Sincronização em tempo real Firestore
  useEffect(() => {
    const unsub = subscribeToDailyDemands(
      (remoteDemands) => {
        if (remoteDemands && remoteDemands.length > 0) {
          setDemands(remoteDemands);
          try {
            localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(remoteDemands));
          } catch {}
        }
      },
      (err) => console.warn('Snapshot daily_demands offline:', err)
    );
    return () => unsub();
  }, []);

  // 1. Criar nova demanda / chamado do dia a dia
  const addDemand = useCallback(
    (
      data: Omit<DailyDemand, 'id' | 'createdAt' | 'updatedAt' | 'andamentos' | 'dataAbertura'> & {
        andamentoInicial?: string;
      }
    ): DailyDemand => {
      const now = new Date().toISOString();
      const initialUpdates: DailyDemandProgressUpdate[] = [];

      if (data.andamentoInicial?.trim()) {
        initialUpdates.push({
          id: `upd_${Date.now()}`,
          dataHora: now,
          autor: user?.nome || data.tecnicoResponsavel || 'Técnico',
          descricao: data.andamentoInicial.trim(),
          novoStatus: data.status,
        });
      } else {
        initialUpdates.push({
          id: `upd_${Date.now()}`,
          dataHora: now,
          autor: user?.nome || data.tecnicoResponsavel || 'Técnico',
          descricao: `Demanda criada: ${data.titulo}`,
          novoStatus: data.status,
        });
      }

      const newDemand: DailyDemand = {
        ...data,
        id: `dem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataAbertura: now,
        andamentos: initialUpdates,
        createdAt: now,
        updatedAt: now,
      };

      setDemands((prev) => [newDemand, ...prev]);
      syncSaveDailyDemand(newDemand).catch(console.error);

      return newDemand;
    },
    [user]
  );

  // 2. Atualizar campos da demanda
  const updateDemand = useCallback((id: string, patch: Partial<DailyDemand>) => {
    const now = new Date().toISOString();
    setDemands((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...patch, updatedAt: now };
        syncSaveDailyDemand(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

  // 3. Adicionar andamento / ocorrência (para acompanhar se "já andou")
  const addProgressUpdate = useCallback(
    (id: string, descricao: string, novoStatus?: DailyDemandStatus, autor?: string) => {
      const now = new Date().toISOString();
      setDemands((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const authorName = autor || user?.nome || d.tecnicoResponsavel || 'Técnico';
          const newUpdate: DailyDemandProgressUpdate = {
            id: `upd_${Date.now()}`,
            dataHora: now,
            autor: authorName,
            descricao: descricao.trim(),
            novoStatus: novoStatus || d.status,
          };

          const finalStatus = novoStatus || d.status;
          const isFinished = finalStatus === 'CONCLUIDO';

          const updated: DailyDemand = {
            ...d,
            status: finalStatus,
            dataConclusao: isFinished ? (d.dataConclusao || now) : undefined,
            andamentos: [newUpdate, ...d.andamentos],
            updatedAt: now,
          };

          syncSaveDailyDemand(updated).catch(console.error);
          return updated;
        })
      );
    },
    [user]
  );

  // 4. Alterar status rapidamente
  const changeDemandStatus = useCallback(
    (id: string, newStatus: DailyDemandStatus, motivo?: string) => {
      const now = new Date().toISOString();
      setDemands((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const authorName = user?.nome || 'Técnico';
          const noteText = motivo?.trim()
            ? `Status alterado para ${newStatus}: ${motivo.trim()}`
            : `Status alterado para ${newStatus}`;

          const newUpdate: DailyDemandProgressUpdate = {
            id: `upd_${Date.now()}`,
            dataHora: now,
            autor: authorName,
            descricao: noteText,
            novoStatus: newStatus,
          };

          const isFinished = newStatus === 'CONCLUIDO';
          const updated: DailyDemand = {
            ...d,
            status: newStatus,
            dataConclusao: isFinished ? (d.dataConclusao || now) : undefined,
            andamentos: [newUpdate, ...d.andamentos],
            updatedAt: now,
          };

          syncSaveDailyDemand(updated).catch(console.error);
          return updated;
        })
      );
    },
    [user]
  );

  // 5. Excluir demanda
  const deleteDemand = useCallback((id: string) => {
    setDemands((prev) => prev.filter((d) => d.id !== id));
    syncDeleteDailyDemand(id).catch(console.error);
  }, []);

  const getDemandById = useCallback((id: string) => demands.find((d) => d.id === id), [demands]);

  // Contadores
  const stats = useMemo(() => {
    const totalAbertos = demands.filter((d) => d.status === 'ABERTO').length;
    const emAndamento = demands.filter((d) => d.status === 'EM_ANDAMENTO').length;
    const aguardandoTerceiro = demands.filter((d) => d.status === 'AGUARDANDO_TERCEIRO').length;
    const concluidos = demands.filter((d) => d.status === 'CONCLUIDO').length;
    const total = demands.length;

    return {
      totalAbertos,
      emAndamento,
      aguardandoTerceiro,
      concluidos,
      total,
    };
  }, [demands]);

  return (
    <DailyDemandsContext.Provider
      value={{
        demands,
        addDemand,
        updateDemand,
        addProgressUpdate,
        changeDemandStatus,
        deleteDemand,
        getDemandById,
        stats,
      }}
    >
      {children}
    </DailyDemandsContext.Provider>
  );
};

export const useDailyDemands = () => {
  const ctx = useContext(DailyDemandsContext);
  if (!ctx) {
    throw new Error('useDailyDemands deve ser usado dentro de um DailyDemandsProvider');
  }
  return ctx;
};
