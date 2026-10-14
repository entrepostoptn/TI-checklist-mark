export interface Client {
  id: string;
  codigo?: string;         // Ex: CLI-001, MARK-01
  razaoSocial: string;     // Nome da empresa / Razão Social
  nomeFantasia?: string;   // Nome Fantasia (Ex: Mark Security)
  cnpj?: string;           // CNPJ quando aplicável
  telefone?: string;       // Telefone de contato
  email?: string;          // E-mail de contato
  responsavel?: string;    // Nome do responsável geral
  observacoes?: string;    // Observações gerais
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  clienteId: string;       // Vínculo obrigatório com o cliente matriz
  clienteNome?: string;    // Nome fantasia / Razão social da matriz
  nome: string;            // Nome ou identificação da loja (Ex: Loja 01 — Barueri)
  codigoLoja: string;      // Número ou código da loja (Ex: 01, LJ-BARUERI)
  cnpj?: string;           // CNPJ da filial quando aplicável
  endereco: string;        // Endereço completo (Rua, Número, Bairro)
  cidade: string;          // Cidade (Ex: Barueri)
  estado: string;          // Estado/UF (Ex: SP)
  cep?: string;            // CEP
  telefone?: string;       // Telefone da loja
  responsavelLocal?: string; // Nome do responsável local / gerente
  horarioFuncionamento?: string; // Horário de funcionamento da loja
  observacoes?: string;    // Observações de acesso ou atendimento
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}
