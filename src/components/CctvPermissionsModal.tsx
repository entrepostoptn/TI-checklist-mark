import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Eye,
  Edit3,
  Sparkles,
  Info,
} from 'lucide-react';

interface CctvPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CctvPermissionsModal: React.FC<CctvPermissionsModalProps> = ({ isOpen, onClose }) => {
  const { user, isMatheus, cctvPermissions, updateCctvPermissions } = useAuth();
  
  const [marcosView, setMarcosView] = useState(cctvPermissions?.marcosViewAllowed || false);
  const [marcosEdit, setMarcosEdit] = useState(cctvPermissions?.marcosEditAllowed || false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Se não for Matheus, bloqueia estritamente
  if (!isMatheus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Acesso Restrito</h3>
          <p className="text-sm text-slate-600">
            Apenas o administrador <strong>Matheus Guarnieri</strong> possui autorização para configurar os acessos ao módulo de Câmeras CFTV.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    // Se desabilitar visualização, desabilita edição obrigatoriamente
    const finalEdit = marcosView ? marcosEdit : false;

    const res = await updateCctvPermissions({
      marcosViewAllowed: marcosView,
      marcosEditAllowed: finalEdit,
    });

    setIsSaving(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'Permissões atualizadas com sucesso e sincronizadas com todos os dispositivos!',
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Erro ao salvar permissões no banco central.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Permissões de Acesso CFTV</h3>
                <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Exclusivo Matheus
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle individual de visualização e edição para Marcos Oliveira
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
          )}

          {/* User Card: Matheus (Proprietário) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                MG
              </div>
              <div>
                <div className="font-bold text-slate-900">Matheus Guarnieri</div>
                <div className="text-slate-500 text-[11px]">Administrador Master do Sistema</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acesso Total Permanente
            </span>
          </div>

          {/* Configuração de Acesso para Marcos Oliveira */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                MO
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-sm">Marcos Oliveira</div>
                <div className="text-slate-500 text-xs">Gestor / Usuário Operacional</div>
              </div>
              <span className="text-[11px] text-slate-400">ID: user_marcos</span>
            </div>

            {/* Toggle 1: Visualização */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Habilitar Visualização da Página e Plantas
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Permite que Marcos visualize o item &ldquo;Projeto de Câmeras&rdquo; no menu e consulte as plantas baixas e câmeras cadastradas.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={marcosView}
                onClick={() => {
                  const next = !marcosView;
                  setMarcosView(next);
                  if (!next) setMarcosEdit(false);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  marcosView ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    marcosView ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Edição */}
            <div className={`flex items-start justify-between gap-4 pt-3 border-t border-slate-100 transition-opacity ${!marcosView ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  Habilitar Edição, Desenho e Cadastro
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Permite que Marcos desenhe paredes, adicione/mova câmeras, altere modelos, posicione racks e salve projetos.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={marcosEdit}
                disabled={!marcosView}
                onClick={() => setMarcosEdit(!marcosEdit)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  marcosEdit ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    marcosEdit ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Segurança &amp; Autonomia:</strong> Marcos não tem permissão para alterar essas opções. Caso ambas as opções fiquem desmarcadas, o módulo continuará 100% oculto para ele no computador e no celular.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
