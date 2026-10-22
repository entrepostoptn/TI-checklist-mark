export type DailyDemandCategory =
  | 'CHAMADO_OPERADORA'   // Vivo, Claro, Provedor Fibra, Telefonia
  | 'ACESSO_REMOTO'       // AnyDesk, TeamViewer, VPN, Liberação de IP
  | 'SISTEMA_PDV'         // Frente de caixa, TEF, Retaguarda, Banco de dados
  | 'INFRAESTRUTURA'      // Rede física, Switch, Nobreak, Cabeamento
  | 'FORNECEDOR_EXTERNO'  // Balanças Toledo, Impressora Elgin, Assistência Externa
  | 'OUTRO';

export type DailyDemandStatus =
  | 'ABERTO'              // Recém anotado / Aguardando início
  | 'EM_ANDAMENTO'        // Em tratamento pelo técnico
  | 'AGUARDANDO_TERCEIRO' // Aguardando retorno Vivo/Claro/Provedor/Técnico de rua
  | 'CONCLUIDO'           // Resolvido / Finalizado
  | 'CANCELADO';

export type DailyDemandPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface DailyDemandProgressUpdate {
  id: string;
  dataHora: string;       // ISO string
  autor: string;          // Técnico que registrou o andamento
  descricao: string;      // O que foi falado/feito (ex: "Protocolo 20261020: atendente informou prazo de 4 horas")
  novoStatus?: DailyDemandStatus;
}

export interface DailyDemand {
  id: string;
  titulo: string;                    // Ex: "Chamado Vivo Fibra - Loja 03 sem internet"
  categoria: DailyDemandCategory;    // Operadora, Acesso, etc.
  protocoloExterno?: string;         // Ex: 20261020-998812 (Vivo/Claro)
  operadoraOuEmpresa?: string;       // Ex: Vivo, Claro, Totvs, Elgin, Toledo
  
  // Loja / Filial vinculada
  lojaId?: string;
  lojaNome: string;                  // Ex: Loja 03 Carapicuíba ou Matriz
  
  // Detalhes operacionais
  descricao: string;                 // Descrição da demanda do dia a dia
  status: DailyDemandStatus;
  prioridade: DailyDemandPriority;
  tecnicoResponsavel: string;
  
  // Previsões e prazos
  prazoEstimado?: string;            // Data ou horário previsto (ex: "Até 14h")
  dataAbertura: string;              // ISO
  dataConclusao?: string;            // ISO
  
  // Histórico de andamentos (para saber se já andou, se avançou)
  andamentos: DailyDemandProgressUpdate[];
  
  // Observações rápidas
  contatoLocal?: string;             // Nome/telefone de quem atende na loja
  linkAcessoRemoto?: string;         // ID AnyDesk ou IP se for chamado de acesso
  
  createdAt: string;
  updatedAt: string;
}

export const DEMAND_CATEGORY_LABELS: Record<
  DailyDemandCategory,
  { label: string; iconName: string; color: string; badgeBg: string; textBadge: string }
> = {
  CHAMADO_OPERADORA: {
    label: 'Chamado Operadora / Internet (Vivo / Claro)',
    iconName: 'PhoneCall',
    color: 'purple',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textBadge: 'text-purple-700',
  },
  ACESSO_REMOTO: {
    label: 'Chamado de Acesso Remoto & VPN',
    iconName: 'KeyRound',
    color: 'blue',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-700',
  },
  SISTEMA_PDV: {
    label: 'Chamado Sistema PDV / Retaguarda / TEF',
    iconName: 'Monitor',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
  },
  INFRAESTRUTURA: {
    label: 'Infraestrutura & Rede Física',
    iconName: 'Server',
    color: 'cyan',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30',
    textBadge: 'text-cyan-700',
  },
  FORNECEDOR_EXTERNO: {
    label: 'Suporte Terceiros / Fornecedor',
    iconName: 'Wrench',
    color: 'orange',
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    textBadge: 'text-orange-700',
  },
  OUTRO: {
    label: 'Demanda Geral / Outros',
    iconName: 'FileText',
    color: 'slate',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-700',
  },
};

export const DEMAND_STATUS_LABELS: Record<
  DailyDemandStatus,
  { label: string; short: string; badgeBg: string; textBadge: string; dotColor: string }
> = {
  ABERTO: {
    label: 'Aberto / Pendente',
    short: 'Aberto',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textBadge: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento / Em Tratativa',
    short: 'Em Andamento',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textBadge: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  AGUARDANDO_TERCEIRO: {
    label: 'Aguardando Terceiro (Vivo / Provedor)',
    short: 'Aguardando Terceiro',
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    textBadge: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  CONCLUIDO: {
    label: 'Concluído / Resolvido',
    short: 'Concluído',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textBadge: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  CANCELADO: {
    label: 'Cancelado',
    short: 'Cancelado',
    badgeBg: 'bg-slate-500/15 border-slate-500/30',
    textBadge: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
};
