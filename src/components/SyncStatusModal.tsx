import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useBranches } from '../context/BranchContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useAuth } from '../context/AuthContext';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Trash2,
  X,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Database,
  Wifi,
  WifiOff,
  Building2,
  ClipboardCheck,
  Users,
  Shield,
  Layers,
} from 'lucide-react';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'GESTOR' | 'TECNICO';
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({
  isOpen,
  onClose,
  userRole,
}) => {
  const { status, isOnline, lastSyncTime, purgeTestData } = useSync();
  const { equipments, stats } = useEquipment();
  const { orders } = useServiceOrders();
  const { branches } = useBranches();
  const { checklists, templates } = useBranchChecklists();
  const { users } = useAuth();

  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{
    deletedEquipments: number;
    deletedOrders: number;
    deletedMovements: number;
    deletedHardware: number;
  } | null>(null);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);

  if (!isOpen) return null;

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      const res = await purgeTestData();
      setPurgeResult(res);
      setShowConfirmPurge(false);
    } catch (err) {
      console.error('Erro ao limpar dados de teste', err);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Sincronização em Tempo Real</h3>
              <p className="text-xs text-slate-400 mt-0.5">Firebase Cloud Firestore Multi-Dispositivo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isOnline && (status === 'online' || status === 'syncing')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>
                  {isOnline
                    ? status === 'syncing'
                      ? 'Sincronizando com a Nuvem...'
                      : 'Conectado & Sincronizado em Tempo Real'
                    : 'Modo Offline (Cache Local)'}
                </span>
                {isOnline && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                {isOnline
                  ? 'Todas as alterações feitas neste computador ou no celular são propagadas instantaneamente para todos os dispositivos conectados via Firestore.'
                  : 'O dispositivo está sem conexão à internet. As informações locais continuam disponíveis e serão sincronizadas assim que a conexão retornar.'}
              </p>
              {lastSyncTime && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Última sincronização bem-sucedida:{' '}
                  <span className="font-semibold text-slate-700">
                    {lastSyncTime.toLocaleTimeString('pt-BR')} ({lastSyncTime.toLocaleDateString('pt-BR')})
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Sync Architecture Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                <Monitor className="w-4 h-4 text-blue-600" />
                Computador / Web
              </div>
              <p className="text-slate-500 text-[11px]">
                Acessa a mesma coleção Firestore central. Sem isolamento de cache local.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                <Smartphone className="w-4 h-4 text-purple-600" />
                Celular / PWA
              </div>
              <p className="text-slate-500 text-[11px]">
                Atualização em tempo real via snapshot. Mesmos registros operacionais.
              </p>
            </div>
          </div>

          {/* Cloud Counts & Database Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Coleções Sincronizadas no Firestore</span>
              <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-mono text-[10px]">ai-studio-techsetupcheckli...</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Máquinas / Equipamentos:
                </span>
                <span className="font-bold text-slate-900 ml-1">{equipments.length}</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Matrizes e Filiais:
                </span>
                <span className="font-bold text-slate-900 ml-1">{branches.length}</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Ordens de Serviço:
                </span>
                <span className="font-bold text-slate-900 ml-1">{orders.length}</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Checklists de Filial:
                </span>
                <span className="font-bold text-slate-900 ml-1">{checklists.length}</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  Modelos de Checklist:
                </span>
                <span className="font-bold text-slate-900 ml-1">{templates.length}</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Usuários Autorizados:
                </span>
                <span className="font-bold text-slate-900 ml-1">{users.length}</span>
              </div>
            </div>

            <div className="pt-1.5 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200/60">
              <span>Projeto: <span className="font-mono text-slate-700">gen-lang-client-0572978799</span></span>
              <span>Hostinger & GitHub: <span className="font-semibold text-emerald-700">Mesma Base Ativa</span></span>
            </div>
          </div>

          {/* Test Data Purge Section (User Request #4) */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Limpeza Central de Dados de Teste
            </h4>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Remove definitivamente os registros de demonstração e teste do Firestore central.
              Após a exclusão, os registros sumirão de todos os computadores e celulares conectados.
            </p>

            {purgeResult && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Limpeza Central Concluída com Sucesso!</div>
                  <div className="text-[11px] mt-0.5 text-emerald-700">
                    Foram removidos: {purgeResult.deletedEquipments} equipamentos,{' '}
                    {purgeResult.deletedOrders} ordens de serviço e movimentações de teste.
                    Todos os dispositivos já refletem a base limpa.
                  </div>
                </div>
              </div>
            )}

            {!showConfirmPurge ? (
              <button
                type="button"
                disabled={isPurging || userRole !== 'GESTOR'}
                onClick={() => setShowConfirmPurge(true)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  userRole === 'GESTOR'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer shadow-sm'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {userRole === 'GESTOR'
                    ? 'Limpar Dados de Teste do Banco Central'
                    : 'Apenas Gestor de TI pode limpar dados de teste'}
                </span>
              </button>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2 text-xs text-rose-900 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Atenção:</span> Esta ação irá excluir os registros de teste e demonstração do Firebase Cloud Firestore central. Isso afetará computadores e celulares simultaneamente. Deseja continuar?
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isPurging}
                    onClick={handlePurge}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isPurging ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Excluindo na nuvem...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirmar Exclusão Central</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isPurging}
                    onClick={() => setShowConfirmPurge(false)}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Banco Central: <span className="font-mono text-slate-700">Firestore</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
