import React from 'react';
import { useBranches } from '../context/BranchContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';
import { SystemPage } from './SidebarNavigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  History,
  FileSpreadsheet,
  AlertOctagon,
  Calendar,
  User,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (page: SystemPage) => void;
  onOpenNewChecklistModal: () => void;
  onOpenNewBranchModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewChecklistModal,
  onOpenNewBranchModal,
}) => {
  const { totalCount, activeCount, inactiveCount, matriz } = useBranches();
  const { stats: checklistStats, recentNonConformities } = useBranchChecklists();
  const { logs } = useAudit();
  const { user } = useAuth();

  const recentLogs = logs.slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sistema Integrado de Filiais Pata Negra</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user?.nome.split(' ')[0]}! Visão Geral da Rede
          </h1>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
            Painel unificado da Matriz Corporativa em Barueri/Alphaville e de todas as 43 filiais e empórios.
            Acompanhe o status operacional, checklists em tempo real e auditoria de modificações.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="button"
              onClick={onOpenNewChecklistModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/25 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('branches')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Ver Matriz e Filiais ({totalCount})</span>
            </button>

            {user?.perfil === 'ADMIN' && (
              <button
                type="button"
                onClick={onOpenNewBranchModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 font-semibold text-xs sm:text-sm border border-amber-500/30 transition-all cursor-pointer"
              >
                <span>Cadastrar Nova Filial</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Indicators Grid (Requirement 10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Filiais */}
        <div
          onClick={() => onNavigate('branches')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Unidades
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">unidades</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Matriz: 1</span>
            <span className="font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5">
              Detalhes <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Unidades Ativas */}
        <div
          onClick={() => onNavigate('branches')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Unidades Ativas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {activeCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">em operação</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{Math.round((activeCount / totalCount) * 100)}% da rede</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativas
            </span>
          </div>
        </div>

        {/* Unidades Inativas */}
        <div
          onClick={() => onNavigate('branches')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Unidades Inativas
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              {inactiveCount}
            </span>
            <span className="text-xs text-rose-600 font-semibold">preservadas</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Para consulta/histórico</span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inativas
            </span>
          </div>
        </div>

        {/* Checklists Concluídos */}
        <div
          onClick={() => onNavigate('checklists')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Checklists Concluídos
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800">
              {checklistStats.concluidos}
            </span>
            <span className="text-xs text-slate-500 font-medium">de {checklistStats.total}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>100% validados</span>
            <span className="font-semibold text-amber-700 group-hover:underline flex items-center gap-0.5">
              Ver lista <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Status Indicators (Checklists Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Pendentes */}
        <div
          onClick={() => onNavigate('checklists')}
          className="bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-sm cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-800">Checklists Pendentes</div>
              <div className="text-2xl font-extrabold text-amber-900">{checklistStats.pendentes}</div>
              <div className="text-[11px] text-amber-700">Aguardando início do operador</div>
            </div>
          </div>
        </div>

        {/* Em Andamento */}
        <div
          onClick={() => onNavigate('checklists')}
          className="bg-gradient-to-br from-blue-50/80 to-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-sm cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-800">Checklists em Andamento</div>
              <div className="text-2xl font-extrabold text-blue-900">{checklistStats.emAndamento}</div>
              <div className="text-[11px] text-blue-700">Salvos e em preenchimento</div>
            </div>
          </div>
        </div>

        {/* Não Conformes */}
        <div
          onClick={() => onNavigate('checklists')}
          className="bg-gradient-to-br from-rose-50/80 to-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-sm cursor-pointer hover:border-rose-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-800">Com Não Conformidades</div>
              <div className="text-2xl font-extrabold text-rose-900">{checklistStats.naoConformes}</div>
              <div className="text-[11px] text-rose-700">Exigem tratativa corretiva</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Não Conformidades Recentes & Últimas Modificações (Requirement 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Não Conformidades Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Não Conformidades Registradas Recentemente
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pontos de atenção identificados nos checklists operacionais
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('checklists')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {recentNonConformities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
                Nenhuma não conformidade em aberto. Todos os itens avaliados estão em conformidade!
              </div>
            ) : (
              recentNonConformities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/60 flex items-start gap-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-rose-950 truncate">
                        {item.unidadeNome}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="font-medium text-slate-800">{item.itemTitulo}</div>
                    {item.observacao && (
                      <div className="text-[11px] text-slate-600 mt-1 bg-white/70 p-1.5 rounded-lg border border-rose-100 italic">
                        "{item.observacao}"
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Últimas Modificações Realizadas (Auditoria) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Últimas Modificações Realizadas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trilha de auditoria e segurança em tempo real
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Auditoria Completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {recentLogs.map((log) => {
              const dateStr = new Date(log.dataHora).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {log.usuarioNome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>{log.usuarioNome}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-200/80 text-slate-700">
                          {log.acao}
                        </span>
                        {log.unidadeNome && (
                          <span className="text-[11px] text-amber-800 font-medium truncate">
                            • {log.unidadeNome}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                        {log.detalhes || `${log.campoModificado}: ${log.valorNovo}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
