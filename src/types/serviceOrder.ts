import { MachineType } from './checklist';

export type ServiceOrderStatus =
  | 'REPARO_ESCRITORIO' // No escritório para reparo
  | 'RESERVA'           // Máquinas que temos reservas (estoque pronto)
  | 'PRONTA'            // Prontas (reparadas/homologadas aguardando entrega)
  | 'EM_OPERACAO';      // Em operação ativa na loja

export type ServiceOrderPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface ServiceOrder {
  id: string;              // Identificador único
  numeroOs: string;        // Ex: OS-101
  equipamentoId?: string;  // Vínculo com cadastro de equipamento
  identificacao: string;   // Ex: PDV-03 ou ESCRIT-01
  patrimonio?: string;     // Número de patrimônio / Tag
  numeroSerie?: string;    // Service Tag / Número de série
  tipo: MachineType;       // PDV ou ESCRITORIO
  lojaOrigem: string;      // Loja onde estava a máquina ou "Estoque Central"
  lojaDestino?: string;    // Loja para onde vai após ficar pronta
  tecnicoResponsavel: string;
  responsavelEntrega?: string; // Quem entregou no escritório
  responsavelRetirada?: string;// Quem retirou
  status: ServiceOrderStatus;
  prioridade: ServiceOrderPriority;

  // Informações de Manutenção
  defeitoRelatado: string;    // Sintoma / Motivo da entrada no escritório
  diagnosticoTecnico?: string;// Análise do técnico
  servicosExecutados?: string;// O que foi feito (troca de SSD, formatação, etc.)
  pecasTrocadas?: string;     // Resumo de peças trocadas
  resultadoAtendimento?: 'CONCLUIDO_SUCESSO' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONDENADO_SUCATA';

  // Datas
  dataEntrada: string;     // Data de entrada no escritório (YYYY-MM-DD)
  dataPrevisao?: string;   // Previsão de entrega
  dataConclusao?: string;  // Data que ficou pronta / liberada
  dataRetirada?: string;   // Data e hora de retirada da máquina

  // Integração com o Checklist
  checklistProgresso?: number; // % do checklist completado
  checklistConcluido?: boolean;

  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ServiceOrderStatus, { label: string; short: string; color: string; badgeBg: string; textBadge: string }> = {
  REPARO_ESCRITORIO: {
    label: 'No Escritório para Reparo',
    short: 'Em Reparo',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-500',
  },
  RESERVA: {
    label: 'Máquina Reserva (Estoque)',
    short: 'Reserva',
    color: 'blue',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-500',
  },
  PRONTA: {
    label: 'Pronta para Entrega',
    short: 'Pronta',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-500',
  },
  EM_OPERACAO: {
    label: 'Em Operação na Loja',
    short: 'Na Loja',
    color: 'slate',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-400',
  },
};
