export interface RemoteAccess {
  id: string;
  maquinaId: string;
  nomeMaquina: string;
  caixaNumero?: string;
  lojaId?: string;
  lojaNome: string;
  filialId?: string;
  filialNome: string;
  patrimonio?: string;
  numeroSerie?: string;
  appAcessoRemoto: 'AnyDesk' | 'TeamViewer' | 'Ammyy' | 'Outro';
  anydeskId: string;
  teamviewerId?: string;
  apelidoDispositivo?: string;
  observacoes?: string;
  status: 'ativo' | 'em_manutencao' | 'substituido' | 'desativado';
  dataUltimaAtualizacao: string;
  tecnicoResponsavel: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RemoteAccessHistory {
  id: string;
  remoteAccessId: string;
  maquinaId: string;
  nomeMaquina: string;
  lojaNome: string;
  filialNome: string;
  dataHora: string;
  tecnicoResponsavel: string;
  tipoEvento: 'FORMATACAO' | 'ALTERACAO_ID' | 'MANUTENCAO' | 'CADASTRO' | 'TROCA_COMPONENTE';
  campoAlterado?: string;
  valorAnterior?: string;
  valorNovo?: string;
  motivo?: string;
  descricaoServico: string;
}
