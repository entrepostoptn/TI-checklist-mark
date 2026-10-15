import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, isLoading, loginError } = useAuth();
  const [username, setUsername] = useState('matheus');
  const [password, setPassword] = useState('Neo981524');
  const [showPassword, setShowPassword] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!username.trim()) {
      setErrorLocal('Por favor, informe seu usuário ou nome.');
      return;
    }
    if (!password) {
      setErrorLocal('Por favor, informe sua senha de acesso.');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      onSuccess?.();
    } else {
      setErrorLocal(res.error || 'Credenciais inválidas.');
    }
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorLocal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background Decorator */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 mb-4 ring-4 ring-amber-500/20">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            PATA NEGRA
          </h1>
          <p className="text-xs sm:text-sm font-medium text-amber-300/80 mt-1 uppercase tracking-widest">
            Matriz & Controle Integrado de Filiais
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Sistema Central de Operações & Checklists</span>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Acesso ao Sistema
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Entre com suas credenciais corporativas com autenticação criptografada.
          </p>

          {(errorLocal || loginError) && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorLocal || loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usuário ou Nome
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: matheus ou marcos"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha corporativa"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando no Servidor...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Shortcut for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Usuários Oficiais Configurados
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect('matheus', 'Neo981524')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  username === 'matheus'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Matheus G.</span>
                  {username === 'matheus' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">Administrador</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Senha: Neo981524</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('marcos', 'Msecurity@20')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  username === 'marcos'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Marcos O.</span>
                  {username === 'marcos' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">Operacional</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Senha: Msecurity@20</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="text-center mt-6 text-slate-400 text-xs">
          <p>Entreposto Pata Negra Comércio de Alimentos Ltda.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Senhas criptografadas com SHA-256 e Salt no servidor. Auditoria ativa em todas as sessões.
          </p>
        </div>
      </div>
    </div>
  );
};
