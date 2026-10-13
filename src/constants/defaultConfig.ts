import { CompanyConfig, MachineIdentification } from '../types/checklist';

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  balancaNumero: 1,
  balancaIp: '192.168.0.201',
  departamentoNumero: 1,
  departamentoNome: 'GERAL',
  etiquetaCodigo: '251',
  etiquetaTamanho: '40 x 40',
  pastaUtilMs: 'C:\\UTIL MS',
  pastaCarga: 'C:\\CARGA',
  impressoraPadrao: 'Epson',
};

export const INITIAL_MACHINE_IDENTIFICATION: MachineIdentification = {
  identificacao: '',
  loja: '',
  tecnico: '',
  data: new Date().toISOString().split('T')[0],
  tipo: 'PDV',
  utilizaImpressor: true,
  observacoes: '',
};

export const UTIL_MS_PROGRAMS = [
  { name: 'Google Chrome', desc: 'Navegador web padrão para sistemas em nuvem e consultas' },
  { name: 'WinRAR', desc: 'Descompactador para pacotes de instalação e utilitários' },
  { name: 'MGV (Módulo Gerenciador de Vendas)', desc: 'Software de comunicação e carga de balanças Toledo' },
  { name: 'Impressor', desc: 'Módulo de spooler e impressão de cupons e documentos pelo sistema' },
  { name: 'Full PDV — Frente de Caixa', desc: 'Sistema operacional de frente de caixa para terminais de venda' },
  { name: 'Drivers de Impressoras', desc: 'Instaladores Epson TM-T20X, Bematech ou aplicáveis' },
  { name: 'Arquivos de Configuração', desc: 'Arquivos .ini, .xml e backups de parâmetros das lojas' },
  { name: 'Logos e Imagens da Loja', desc: 'Imagens para personalização de cupons fiscais e relatórios' },
  { name: 'Ícones e Atalhos Padronizados', desc: 'Ícones da Área de Trabalho e inicialização rápida' },
  { name: 'Outros utilitários necessários', desc: 'AnyDesk, UltraVNC, CrystalDiskInfo e ferramentas de suporte' },
];
