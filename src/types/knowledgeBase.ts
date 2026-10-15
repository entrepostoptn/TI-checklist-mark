export type KnowledgeCategory =
  | 'ATENDIMENTO_OS'
  | 'CHECKLIST'
  | 'EQUIPAMENTOS'
  | 'MATRIZES_FILIAIS'
  | 'RELATORIOS'
  | 'PROCEDIMENTOS_TECNICOS';

export interface KnowledgeArticleStep {
  numero: number;
  titulo: string;
  instrucao: string;
  dicaOuAlerta?: string;
}

export interface KnowledgeArticle {
  id: string;
  titulo: string;
  categoria: KnowledgeCategory;
  categoriaNome: string;
  objetivo: string;
  quandoUtilizar: string;
  preRequisitos: string[];
  passos: KnowledgeArticleStep[];
  resultadoEsperado: string;
  validacaoFinal: string;
  oQueFazerSeErro: string;
  responsavelOuEquipe: string;
  tags: string[];
  artigosRelacionadosIds?: string[];
  status: 'PUBLICADO' | 'RASCUNHO' | 'PENDENTE_VALIDACAO';
  autorNome: string;
  criadoEm: string;
  atualizadoEm: string;
}
