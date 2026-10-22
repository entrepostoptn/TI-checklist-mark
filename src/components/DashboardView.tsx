import { useAuth, getUserDisplayRole } from '../context/AuthContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useMaintenance } from '../context/MaintenanceContext';
import { useDailyDemands } from '../context/DailyDemandsContext';
import { ServiceOrder } from '../types/serviceOrder';
import { SystemPage } from './SidebarNavigation';
import { ServiceOrdersCompletedChart } from './ServiceOrdersCompletedChart';
import {
  Wrench,
  ClipboardCheck,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  History,
  FileSpreadsheet,
  Users,
  Monitor,
  BookOpen,
  Cpu,
  PhoneCall,
  Truck,
  AlertTriangle,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (page: SystemPage) => void;
  onOpenNewChecklistModal: () => void;
  onOpenNewServiceOrderModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewChecklistModal,
  onOpenNewServiceOrderModal,
}) => {
  const { user, permissions } = useAuth();
  const { orders } = useServiceOrders();
  const { checklists } = useBranchChecklists();
  const { stats: maintenanceStats } = useMaintenance();
  const { stats: demandStats } = useDailyDemands();

  // Active / pending counts for core operations
  const activeOrders = orders.filter(
    (os: ServiceOrder) => os.status === 'ABERTA' || os.status === 'EM_ANDAMENTO' || os.status === 'AGUARDANDO_PECA'
  );
  const pendingChecklists = checklists.filter(
    (chk) => chk.status === 'PENDENTE' || chk.status === 'EM_ANDAMENTO'
  );

  const recentOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Objective Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Painel Principal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acessos rápidos para as operações diárias
          </p>
        </div>

        {user && (
          <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto font-medium">
            <span className="font-semibold text-slate-900">{user.nome}</span>
            <span className="text-slate-400 mx-1.5">—</span>
            <span className="text-amber-700 font-bold">{getUserDisplayRole(user)}</span>
          </div>
        )}
      </div>

      {/* 4 Core Priority Cards: Atendimento / OS, Checklist, Base de Conhecimento, Relatórios (Requirement 4 & 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* 1. Atendimento / Ordem de Serviço */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Atendimento & OS
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                Abertura, acompanhamento e histórico de manutenção.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                <b className="text-slate-900">{activeOrders.length}</b> em andamento
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenNewServiceOrderModal) {
                  onOpenNewServiceOrderModal();
                } else {
                  onNavigate('legacy_service_orders');
                }
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova OS</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('legacy_service_orders')}
              className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer min-h-[38px]"
              title="Consultar todas as ordens de serviço"
            >
              <span>Ver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Checklist de Manutenção */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Checklist
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                Vistorias técnicas, aberturas de loja e conformidades.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <b className="text-slate-900">{pendingChecklists.length}</b> pendentes
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewChecklistModal}
              className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Iniciar</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('checklists')}
              className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer min-h-[38px]"
              title="Consultar checklists da rede"
            >
              <span>Ver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Base de Conhecimento (Requirement 4 & 5) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Base de Conhecimento
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                Procedimentos operacionais, manuais técnicos e passo a passo.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Procedimentos Mark Security</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('knowledge_base')}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <span>Acessar Base</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Relatórios Operacionais */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Relatórios
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                Indicadores técnicos, histórico e métricas de lojas.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Tempo real & exportação</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('legacy_reports')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <span>Visualizar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Banner / Acesso Rápido ao Módulo de Máquinas e Patrimônio (Requisito 14) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">Máquinas, Patrimônio & Acesso Remoto</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">Requisito 14</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Controle individual por loja e filial, IDs AnyDesk/TeamViewer em 1 toque, configuração técnica e dossiê de manutenções.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('machines')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs min-h-[40px]"
        >
          <span>Acessar Máquinas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Fila de Manutenção (Lab) & Demandas do Dia a Dia (Vivo, Acessos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Fila de Manutenção de Máquinas no Laboratório */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Laboratório Técnico
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Fila de Manutenção Integrada às OS
                  </h3>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Checklists de bancada, diagnóstico de problemas, peças substituídas e controle de liberação para envio às lojas.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="text-lg font-black text-amber-700">{maintenanceStats.emManutencao}</div>
                <div className="text-[10px] font-bold text-amber-900 mt-0.5">Em Bancada</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                <div className="text-lg font-black text-rose-700">{maintenanceStats.pendentes}</div>
                <div className="text-[10px] font-bold text-rose-900 mt-0.5">Pendentes</div>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
                <div className="text-lg font-black text-teal-700">{maintenanceStats.disponiveisEnvio}</div>
                <div className="text-[10px] font-bold text-teal-900 mt-0.5">P/ Envio Loja</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('maintenance')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Abrir Fila de Manutenção do Lab</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>

        {/* Card 2: Demandas & Chamados do Dia a Dia (Vivo, Acessos) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Operações & Terceiros
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Demandas & Chamados (Vivo, Acessos)
                  </h3>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Rotina TI
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anotação de chamados externos com operadoras (Vivo, Claro), acessos AnyDesk e acompanhamento de andamento.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="text-lg font-black text-blue-700">{demandStats.totalAbertos}</div>
                <div className="text-[10px] font-bold text-blue-900 mt-0.5">Abertos</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="text-lg font-black text-amber-700">{demandStats.emAndamento}</div>
                <div className="text-[10px] font-bold text-amber-900 mt-0.5">Em Andamento</div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
                <div className="text-lg font-black text-orange-700">{demandStats.aguardandoTerceiro}</div>
                <div className="text-[10px] font-bold text-orange-900 mt-0.5">Aguardando Vivo</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('daily_demands')}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <PhoneCall className="w-4 h-4 text-purple-300" />
            <span>Ver Demandas & Anotar Chamados</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>
      </div>

      {/* Gráfico Recharts: Ordens de Serviço Concluídas nos Últimos Dias */}
      <ServiceOrdersCompletedChart
        orders={orders}
        onNavigateToOrders={() => onNavigate('legacy_service_orders')}
      />

      {/* Recent Activity Table with Mobile Card View Fallback */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Atendimentos Recentes
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('legacy_service_orders')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhuma ordem de serviço cadastrada recentemente.
          </div>
        ) : (
          <>
            {/* Mobile View: Clean Touch Cards */}
            <div className="block sm:hidden space-y-2.5">
              {recentOrders.map((os: ServiceOrder) => (
                <div
                  key={os.id}
                  onClick={() => onNavigate('legacy_service_orders')}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                      {os.numeroOs || os.id}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        os.status === 'CONCLUIDA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : os.status === 'CANCELADA'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {os.status}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 leading-snug">
                    {os.identificacao}
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">
                    {os.defeitoRelatado}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="truncate">{os.lojaNome || os.lojaOrigem || 'Matriz'}</span>
                    <span className="font-mono shrink-0">
                      {new Date(os.dataHoraAbertura || os.dataEntrada).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-2 px-3">OS</th>
                    <th className="py-2 px-3">Equipamento / Loja</th>
                    <th className="py-2 px-3">Defeito Relatado</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((os: ServiceOrder) => (
                    <tr key={os.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {os.numeroOs || os.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{os.identificacao}</div>
                        <div className="text-[11px] text-slate-500">{os.lojaNome || os.lojaOrigem || 'Matriz'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {os.defeitoRelatado}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            os.status === 'CONCLUIDA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : os.status === 'CANCELADA'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {os.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {new Date(os.dataHoraAbertura || os.dataEntrada).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Discrete Quick Navigation Links to Internal Modules */}
      <div className="pt-2">
        <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Áreas Internas
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('branches')}
            className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Matriz e Filiais</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('templates')}
            className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Modelos de Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('audit')}
            className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Histórico de Modificações</span>
          </button>

          {permissions.podeGerenciarUsuarios ? (
            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Gerenciar Usuários</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('legacy_equipments')}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
            >
              <Monitor className="w-4 h-4 text-slate-500" />
              <span>Equipamentos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
