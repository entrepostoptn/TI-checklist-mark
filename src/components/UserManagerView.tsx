import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudit } from '../context/AuditContext';
import { User, UserRole } from '../types/auth';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Power,
  Edit2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

export const UserManagerView: React.FC = () => {
  const {
    user: currentUser,
    users,
    permissions,
    createUser,
    updateUser,
    resetUserPassword,
    toggleUserStatus,
  } = useAuth();

  const { logs } = useAudit();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [userAuditModal, setUserAuditModal] = useState<User | null>(null);

  // Form: Create User
  const [createForm, setCreateForm] = useState({
    username: '',
    nome: '',
    email: '',
    perfil: 'OPERACIONAL' as UserRole,
    senhaInicial: '',
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Form: Reset Password
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [confirmPasswordReset, setConfirmPasswordReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Server-side / context security validation (Requirement 7)
  if (currentUser?.perfil !== 'ADMIN') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-3">
        <Shield className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-rose-600 max-w-md mx-auto">
          Esta área é exclusiva para o perfil Administrador (Matheus Guarnieri). Usuários operacionais não possuem permissão de acesso ao Gerenciamento de Usuários.
        </p>
      </div>
    );
  }

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!createForm.username.trim() || !createForm.nome.trim()) {
      setErrorMsg('Informe o nome e o nome de usuário.');
      return;
    }
    if (!createForm.senhaInicial || createForm.senhaInicial.length < 6) {
      setErrorMsg('A senha inicial deve conter pelo menos 6 caracteres.');
      return;
    }

    const res = await createUser(createForm);
    if (res.success) {
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        nome: '',
        email: '',
        perfil: 'OPERACIONAL',
        senhaInicial: '',
      });
      triggerToast('Novo usuário cadastrado com sucesso!');
    } else {
      setErrorMsg(res.error || 'Erro ao cadastrar usuário.');
    }
  };

  // Handle Reset Password (Requirement 7: Exige confirmação, não exibe senha atual, grava histórico)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    setErrorMsg(null);

    if (!confirmPasswordReset) {
      setErrorMsg('Você precisa marcar a caixa de confirmação para autorizar a redefinição.');
      return;
    }
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setErrorMsg('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (!resetReason.trim()) {
      setErrorMsg('Informe a justificativa desta alteração de senha para fins de auditoria.');
      return;
    }

    const res = await resetUserPassword(passwordResetUser.id, newPasswordValue, resetReason);
    if (res.success) {
      setPasswordResetUser(null);
      setNewPasswordValue('');
      setResetReason('');
      setConfirmPasswordReset(false);
      triggerToast(`Senha do usuário ${passwordResetUser.nome} redefinida com sucesso!`);
    } else {
      setErrorMsg(res.error || 'Erro ao redefinir senha.');
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (userToToggle: User) => {
    if (userToToggle.id === currentUser.id) {
      alert('Você não pode inativar sua própria conta de administrador.');
      return;
    }

    const res = await toggleUserStatus(userToToggle.id);
    if (res.success) {
      triggerToast(
        userToToggle.status === 'ativo'
          ? `Conta de ${userToToggle.nome} inativada.`
          : `Conta de ${userToToggle.nome} reativada.`
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gerenciamento de Usuários
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-mono">
              Painel do Administrador
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Controle de acessos, perfis (Administrador / Operacional), redefinição de senhas com confirmação e auditoria.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Security Callout: Hash & No-plaintext (Requirement 6 & 7) */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white">Segurança Criptográfica & Conformidade</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Todas as senhas são armazenadas com Salt + SHA-256 no servidor. A senha atual nunca é visível para ninguém (nem administradores). Todas as redefinições exigem confirmação expressa e geram trilha de auditoria.
            </div>
          </div>
        </div>
      </div>

      {/* Users Table (Requirement 7) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Usuário / Nome</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4">Perfil de Acesso</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const isAdmin = u.perfil === 'ADMIN';
                const isActive = u.status === 'ativo';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nome & Avatar */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: u.avatarCor || (isAdmin ? '#2563EB' : '#10B981') }}
                        >
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{u.nome}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Login */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                      @{u.username}
                    </td>

                    {/* Perfil */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isAdmin
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isAdmin ? 'Administrador' : 'Usuário Operacional'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        <span>{isActive ? 'Ativo' : 'Inativo'}</span>
                      </span>
                    </td>

                    {/* Último Login */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {u.ultimoLogin
                        ? new Date(u.ultimoLogin).toLocaleString('pt-BR')
                        : 'Nunca acessou'}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Redefinir Senha (Requirement 7) */}
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordResetUser(u);
                            setNewPasswordValue('');
                            setResetReason('');
                            setConfirmPasswordReset(false);
                            setErrorMsg(null);
                          }}
                          className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Redefinir senha com confirmação"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Histórico do Usuário */}
                        <button
                          type="button"
                          onClick={() => setUserAuditModal(u)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver histórico de ações deste usuário"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Ativar / Inativar */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Inativar conta' : 'Reativar conta'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Reference (Requirement 7 & 8) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Matriz Comparativa de Permissões (Validação em Servidor)</span>
        </h3>
        <p className="text-xs text-slate-500">
          As regras de permissão são checadas no backend/contexto para garantir que nenhuma operação indevida ocorra.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          {/* Perfil Administrador (Matheus Guarnieri) */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="font-extrabold text-blue-900 flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Matheus Guarnieri (Perfil Administrador)</span>
            </div>
            <ul className="space-y-1.5 text-blue-800">
              <li className="flex items-center gap-2">✓ Acesso total à Matriz e todas as 43 filiais</li>
              <li className="flex items-center gap-2">✓ Criar, editar, ativar e inativar unidades</li>
              <li className="flex items-center gap-2">✓ Gerenciamento de Usuários (criar, editar, ativar/inativar)</li>
              <li className="flex items-center gap-2">✓ Redefinir senhas com confirmação e auditoria</li>
              <li className="flex items-center gap-2">✓ Criar, editar e versionar Modelos de Checklist (v1, v2)</li>
              <li className="flex items-center gap-2">✓ Reabrir checklists concluídos com justificativa</li>
              <li className="flex items-center gap-2">✓ Acesso à trilha de governança e auditoria completa</li>
            </ul>
          </div>

          {/* Perfil Operacional (Marcos Oliveira) */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Marcos Oliveira (Perfil Operacional)</span>
            </div>
            <ul className="space-y-1.5 text-emerald-800">
              <li className="flex items-center gap-2">✓ Consultar matriz e filiais da rede</li>
              <li className="flex items-center gap-2">✓ Consultar fichas cadastrais das unidades</li>
              <li className="flex items-center gap-2">✓ Acessar, preencher e salvar checklists em andamento</li>
              <li className="flex items-center gap-2">✓ Adicionar observações e fotos/evidências aos itens</li>
              <li className="flex items-center gap-2">✓ Consultar histórico de checklists e modificações autorizadas</li>
              <li className="flex items-center gap-2 text-rose-700 font-semibold">✗ Sem permissão para alterar senhas de outros</li>
              <li className="flex items-center gap-2 text-rose-700 font-semibold">✗ Sem permissão para excluir usuários ou apagar auditoria</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL 1: Cadastrar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>Novo Usuário do Sistema</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={createForm.nome}
                  onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                  placeholder="Ex: Roberto Almeida"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome de Usuário (Login) *</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase() })}
                  placeholder="Ex: roberto.almeida"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="usuario@patanegra.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil de Acesso *</label>
                <select
                  value={createForm.perfil}
                  onChange={(e) => setCreateForm({ ...createForm, perfil: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="OPERACIONAL">Usuário Operacional (Rotina de Lojas)</option>
                  <option value="ADMIN">Administrador (Acesso Pleno)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha Inicial *</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createForm.senhaInicial}
                    onChange={(e) => setCreateForm({ ...createForm, senhaInicial: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  A senha será criptografada com SHA-256 e Salt no servidor.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Redefinição de Senha com Confirmação e Auditoria (Requirement 7) */}
      {passwordResetUser && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Redefinir Senha de Usuário
                </h3>
                <p className="text-xs text-slate-500">
                  {passwordResetUser.nome} (@{passwordResetUser.username})
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Diretriz de Segurança:</div>
              <div>
                Por segurança, a senha atual <b>nunca pode ser visualizada</b> por ninguém. Você definirá uma nova senha segura que será criptografada no servidor e registrada na trilha de auditoria.
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nova Senha *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Justificativa / Motivo da Redefinição (Para Auditoria) *
                </label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Ex: Esquecimento de senha, solicitação formal do colaborador"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  required
                />
              </div>

              {/* Confirmação Expressa Obrigatória (Requirement 7) */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="chkConfirm"
                  checked={confirmPasswordReset}
                  onChange={(e) => setConfirmPasswordReset(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chkConfirm" className="text-[11px] text-amber-950 font-semibold cursor-pointer">
                  Confirmo que sou o administrador Matheus Guarnieri e autorizo a redefinição de credenciais deste usuário, ciente de que a operação será gravada de forma permanente na auditoria.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!confirmPasswordReset}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md disabled:opacity-40 cursor-pointer"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Histórico de Ações do Usuário (Requirement 7) */}
      {userAuditModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Histórico de Ações — {userAuditModal.nome}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Login: @{userAuditModal.username} • Perfil: {userAuditModal.perfil}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserAuditModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
              {logs.filter((l) => l.usuarioId === userAuditModal.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Nenhuma atividade registrada por este usuário ainda.
                </div>
              ) : (
                logs
                  .filter((l) => l.usuarioId === userAuditModal.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                            {log.acao}
                          </span>
                          <span>{log.detalhes || log.campoModificado}</span>
                        </div>
                        {log.motivo && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Motivo: "{log.motivo}"
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setUserAuditModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
