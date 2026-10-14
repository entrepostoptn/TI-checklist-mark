import { MachineType } from './checklist';

export type ServiceOrderStatus =
  | 'ABERTA'              // Aberta / Nova
  | 'EM_ANDAMENTO'         // Em atendimento técnico
  | 'AGUARDANDO_PECA'      // Aguardando chegada de peça / suprimento
  | 'AGUARDANDO_TERCEIROS'  // Aguardando provedor/operadora/fabricante
  | 'CONCLUIDA'            // Concluída com sucesso
  | 'CANCELADA'            // Cancelada
  // Retrocompatibilidade:
  | 'REPARO_ESCRITORIO'
  | 'RESERVA'
  | 'PRONTA'
  | 'EM_OPERACAO';

export type ServiceOrderPriority =
  | 'BAIXA'
  | 'NORMAL'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA'
  | 'URGENTE';

export type ServiceOrderType =
  | 'corretivo'
  | 'preventivo'
  | 'instalacao'
  | 'configuracao'
  | 'atualizacao'
  | 'outro';

export interface ServiceOrder {
  id: string;                      // Identificador único interno
  numeroOs: string;                // Ex: OS-101 (gerado automaticamente)
  
  // Vínculos Estruturais
  clienteId?: string;              // ID do cliente matriz
  clienteNome?: string;            // Razão social / Nome fantasia
  lojaId?: string;                 // ID da filial/loja
  lojaNome?: string;               // Nome da loja (Ex: Loja 01 — Barueri)
  lojaOrigem?: string;             // Retrocompatibilidade
  lojaDestino?: string;            // Loja para onde vai após ficar pronta
  
  // Equipamento
  equipamentoId?: string;          // Vínculo com cadastro de equipamento
  equipamentoNome?: string;        // Nome amigável do equipamento
  identificacao: string;           // Ex: PDV-03 ou "Infraestrutura / Rede"
  patrimonio?: string;             // Tag de patrimônio único
  numeroSerie?: string;            // Serial / Service Tag
  tipo?: MachineType | string;     // PDV, COMPUTADOR, IMPRESSORA, etc.
  semEquipamento?: boolean;        // Verdadeiro quando for atendimento de infra/rede/loja geral
  
  // Equipe e Responsáveis
  tecnicoResponsavel: string;      // Técnico responsável
  responsavelEntrega?: string;     // Quem abriu / solicitou
  responsavelRetirada?: string;    // Quem recebeu
  responsavelEncerramento?: string;// Quem finalizou o atendimento
  
  // Classificação
  status: ServiceOrderStatus;
  prioridade: ServiceOrderPriority;
  categoriaAtendimento?: string;   // Rede, PDV, Balança, Impressora, Sistema, etc.
  tipoServico?: ServiceOrderType;  // corretivo, preventivo, instalacao, etc.
  
  // Atendimento Técnico
  defeitoRelatado: string;         // Descrição do problema relatado
  diagnosticoTecnico?: string;     // Diagnóstico técnico
  procedimentosExecutados?: string;// Procedimentos executados
  servicosExecutados?: string;     // Sinônimo para retrocompatibilidade
  pecasTrocadas?: string;          // Peças ou componentes utilizados
  solucaoAplicada?: string;        // Solução aplicada final
  resultadoAtendimento?: 'CONCLUIDO_SUCESSO' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONDENADO_SUCATA';
  
  // Datas e Horários
  dataEntrada: string;             // Data (YYYY-MM-DD)
  dataHoraAbertura?: string;       // ISO Data e Hora de abertura
  dataPrevisao?: string;           // Previsão de entrega
  dataConclusao?: string;          // Data de conclusão (YYYY-MM-DD)
  dataHoraConclusao?: string;      // ISO Data e Hora de conclusão
  dataRetirada?: string;           // Data e hora de retirada
  
  // Integração com o Checklist
  checklistProgresso?: number;     // % do checklist completado
  checklistConcluido?: boolean;
  
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<
  ServiceOrderStatus,
  { label: string; short: string; color: string; badgeBg: string; textBadge: string; dotColor: string }
> = {
  ABERTA: {
    label: 'Aberta / Pendente',
    short: 'Aberta',
    color: 'blue',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    short: 'Em Andamento',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  AGUARDANDO_PECA: {
    label: 'Aguardando Peça',
    short: 'Aguardando Peça',
    color: 'orange',
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    textBadge: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  AGUARDANDO_TERCEIROS: {
    label: 'Aguardando Terceiros',
    short: 'Terceiros',
    color: 'purple',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textBadge: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  CONCLUIDA: {
    label: 'Concluída / Encerrada',
    short: 'Concluída',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    short: 'Cancelada',
    color: 'slate',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  // Mapeamentos retrocompatíveis
  REPARO_ESCRITORIO: {
    label: 'No Escritório para Reparo',
    short: 'Em Reparo',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  RESERVA: {
    label: 'Máquina Reserva (Estoque)',
    short: 'Reserva',
    color: 'indigo',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
    textBadge: 'text-indigo-700',
    dotColor: 'bg-indigo-500',
  },
  PRONTA: {
    label: 'Pronta para Entrega',
    short: 'Pronta',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  EM_OPERACAO: {
    label: 'Em Operação na Loja',
    short: 'Na Loja',
    color: 'slate',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
};

export const PRIORITY_CONFIG: Record<
  ServiceOrderPriority,
  { label: string; badgeBg: string; textBadge: string; border: string }
> = {
  BAIXA: {
    label: 'Baixa',
    badgeBg: 'bg-slate-100',
    textBadge: 'text-slate-700',
    border: 'border-slate-300',
  },
  NORMAL: {
    label: 'Normal',
    badgeBg: 'bg-blue-50',
    textBadge: 'text-blue-700',
    border: 'border-blue-200',
  },
  MEDIA: {
    label: 'Média',
    badgeBg: 'bg-blue-50',
    textBadge: 'text-blue-700',
    border: 'border-blue-200',
  },
  ALTA: {
    label: 'Alta',
    badgeBg: 'bg-amber-50',
    textBadge: 'text-amber-800',
    border: 'border-amber-300',
  },
  CRITICA: {
    label: 'Crítica',
    badgeBg: 'bg-red-50',
    textBadge: 'text-red-700 font-bold',
    border: 'border-red-300',
  },
  URGENTE: {
    label: 'Crítica / Urgente',
    badgeBg: 'bg-red-50',
    textBadge: 'text-red-700 font-bold',
    border: 'border-red-300',
  },
};
