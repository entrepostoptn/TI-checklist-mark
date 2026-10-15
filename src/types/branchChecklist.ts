export type ChecklistItemStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONFORME'
  | 'NAO_CONFORME'
  | 'NAO_APLICAVEL';

export type ChecklistOverallStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'NAO_CONFORME';

export interface ChecklistTemplateItem {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  obrigatorio: boolean;
}

export interface ChecklistTemplate {
  id: string;
  nome: string;
  categoria: string;
  versao: number;
  descricao?: string;
  itens: ChecklistTemplateItem[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface BranchChecklistItem {
  id: string;
  templateItemId?: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  status: ChecklistItemStatus;
  observacao?: string;
  evidenciaUrl?: string;
  atualizadoEm?: string;
}

export interface ReopenRecord {
  data: string;
  responsavelId: string;
  responsavelNome: string;
  motivo: string;
}

export interface BranchChecklist {
  id: string;
  unidadeId: string;               // Vínculo com a matriz ou filial
  unidadeNome: string;             // Nome fantasia da unidade vinculada
  unidadeCnpj?: string;
  nome: string;                    // Nome do checklist
  categoria: string;               // Ex: Abertura, TI & PDVs, Balanças & Frios, Higiene, Fechamento
  templateId?: string;             // Modelo utilizado
  templateVersao?: number;         // Versão snapshot do modelo
  responsavelId: string;           // Usuário responsável
  responsavelNome: string;         // Nome do responsável
  dataCriacao: string;
  dataAtualizacao: string;
  dataConclusao?: string;
  status: ChecklistOverallStatus;
  itens: BranchChecklistItem[];
  observacoesGerais?: string;
  historicoReabertura?: ReopenRecord[];
}
