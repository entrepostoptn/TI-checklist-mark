export type MaintenanceStatus =
  | 'RECEBIDA'             // Máquina recebida no laboratório / na fila de triagem
  | 'EM_MANUTENCAO'        // Técnico em atendimento na bancada de testes
  | 'PENDENTE'             // Não concluída / Aguardando peça ou validação (com motivo)
  | 'CONCLUIDA'            // Concluída, limpeza e testes finais realizados
  | 'DISPONIVEL_ENVIO'     // Disponível para envio à loja
  | 'RETIRADA_TRANSPORTE'  // Retirada registrada por técnico para transporte/despacho
  | 'ENTREGUE_LOJA';       // Entregue e restabelecida na loja de destino

export interface MaintenanceChecklist {
  testeInicializacao: boolean;        // POST, BIOS e inicialização sem erros
  testeMemoriaRam: boolean;           // Memória RAM sem falhas ou tela azul
  testeArmazenamento: boolean;        // Saúde SMART do SSD/HD 100%, setores íntegros
  testePortasComunicacao: boolean;    // Portas USB, seriais COM e interfaces
  testeRedeConectividade: boolean;    // Rede Ethernet cabeada e Wi-Fi estáveis
  testeTermicoCooler: boolean;        // Temperatura da CPU estável, limpeza cooler/dissipador
  testeFonteAlimentacao: boolean;     // Tensões nominais e estabilidade elétrica
  testePerifericos: boolean;          // Balança, impressora térmica, leitor ou monitor
  testeSistemaOperacional: boolean;   // Sistema operacional carregando e drivers OK
  limpezaInternaExterna: boolean;     // Despoeiramento interno e higienização externa
  testesFinaisAprovados: boolean;     // Teste de bancada final sob estresse aprovado
  observacoesChecklist?: string;      // Observações específicas dos testes
}

export interface MaintenancePiece {
  id: string;
  descricao: string;
  quantidade: number;
  numeroSerie?: string;
  status: 'UTILIZADA' | 'AGUARDANDO_CHEGADA';
  dataRegistro: string;
}

export interface MaintenanceEvent {
  id: string;
  dataHora: string;                   // ISO string
  tipo:
    | 'CRIACAO_OS'
    | 'ENTRADA_LABORATORIO'
    | 'INICIO_TESTES'
    | 'ATUALIZACAO_CHECKLIST'
    | 'PENDENCIA_REGISTRADA'
    | 'CONCLUSAO_TESTES'
    | 'LIBERADO_ENVIO'
    | 'RETIRADA_TRANSPORTE'
    | 'ENTREGA_CONFIRMADA';
  descricao: string;
  responsavel: string;
  detalhes?: string;
}

export interface MaintenanceRecord {
  id: string;
  // Vínculos
  osId: string;
  numeroOs: string;
  equipamentoId?: string;
  equipamentoNome: string;
  patrimonio?: string;
  numeroSerie?: string;
  tipoEquipamento: string;
  
  // Unidade de Origem e Destino
  lojaOrigem: string;
  lojaDestino?: string;
  
  // Status do Ciclo de Vida
  status: MaintenanceStatus;
  
  // Responsáveis e Datas
  dataHoraEntrada: string;            // ISO
  tecnicoAbertura: string;
  tecnicoBancada?: string;            // Técnico que assumiu os testes
  dataHoraInicioTestes?: string;
  
  // Checklist e Avaliação Técnica
  checklist: MaintenanceChecklist;
  problemasEncontrados: string;
  pecasNecessarias: MaintenancePiece[];
  alteracoesExecutadas: string;       // Modificações de hardware/software
  servicosExecutados: string;         // Serviços realizados (troca de pasta, regravação de BIOS, etc.)
  
  // Desfecho de Bancada
  resultadoFinal?: 'CONCLUIDA' | 'NAO_CONCLUIDA_PENDENTE';
  motivoNaoConcluida?: string;        // OBRIGATÓRIO se resultadoFinal === 'NAO_CONCLUIDA_PENDENTE'
  dataHoraConclusao?: string;
  tecnicoConclusao?: string;
  
  // Fluxo de Despacho / Retirada
  retiradaRegistrada: boolean;
  dataHoraRetirada?: string;
  tecnicoRetirada?: string;           // Técnico que retirou no lab para transporte
  destinoEnvio?: string;
  observacoesRetirada?: string;
  
  // Fluxo de Entrega na Loja
  entregaRegistrada: boolean;
  dataHoraEntrega?: string;
  tecnicoEntrega?: string;            // Técnico que realizou a entrega
  responsavelRecebimentoLoja?: string;// Quem recebeu e assinou na filial
  observacoesEntrega?: string;
  
  // Linha do tempo / Auditoria de cada máquina vinculada à OS
  historicoEventos: MaintenanceEvent[];
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStats {
  totalRecebidasMes: number;
  emManutencao: number;
  pendentes: number;
  concluidasMes: number;
  disponiveisEnvio: number;
  retiradasEmTransito: number;
  entreguesMes: number;
}

export const DEFAULT_MAINTENANCE_CHECKLIST: MaintenanceChecklist = {
  testeInicializacao: false,
  testeMemoriaRam: false,
  testeArmazenamento: false,
  testePortasComunicacao: false,
  testeRedeConectividade: false,
  testeTermicoCooler: false,
  testeFonteAlimentacao: false,
  testePerifericos: false,
  testeSistemaOperacional: false,
  limpezaInternaExterna: false,
  testesFinaisAprovados: false,
};

export const MAINTENANCE_STATUS_LABELS: Record<
  MaintenanceStatus,
  { label: string; short: string; badgeBg: string; textBadge: string; dotColor: string }
> = {
  RECEBIDA: {
    label: 'Recebida no Laboratório',
    short: 'Recebida',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  EM_MANUTENCAO: {
    label: 'Em Manutenção / Bancada',
    short: 'Em Bancada',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  PENDENTE: {
    label: 'Pendente (Não Concluída)',
    short: 'Pendente',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    textBadge: 'text-rose-700',
    dotColor: 'bg-rose-500',
  },
  CONCLUIDA: {
    label: 'Concluída / Testes Aprovados',
    short: 'Concluída',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  DISPONIVEL_ENVIO: {
    label: 'Disponível para Envio à Loja',
    short: 'Disponível Envio',
    badgeBg: 'bg-teal-500/15 border-teal-500/30',
    textBadge: 'text-teal-700',
    dotColor: 'bg-teal-500',
  },
  RETIRADA_TRANSPORTE: {
    label: 'Retirada / A Caminho da Loja',
    short: 'Em Transporte',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textBadge: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  ENTREGUE_LOJA: {
    label: 'Entregue e Operando na Loja',
    short: 'Entregue',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-700',
    dotColor: 'bg-slate-500',
  },
};
