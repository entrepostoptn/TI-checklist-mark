import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Equipment,
  MovementRecord,
  HardwareChangeRecord,
} from '../types/equipment';
import {
  subscribeToEquipments,
  subscribeToMovements,
  subscribeToHardwareChanges,
  syncSaveEquipment,
  syncDeleteEquipment,
  syncSaveMovement,
  syncSaveHardwareChange,
  checkAndInitializeDatabase,
} from '../services/firestoreSync';

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
  getEquipmentsByStoreId: (storeId: string) => Equipment[];
  getEquipmentsByClientId: (clientId: string) => Equipment[];
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

export const INITIAL_DEMO_EQUIPMENTS: Equipment[] = [
  {
    id: 'eq_1',
    nome: 'PDV-01',
    patrimonio: 'PAT-0041',
    numeroSerie: 'BRJ8421-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    marca: 'Dell',
    modelo: 'OptiPlex 3050 Micro',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    lojaOrigem: 'Loja 01 — Barueri',
    posicaoCaixa: 'PDV 01 (Frente de Caixa)',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.1.101',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataInstalacao: '2024-03-10',
    processador: 'Intel Core i3-7100T 3.40GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
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
    marca: 'Dell',
    modelo: 'OptiPlex 3050 Micro',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    lojaOrigem: 'Loja 01 — Barueri',
    posicaoCaixa: 'PDV 02 (Frente de Caixa)',
    localizacaoAtual: 'ESCRITORIO',
    status: 'EM_MANUTENCAO',
    enderecoIp: '192.168.1.102',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataInstalacao: '2024-03-10',
    processador: 'Intel Core i3-7100T 3.40GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    dataPrimeiroCadastro: '2024-03-10',
    dataUltimaEntrada: '2026-10-12T09:15',
    dataUltimaManutencao: '2026-10-12',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Na bancada da TI. Substituição de SSD antigo e reinstalação de imagem padrão.',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'eq_3',
    nome: 'Computador Administrativo',
    patrimonio: 'PAT-0055',
    numeroSerie: 'BRJ3301-DEL',
    tipo: 'COMPUTADOR',
    marcaModelo: 'Dell Vostro 3681',
    marca: 'Dell',
    modelo: 'Vostro 3681',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    lojaOrigem: 'Loja 01 — Barueri',
    posicaoCaixa: 'Escritório / Retaguarda',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.1.50',
    sistemaOperacional: 'Windows 11 Pro 64-bit',
    dataInstalacao: '2024-04-01',
    processador: 'Intel Core i5-10400 2.90GHz',
    memoriaRamGb: 16,
    armazenamentoValor: 512,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_NVME',
    dataPrimeiroCadastro: '2024-04-01',
    tecnicoResponsavel: 'Marcos Oliveira',
    observacoes: 'Estação de faturamento e conciliação do gerente.',
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2026-08-10T14:00:00Z',
  },
  {
    id: 'eq_imp_1',
    nome: 'Impressora Térmica Não Fiscal',
    patrimonio: 'PAT-IMP-01',
    numeroSerie: 'EPS-T20X-8821',
    tipo: 'IMPRESSORA',
    marcaModelo: 'Epson TM-T20X',
    marca: 'Epson',
    modelo: 'TM-T20X USB/Serial',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    lojaOrigem: 'Loja 01 — Barueri',
    posicaoCaixa: 'PDV 01',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    dataInstalacao: '2024-03-10',
    dataPrimeiroCadastro: '2024-03-10',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Spooler configurado via Impressor SIU em porta COM3 emulada.',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'eq_bal_1',
    nome: 'Balança Computadora de Mesa',
    patrimonio: 'PAT-BAL-01',
    numeroSerie: 'TOL-PR5-99120',
    tipo: 'BALANCA',
    marcaModelo: 'Toledo Prix 5 Plus',
    marca: 'Toledo',
    modelo: 'Prix 5 Plus Ethernet',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    lojaOrigem: 'Loja 01 — Barueri',
    posicaoCaixa: 'Setor Hortifruti / Balcão',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.0.201',
    dataInstalacao: '2024-03-15',
    dataPrimeiroCadastro: '2024-03-15',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Carga transmitida via MGV Toledo no código de departamento 01 e etiqueta 251.',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
  },
  {
    id: 'eq_dvr_1',
    nome: 'DVR de Câmeras CFTV',
    patrimonio: 'PAT-DVR-01',
    numeroSerie: 'HIK-16CH-4890',
    tipo: 'DVR',
    marcaModelo: 'Hikvision iDS-7216HQHI-M1/S',
    marca: 'Hikvision',
    modelo: '16 Canais AcuSense',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    posicaoCaixa: 'Rack Sala TI / Segurança',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.1.200',
    dataInstalacao: '2024-01-20',
    dataPrimeiroCadastro: '2024-01-20',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'HD Seagate SkyHawk 4TB para CFTV. Gravação 24/7 com detecção de movimento.',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'eq_sw_1',
    nome: 'Switch Core Gigabit',
    patrimonio: 'PAT-SW-01',
    numeroSerie: 'INT-SG2404-110',
    tipo: 'SWITCH',
    marcaModelo: 'Intelbras SG 2404 MR L2+',
    marca: 'Intelbras',
    modelo: '24 Portas Gigabit + 4 SFP',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    posicaoCaixa: 'Rack Principal Mezanino',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.1.2',
    dataInstalacao: '2024-01-20',
    dataPrimeiroCadastro: '2024-01-20',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'VLAN 10 para PDVs, VLAN 20 para CFTV e VLAN 30 para Administrativo.',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'eq_rt_1',
    nome: 'Roteador / Firewall Principal',
    patrimonio: 'PAT-RT-01',
    numeroSerie: 'MKT-750GR3-771',
    tipo: 'ROTEADOR',
    marcaModelo: 'MikroTik RouterBOARD hEX (RB750Gr3)',
    marca: 'MikroTik',
    modelo: 'RB750Gr3 RouterOS',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_01',
    lojaNome: 'Loja 01 — Barueri',
    posicaoCaixa: 'Rack Principal Mezanino',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    enderecoIp: '192.168.1.1',
    dataInstalacao: '2024-01-20',
    dataPrimeiroCadastro: '2024-01-20',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Dual WAN (Vivo Fibra + Claro contingência) com failover automático.',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'eq_osasco_1',
    nome: 'PDV-01',
    patrimonio: 'PAT-0061',
    numeroSerie: 'BRJ5590-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    marca: 'Dell',
    modelo: 'OptiPlex 3050 Micro',
    clienteId: 'cli_mark',
    clienteNome: 'Mark Security',
    lojaId: 'store_mark_02',
    lojaNome: 'Loja 02 — Osasco',
    posicaoCaixa: 'Caixa 01',
    localizacaoAtual: 'LOJA',
    status: 'EM_USO',
    processador: 'Intel Core i3-7100T',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    dataPrimeiroCadastro: '2024-02-15',
    tecnicoResponsavel: 'Carlos Silva',
    observacoes: 'Terminal frente de caixa Loja Osasco.',
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'eq_reserva_1',
    nome: 'PDV-RES-01',
    patrimonio: 'PAT-0099',
    numeroSerie: 'BRJ1182-DEL',
    tipo: 'PDV',
    marcaModelo: 'Dell OptiPlex 3050 Micro',
    marca: 'Dell',
    modelo: 'OptiPlex 3050 Micro',
    clienteId: 'cli_interno',
    clienteNome: 'Estoque Central TI',
    lojaId: 'store_estoque_central',
    lojaNome: 'Bancada TI & Estoque Central',
    posicaoCaixa: 'Armário Reserva Bancada',
    localizacaoAtual: 'ESTOQUE',
    status: 'EM_USO',
    processador: 'Intel Core i5-7500T 2.70GHz',
    memoriaRamGb: 8,
    armazenamentoValor: 240,
    armazenamentoUnidade: 'GB',
    tipoArmazenamento: 'SSD_SATA',
    sistemaOperacional: 'Windows 10 Pro 64-bit',
    dataPrimeiroCadastro: '2024-05-15',
    dataUltimaManutencao: '2026-10-08',
    tecnicoResponsavel: 'Marcos Oliveira',
    observacoes: 'Máquina reserva de contingência para frente de caixa. Homologada com MGV e Full PDV.',
    createdAt: '2024-05-15T14:00:00Z',
    updatedAt: '2026-10-08T11:00:00Z',
  },
];

export const INITIAL_DEMO_MOVEMENTS: MovementRecord[] = [
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
    responsavelRetirada: 'Carlos Silva',
    motivoEnvio: 'Manutenção preventiva periódica',
    problemaRelatado: 'Poeira acumulada no cooler e lentidão eventual',
    servicoRealizado: 'Limpeza física, troca de pasta térmica e atualização de drivers',
    resultadoAtendimento: 'CONCLUIDO_SUCESSO',
    observacoes: 'Temperatura estabilizada em 42°C sob carga.',
    criadoEm: '2026-09-15T08:30:00Z',
  },
];

export const INITIAL_DEMO_HARDWARE_CHANGES: HardwareChangeRecord[] = [
  {
    id: 'hw_1',
    equipamentoId: 'eq_2',
    equipamentoNome: 'PDV-02',
    patrimonio: 'PAT-0042',
    numeroOs: 'OS-101',
    componenteSubstituido: 'SSD',
    descricaoPecaAntiga: 'HD SATA 500GB Seagate Barracuda 5400RPM',
    serialPecaAntiga: 'W804912-SG',
    componenteInstalado: 'SSD Kingston A400 240GB SATA III',
    marcaModeloNovo: 'Kingston A400 240GB',
    serialPecaNova: 'SA400S37-9941',
    quantidade: 1,
    tipoAlteracao: 'ARMAZENAMENTO',
    especificacaoAnterior: '500 GB HD',
    especificacaoNova: '240 GB SSD SATA',
    dataSubstituicao: '2026-10-12',
    tecnicoResponsavel: 'Carlos Silva',
    motivoTroca: 'HD com lentidão extrema, setores com falha de leitura (bad blocks) e boot demorando 4 minutos',
    resultado: 'Boot reduzido para 18 segundos e carregamento instantâneo do PDV',
    observacoes: 'Descarte seguro do HD antigo efetuado conforme protocolo de TI.',
    criadoEm: '2026-10-12T10:00:00Z',
  },
  {
    id: 'hw_2',
    equipamentoId: 'eq_4',
    equipamentoNome: 'GER-LJ03',
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
  // Read initial cache from localStorage as fallback during initial connection
  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EQUIPMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler cache local de equipamentos', e);
    }
    return [];
  });

  const [movements, setMovements] = useState<MovementRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler cache local de movimentações', e);
    }
    return [];
  });

  const [hardwareChanges, setHardwareChanges] = useState<HardwareChangeRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HARDWARE_CHANGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler cache local de alterações de hardware', e);
    }
    return [];
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    // 1. Check and initialize once if the central DB is brand new
    checkAndInitializeDatabase(
      INITIAL_DEMO_EQUIPMENTS,
      [],
      INITIAL_DEMO_MOVEMENTS,
      INITIAL_DEMO_HARDWARE_CHANGES
    ).catch((err) => console.warn('Sync init check:', err));

    // 2. Subscribe in real-time to central Firestore collections
    const unsubEquipments = subscribeToEquipments(
      (remoteEquipments) => {
        setEquipments(remoteEquipments);
        try {
          localStorage.setItem(STORAGE_KEY_EQUIPMENTS, JSON.stringify(remoteEquipments));
        } catch {
          // ignore
        }
      },
      (err) => console.warn('Equipments sync snapshot error:', err)
    );

    const unsubMovements = subscribeToMovements(
      (remoteMovements) => {
        setMovements(remoteMovements);
        try {
          localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(remoteMovements));
        } catch {
          // ignore
        }
      },
      (err) => console.warn('Movements sync snapshot error:', err)
    );

    const unsubHardware = subscribeToHardwareChanges(
      (remoteChanges) => {
        setHardwareChanges(remoteChanges);
        try {
          localStorage.setItem(STORAGE_KEY_HARDWARE_CHANGES, JSON.stringify(remoteChanges));
        } catch {
          // ignore
        }
      },
      (err) => console.warn('Hardware changes sync snapshot error:', err)
    );

    return () => {
      unsubEquipments();
      unsubMovements();
      unsubHardware();
    };
  }, []);

  // Add Equipment with duplicate validation and Firestore sync
  const addEquipment = useCallback((data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    let cleanPatrimonio = (data.patrimonio || '').trim().toUpperCase();
    if (!cleanPatrimonio) {
      cleanPatrimonio = `EQ-${String(equipments.length + 101).padStart(4, '0')}`;
    }

    const cleanSerial = (data.numeroSerie || '').trim().toUpperCase();

    // Check duplicate patrimonio
    const existsPatrimonio = equipments.some(
      (e) => e.patrimonio.trim().toUpperCase() === cleanPatrimonio
    );
    if (existsPatrimonio) {
      return {
        success: false,
        error: `Já existe um equipamento cadastrado com o código/patrimônio "${cleanPatrimonio}".`,
      };
    }

    // Check duplicate serial number (only if provided and not empty)
    if (cleanSerial) {
      const existsSerial = equipments.some(
        (e) => e.numeroSerie && e.numeroSerie.trim().toUpperCase() === cleanSerial
      );
      if (existsSerial) {
        return {
          success: false,
          error: `Já existe um equipamento cadastrado com o número de série / Service Tag "${data.numeroSerie}".`,
        };
      }
    }

    const newEquipment: Equipment = {
      ...data,
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patrimonio: cleanPatrimonio,
      numeroSerie: cleanSerial || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic state update
    setEquipments((prev) => [newEquipment, ...prev]);

    // Central Firestore sync (persists to cloud and broadcasts to all other devices)
    syncSaveEquipment(newEquipment).catch((err) => {
      console.error('Falha ao sincronizar equipamento no Firestore', err);
    });

    return { success: true, equipment: newEquipment };
  }, [equipments]);

  // Update Equipment with duplicate validation and Firestore sync
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
        (e) => e.id !== id && (e.numeroSerie || '').trim().toUpperCase() === cleanSerial
      );
      if (duplicate) {
        return { success: false, error: `O número de série "${patch.numeroSerie}" já está em uso por outro equipamento.` };
      }
    }

    const updatedEquipment: Equipment = {
      ...current,
      ...patch,
      patrimonio: patch.patrimonio ? patch.patrimonio.trim().toUpperCase() : current.patrimonio,
      numeroSerie: patch.numeroSerie ? patch.numeroSerie.trim().toUpperCase() : current.numeroSerie,
      updatedAt: new Date().toISOString(),
    };

    setEquipments((prev) =>
      prev.map((e) => (e.id === id ? updatedEquipment : e))
    );

    // Broadcast to Firestore
    syncSaveEquipment(updatedEquipment).catch((err) => {
      console.error('Falha ao atualizar equipamento no Firestore', err);
    });

    return { success: true };
  }, [equipments]);

  // Delete Equipment with safety and Firestore sync
  const deleteEquipment = useCallback((id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
    // Remove centrally in Firestore so it immediately disappears on all other devices
    syncDeleteEquipment(id).catch((err) => {
      console.error('Falha ao excluir equipamento no Firestore', err);
    });
    return { success: true };
  }, []);

  // Add Timeline Movement with Firestore sync
  const addMovement = useCallback((recordData: Omit<MovementRecord, 'id' | 'criadoEm'>): MovementRecord => {
    const newMovement: MovementRecord = {
      ...recordData,
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      criadoEm: new Date().toISOString(),
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Save movement to Firestore
    syncSaveMovement(newMovement).catch((err) => {
      console.error('Falha ao sincronizar movimentação no Firestore', err);
    });

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

        const updatedEq = { ...eq, ...updates };
        syncSaveEquipment(updatedEq).catch(() => {});
        return updatedEq;
      })
    );

    return newMovement;
  }, []);

  // Add Hardware Change Record with Firestore sync
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

    syncSaveHardwareChange(newChange).catch((err) => {
      console.error('Falha ao sincronizar alteração de hardware no Firestore', err);
    });

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

          const updatedEq = { ...eq, ...patch };
          syncSaveEquipment(updatedEq).catch(() => {});
          return updatedEq;
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
        (e.numeroSerie && e.numeroSerie.toLowerCase().includes(clean)) ||
        (e.lojaNome && e.lojaNome.toLowerCase().includes(clean)) ||
        (e.lojaOrigem && e.lojaOrigem.toLowerCase().includes(clean)) ||
        (e.clienteNome && e.clienteNome.toLowerCase().includes(clean)) ||
        (e.marcaModelo && e.marcaModelo.toLowerCase().includes(clean)) ||
        (e.posicaoCaixa && e.posicaoCaixa.toLowerCase().includes(clean)) ||
        (e.enderecoIp && e.enderecoIp.toLowerCase().includes(clean)) ||
        e.tipo.toLowerCase().includes(clean)
    );
  }, [equipments]);

  const getEquipmentsByStoreId = useCallback((storeId: string) => {
    return equipments.filter((e) => e.lojaId === storeId || e.lojaOrigem === storeId);
  }, [equipments]);

  const getEquipmentsByClientId = useCallback((clientId: string) => {
    return equipments.filter((e) => e.clienteId === clientId);
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
        parsed.equipments.forEach((eq: Equipment) => syncSaveEquipment(eq).catch(() => {}));
      }
      if (parsed.movements && Array.isArray(parsed.movements)) {
        setMovements(parsed.movements);
        parsed.movements.forEach((mov: MovementRecord) => syncSaveMovement(mov).catch(() => {}));
      }
      if (parsed.hardwareChanges && Array.isArray(parsed.hardwareChanges)) {
        setHardwareChanges(parsed.hardwareChanges);
        parsed.hardwareChanges.forEach((hw: HardwareChangeRecord) => syncSaveHardwareChange(hw).catch(() => {}));
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
        getEquipmentsByStoreId,
        getEquipmentsByClientId,
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
