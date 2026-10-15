export type BranchStatus = 'ativa' | 'inativa';
export type BranchType = 'MATRIZ' | 'FILIAL';

export interface BranchUnit {
  id: string;                      // ID do sistema (ex: branch_01, branch_matriz)
  idOriginal: string;              // ID da empresa na imagem/origem (ex: "01", "02", "CD")
  tipo: BranchType;                // MATRIZ ou FILIAL
  cnpj: string;                    // Identificador principal único (ex: 45.123.890/0001-44)
  razaoSocial: string;            // Razão Social mantida estritamente separada do nome fantasia
  nomeFantasia: string;           // Nome fantasia exclusivo da unidade (exibição)
  cep: string;                     // CEP formatado (ex: 06455-000)
  endereco: string;                // Endereço completo (Logradouro, número, bairro)
  municipio: string;               // Cidade / Município
  uf: string;                      // Estado (ex: SP)
  telefone?: string;               // Telefone da unidade
  status: BranchStatus;            // 'ativa' (verde) ou 'inativa' (vermelha - desativada)
  responsavelLocal?: string;       // Gerente ou responsável da unidade
  horarioFuncionamento?: string;   // Horário de operação
  observacoes?: string;            // Observações gerais
  pendenteConferencia?: boolean;   // Sinalização de dados ausentes/ilegíveis para conferência manual
  camposIlegiveis?: string[];      // Lista de campos com pendência de validação
  matrizVinculadaId?: string;      // ID da Matriz à qual a filial está vinculada
  matrizVinculadaNome?: string;    // Nome da Matriz vinculada
  criadoEm: string;
  atualizadoEm: string;
}

export interface BranchFilterOptions {
  busca: string;
  municipio: string;
  uf: string;
  status: 'TODAS' | 'ATIVAS' | 'INATIVAS';
  ordenarPor: 'nome' | 'cidade' | 'atualizacao' | 'codigo';
  ordemDirecao: 'asc' | 'desc';
}
