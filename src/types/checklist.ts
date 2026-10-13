export type MachineType = 'PDV' | 'ESCRITORIO';

export type ChecklistStatus = 'Pendente' | 'Em andamento' | 'Concluído';

export interface CompanyConfig {
  balancaNumero: number;
  balancaIp: string;
  departamentoNumero: number;
  departamentoNome: string;
  etiquetaCodigo: string;
  etiquetaTamanho: string;
  pastaUtilMs: string;
  pastaCarga: string;
  impressoraPadrao: string;
}

export interface MachineIdentification {
  identificacao: string; // Ex: PDV-01 ou ESCRIT-04
  loja: string;          // Ex: Loja 01 - Centro
  tecnico: string;       // Ex: Carlos Técnico
  data: string;          // Ex: YYYY-MM-DD
  tipo: MachineType;
  utilizaImpressor: boolean; // Se a máquina utiliza impressão pelo Impressor
  observacoes: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  sublabel?: string;
  done: boolean;
  notes?: string;
  commandToCopy?: string;
  commandLabel?: string;
  isConditional?: boolean;
  conditionalType?: MachineType | 'IMPRESSOR';
  sectionRef?: string;
}

export interface ChecklistStep {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  applicableFor?: MachineType | 'ALL' | 'IMPRESSOR';
  items: ChecklistItem[];
  subsections?: {
    id: string;
    code: string;
    title: string;
    badge?: string;
    items: ChecklistItem[];
  }[];
}

export interface SavedChecklistRecord {
  id: string;
  machine: MachineIdentification;
  config: CompanyConfig;
  itemsState: Record<string, boolean>;
  stepNotes: Record<string, string>;
  status: ChecklistStatus;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  createdAt: string;
  updatedAt: string;
  finalObservations: string;
}
