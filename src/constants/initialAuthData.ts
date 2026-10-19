import { User } from '../types/auth';
import { PRESET_SALTS } from '../utils/cryptoAuth';

// Usuário 1: Matheus Guarnieri | Senha inicial: Neo981524 | Perfil: Administrador
// Usuário 2: Marcos Oliveira | Senha inicial: Msecurity@20 | Perfil: Usuário operacional
export const INITIAL_USERS: User[] = [
  {
    id: 'user_matheus',
    username: 'matheus',
    nome: 'Matheus Guarnieri',
    email: 'matheus.guarnieri@marksecurity.com.br',
    perfil: 'ADMIN',
    cargo: 'Administrador',
    status: 'ativo',
    precisaTrocarSenha: false,
    criadoEm: '2024-01-01T08:00:00Z',
    ultimoLogin: '2026-10-15T08:00:00Z',
    avatarCor: '#2563EB',
  },
  {
    id: 'user_marcos',
    username: 'marcos',
    nome: 'Marcos Oliveira',
    email: 'marcos.oliveira@marksecurity.com.br',
    perfil: 'OPERACIONAL',
    cargo: 'Gestor',
    status: 'ativo',
    precisaTrocarSenha: false,
    criadoEm: '2024-01-01T08:00:00Z',
    ultimoLogin: '2026-10-15T07:45:00Z',
    avatarCor: '#10B981',
  },
];

export const INITIAL_HASHES: Record<string, { hash: string; salt: string }> = {
  user_matheus: {
    hash: '9e7fff1a7a267229dfa966ea497d67df012b9bee6adcfdf1b7f3ec8d73837036',
    salt: PRESET_SALTS.matheus,
  },
  user_marcos: {
    hash: '2c726e08e22b3599c8d1e68f867a29140ed374d043c30955b28aea514c10faa0',
    salt: PRESET_SALTS.marcos,
  },
};
