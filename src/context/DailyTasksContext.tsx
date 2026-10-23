import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DailyTask, TaskPriority } from '../types/task';
import {
  subscribeToDailyTasks,
  syncSaveDailyTask,
  syncDeleteDailyTask,
} from '../services/firestoreSync';
import { useAuth } from './AuthContext';

interface DailyTasksContextType {
  tasks: DailyTask[];
  loading: boolean;
  todayPendingTasks: DailyTask[];
  overdueTasks: DailyTask[];
  completedTodayTasks: DailyTask[];
  totalPendingCount: number;
  addTask: (params: {
    titulo: string;
    descricao?: string;
    dataAgendada?: string;
    lojaId?: string;
    lojaNome?: string;
    prioridade?: TaskPriority;
    responsavelNome?: string;
    origemAutomatica?: 'DEVOLUCAO_MAQUINA' | 'CHAMADO_OPERADORA' | 'MANUAL';
    referenciaId?: string;
  }) => Promise<DailyTask>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<DailyTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const DailyTasksContext = createContext<DailyTasksContextType | undefined>(undefined);

export const DailyTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsub = subscribeToDailyTasks(
      (data) => {
        if (data.length > 0) {
          setTasks(data);
        } else {
          // Initial demo tasks demonstrating automatic rollover
          const now = new Date();
          const todayIso = now.toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayIso = yesterday.toISOString().split('T')[0];

          const seedTasks: DailyTask[] = [
            {
              id: 'task_demo_1',
              titulo: 'Ligar para gerente da Loja 03 para checar estabilidade do Link Vivo',
              descricao: 'Confirmar se após visita técnica da Vivo o PDV principal parou de oscilar.',
              dataAgendada: yesterdayIso, // Overdue from yesterday - demonstrates automatic rollover!
              lojaId: 'branch_ptn_03',
              lojaNome: 'Mark Security — Loja 03 Carapicuíba',
              prioridade: 'ALTA',
              concluida: false,
              responsavelNome: 'Carlos Silva',
              origemAutomatica: 'CHAMADO_OPERADORA',
              criadoEm: yesterday.toISOString(),
              atualizadoEm: yesterday.toISOString(),
            },
            {
              id: 'task_demo_2',
              titulo: 'Devolver máquina PDV-02 na Loja 02 Osasco (Concluída no Lab)',
              descricao: 'Fonte substituída e higienizada. Levar termo de entrega para assinatura do gerente.',
              dataAgendada: todayIso,
              lojaId: 'branch_ptn_02',
              lojaNome: 'Mark Security — Loja 02 Osasco (Vila Yara)',
              prioridade: 'ALTA',
              concluida: false,
              responsavelNome: 'Renan Mendes',
              origemAutomatica: 'DEVOLUCAO_MAQUINA',
              criadoEm: now.toISOString(),
              atualizadoEm: now.toISOString(),
            },
            {
              id: 'task_demo_3',
              titulo: 'Testar novo cabo de rede blindado e conector RJ45 no caixa 03',
              dataAgendada: todayIso,
              lojaId: 'branch_ptn_01',
              lojaNome: 'Mark Security — Matriz / Loja 01 Alphaville',
              prioridade: 'MEDIA',
              concluida: false,
              responsavelNome: 'Técnico de Plantão',
              origemAutomatica: 'MANUAL',
              criadoEm: now.toISOString(),
              atualizadoEm: now.toISOString(),
            },
          ];

          setTasks(seedTasks);
          // Persist seeds so other devices see them
          seedTasks.forEach((st) => syncSaveDailyTask(st));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Error subscribing to daily tasks:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Tasks that are pending: either scheduled for today or overdue from previous days (Rollover)
  const overdueTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.concluida && t.dataAgendada < todayStr)
      .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
  }, [tasks, todayStr]);

  const todayPendingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.concluida && t.dataAgendada === todayStr)
      .sort((a, b) => (b.prioridade === 'ALTA' ? 1 : -1));
  }, [tasks, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.concluida || !t.concluidaEm) return false;
      const completedDate = t.concluidaEm.split('T')[0];
      return completedDate === todayStr;
    });
  }, [tasks, todayStr]);

  const totalPendingCount = useMemo(() => {
    return overdueTasks.length + todayPendingTasks.length;
  }, [overdueTasks, todayPendingTasks]);

  const addTask = useCallback(
    async (params: {
      titulo: string;
      descricao?: string;
      dataAgendada?: string;
      lojaId?: string;
      lojaNome?: string;
      prioridade?: TaskPriority;
      responsavelNome?: string;
      origemAutomatica?: 'DEVOLUCAO_MAQUINA' | 'CHAMADO_OPERADORA' | 'MANUAL';
      referenciaId?: string;
    }): Promise<DailyTask> => {
      const now = new Date();
      const newTask: DailyTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        titulo: params.titulo.trim(),
        descricao: params.descricao?.trim(),
        dataAgendada: params.dataAgendada || now.toISOString().split('T')[0],
        lojaId: params.lojaId,
        lojaNome: params.lojaNome,
        prioridade: params.prioridade || 'MEDIA',
        concluida: false,
        responsavelNome: params.responsavelNome || user?.nome || 'Técnico de Plantão',
        origemAutomatica: params.origemAutomatica || 'MANUAL',
        referenciaId: params.referenciaId,
        criadoEm: now.toISOString(),
        atualizadoEm: now.toISOString(),
      };

      await syncSaveDailyTask(newTask);
      return newTask;
    },
    [user]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<void> => {
      const existing = tasks.find((t) => t.id === id);
      if (!existing) return;

      const now = new Date().toISOString();
      const updated: DailyTask = {
        ...existing,
        concluida: !existing.concluida,
        concluidaEm: !existing.concluida ? now : undefined,
        concluidaPor: !existing.concluida ? (user?.nome || 'Técnico') : undefined,
        atualizadoEm: now,
      };

      await syncSaveDailyTask(updated);
    },
    [tasks, user]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<DailyTask>): Promise<void> => {
      const existing = tasks.find((t) => t.id === id);
      if (!existing) return;

      const updated: DailyTask = {
        ...existing,
        ...updates,
        atualizadoEm: new Date().toISOString(),
      };

      await syncSaveDailyTask(updated);
    },
    [tasks]
  );

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await syncDeleteDailyTask(id);
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      todayPendingTasks,
      overdueTasks,
      completedTodayTasks,
      totalPendingCount,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
    }),
    [
      tasks,
      loading,
      todayPendingTasks,
      overdueTasks,
      completedTodayTasks,
      totalPendingCount,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
    ]
  );

  return <DailyTasksContext.Provider value={value}>{children}</DailyTasksContext.Provider>;
};

export const useDailyTasks = (): DailyTasksContextType => {
  const ctx = useContext(DailyTasksContext);
  if (!ctx) {
    throw new Error('useDailyTasks must be used within a DailyTasksProvider');
  }
  return ctx;
};
