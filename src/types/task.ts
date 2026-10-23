export type TaskPriority = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface DailyTask {
  id: string;
  titulo: string;
  descricao?: string;
  dataAgendada: string; // YYYY-MM-DD
  lojaId?: string;
  lojaNome?: string;
  prioridade: TaskPriority;
  concluida: boolean;
  concluidaEm?: string; // ISO string
  concluidaPor?: string;
  responsavelNome?: string;
  origemAutomatica?: 'DEVOLUCAO_MAQUINA' | 'CHAMADO_OPERADORA' | 'MANUAL';
  referenciaId?: string; // id da OS / chamado se gerado
  criadoEm: string; // ISO string
  atualizadoEm: string; // ISO string
}
