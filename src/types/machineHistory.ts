export interface MachinePatrimonyHistory {
  id: string;
  maquinaId: string;
  patrimonio?: string;
  lojaNome: string;
  filialNome?: string;
  dataHora: string;
  tecnicoResponsavel: string;
  tipoEvento:
    | 'FORMATACAO'
    | 'INSTALACAO_PROGRAMAS'
    | 'ALTERACAO_CONFIGURACAO'
    | 'TROCA_MEMORIA_RAM'
    | 'TROCA_DISCO_SSD_HD'
    | 'TROCA_PROCESSADOR'
    | 'TROCA_PLACA_MAE'
    | 'ALTERACAO_NOME_WINDOWS'
    | 'ALTERACAO_ID_REMOTO'
    | 'TRANSFERENCIA_LOJA'
    | 'ENTRADA_MANUTENCAO'
    | 'SAIDA_MANUTENCAO'
    | 'MANUTENCAO_PREVENTIVA'
    | 'CHECKLIST_EXECUTADO'
    | 'ORDEM_SERVICO'
    | 'OUTRO';
  detalhes: string;
  componente?: string;
  especificacaoAnterior?: string;
  especificacaoNova?: string;
  ordemServicoId?: string;
  checklistId?: string;
  motivo?: string;
  criadoEm?: string;
}
