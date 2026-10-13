import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
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
} from 'lucide-react';

interface HeaderProps {
  activeMainTab: 'checklist' | 'service_orders';
  setActiveMainTab: (tab: 'checklist' | 'service_orders') => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenCommands: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMainTab,
  setActiveMainTab,
  onOpenSettings,
  onOpenHistory,
  onOpenCommands,
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

  const getStatusBadge = () => {
    switch (status) {
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído (100%)
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Em andamento ({progressPercent}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-400/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand + Main Tab Switcher + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Module Switcher */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-base">
                TI
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
                  Checklist & Ordens de Serviço
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium">Gestão de TI para Lojas</span>
                  {activeMainTab === 'checklist' && machine.identificacao && (
                    <>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">{machine.identificacao}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Actions button */}
            <div className="md:hidden flex items-center gap-1">
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

          {/* Center: Main Section Navigation (Checklist vs Ordens de Serviço) */}
          <div className="bg-slate-800/90 p-1 rounded-xl flex items-center border border-slate-700/80 text-xs font-semibold self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => setActiveMainTab('checklist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeMainTab === 'checklist'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Checklist de Formatação</span>
              {activeMainTab === 'checklist' && getStatusBadge()}
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('service_orders')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeMainTab === 'service_orders'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Ordens de Serviço & Estoque</span>
              {/* Quick status pill counters */}
              <div className="hidden sm:flex items-center gap-1 text-[10px]">
                <span
                  className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                  title="No Escritório para Reparo"
                >
                  {reparoCount} reparo
                </span>
                <span
                  className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                  title="Máquinas Reservas"
                >
                  {reservaCount} reservas
                </span>
                <span
                  className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                  title="Prontas para Entrega"
                >
                  {prontaCount} prontas
                </span>
              </div>
            </button>
          </div>

          {/* Right: Subview Switcher (when in checklist) & Global Tools */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenCommands}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Comandos Rápidos do Windows / Rede"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Comandos</span>
              </button>

              <button
                type="button"
                onClick={onOpenHistory}
                className="relative flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
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
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Parâmetros da Empresa (IP balança, etiqueta, pastas)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {activeMainTab === 'checklist' && (
                <button
                  type="button"
                  onClick={resetChecklist}
                  className="p-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-700 transition-colors"
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
