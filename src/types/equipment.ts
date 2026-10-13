import { MachineType } from './checklist';

export type EquipmentType = 'PDV' | 'COMPUTADOR' | 'NOTEBOOK' | 'OUTRO';

export type EquipmentLocation =
  | 'LOJA'
  | 'ESCRITORIO'
  | 'ESTOQUE'
  | 'ASSISTENCIA'
  | 'OUTRO';

export type EquipmentStatus =
  | 'EM_USO'                 // Em uso na loja
  | 'AGUARDANDO_MANUTENCAO'  // Aguardando manutenção no escritório
  | 'EM_MANUTENCAO'          // Em manutenção na bancada
  | 'DISPONIVEL_RETIRADA'    // Disponível para retirada / pronto
  | 'RETIRADO'               // Retirado / a caminho da loja
  | 'DESATIVADO';            // Desativado / sucata

export type StorageType = 'SSD_SATA' | 'SSD_NVME' | 'HD';

export interface Equipment {
  id: string;                      // Identificador único interno
  nome: string;                    // Nome padronizado (Ex: PDV-01, EST-03)
  patrimonio: string;              // Código interno / Patrimônio único
  numeroSerie: string;             // Service Tag / Serial number único
  tipo: EquipmentType;             // PDV, COMPUTADOR, NOTEBOOK, OUTRO
  marcaModelo: string;             // Ex: Dell OptiPlex 3050, Bematech RC-8400
  lojaOrigem: string;              // Loja ou setor de origem (Ex: Loja 01 - Centro)
  localizacaoAtual: EquipmentLocation; // Onde o equipamento está fisicamente
  status: EquipmentStatus;         // Status operacional atual
  
  // Especificações de Hardware
  processador: string;             // Ex: Intel Core i3-7100 3.90GHz
  memoriaRamGb: number;            // Memória RAM em GB (Ex: 8, 16)
  armazenamentoValor: number;      // Tamanho do armazenamento (Ex: 240, 500, 1)
  armazenamentoUnidade: 'GB' | 'TB';// Unidade (GB ou TB)
  tipoArmazenamento: StorageType;  // HD, SSD SATA, SSD NVMe
  sistemaOperacional: string;      // Ex: Windows 10 Pro 64-bit
  
  // Datas e auditoria
  dataPrimeiroCadastro: string;    // Data do primeiro cadastro (YYYY-MM-DD)
  dataUltimaEntrada?: string;      // Data da última chegada ao escritório (YYYY-MM-DDTHH:mm)
  dataUltimaRetirada?: string;     // Data da última retirada (YYYY-MM-DDTHH:mm)
  dataUltimaManutencao?: string;   // Data da última manutenção concluída (YYYY-MM-DD)
  tecnicoResponsavel?: string;     // Último técnico que atendeu
  observacoes?: string;            // Notas gerais
  
  createdAt: string;
  updatedAt: string;
}

export type MovementResult =
  | 'CONCLUIDO_SUCESSO'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_PECA'
  | 'CONDENADO_SUCATA';

export interface MovementRecord {
  id: string;
  equipamentoId: string;
  equipamentoNome: string;
  patrimonio: string;
  osId?: string;                   // Ordem de Serviço vinculada (se houver)
  numeroOs?: string;
  
  // Cronologia de Movimentação
  dataHoraEntrada: string;         // ISO YYYY-MM-DDTHH:mm (Chegada ao escritório)
  dataHoraRetirada?: string;       // ISO YYYY-MM-DDTHH:mm (Retirada da máquina)
  dataDevolucao?: string;          // Data da devolução ou reinstalação na loja
  
  // Origem e Destino
  lojaOrigem: string;              // Loja ou setor de onde veio
  destino?: string;                // Destino após a manutenção
  
  // Pessoas envolvidas
  responsavelEntrega: string;      // Quem entregou o equipamento no escritório
  tecnicoResponsavel: string;      // Técnico que recebeu / atendeu
  responsavelRetirada?: string;    // Quem retirou o equipamento
  
  // Atendimento
  motivoEnvio: string;             // Motivo da vinda ao escritório
  problemaRelatado: string;        // Defeito relatado
  servicoRealizado?: string;       // Serviço executado
  resultadoAtendimento: MovementResult;
  
  observacoes?: string;
  criadoEm: string;
}

export interface HardwareChangeRecord {
  id: string;
  equipamentoId: string;
  equipamentoNome: string;
  patrimonio: string;
  osId?: string;                   // Ordem de serviço responsável
  numeroOs?: string;
  
  // Componente e Substituição
  componenteSubstituido: string;   // Ex: Memória RAM, SSD, HD, Fonte, Placa-Mãe, Processador
  descricaoPecaAntiga: string;     // Ex: HD 500GB Seagate 5400RPM
  serialPecaAntiga?: string;       // Serial da peça antiga (se disponível)
  
  componenteInstalado: string;     // Ex: SSD 240GB Kingston A400
  marcaModeloNovo: string;         // Ex: Kingston A400
  serialPecaNova?: string;         // Serial da peça nova
  quantidade: number;              // Quantidade instalada
  
  // Configuração anterior vs nova (para rastreio de upgrade)
  tipoAlteracao?: 'RAM' | 'ARMAZENAMENTO' | 'PROCESSADOR' | 'OUTRO';
  especificacaoAnterior?: string;  // Ex: 8 GB
  especificacaoNova?: string;      // Ex: 16 GB
  
  dataSubstituicao: string;        // YYYY-MM-DD
  tecnicoResponsavel: string;
  motivoTroca: string;             // Motivo da substituição
  resultado: string;               // Resultado após o teste
  observacoes?: string;
  criadoEm: string;
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, { label: string; color: string; badgeBg: string; textBadge: string; dotColor: string }> = {
  EM_USO: {
    label: 'Em Uso na Loja',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  AGUARDANDO_MANUTENCAO: {
    label: 'Aguardando Manutenção',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  EM_MANUTENCAO: {
    label: 'Em Manutenção',
    color: 'orange',
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    textBadge: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  DISPONIVEL_RETIRADA: {
    label: 'Disponível para Retirada',
    color: 'blue',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  RETIRADO: {
    label: 'Retirado / A Caminho',
    color: 'purple',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textBadge: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  DESATIVADO: {
    label: 'Desativado / Sucata',
    color: 'slate',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
};

export const LOCATION_LABELS: Record<EquipmentLocation, string> = {
  LOJA: 'Na Loja (Produção)',
  ESCRITORIO: 'No Escritório de TI',
  ESTOQUE: 'Estoque Central de Reservas',
  ASSISTENCIA: 'Assistência Técnica Externa',
  OUTRO: 'Outro Local',
};
