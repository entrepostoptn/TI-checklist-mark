export type AuditRecordType =
  | 'FILIAL'
  | 'CHECKLIST'
  | 'MODELO'
  | 'USUARIO'
  | 'AUTENTICACAO'
  | 'CONFIGURACAO';

export type AuditActionType =
  | 'CRIACAO'
  | 'EDICAO'
  | 'EXCLUSAO'
  | 'ATIVACAO'
  | 'INATIVACAO'
  | 'CONCLUSAO'
  | 'REABERTURA'
  | 'REDEFINICAO_SENHA'
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPORTACAO_LOTE';

export interface AuditLog {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  unidadeId?: string;
  unidadeNome?: string;
  tipoRegistro: AuditRecordType;
  acao: AuditActionType;
  campoModificado?: string;
  valorAnterior?: string;
  valorNovo?: string;
  motivo?: string;
  detalhes?: string;
  ipOrigem?: string;
}

export interface AuditFilterOptions {
  busca: string;
  usuarioId?: string;
  unidadeId?: string;
  tipoRegistro?: AuditRecordType | 'TODOS';
  acao?: AuditActionType | 'TODAS';
  dataInicio?: string;
  dataFim?: string;
}
