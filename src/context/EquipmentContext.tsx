import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Equipment,
  MovementRecord,
  HardwareChangeRecord,
  EquipmentStatus,
  EquipmentLocation,
  EquipmentType,
  StorageType,
} from '../types/equipment';

interface EquipmentContextType {
  equipments: Equipment[];
  movements: MovementRecord[];
  hardwareChanges: HardwareChangeRecord[];
  
  // CRUD Equipment with Duplicate Validation
  addEquipment: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string; equipment?: Equipment };
  updateEquipment: (id: string, patch: Partial<Equipment>) => { success: boolean; error?: string };
  deleteEquipment: (id: string) => { success: boolean; error?: string };
  
  // Timeline Movements
  addMovement: (record: Omit<MovementRecord, 'id' | 'criadoEm'>) => MovementRecord;
  
  // Hardware Changes
  addHardwareChange: (record: Omit<HardwareChangeRecord, 'id' | 'criadoEm'>, applyToEquipment?: boolean) => HardwareChangeRecord;
  
  // Queries & Stats
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentBySearch: (term: string) => Equipment[];
  getMovementsForEquipment: (equipamentoId: string) => MovementRecord[];
  getHardwareChangesForEquipment: (equipamentoId: string) => HardwareChangeRecord[];
  
  // KPIs
  stats: {
    totalEquipamentos: number;
    aguardandoManutencao: number;
    emManutencao: number;
    disponivelRetirada: number;
    pendentesRetirada: number;
    emUso: number;
    desativados: number;
  };
  
  // Backup / Restore
  exportAllDataJSON: () => void;
  importAllDataJSON: (jsonData: string) => boolean;
}

const STORAGE_KEY_EQUIPMENTS = 'it_equipments_v1';
const STORAGE_KEY_MOVEMENTS = 'it_movements_v1';
const STORAGE_KEY_HARDWARE_CHANGES = 'it_hardware_changes_v1';

const INITIAL_DEMO_EQUIPMENTS: Equipment[] = [
  {
    id: 'eq_1',
    nome: 'PDV-01',
    patrimonio: 'PAT-0041',
    numeroSerie: 'BRJ8421-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    lojaOrigem: 'Loja 01 - Centro',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    processador: 'Intel Core i3-7100T 3.40GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataPrimeiroCadastro: '2024-03-10',
    dataUltimaEntrada: '2026-09-15T08:30',
    dataUltimaRetirada: '2026-09-16T17:00',
    dataUltimaManutencao: '2026-09-16',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Terminal de caixa principal (Caixa 01). Balança Toledo e impressora Epson TM-T20X.',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2026-09-16T17:00:00Z',
  },
  {
    id: 'eq_2',
    nome: 'PDV-02',
    patrimonio: 'PAT-0042',
    numeroSerie: 'BRJ9045-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    lojaOrigem: 'Loja 01 - Centro',
    localizacaoAtual: 'ESCRITORIO',
    status: 'EM_MANUTENCAO',
    processador: 'Intel Core i3-7100T 3.40GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataPrimeiroCadastro: '2024-03-10',
    dataUltimaEntrada: '2026-10-12T09:15',
    dataUltimaManutencao: '2026-10-12',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Na bancada da TI. Substituição de SSD antigo e reinstalação de imagem padrão.',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2026-10-12T09:15:00Z',
  },
  {
    id: 'eq_3',
    nome: 'PDV-RES-01',
    patrimonio: 'PAT-0099',
    numeroSerie: 'BEM-RC8400-019',
    tipo: 'PDV',
    marcaModelo: 'Bematech RC-8400',
    lojaOrigem: 'Estoque Central TI',
    localizacaoAtual: 'ESTOQUE',
    status: 'DISPONIVEL_RETIRADA',
    processador: 'Intel Celeron J1900 2.00GHz Quad-Core',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataPrimeiroCadastro: '2024-06-15',
    dataUltimaEntrada: '2026-10-05T14:00',
    dataUltimaRetirada: '2026-10-06T11:00',
    dataUltimaManutencao: '2026-10-06',
    tecnicoResponsavel: 'Marcos Oliveira',
    observacoes: 'Máquina reserva de frente de caixa pronta para emergência. Configurada para qualquer loja.',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2026-10-06T11:00:00Z',
  },
  {
    id: 'eq_4',
    nome: 'EST-01',
    patrimonio: 'PAT-0060',
    numeroSerie: 'LNV-TC-M720-04',
    tipo: 'COMPUTADOR',
    marcaModelo: 'Lenovo ThinkCentre M720s',
    lojaOrigem: 'Loja 02 - Shopping',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    processador: 'Intel Core i5-8400 2.80GHz',
    memoriaRamGb: 16,
    armazenamentoValor: 480,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_NVME',
    sistemaOperacional: 'Windows 11 Pro 64-bit',
    dataPrimeiroCadastro: '2023-11-20',
    dataUltimaEntrada: '2026-08-20T10:00',
    dataUltimaRetirada: '2026-08-21T16:30',
    dataUltimaManutencao: '2026-08-21',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Estação da gerência da Loja Shopping. Microsoft Office 2021 Pro instalado.',
    createdAt: '2023-11-20T11:00:00Z',
    updatedAt: '2026-08-21T16:30:00Z',
  },
  {
    id: 'eq_5',
    nome: 'CX-04',
    patrimonio: 'PAT-0078',
    numeroSerie: 'BRJ7732-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    lojaOrigem: 'Loja 03 - Shopping',
    localizacaoAtual: 'ESCRITORIO',
    status: 'DISPONIVEL_RETIRADA',
    processador: 'Intel Core i3-7100T 3.40GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataPrimeiroCadastro: '2024-04-05',
    dataUltimaEntrada: '2026-10-10T11:30',
    dataUltimaManutencao: '2026-10-12',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Homologada 100%. Driver Epson TM-T20X reinstalado e comunicação do Impressor testada. Aguardando retirada.',
    createdAt: '2024-04-05T08:00:00Z',
    updatedAt: '2026-10-12T16:00:00Z',
  },
];

const INITIAL_DEMO_MOVEMENTS: MovementRecord[] = [
  {
    id: 'mov_1',
    equipamentoId: 'eq_2',
    equipamentoNome: 'PDV-02',
    patrimonio: 'PAT-0042',
    numeroOs: 'OS-101',
    dataHoraEntrada: '2026-10-12T09:15',
    lojaOrigem: 'Loja 01 - Centro',
    destino: 'Loja 01 - Centro (Retorno após manutenção)',
    responsavelEntrega: 'Marcos Gerente',
    tecnicoResponsavel: 'Carlos Silva',
    motivoEnvio: 'Travamento constante no Windows e balança não transmitindo peso',
    problemaRelatado: 'Setores defeituosos no SSD antigo',
    servicoRealizado: 'Substituição do SSD antigo por SSD Kingston 240GB e formatação limpa',
    resultadoAtendimento: 'EM_ANDAMENTO',
    observacoes: 'Aguardando teste final do MGV para liberação.',
    criadoEm: '2026-10-12T09:15:00Z',
  },
  {
    id: 'mov_2',
    equipamentoId: 'eq_5',
    equipamentoNome: 'CX-04',
    patrimonio: 'PAT-0078',
    numeroOs: 'OS-104',
    dataHoraEntrada: '2026-10-10T11:30',
    dataHoraRetirada: '2026-10-13T10:00',
    dataDevolucao: '2026-10-13',
    lojaOrigem: 'Loja 03 - Shopping',
    destino: 'Loja 03 - Shopping',
    responsavelEntrega: 'Luciano Operações',
    tecnicoResponsavel: 'Carlos Silva',
    responsavelRetirada: 'Carlos Silva',
    motivoEnvio: 'Impressora Epson não cortava e módulo Impressor travando',
    problemaRelatado: 'Spooler corrompido e driver desatualizado',
    servicoRealizado: 'Reinstalação limpa dos drivers térmicos Epson e teste de corte automático',
    resultadoAtendimento: 'CONCLUIDO_SUCESSO',
    observacoes: 'Equipamento testado com 10 impressões seguidas.',
    criadoEm: '2026-10-10T11:30:00Z',
  },
  {
    id: 'mov_3',
    equipamentoId: 'eq_1',
    equipamentoNome: 'PDV-01',
    patrimonio: 'PAT-0041',
    dataHoraEntrada: '2026-09-15T08:30',
    dataHoraRetirada: '2026-09-16T17:00',
    dataDevolucao: '2026-09-16',
    lojaOrigem: 'Loja 01 - Centro',
    destino: 'Loja 01 - Centro',
    responsavelEntrega: 'Carlos Silva',
    tecnicoResponsavel: 'Carlos Silva',
    responsavelRetirada: 'Marcos Gerente',
    motivoEnvio: 'Manutenção preventiva semestral e limpeza de cooler',
    problemaRelatado: 'Aquecimento e poeira acumulada',
    servicoRealizado: 'Limpeza física, troca de pasta térmica e atualização de segurança do Windows',
    resultadoAtendimento: 'CONCLUIDO_SUCESSO',
    observacoes: 'Temperatura do processador baixou de 72°C para 41°C em estresse.',
    criadoEm: '2026-09-15T08:30:00Z',
  },
];

const INITIAL_DEMO_HARDWARE_CHANGES: HardwareChangeRecord[] = [
  {
    id: 'hw_1',
    equipamentoId: 'eq_2',
    equipamentoNome: 'PDV-02',
    patrimonio: 'PAT-0042',
    numeroOs: 'OS-101',
    componenteSubstituido: 'Armazenamento (SSD)',
    descricaoPecaAntiga: 'SSD SanDisk Plus 120GB SATA',
    serialPecaAntiga: 'SD-120-9482',
    componenteInstalado: 'SSD Kingston A400 240GB SATA III',
    marcaModeloNovo: 'Kingston A400 240GB',
    serialPecaNova: 'KNG-240-8831',
    quantidade: 1,
    tipoAlteracao: 'ARMAZENAMENTO',
    especificacaoAnterior: '120 GB SSD',
    especificacaoNova: '240 GB SSD SATA',
    dataSubstituicao: '2026-10-12',
    tecnicoResponsavel: 'Carlos Silva',
    motivoTroca: 'SSD antigo com taxa de saúde de 18% no CrystalDiskInfo e lentidão na abertura do PDV',
    resultado: 'Taxa de leitura de 510MB/s e sistema inicializando em 12 segundos',
    observacoes: 'Peça antiga descartada para sucata.',
    criadoEm: '2026-10-12T10:00:00Z',
  },
  {
    id: 'hw_2',
    equipamentoId: 'eq_4',
    equipamentoNome: 'EST-01',
    patrimonio: 'PAT-0060',
    componenteSubstituido: 'Memória RAM',
    descricaoPecaAntiga: '1x 8GB DDR4 2400MHz Samsung',
    serialPecaAntiga: 'SM-8G-4421',
    componenteInstalado: '2x 8GB DDR4 2666MHz Kingston Fury (Total 16GB Dual Channel)',
    marcaModeloNovo: 'Kingston Fury Beast 16GB Kit',
    serialPecaNova: 'KF-16G-KIT-90',
    quantidade: 2,
    tipoAlteracao: 'RAM',
    especificacaoAnterior: '8 GB RAM',
    especificacaoNova: '16 GB RAM',
    dataSubstituicao: '2026-08-21',
    tecnicoResponsavel: 'Carlos Silva',
    motivoTroca: 'Upgrade solicitado pela gerência para planilhas pesadas de fechamento e relatórios ERP',
    resultado: 'Dual channel ativado e sem engasgos com mais de 30 abas abertas',
    observacoes: 'Pente antigo de 8GB remanejado para máquina reserva do escritório.',
    criadoEm: '2026-08-21T14:30:00Z',
  },
];

const EquipmentContext = createContext<EquipmentContextType | null>(null);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EQUIPMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler equipamentos do localStorage', e);
    }
    return INITIAL_DEMO_EQUIPMENTS;
  });

  const [movements, setMovements] = useState<MovementRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler movimentações do localStorage', e);
    }
    return INITIAL_DEMO_MOVEMENTS;
  });

  const [hardwareChanges, setHardwareChanges] = useState<HardwareChangeRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HARDWARE_CHANGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler alterações de hardware do localStorage', e);
    }
    return INITIAL_DEMO_HARDWARE_CHANGES;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENTS, JSON.stringify(equipments));
    } catch (e) {
      console.error('Erro ao salvar equipamentos', e);
    }
  }, [equipments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Erro ao salvar movimentações', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HARDWARE_CHANGES, JSON.stringify(hardwareChanges));
    } catch (e) {
      console.error('Erro ao salvar alterações de hardware', e);
    }
  }, [hardwareChanges]);

  // Add Equipment with duplicate validation
  const addEquipment = useCallback((data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cleanPatrimonio = data.patrimonio.trim().toUpperCase();
    const cleanSerial = data.numeroSerie.trim().toUpperCase();

    // Check duplicate patrimonio
    const existsPatrimonio = equipments.some(
      (e) => e.patrimonio.trim().toUpperCase() === cleanPatrimonio
    );
    if (existsPatrimonio) {
      return {
        success: false,
        error: `Já existe um equipamento cadastrado com o patrimônio "${data.patrimonio}".`,
      };
    }

    // Check duplicate serial number
    const existsSerial = equipments.some(
      (e) => e.numeroSerie.trim().toUpperCase() === cleanSerial
    );
    if (existsSerial) {
      return {
        success: false,
        error: `Já existe um equipamento cadastrado com o número de série / Service Tag "${data.numeroSerie}".`,
      };
    }

    const newEquipment: Equipment = {
      ...data,
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patrimonio: cleanPatrimonio,
      numeroSerie: cleanSerial,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEquipments((prev) => [newEquipment, ...prev]);
    return { success: true, equipment: newEquipment };
  }, [equipments]);

  // Update Equipment with duplicate validation
  const updateEquipment = useCallback((id: string, patch: Partial<Equipment>) => {
    const current = equipments.find((e) => e.id === id);
    if (!current) return { success: false, error: 'Equipamento não encontrado.' };

    if (patch.patrimonio) {
      const cleanPat = patch.patrimonio.trim().toUpperCase();
      const duplicate = equipments.some(
        (e) => e.id !== id && e.patrimonio.trim().toUpperCase() === cleanPat
      );
      if (duplicate) {
        return { success: false, error: `O patrimônio "${patch.patrimonio}" já está em uso por outro equipamento.` };
      }
    }

    if (patch.numeroSerie) {
      const cleanSerial = patch.numeroSerie.trim().toUpperCase();
      const duplicate = equipments.some(
        (e) => e.id !== id && e.numeroSerie.trim().toUpperCase() === cleanSerial
      );
      if (duplicate) {
        return { success: false, error: `O número de série "${patch.numeroSerie}" já está em uso por outro equipamento.` };
      }
    }

    setEquipments((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          ...patch,
          patrimonio: patch.patrimonio ? patch.patrimonio.trim().toUpperCase() : e.patrimonio,
          numeroSerie: patch.numeroSerie ? patch.numeroSerie.trim().toUpperCase() : e.numeroSerie,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return { success: true };
  }, [equipments]);

  // Delete Equipment with safety
  const deleteEquipment = useCallback((id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  }, []);

  // Add Timeline Movement
  const addMovement = useCallback((recordData: Omit<MovementRecord, 'id' | 'criadoEm'>): MovementRecord => {
    const newMovement: MovementRecord = {
      ...recordData,
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      criadoEm: new Date().toISOString(),
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Update equipment's last dates & status if relevant
    setEquipments((prev) =>
      prev.map((eq) => {
        if (eq.id !== recordData.equipamentoId) return eq;
        const updates: Partial<Equipment> = {
          updatedAt: new Date().toISOString(),
        };

        if (recordData.dataHoraEntrada) {
          updates.dataUltimaEntrada = recordData.dataHoraEntrada;
        }
        if (recordData.dataHoraRetirada) {
          updates.dataUltimaRetirada = recordData.dataHoraRetirada;
        }
        if (recordData.tecnicoResponsavel) {
          updates.tecnicoResponsavel = recordData.tecnicoResponsavel;
        }
        if (recordData.resultadoAtendimento === 'CONCLUIDO_SUCESSO') {
          updates.dataUltimaManutencao = new Date().toISOString().split('T')[0];
        }

        return { ...eq, ...updates };
      })
    );

    return newMovement;
  }, []);

  // Add Hardware Change Record
  const addHardwareChange = useCallback((
    recordData: Omit<HardwareChangeRecord, 'id' | 'criadoEm'>,
    applyToEquipment: boolean = true
  ): HardwareChangeRecord => {
    const newChange: HardwareChangeRecord = {
      ...recordData,
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      criadoEm: new Date().toISOString(),
    };

    setHardwareChanges((prev) => [newChange, ...prev]);

    // Optionally apply hardware spec updates to the equipment's current profile
    if (applyToEquipment && recordData.tipoAlteracao) {
      setEquipments((prev) =>
        prev.map((eq) => {
          if (eq.id !== recordData.equipamentoId) return eq;
          const patch: Partial<Equipment> = { updatedAt: new Date().toISOString() };

          if (recordData.tipoAlteracao === 'RAM' && recordData.especificacaoNova) {
            const numRam = parseInt(recordData.especificacaoNova, 10);
            if (!isNaN(numRam) && numRam > 0) patch.memoriaRamGb = numRam;
          } else if (recordData.tipoAlteracao === 'ARMAZENAMENTO' && recordData.especificacaoNova) {
            const match = recordData.especificacaoNova.match(/(\d+)\s*(GB|TB)/i);
            if (match) {
              patch.armazenamentoValor = parseInt(match[1], 10);
              patch.armazenamentoUnidade = match[2].toUpperCase() as 'GB' | 'TB';
            }
            if (/NVMe/i.test(recordData.especificacaoNova)) patch.tipoArmazenamento = 'SSD_NVME';
            else if (/SSD/i.test(recordData.especificacaoNova)) patch.tipoArmazenamento = 'SSD_SATA';
            else if (/HD/i.test(recordData.especificacaoNova)) patch.tipoArmazenamento = 'HD';
          }

          return { ...eq, ...patch };
        })
      );
    }

    return newChange;
  }, []);

  const getEquipmentById = useCallback((id: string) => {
    return equipments.find((e) => e.id === id);
  }, [equipments]);

  const getEquipmentBySearch = useCallback((term: string) => {
    const clean = term.toLowerCase().trim();
    if (!clean) return equipments;
    return equipments.filter(
      (e) =>
        e.nome.toLowerCase().includes(clean) ||
        e.patrimonio.toLowerCase().includes(clean) ||
        e.numeroSerie.toLowerCase().includes(clean) ||
        e.lojaOrigem.toLowerCase().includes(clean) ||
        e.marcaModelo.toLowerCase().includes(clean)
    );
  }, [equipments]);

  const getMovementsForEquipment = useCallback((equipamentoId: string) => {
    return movements.filter((m) => m.equipamentoId === equipamentoId);
  }, [movements]);

  const getHardwareChangesForEquipment = useCallback((equipamentoId: string) => {
    return hardwareChanges.filter((h) => h.equipamentoId === equipamentoId);
  }, [hardwareChanges]);

  // Compute stats
  const stats = useMemo(() => {
    let aguardando = 0;
    let manutencao = 0;
    let disponivel = 0;
    let pendentes = 0;
    let uso = 0;
    let desativados = 0;

    equipments.forEach((e) => {
      if (e.status === 'AGUARDANDO_MANUTENCAO') aguardando++;
      else if (e.status === 'EM_MANUTENCAO') manutencao++;
      else if (e.status === 'DISPONIVEL_RETIRADA') {
        disponivel++;
        pendentes++;
      } else if (e.status === 'EM_USO') uso++;
      else if (e.status === 'DESATIVADO') desativados++;
    });

    return {
      totalEquipamentos: equipments.length,
      aguardandoManutencao: aguardando,
      emManutencao: manutencao,
      disponivelRetirada: disponivel,
      pendentesRetirada: pendentes,
      emUso: uso,
      desativados,
    };
  }, [equipments]);

  const exportAllDataJSON = useCallback(() => {
    const dataToExport = {
      equipments,
      movements,
      hardwareChanges,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `patrimonio_e_manutencao_ti_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [equipments, movements, hardwareChanges]);

  const importAllDataJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.equipments && Array.isArray(parsed.equipments)) {
        setEquipments(parsed.equipments);
      }
      if (parsed.movements && Array.isArray(parsed.movements)) {
        setMovements(parsed.movements);
      }
      if (parsed.hardwareChanges && Array.isArray(parsed.hardwareChanges)) {
        setHardwareChanges(parsed.hardwareChanges);
      }
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON', e);
      return false;
    }
  }, []);

  return (
    <EquipmentContext.Provider
      value={{
        equipments,
        movements,
        hardwareChanges,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addMovement,
        addHardwareChange,
        getEquipmentById,
        getEquipmentBySearch,
        getMovementsForEquipment,
        getHardwareChangesForEquipment,
        stats,
        exportAllDataJSON,
        importAllDataJSON,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment deve ser usado dentro de um EquipmentProvider');
  }
  return context;
};
