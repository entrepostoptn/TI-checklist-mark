import { useAuth, getUserDisplayRole } from '../context/AuthContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { ServiceOrder } from '../types/serviceOrder';
import { SystemPage } from './SidebarNavigation';
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

      {/* 3 Core Priority Cards: Atendimento / Ordem de Serviço, Checklist, Relatórios (Requirement 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Atendimento / Ordem de Serviço */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Atendimento & Ordens de Serviço
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Abertura, acompanhamento e finalização de manutenções.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>
                <b className="text-slate-900">{activeOrders.length}</b> em andamento
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenNewServiceOrderModal) {
                  onOpenNewServiceOrderModal();
                } else {
                  onNavigate('legacy_service_orders');
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova OS</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('legacy_service_orders')}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Consultar todas as ordens de serviço"
            >
              <span>Consultar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Checklist de Manutenção */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Checklist de Manutenção
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Vistorias técnicas, aberturas de loja e conformidades.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                <b className="text-slate-900">{pendingChecklists.length}</b> pendentes / em andamento
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewChecklistModal}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('checklists')}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Consultar checklists da rede"
            >
              <span>Consultar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Relatórios */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Relatórios Operacionais
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Indicadores técnicos, histórico e exportação de dados.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Estatísticas em tempo real</span>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('legacy_reports')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Visualizar Relatórios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Clean and Compact) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Atendimentos Recentes
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('legacy_service_orders')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
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
          <div className="overflow-x-auto">
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
