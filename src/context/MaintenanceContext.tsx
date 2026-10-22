import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceChecklist,
  MaintenancePiece,
  MaintenanceEvent,
  DEFAULT_MAINTENANCE_CHECKLIST,
} from '../types/maintenance';
import { ServiceOrder } from '../types/serviceOrder';
import { Equipment } from '../types/equipment';
import {
  subscribeToMaintenanceQueue,
  syncSaveMaintenanceRecord,
  syncDeleteMaintenanceRecord,
} from '../services/firestoreSync';

interface FinalizeOptions {
  approved: boolean;
  limpezaOk?: boolean;
  testesFinaisOk?: boolean;
  motivoNaoConcluida?: string;
  techName: string;
}

interface DispatchOptions {
  tecnicoRetirada: string;
  destinoLoja: string;
  dataHora?: string;
  observacoes?: string;
}

interface DeliveryOptions {
  tecnicoEntrega: string;
  responsavelLoja: string;
  dataHora?: string;
  observacoes?: string;
}

interface MaintenanceContextType {
  records: MaintenanceRecord[];
  
  // Actions
  createRecordFromOS: (order: ServiceOrder, equipment?: Equipment | null) => MaintenanceRecord;
  startTesting: (id: string, technician: string) => void;
  saveChecklistAndDiagnostics: (
    id: string,
    checklist: MaintenanceChecklist,
    problemasEncontrados: string,
    pecas: MaintenancePiece[],
    alteracoes: string,
    servicos: string,
    techName: string
  ) => void;
  finalizeMaintenance: (id: string, options: FinalizeOptions) => { success: boolean; error?: string };
  registerDispatch: (id: string, options: DispatchOptions) => { success: boolean; error?: string };
  registerDelivery: (id: string, options: DeliveryOptions) => { success: boolean; error?: string };
  deleteRecord: (id: string) => void;
  
  // Queries & Stats
  getRecordById: (id: string) => MaintenanceRecord | undefined;
  getRecordByOsId: (osId: string) => MaintenanceRecord | undefined;
  getRecordsByEquipmentId: (equipamentoId: string) => MaintenanceRecord[];
  
  // Real-time Monthly Statistics
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  stats: {
    totalRecebidasMes: number;
    emManutencao: number;
    pendentes: number;
    concluidasMes: number;
    disponiveisEnvio: number;
    retiradasEmTransito: number;
    entreguesMes: number;
  };
}

const STORAGE_KEY_MAINTENANCE = 'it_maintenance_queue_v1';

// Initial realistic demonstration records connected to the OSs
const INITIAL_DEMO_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'maint_os_101',
    osId: 'os_101',
    numeroOs: 'OS-101',
    equipamentoId: 'eq_ptn_1',
    equipamentoNome: 'PDV-01 Dell OptiPlex 3070',
    patrimonio: 'PAT-PTN-01',
    numeroSerie: 'PTN-PDV1-DEL',
    tipoEquipamento: 'PDV',
    lojaOrigem: 'Matriz / Loja 01 — Alphaville Barueri',
    lojaDestino: 'Matriz / Loja 01 — Alphaville Barueri',
    status: 'EM_MANUTENCAO',
    dataHoraEntrada: '2026-10-18T09:30:00Z',
    tecnicoAbertura: 'Carlos Silva',
    tecnicoBancada: 'Carlos Silva',
    dataHoraInicioTestes: '2026-10-18T10:15:00Z',
    checklist: {
      testeInicializacao: true,
      testeMemoriaRam: true,
      testeArmazenamento: false,
      testePortasComunicacao: true,
      testeRedeConectividade: true,
      testeTermicoCooler: true,
      testeFonteAlimentacao: true,
      testePerifericos: true,
      testeSistemaOperacional: false,
      limpezaInternaExterna: true,
      testesFinaisAprovados: false,
      observacoesChecklist: 'Setores defeituosos encontrados no SSD NVMe original.',
    },
    problemasEncontrados: 'SSD NVMe travando nas operações de gravação de arquivos de cupom fiscal; lentidão no boot.',
    pecasNecessarias: [
      {
        id: 'p_1',
        descricao: 'SSD NVMe 256GB Kingston M.2 PCIe',
        quantidade: 1,
        numeroSerie: 'KNG-NVME-8849',
        status: 'UTILIZADA',
        dataRegistro: '2026-10-18T11:00:00Z',
      },
    ],
    alteracoesExecutadas: 'Substituído SSD antigo de 128GB defeituoso por novo Kingston NVMe 256GB.',
    servicosExecutados: 'Troca de pasta térmica prata na CPU, regravação da imagem padrão Windows 10 e drivers fiscais.',
    retiradaRegistrada: false,
    entregaRegistrada: false,
    historicoEventos: [
      {
        id: 'ev_1',
        dataHora: '2026-10-18T09:30:00Z',
        tipo: 'ENTRADA_LABORATORIO',
        descricao: 'Máquina recebida no laboratório através da OS-101',
        responsavel: 'Carlos Silva',
      },
      {
        id: 'ev_2',
        dataHora: '2026-10-18T10:15:00Z',
        tipo: 'INICIO_TESTES',
        descricao: 'Iniciados testes de bancada e diagnóstico de armazenamento',
        responsavel: 'Carlos Silva',
      },
    ],
    createdAt: '2026-10-18T09:30:00Z',
    updatedAt: '2026-10-18T11:30:00Z',
  },
  {
    id: 'maint_os_102',
    osId: 'os_102',
    numeroOs: 'OS-102',
    equipamentoId: 'eq_ptn_2',
    equipamentoNome: 'PDV-02 Dell OptiPlex 3050',
    patrimonio: 'PAT-PTN-02',
    numeroSerie: 'PTN-PDV2-DEL',
    tipoEquipamento: 'PDV',
    lojaOrigem: 'Loja 02 — Osasco (Vila Yara)',
    lojaDestino: 'Loja 02 — Osasco (Vila Yara)',
    status: 'DISPONIVEL_ENVIO',
    dataHoraEntrada: '2026-10-16T14:00:00Z',
    tecnicoAbertura: 'Marcos Silva',
    tecnicoBancada: 'Renan Mendes',
    dataHoraInicioTestes: '2026-10-16T15:00:00Z',
    checklist: {
      testeInicializacao: true,
      testeMemoriaRam: true,
      testeArmazenamento: true,
      testePortasComunicacao: true,
      testeRedeConectividade: true,
      testeTermicoCooler: true,
      testeFonteAlimentacao: true,
      testePerifericos: true,
      testeSistemaOperacional: true,
      limpezaInternaExterna: true,
      testesFinaisAprovados: true,
      observacoesChecklist: 'Testes de bancada e estresse sob carga de 45 minutos 100% OK.',
    },
    problemasEncontrados: 'Fonte de alimentação interna com ruído elétrico e capacitores estufados.',
    pecasNecessarias: [
      {
        id: 'p_2',
        descricao: 'Fonte Dell 180W Original 80 Plus Bronze',
        quantidade: 1,
        numeroSerie: 'DEL-PSU-9921',
        status: 'UTILIZADA',
        dataRegistro: '2026-10-16T16:00:00Z',
      },
    ],
    alteracoesExecutadas: 'Instalada nova fonte de alimentação original Dell 180W.',
    servicosExecutados: 'Substituição da fonte, limpeza interna do dissipador, testes de estresse e higienização externa completa.',
    resultadoFinal: 'CONCLUIDA',
    dataHoraConclusao: '2026-10-17T11:00:00Z',
    tecnicoConclusao: 'Renan Mendes',
    retiradaRegistrada: false,
    entregaRegistrada: false,
    historicoEventos: [
      {
        id: 'ev_3',
        dataHora: '2026-10-16T14:00:00Z',
        tipo: 'ENTRADA_LABORATORIO',
        descricao: 'Entrada no laboratório para manutenção corretiva da fonte',
        responsavel: 'Marcos Silva',
      },
      {
        id: 'ev_4',
        dataHora: '2026-10-17T11:00:00Z',
        tipo: 'CONCLUSAO_TESTES',
        descricao: 'Manutenção concluída, limpeza e testes finais aprovados na bancada',
        responsavel: 'Renan Mendes',
      },
      {
        id: 'ev_5',
        dataHora: '2026-10-17T11:15:00Z',
        tipo: 'LIBERADO_ENVIO',
        descricao: 'Equipamento pronto e colocado na prateleira de disponíveis para envio',
        responsavel: 'Renan Mendes',
      },
    ],
    createdAt: '2026-10-16T14:00:00Z',
    updatedAt: '2026-10-17T11:15:00Z',
  },
  {
    id: 'maint_os_103',
    osId: 'os_103',
    numeroOs: 'OS-103',
    equipamentoId: 'eq_ptn_3',
    equipamentoNome: 'Computador Escritório Dell Vostro',
    patrimonio: 'PAT-PTN-03',
    numeroSerie: 'PTN-ADM1-DEL',
    tipoEquipamento: 'COMPUTADOR',
    lojaOrigem: 'Loja 03 — Carapicuíba',
    lojaDestino: 'Loja 03 — Carapicuíba',
    status: 'PENDENTE',
    dataHoraEntrada: '2026-10-17T08:00:00Z',
    tecnicoAbertura: 'Carlos Silva',
    tecnicoBancada: 'Carlos Silva',
    dataHoraInicioTestes: '2026-10-17T09:00:00Z',
    checklist: {
      testeInicializacao: false,
      testeMemoriaRam: false,
      testeArmazenamento: true,
      testePortasComunicacao: false,
      testeRedeConectividade: false,
      testeTermicoCooler: false,
      testeFonteAlimentacao: true,
      testePerifericos: false,
      testeSistemaOperacional: false,
      limpezaInternaExterna: false,
      testesFinaisAprovados: false,
    },
    problemasEncontrados: 'Placa-mãe danificada por surto elétrico na tempestade; circuito regulador VRM em curto.',
    pecasNecessarias: [
      {
        id: 'p_3',
        descricao: 'Placa-Mãe Dell Vostro 3681 Socket LGA 1200',
        quantidade: 1,
        status: 'AGUARDANDO_CHEGADA',
        dataRegistro: '2026-10-17T10:00:00Z',
      },
    ],
    alteracoesExecutadas: 'Testado com fonte de bancada, diagnosticado curto no PWM do processador.',
    servicosExecutados: 'Diagnóstico eletrônico avançado.',
    resultadoFinal: 'NAO_CONCLUIDA_PENDENTE',
    motivoNaoConcluida: 'Aguardando chegada da placa-mãe de reposição solicitada ao fornecedor autorizado Dell (Previsão: 22/10).',
    retiradaRegistrada: false,
    entregaRegistrada: false,
    historicoEventos: [
      {
        id: 'ev_6',
        dataHora: '2026-10-17T08:00:00Z',
        tipo: 'ENTRADA_LABORATORIO',
        descricao: 'Equipamento recebido sem ligar pós-descarga elétrica',
        responsavel: 'Carlos Silva',
      },
      {
        id: 'ev_7',
        dataHora: '2026-10-17T10:30:00Z',
        tipo: 'PENDENCIA_REGISTRADA',
        descricao: 'Pendente: Aguardando chegada da placa-mãe Dell',
        responsavel: 'Carlos Silva',
        detalhes: 'Curto no VRM. Pedido de compra de peça nº 4092 aberto.',
      },
    ],
    createdAt: '2026-10-17T08:00:00Z',
    updatedAt: '2026-10-17T10:30:00Z',
  },
  {
    id: 'maint_os_104',
    osId: 'os_104',
    numeroOs: 'OS-104',
    equipamentoId: 'eq_ptn_4',
    equipamentoNome: 'Balança Toledo Prix 5 Plus',
    patrimonio: 'PAT-PTN-04',
    numeroSerie: 'TOL-PR5-99120',
    tipoEquipamento: 'BALANCA',
    lojaOrigem: 'Loja 01 — Alphaville Barueri',
    lojaDestino: 'Loja 01 — Alphaville Barueri',
    status: 'ENTREGUE_LOJA',
    dataHoraEntrada: '2026-10-13T10:00:00Z',
    tecnicoAbertura: 'Carlos Silva',
    tecnicoBancada: 'Carlos Silva',
    dataHoraInicioTestes: '2026-10-13T10:30:00Z',
    checklist: {
      testeInicializacao: true,
      testeMemoriaRam: true,
      testeArmazenamento: true,
      testePortasComunicacao: true,
      testeRedeConectividade: true,
      testeTermicoCooler: true,
      testeFonteAlimentacao: true,
      testePerifericos: true,
      testeSistemaOperacional: true,
      limpezaInternaExterna: true,
      testesFinaisAprovados: true,
    },
    problemasEncontrados: 'Conflito de IP na placa de rede Ethernet e firmware defasado.',
    pecasNecessarias: [],
    alteracoesExecutadas: 'Atualizado firmware da placa principal para v4.12.',
    servicosExecutados: 'Carga de tabelas MGV6 retransmitida com 450 itens; calibração do cabeçote térmico de etiquetas.',
    resultadoFinal: 'CONCLUIDA',
    dataHoraConclusao: '2026-10-13T16:00:00Z',
    tecnicoConclusao: 'Carlos Silva',
    retiradaRegistrada: true,
    dataHoraRetirada: '2026-10-14T08:30:00Z',
    tecnicoRetirada: 'Renan Mendes',
    destinoEnvio: 'Loja 01 — Alphaville Barueri',
    observacoesRetirada: 'Transportada em caixa acolchoada no veículo de apoio TI.',
    entregaRegistrada: true,
    dataHoraEntrega: '2026-10-14T10:00:00Z',
    tecnicoEntrega: 'Renan Mendes',
    responsavelRecebimentoLoja: 'Sr. Antônio (Encarregado do Açougue)',
    observacoesEntrega: 'Instalada na ilha de frios, teste de pesagem e impressão de etiquetas 100% validado.',
    historicoEventos: [
      {
        id: 'ev_8',
        dataHora: '2026-10-13T10:00:00Z',
        tipo: 'ENTRADA_LABORATORIO',
        descricao: 'Balança recebida para manutenção de rede',
        responsavel: 'Carlos Silva',
      },
      {
        id: 'ev_9',
        dataHora: '2026-10-13T16:00:00Z',
        tipo: 'CONCLUSAO_TESTES',
        descricao: 'Testes de pesagem, rede e impressão de etiquetas aprovados',
        responsavel: 'Carlos Silva',
      },
      {
        id: 'ev_10',
        dataHora: '2026-10-14T08:30:00Z',
        tipo: 'RETIRADA_TRANSPORTE',
        descricao: 'Retirada registrada por Renan Mendes para entrega na Loja 01',
        responsavel: 'Renan Mendes',
      },
      {
        id: 'ev_11',
        dataHora: '2026-10-14T10:00:00Z',
        tipo: 'ENTREGA_CONFIRMADA',
        descricao: 'Entrega e instalação finalizadas na loja. Recebido por Sr. Antônio.',
        responsavel: 'Renan Mendes',
      },
    ],
    createdAt: '2026-10-13T10:00:00Z',
    updatedAt: '2026-10-14T10:00:00Z',
  },
];

const MaintenanceContext = createContext<MaintenanceContextType | null>(null);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_MAINTENANCE_RECORDS;
  });

  // Default month: Current month in YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Firestore real-time synchronization
  useEffect(() => {
    const unsub = subscribeToMaintenanceQueue(
      (remoteRecords) => {
        if (remoteRecords && remoteRecords.length > 0) {
          setRecords(remoteRecords);
          try {
            localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(remoteRecords));
          } catch {}
        }
      },
      (err) => console.warn('Falha snapshot maintenance_queue:', err)
    );
    return () => unsub();
  }, []);

  // 1. Criar registro de manutenção automaticamente ao abrir uma OS
  const createRecordFromOS = useCallback((order: ServiceOrder, equipment?: Equipment | null): MaintenanceRecord => {
    const now = new Date().toISOString();
    const newRecord: MaintenanceRecord = {
      id: `maint_${order.id}`,
      osId: order.id,
      numeroOs: order.numeroOs || 'OS-NOVA',
      equipamentoId: equipment?.id || order.equipamentoId,
      equipamentoNome: equipment?.nome || order.equipamentoNome || order.identificacao || 'Equipamento TI',
      patrimonio: equipment?.patrimonio || order.patrimonio,
      numeroSerie: equipment?.numeroSerie || order.numeroSerie,
      tipoEquipamento: equipment?.tipo || (typeof order.tipo === 'string' ? order.tipo : 'PDV'),
      lojaOrigem: order.lojaOrigem || order.lojaNome || 'Loja',
      lojaDestino: order.lojaDestino || order.lojaOrigem || order.lojaNome,
      status: 'RECEBIDA',
      dataHoraEntrada: order.dataHoraAbertura || now,
      tecnicoAbertura: order.tecnicoResponsavel || 'Técnico de Triagem',
      checklist: { ...DEFAULT_MAINTENANCE_CHECKLIST },
      problemasEncontrados: order.defeitoRelatado || '',
      pecasNecessarias: [],
      alteracoesExecutadas: '',
      servicosExecutados: '',
      retiradaRegistrada: false,
      entregaRegistrada: false,
      historicoEventos: [
        {
          id: `ev_open_${Date.now()}`,
          dataHora: now,
          tipo: 'ENTRADA_LABORATORIO',
          descricao: `Máquina entrou na fila de manutenção do laboratório vinculada à ${order.numeroOs}`,
          responsavel: order.tecnicoResponsavel || 'Laboratório TI',
          detalhes: order.defeitoRelatado ? `Problema inicial: "${order.defeitoRelatado}"` : undefined,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setRecords((prev) => {
      // Remove previous record with same id or osId if any exists, and put newest first
      const filtered = prev.filter((r) => r.id !== newRecord.id && r.osId !== order.id);
      return [newRecord, ...filtered];
    });

    syncSaveMaintenanceRecord(newRecord).catch((err) => {
      console.error('Falha ao salvar maintenance_queue no Firestore', err);
    });

    return newRecord;
  }, []);

  // 2. Iniciar testes de bancada
  const startTesting = useCallback((id: string, technician: string) => {
    const now = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newEvent: MaintenanceEvent = {
          id: `ev_test_${Date.now()}`,
          dataHora: now,
          tipo: 'INICIO_TESTES',
          descricao: `Técnico ${technician} iniciou atendimento na bancada de testes`,
          responsavel: technician,
        };
        const updated: MaintenanceRecord = {
          ...r,
          status: 'EM_MANUTENCAO',
          tecnicoBancada: technician,
          dataHoraInicioTestes: r.dataHoraInicioTestes || now,
          historicoEventos: [newEvent, ...r.historicoEventos],
          updatedAt: now,
        };
        syncSaveMaintenanceRecord(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

  // 3. Salvar Checklist e Diagnóstico
  const saveChecklistAndDiagnostics = useCallback(
    (
      id: string,
      checklist: MaintenanceChecklist,
      problemasEncontrados: string,
      pecas: MaintenancePiece[],
      alteracoes: string,
      servicos: string,
      techName: string
    ) => {
      const now = new Date().toISOString();
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const newEvent: MaintenanceEvent = {
            id: `ev_chk_${Date.now()}`,
            dataHora: now,
            tipo: 'ATUALIZACAO_CHECKLIST',
            descricao: `Checklist técnico e diagnóstico atualizados por ${techName}`,
            responsavel: techName,
          };
          const updated: MaintenanceRecord = {
            ...r,
            checklist,
            problemasEncontrados,
            pecasNecessarias: pecas,
            alteracoesExecutadas: alteracoes,
            servicosExecutados: servicos,
            historicoEventos: [newEvent, ...r.historicoEventos],
            updatedAt: now,
          };
          syncSaveMaintenanceRecord(updated).catch(console.error);
          return updated;
        })
      );
    },
    []
  );

  // 4. Finalizar Manutenção (Concluída ou Pendente com Motivo)
  const finalizeMaintenance = useCallback(
    (id: string, options: FinalizeOptions): { success: boolean; error?: string } => {
      const now = new Date().toISOString();
      const current = records.find((r) => r.id === id);
      if (!current) return { success: false, error: 'Registro não encontrado' };

      if (!options.approved && !options.motivoNaoConcluida?.trim()) {
        return {
          success: false,
          error: 'O motivo da pendência é obrigatório para registrar máquina não concluída.',
        };
      }

      let updated: MaintenanceRecord;

      if (options.approved) {
        // Concluída com testes finais e limpeza
        const newEvent1: MaintenanceEvent = {
          id: `ev_conc_${Date.now()}`,
          dataHora: now,
          tipo: 'CONCLUSAO_TESTES',
          descricao: `Manutenção concluída com sucesso. Limpeza técnica e testes finais de estresse validados.`,
          responsavel: options.techName,
        };
        const newEvent2: MaintenanceEvent = {
          id: `ev_lib_${Date.now() + 1}`,
          dataHora: now,
          tipo: 'LIBERADO_ENVIO',
          descricao: `Máquina colocada como Disponível para envio à loja.`,
          responsavel: options.techName,
        };

        updated = {
          ...current,
          status: 'DISPONIVEL_ENVIO',
          resultadoFinal: 'CONCLUIDA',
          dataHoraConclusao: now,
          tecnicoConclusao: options.techName,
          checklist: {
            ...current.checklist,
            limpezaInternaExterna: options.limpezaOk ?? true,
            testesFinaisAprovados: options.testesFinaisOk ?? true,
          },
          historicoEventos: [newEvent2, newEvent1, ...current.historicoEventos],
          updatedAt: now,
        };
      } else {
        // Não Concluída / Pendente com motivo
        const newEvent: MaintenanceEvent = {
          id: `ev_pend_${Date.now()}`,
          dataHora: now,
          tipo: 'PENDENCIA_REGISTRADA',
          descricao: `Manutenção pendente: ${options.motivoNaoConcluida}`,
          responsavel: options.techName,
          detalhes: options.motivoNaoConcluida,
        };

        updated = {
          ...current,
          status: 'PENDENTE',
          resultadoFinal: 'NAO_CONCLUIDA_PENDENTE',
          motivoNaoConcluida: options.motivoNaoConcluida?.trim(),
          historicoEventos: [newEvent, ...current.historicoEventos],
          updatedAt: now,
        };
      }

      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      syncSaveMaintenanceRecord(updated).catch(console.error);

      return { success: true };
    },
    [records]
  );

  // 5. Registrar Retirada para Transporte
  const registerDispatch = useCallback(
    (id: string, options: DispatchOptions): { success: boolean; error?: string } => {
      const now = options.dataHora || new Date().toISOString();
      const current = records.find((r) => r.id === id);
      if (!current) return { success: false, error: 'Registro não encontrado' };

      const newEvent: MaintenanceEvent = {
        id: `ev_ret_${Date.now()}`,
        dataHora: now,
        tipo: 'RETIRADA_TRANSPORTE',
        descricao: `Retirada registrada por ${options.tecnicoRetirada} para transporte até ${options.destinoLoja}.`,
        responsavel: options.tecnicoRetirada,
        detalhes: options.observacoes || undefined,
      };

      const updated: MaintenanceRecord = {
        ...current,
        status: 'RETIRADA_TRANSPORTE',
        retiradaRegistrada: true,
        dataHoraRetirada: now,
        tecnicoRetirada: options.tecnicoRetirada,
        destinoEnvio: options.destinoLoja,
        observacoesRetirada: options.observacoes,
        historicoEventos: [newEvent, ...current.historicoEventos],
        updatedAt: now,
      };

      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      syncSaveMaintenanceRecord(updated).catch(console.error);

      return { success: true };
    },
    [records]
  );

  // 6. Confirmar Entrega na Loja
  const registerDelivery = useCallback(
    (id: string, options: DeliveryOptions): { success: boolean; error?: string } => {
      const now = options.dataHora || new Date().toISOString();
      const current = records.find((r) => r.id === id);
      if (!current) return { success: false, error: 'Registro não encontrado' };

      const newEvent: MaintenanceEvent = {
        id: `ev_ent_${Date.now()}`,
        dataHora: now,
        tipo: 'ENTREGA_CONFIRMADA',
        descricao: `Equipamento entregue e instalado na filial por ${options.tecnicoEntrega}. Recebido por ${options.responsavelLoja}.`,
        responsavel: options.tecnicoEntrega,
        detalhes: options.observacoes || undefined,
      };

      const updated: MaintenanceRecord = {
        ...current,
        status: 'ENTREGUE_LOJA',
        entregaRegistrada: true,
        dataHoraEntrega: now,
        tecnicoEntrega: options.tecnicoEntrega,
        responsavelRecebimentoLoja: options.responsavelLoja,
        observacoesEntrega: options.observacoes,
        historicoEventos: [newEvent, ...current.historicoEventos],
        updatedAt: now,
      };

      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      syncSaveMaintenanceRecord(updated).catch(console.error);

      return { success: true };
    },
    [records]
  );

  // 7. Exclusão
  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    syncDeleteMaintenanceRecord(id).catch(console.error);
  }, []);

  // Consultas
  const getRecordById = useCallback((id: string) => records.find((r) => r.id === id), [records]);
  const getRecordByOsId = useCallback((osId: string) => records.find((r) => r.osId === osId), [records]);
  const getRecordsByEquipmentId = useCallback(
    (equipamentoId: string) => records.filter((r) => r.equipamentoId === equipamentoId),
    [records]
  );

  // Cálculo dos Indicadores Mensais e Atualizados em Tempo Real
  const stats = useMemo(() => {
    // Filtragem por mês selecionado (YYYY-MM)
    const inSelectedMonth = (dateIso?: string) => {
      if (!dateIso) return false;
      return dateIso.startsWith(selectedMonth);
    };

    const totalRecebidasMes = records.filter((r) => inSelectedMonth(r.dataHoraEntrada)).length;
    const emManutencao = records.filter((r) => r.status === 'EM_MANUTENCAO' || r.status === 'RECEBIDA').length;
    const pendentes = records.filter((r) => r.status === 'PENDENTE').length;
    const concluidasMes = records.filter(
      (r) =>
        (r.status === 'CONCLUIDA' || r.status === 'DISPONIVEL_ENVIO' || r.status === 'RETIRADA_TRANSPORTE' || r.status === 'ENTREGUE_LOJA') &&
        inSelectedMonth(r.dataHoraConclusao || r.updatedAt)
    ).length;
    const disponiveisEnvio = records.filter((r) => r.status === 'DISPONIVEL_ENVIO').length;
    const retiradasEmTransito = records.filter((r) => r.status === 'RETIRADA_TRANSPORTE').length;
    const entreguesMes = records.filter(
      (r) => r.status === 'ENTREGUE_LOJA' && inSelectedMonth(r.dataHoraEntrega || r.updatedAt)
    ).length;

    return {
      totalRecebidasMes,
      emManutencao,
      pendentes,
      concluidasMes,
      disponiveisEnvio,
      retiradasEmTransito,
      entreguesMes,
    };
  }, [records, selectedMonth]);

  return (
    <MaintenanceContext.Provider
      value={{
        records,
        createRecordFromOS,
        startTesting,
        saveChecklistAndDiagnostics,
        finalizeMaintenance,
        registerDispatch,
        registerDelivery,
        deleteRecord,
        getRecordById,
        getRecordByOsId,
        getRecordsByEquipmentId,
        selectedMonth,
        setSelectedMonth,
        stats,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error('useMaintenance deve ser usado dentro de um MaintenanceProvider');
  }
  return ctx;
};
