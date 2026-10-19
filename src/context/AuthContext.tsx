import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, UserPermissions } from '../types/auth';
import { CctvPermissionsConfig } from '../types/cctv';
import { verifyUserPassword, hashPasswordWithSalt, generateSalt, PRESET_SALTS } from '../utils/cryptoAuth';
import {
  subscribeToUsers,
  syncSaveUser,
  subscribeToCredentials,
  syncSaveCredentials,
  subscribeToCctvPermissions,
  syncSaveCctvPermissions,
  DEFAULT_CCTV_PERMISSIONS,
} from '../services/firestoreSync';

interface AuthContextType {
  user: User | null;
  users: User[];
  permissions: UserPermissions;
  cctvPermissions: CctvPermissionsConfig;
  isMatheus: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (usernameOrName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (data: { username: string; nome: string; email?: string; perfil: UserRole; senhaInicial: string }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, patch: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (targetUserId: string, newPassword: string, motivo: string) => Promise<{ success: boolean; error?: string }>;
  changeOwnPassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateCctvPermissions: (patch: Partial<CctvPermissionsConfig>) => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_KEY_AUTH_USER = 'ptn_auth_current_user_v2';
const STORAGE_KEY_USERS_LIST = 'ptn_auth_users_v2';
const STORAGE_KEY_CREDENTIALS = 'ptn_auth_credentials_store_v2';

export const getUserDisplayRole = (u: User | null): string => {
  if (!u) return '';
  if (u.cargo) return u.cargo;
  return u.perfil === 'ADMIN' ? 'Administrador' : 'Operacional';
};

// Usuário 1: Matheus Guarnieri | Senha inicial: Neo981524 | Perfil: Administrador
// Usuário 2: Marcos Oliveira | Senha inicial: Msecurity@20 | Perfil: Usuário operacional
const INITIAL_USERS: User[] = [
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
    avatarCor: '#2563EB', // Blue
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
    avatarCor: '#10B981', // Emerald
  },
];

// Senhas armazenadas com hash SHA-256 e salt seguro
const INITIAL_HASHES: Record<string, { hash: string; salt: string }> = {
  user_matheus: {
    hash: '9e7fff1a7a267229dfa966ea497d67df012b9bee6adcfdf1b7f3ec8d73837036',
    salt: PRESET_SALTS.matheus,
  },
  user_marcos: {
    hash: '2c726e08e22b3599c8d1e68f867a29140ed374d043c30955b28aea514c10faa0',
    salt: PRESET_SALTS.marcos,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Requer login manual se não houver sessão salva
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS_LIST);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Garante que Matheus e Marcos estejam sempre presentes
        const ids = new Set(parsed.map((u) => u.id));
        const missing = INITIAL_USERS.filter((u) => !ids.has(u.id));
        if (missing.length === 0) return parsed;
        return [...parsed, ...missing];
      }
    } catch {}
    return INITIAL_USERS;
  });

  const [credentialsStore, setCredentialsStore] = useState<Record<string, { hash: string; salt: string }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
      if (saved) return { ...INITIAL_HASHES, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_HASHES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<Record<string, { count: number; lockUntil?: number }>>({});


  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(credentialsStore));
    } catch {}
  }, [credentialsStore]);

  // Sincronização em tempo real de usuários e credenciais via Firestore
  useEffect(() => {
    const unsubUsers = subscribeToUsers(
      (remoteUsers) => {
        if (remoteUsers && remoteUsers.length > 0) {
          setUsers(remoteUsers);
          setUser((currentUser) => {
            if (!currentUser) return null;
            const updated = remoteUsers.find((u) => u.id === currentUser.id);
            if (updated) {
              if (updated.status === 'inativo') return null;
              return { ...currentUser, ...updated };
            }
            return currentUser;
          });
          try {
            localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(remoteUsers));
          } catch {}
        }
      },
      (err) => console.warn('Users sync error:', err)
    );

    const unsubCreds = subscribeToCredentials(
      (remoteCreds) => {
        if (remoteCreds && Object.keys(remoteCreds).length > 0) {
          setCredentialsStore(remoteCreds);
          try {
            localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(remoteCreds));
          } catch {}
        }
      },
      (err) => console.warn('Credentials sync error:', err)
    );

    return () => {
      unsubUsers();
      unsubCreds();
    };
  }, []);

  // Sincronização em tempo real das permissões de CFTV (Matheus -> Marcos)
  const [cctvPermissions, setCctvPermissions] = useState<CctvPermissionsConfig>(DEFAULT_CCTV_PERMISSIONS);

  useEffect(() => {
    const unsub = subscribeToCctvPermissions((cfg) => {
      if (cfg) {
        setCctvPermissions(cfg);
      }
    });
    return () => unsub();
  }, []);

  const isMatheus = useMemo(() => {
    if (!user) return false;
    const lowerUser = (user.username || '').toLowerCase();
    const lowerNome = (user.nome || '').toLowerCase();
    return user.id === 'user_matheus' || lowerUser === 'matheus' || lowerNome.includes('matheus');
  }, [user]);

  const isMarcos = useMemo(() => {
    if (!user) return false;
    const lowerUser = (user.username || '').toLowerCase();
    const lowerNome = (user.nome || '').toLowerCase();
    return user.id === 'user_marcos' || lowerUser === 'marcos' || lowerNome.includes('marcos');
  }, [user]);

  // Permissões dinâmicas baseadas no perfil do usuário logado
  const permissions: UserPermissions = useMemo(() => {
    const isAdmin = user?.perfil === 'ADMIN';
    const podeAcessarCctv = isMatheus || (isMarcos && cctvPermissions.marcosViewAllowed);
    const podeEditarCctv = isMatheus || (isMarcos && cctvPermissions.marcosEditAllowed);

    return {
      podeGerenciarUsuarios: isAdmin,
      podeRedefinirSenhas: isAdmin,
      podeEditarFiliais: true,
      podeCriarFiliais: true,
      podeInativarFiliais: isAdmin,
      podeCriarChecklists: true,
      podePreencherChecklists: true,
      podeReabrirChecklists: isAdmin,
      podeGerenciarModelos: isAdmin,
      podeVerAuditoria: true,
      podeAcessarCctv,
      podeEditarCctv,
    };
  }, [user, isMatheus, isMarcos, cctvPermissions]);

  // Atualização exclusiva por Matheus das permissões de visualização e edição de Marcos
  const updateCctvPermissions = useCallback(
    async (patch: Partial<CctvPermissionsConfig>): Promise<{ success: boolean; error?: string }> => {
      if (!isMatheus) {
        return {
          success: false,
          error: 'Apenas o usuário Matheus tem permissão para configurar os acessos ao módulo de Câmeras CFTV.',
        };
      }

      const updated: CctvPermissionsConfig = {
        ...cctvPermissions,
        ...patch,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setCctvPermissions(updated);

      try {
        await syncSaveCctvPermissions(updated);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Falha ao salvar permissões no banco' };
      }
    },
    [isMatheus, cctvPermissions, user]
  );

  // Login com validação de hash criptográfico e bloqueio de tentativas repetidas
  const login = useCallback(
    async (usernameOrName: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setLoginError(null);

      const cleanInput = usernameOrName.trim().toLowerCase();
      const now = Date.now();

      // Checa bloqueio de segurança
      const attempt = failedAttempts[cleanInput];
      if (attempt && attempt.lockUntil && attempt.lockUntil > now) {
        const remainingSec = Math.ceil((attempt.lockUntil - now) / 1000);
        const msg = `Muitas tentativas incorretas. Aguarde ${remainingSec} segundos antes de tentar novamente.`;
        setLoginError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Localiza o usuário por username ou por nome completo
      const targetUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanInput ||
          u.nome.toLowerCase() === cleanInput ||
          (cleanInput === 'matheus guarnieri' && u.id === 'user_matheus') ||
          (cleanInput === 'marcos oliveira' && u.id === 'user_marcos')
      );

      if (!targetUser) {
        const msg = 'Usuário não encontrado. Verifique as credenciais.';
        setLoginError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      if (targetUser.status === 'inativo') {
        const msg = 'Esta conta de usuário está desativada. Entre em contato com o Administrador.';
        setLoginError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const cred = credentialsStore[targetUser.id];
      if (!cred) {
        const msg = 'Credenciais não configuradas para este usuário.';
        setLoginError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Validação de senha criptografada via SHA-256 com salt
      const isValid = await verifyUserPassword(password, cred.hash, cred.salt);

      if (!isValid) {
        const currentCount = (attempt?.count || 0) + 1;
        const newLock = currentCount >= 5 ? now + 60000 : undefined; // Bloqueia 1 min após 5 erros
        setFailedAttempts((prev) => ({
          ...prev,
          [cleanInput]: { count: currentCount, lockUntil: newLock },
        }));

        const msg = newLock
          ? 'Senha incorreta. Limite de 5 tentativas excedido. Conta bloqueada temporariamente por 1 minuto.'
          : 'Senha incorreta. Verifique suas credenciais.';
        setLoginError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Sucesso: limpa tentativas e atualiza último login
      setFailedAttempts((prev) => {
        const next = { ...prev };
        delete next[cleanInput];
        return next;
      });

      const updatedUser: User = {
        ...targetUser,
        ultimoLogin: new Date().toISOString(),
      };

      setUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      setIsLoading(false);

      return { success: true };
    },
    [users, credentialsStore, failedAttempts]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Criação de novos usuários pelo Administrador
  const createUser = useCallback(
    async (data: {
      username: string;
      nome: string;
      email?: string;
      perfil: UserRole;
      senhaInicial: string;
    }): Promise<{ success: boolean; error?: string }> => {
      if (user?.perfil !== 'ADMIN') {
        return { success: false, error: 'Apenas administradores podem criar usuários.' };
      }

      const cleanUsername = data.username.trim().toLowerCase();
      if (!cleanUsername || !data.nome.trim() || !data.senhaInicial) {
        return { success: false, error: 'Preencha todos os campos obrigatórios.' };
      }

      if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
        return { success: false, error: `O nome de usuário "${cleanUsername}" já está em uso.` };
      }

      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(data.senhaInicial, salt);

      const newUser: User = {
        id: newId,
        username: cleanUsername,
        nome: data.nome.trim(),
        email: data.email?.trim() || undefined,
        perfil: data.perfil,
        status: 'ativo',
        precisaTrocarSenha: true,
        criadoEm: new Date().toISOString(),
        avatarCor: data.perfil === 'ADMIN' ? '#2563EB' : '#10B981',
      };

      const newCredentials = {
        ...credentialsStore,
        [newId]: { hash, salt },
      };
      setCredentialsStore(newCredentials);
      setUsers((prev) => [...prev, newUser]);

      syncSaveUser(newUser).catch((err) => console.warn('Erro ao salvar usuário no Firestore:', err));
      syncSaveCredentials(newCredentials).catch((err) => console.warn('Erro ao salvar credenciais no Firestore:', err));

      return { success: true };
    },
    [user, users, credentialsStore]
  );

  // Edição de dados do usuário
  const updateUser = useCallback(
    async (id: string, patch: Partial<User>): Promise<{ success: boolean; error?: string }> => {
      if (user?.perfil !== 'ADMIN' && user?.id !== id) {
        return { success: false, error: 'Sem permissão para alterar este usuário.' };
      }

      const existing = users.find((u) => u.id === id);
      if (!existing) return { success: false, error: 'Usuário não encontrado.' };

      const updated = { ...existing, ...patch };
      if (user?.id === id) setUser(updated);

      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      syncSaveUser(updated).catch((err) => console.warn('Erro ao atualizar usuário no Firestore:', err));

      return { success: true };
    },
    [user, users]
  );

  // Redefinição de senha de outro usuário (Exclusivo Administrador Matheus Guarnieri)
  const resetUserPassword = useCallback(
    async (targetUserId: string, newPassword: string, motivo: string): Promise<{ success: boolean; error?: string }> => {
      if (user?.perfil !== 'ADMIN') {
        return { success: false, error: 'Apenas administradores podem redefinir senhas.' };
      }

      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }

      const target = users.find((u) => u.id === targetUserId);
      if (!target) {
        return { success: false, error: 'Usuário não encontrado.' };
      }

      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(newPassword, salt);

      const updatedCreds = {
        ...credentialsStore,
        [targetUserId]: { hash, salt },
      };
      setCredentialsStore(updatedCreds);
      syncSaveCredentials(updatedCreds).catch((err) => console.warn('Erro ao atualizar credenciais no Firestore:', err));

      const updatedTarget: User = { ...target, precisaTrocarSenha: true };
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? updatedTarget : u))
      );
      syncSaveUser(updatedTarget).catch((err) => console.warn('Erro ao atualizar usuário no Firestore:', err));

      return { success: true };
    },
    [user, users, credentialsStore]
  );

  // Alteração da própria senha
  const changeOwnPassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Nenhum usuário autenticado.' };
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }

      const cred = credentialsStore[user.id];
      if (!cred) return { success: false, error: 'Credenciais não encontradas.' };

      const isOldValid = await verifyUserPassword(oldPassword, cred.hash, cred.salt);
      if (!isOldValid) {
        return { success: false, error: 'A senha atual informada está incorreta.' };
      }

      const newSalt = generateSalt();
      const newHash = await hashPasswordWithSalt(newPassword, newSalt);

      const updatedCreds = {
        ...credentialsStore,
        [user.id]: { hash: newHash, salt: newSalt },
      };
      setCredentialsStore(updatedCreds);
      syncSaveCredentials(updatedCreds).catch((err) => console.warn('Erro ao atualizar credenciais no Firestore:', err));

      const updatedUser: User = { ...user, precisaTrocarSenha: false };
      setUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      syncSaveUser(updatedUser).catch((err) => console.warn('Erro ao atualizar usuário no Firestore:', err));

      return { success: true };
    },
    [user, credentialsStore]
  );

  // Ativação / Inativação de conta
  const toggleUserStatus = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (user?.perfil !== 'ADMIN') {
        return { success: false, error: 'Apenas administradores podem ativar ou inativar contas.' };
      }
      if (id === user.id) {
        return { success: false, error: 'Você não pode inativar sua própria conta de administrador.' };
      }

      const target = users.find((u) => u.id === id);
      if (!target) return { success: false, error: 'Usuário não encontrado' };

      const nextStatus: 'ativo' | 'inativo' = target.status === 'ativo' ? 'inativo' : 'ativo';
      const updated: User = { ...target, status: nextStatus };

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updated : u))
      );
      syncSaveUser(updated).catch((err) => console.warn('Erro ao atualizar usuário no Firestore:', err));

      return { success: true };
    },
    [user, users]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        permissions,
        isLoading,
        loginError,
        login,
        logout,
        createUser,
        updateUser,
        resetUserPassword,
        changeOwnPassword,
        toggleUserStatus,
        cctvPermissions,
        isMatheus,
        updateCctvPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
