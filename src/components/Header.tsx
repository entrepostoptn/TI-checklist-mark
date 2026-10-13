import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useEquipment } from '../context/EquipmentContext';
import { useSync } from '../context/SyncContext';
import {
  Settings,
  History,
  Terminal,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Laptop,
  Store,
  Layers,
  FileText,
  ListTodo,
  Wrench,
  Package,
  Shield,
  UserCheck,
  Cloud,
  CloudCheck,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export type MainAppTab = 'equipments' | 'service_orders' | 'reports' | 'checklist';

interface HeaderProps {
  activeMainTab: MainAppTab;
  setActiveMainTab: (tab: MainAppTab) => void;
  userRole: 'GESTOR' | 'TECNICO';
  setUserRole: (role: 'GESTOR' | 'TECNICO') => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenCommands: () => void;
  onOpenSyncStatus: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMainTab,
  setActiveMainTab,
  userRole,
  setUserRole,
  onOpenSettings,
  onOpenHistory,
  onOpenCommands,
  onOpenSyncStatus,
}) => {
  const {
    machine,
    status,
    progressPercent,
    viewMode,
    setViewMode,
    resetChecklist,
    savedRecords,
  } = useChecklist();

  const { reparoCount, reservaCount, prontaCount } = useServiceOrders();
  const { stats } = useEquipment();
  const { status: syncStatus, isOnline } = useSync();

  const getStatusBadge = () => {
    switch (status) {
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            100%
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 animate-pulse" />
            {progressPercent}%
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            0%
          </span>
        );
    }
  };

  const getCloudSyncBadge = () => {
    if (!isOnline || syncStatus === 'offline') {
      return (
        <button
          type="button"
          onClick={onOpenSyncStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
          title="Modo Offline (Alterações salvas localmente e sincronizadas quando voltar a conexão)"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Offline</span>
        </button>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <button
          type="button"
          onClick={onOpenSyncStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all cursor-pointer"
          title="Sincronizando com o banco central Firebase..."
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span className="hidden sm:inline">Sincronizando</span>
        </button>
      );
    }

    // Online & Synced
    return (
      <button
        type="button"
        onClick={onOpenSyncStatus}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
        title="Banco central em tempo real ativo. Computadores e celulares sincronizados."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Nuvem Ativa</span>
      </button>
    );
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand + Main Tab Switcher + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Logo & Module Brand */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-base shrink-0">
                TI
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
                  Checklist & Gestão de TI
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium">Equipamentos, OS & Relatórios</span>
                  {activeMainTab === 'checklist' && machine.identificacao && (
                    <>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">{machine.identificacao}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cloud badge & profile mobile */}
            <div className="lg:hidden flex items-center gap-1.5">
              {getCloudSyncBadge()}

              <button
                type="button"
                onClick={() => setUserRole(userRole === 'GESTOR' ? 'TECNICO' : 'GESTOR')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  userRole === 'GESTOR'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {userRole === 'GESTOR' ? '👑 Gestor' : '🔧 Técnico'}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Configurações da Empresa"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Main Module Navigation Bar (4 Modules) */}
          <div className="bg-slate-800/95 p-1 rounded-xl flex items-center border border-slate-700/80 text-xs font-semibold overflow-x-auto no-scrollbar gap-1">
            {/* 1. Equipamentos & Patrimônio */}
            <button
              type="button"
              onClick={() => setActiveMainTab('equipments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeMainTab === 'equipments'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Equipamentos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-900/40 text-blue-200">
                {stats.totalEquipamentos}
              </span>
            </button>

            {/* 2. Ordens de Serviço & Estoque */}
            <button
              type="button"
              onClick={() => setActiveMainTab('service_orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeMainTab === 'service_orders'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Ordens de Serviço</span>
              {(reparoCount > 0 || prontaCount > 0) && (
                <span className="flex items-center gap-1 text-[10px] font-bold">
                  {reparoCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300" title="Em Reparo">
                      {reparoCount}
                    </span>
                  )}
                  {prontaCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300" title="Prontas">
                      {prontaCount}
                    </span>
                  )}
                </span>
              )}
            </button>

            {/* 3. Relatórios Operacionais */}
            <button
              type="button"
              onClick={() => setActiveMainTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeMainTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Relatórios</span>
            </button>

            {/* 4. Checklist de Formatação */}
            <button
              type="button"
              onClick={() => setActiveMainTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeMainTab === 'checklist'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Checklist</span>
              {getStatusBadge()}
            </button>
          </div>

          {/* Right: Cloud Sync, Subviews & Global Tools */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Desktop Cloud Sync Badge */}
            <div className="hidden lg:block">
              {getCloudSyncBadge()}
            </div>

            {/* Checklist View Switcher */}
            {activeMainTab === 'checklist' && (
              <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('step')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    viewMode === 'step'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualização Passo a Passo"
                >
                  Etapas
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    viewMode === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Todas as etapas na mesma tela"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('summary')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    viewMode === 'summary'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Resumo Final"
                >
                  Resumo
                </button>
              </div>
            )}

            {/* Profile Switcher (Gestor / Técnico) */}
            <button
              type="button"
              onClick={() => setUserRole(userRole === 'GESTOR' ? 'TECNICO' : 'GESTOR')}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                userRole === 'GESTOR'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
              }`}
              title="Clique para alternar entre perfil de Gestor e Técnico de TI"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{userRole === 'GESTOR' ? 'Perfil: Gestor' : 'Perfil: Técnico'}</span>
            </button>

            {/* Global Tools */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenCommands}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Comandos Rápidos do Windows / Rede"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Comandos</span>
              </button>

              <button
                type="button"
                onClick={onOpenHistory}
                className="relative flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Histórico de Checklists Salvos"
              >
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Histórico</span>
                {savedRecords.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-300">
                    {savedRecords.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Parâmetros da Empresa (IP balança, etiqueta, pastas)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {activeMainTab === 'checklist' && (
                <button
                  type="button"
                  onClick={resetChecklist}
                  className="p-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer"
                  title="Iniciar Novo Checklist em Branco"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
