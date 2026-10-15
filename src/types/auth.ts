export type UserRole = 'ADMIN' | 'OPERACIONAL';

export interface User {
  id: string;
  username: string;
  nome: string;
  email?: string;
  perfil: UserRole;
  cargo?: string;
  status: 'ativo' | 'inativo';
  precisaTrocarSenha?: boolean;
  criadoEm: string;
  ultimoLogin?: string;
  avatarCor?: string;
}

export interface UserPermissions {
  podeGerenciarUsuarios: boolean;
  podeRedefinirSenhas: boolean;
  podeEditarFiliais: boolean;
  podeCriarFiliais: boolean;
  podeInativarFiliais: boolean;
  podeCriarChecklists: boolean;
  podePreencherChecklists: boolean;
  podeReabrirChecklists: boolean;
  podeGerenciarModelos: boolean;
  podeVerAuditoria: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}
