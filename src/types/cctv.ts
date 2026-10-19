export type CctvCameraType =
  | 'DOME'
  | 'BULLET'
  | 'SPEED_DOME_PTZ'
  | 'FISHEYE_360'
  | 'TERMICA'
  | 'VARIFOCAL';

export type CctvTechnology =
  | 'IP_POE'
  | 'HD_CVI'
  | 'HD_TVI'
  | 'AHD'
  | 'ANALOGICO'
  | 'WI_FI';

export type CctvCameraStatus =
  | 'OPERACIONAL'
  | 'PLANEJADA'
  | 'MANUTENCAO'
  | 'SUBSTITUICAO';

export interface CctvCamera {
  id: string;
  codigo: string; // Ex: CAM-01
  nome: string; // Ex: Frente de Caixa 01
  tipo: CctvCameraType;
  tecnologia: CctvTechnology;
  resolucao: string; // Ex: 2MP Full HD (1080p), 4MP Quad HD, 4K
  marcaModelo: string; // Ex: Intelbras VHD 3230 B
  lente?: string; // Ex: 2.8mm, 3.6mm, 2.7-13.5mm
  alcanceMetros: number; // Ex: 10, 15, 25, 30m
  anguloAberturaGraus: number; // Ex: 85°, 100°, 360°
  direcaoGraus: number; // 0 to 360 degrees rotation
  posicaoX: number; // Canvas coordinate X
  posicaoY: number; // Canvas coordinate Y
  alturaInstalacaoMetros?: number; // Ex: 2.8m, 3.5m
  canalDvr?: number; // Canal 1 a 64
  ipAddress?: string; // 192.168.1.101
  status: CctvCameraStatus;
  observacoes?: string;
  corIdentificacao?: string; // Cor personalizada do cone/ícone
}

export type CctvInfraType =
  | 'DVR_NVR'
  | 'RACK_TI'
  | 'MONITOR_TV'
  | 'SWITCH_POE'
  | 'PONTO_REDE'
  | 'NOBREAK'
  | 'CAIXA_PASSAGEM';

export interface CctvInfrastructureEquipment {
  id: string;
  codigo: string; // Ex: NVR-01, RACK-01
  nome: string; // Ex: NVR Central 32ch
  tipo: CctvInfraType;
  posicaoX: number;
  posicaoY: number;
  modelo?: string;
  especificacao?: string; // Ex: 32 Canais / 4TB Purple / 16p PoE
  ipAddress?: string;
  observacoes?: string;
}

export type CctvFloorplanElementType =
  | 'PAREDE'
  | 'PORTA'
  | 'CORREDOR'
  | 'AMBIENTE_ZONA'
  | 'TEXTO_ROTULO'
  | 'MEDIDA_COTA';

export interface CctvFloorplanElement {
  id: string;
  tipo: CctvFloorplanElementType;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  largura?: number;
  altura?: number;
  rotulo?: string; // Ex: "Frente de Caixa", "Estoque", "Câmara Fria"
  cor?: string;
  espessuraLinha?: number;
  medidaMetros?: number;
}

export interface CctvVersionSnapshot {
  id: string;
  dataHora: string;
  autorNome: string;
  autorId: string;
  descricao: string;
  totalCameras: number;
  dataSnapshot: {
    cameras: CctvCamera[];
    equipamentos: CctvInfrastructureEquipment[];
    elementosPlanta: CctvFloorplanElement[];
    dimensoesMetros: { largura: number; comprimento: number };
  };
}

export interface CctvProject {
  id: string;
  branchId: string; // ID da Filial / Matriz
  branchName: string;
  branchCode?: string;
  storeId?: string; // ID da Loja vinculada
  storeName: string;
  nomeProjeto: string; // Ex: Projeto CFTV - Loja 01 Barueri
  dimensoesMetros: {
    largura: number; // Largura do imóvel em metros (ex: 40m)
    comprimento: number; // Comprimento em metros (ex: 60m)
  };
  escalaPixelsPorMetro: number; // Escala visual (ex: 25px = 1 metro)
  gridVisible: boolean;
  gridSnap: boolean;
  gridTamanhoMetros: number; // Tamanho do grid em metros (ex: 1m ou 0.5m)
  
  // Imagem de fundo importada (planta baixa PDF/PNG/JPG convertida)
  imagemPlantaFundo?: string; // Base64 Data URL
  imagemPlantaNome?: string;
  imagemPlantaOpacidade?: number; // 0.1 a 1.0 (default 0.75)
  imagemPlantaEscala?: number;
  imagemPlantaOffsetX?: number;
  imagemPlantaOffsetY?: number;

  // Equipamentos e Desenho
  cameras: CctvCamera[];
  equipamentos: CctvInfrastructureEquipment[];
  elementosPlanta: CctvFloorplanElement[];

  // Histórico de versões
  historicoVersoes: CctvVersionSnapshot[];

  // Metadados
  criadoEm: string;
  criadoPor: string;
  atualizadoEm: string;
  atualizadoPor: string;
}

export interface CctvPermissionsConfig {
  marcosViewAllowed: boolean;
  marcosEditAllowed: boolean;
  atualizadoEm: string;
  atualizadoPor: string;
}
