import React from 'react';
import { useAuth, getUserDisplayRole } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  Wrench,
  Monitor,
  FileText,
  X,
  BookOpen,
} from 'lucide-react';

export type SystemPage =
  | 'dashboard'
  | 'branches'
  | 'machines'
  | 'checklists'
  | 'templates'
  | 'knowledge_base'
  | 'audit'
  | 'users'
  | 'settings'
  // Existing TI modules
  | 'legacy_equipments'
  | 'legacy_service_orders'
  | 'legacy_it_checklist'
  | 'legacy_reports';

interface SidebarNavigationProps {
  currentPage: SystemPage;
  onSelectPage: (page: SystemPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSettingsModal: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  onOpenSettingsModal,
}) => {
  const { user, permissions, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  const navItems = [
    {
      id: 'dashboard' as SystemPage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'branches' as SystemPage,
      label: 'Matrizes e Filiais',
      icon: Building2,
      badge: null,
    },
    {
      id: 'machines' as SystemPage,
      label: 'Máquinas e Patrimônio',
      icon: Monitor,
      badge: 'Módulo 14',
    },
    {
      id: 'checklists' as SystemPage,
      label: 'Checklists',
      icon: ClipboardCheck,
      badge: null,
    },
    {
      id: 'templates' as SystemPage,
      label: 'Modelos de Checklist',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'knowledge_base' as SystemPage,
      label: 'Base de Conhecimento',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'audit' as SystemPage,
      label: 'Histórico de Modificações',
      icon: History,
      badge: null,
    },
  ];

  const adminItems = [
    {
      id: 'users' as SystemPage,
      label: 'Gerenciamento de Usuários',
      icon: Users,
      badge: 'Admin',
      show: permissions.podeGerenciarUsuarios,
    },
  ];

  const legacyTiItems = [
    {
      id: 'legacy_equipments' as SystemPage,
      label: 'Equipamentos & Patrimônio',
      icon: Monitor,
    },
    {
      id: 'legacy_service_orders' as SystemPage,
      label: 'Ordens de Serviço (OS)',
      icon: Wrench,
    },
    {
      id: 'legacy_it_checklist' as SystemPage,
      label: 'Checklist Formatação TI',
      icon: Layers,
    },
    {
      id: 'legacy_reports' as SystemPage,
      label: 'Relatórios Operacionais',
      icon: FileText,
    },
  ];

  const handleNavClick = (page: SystemPage) => {
    onSelectPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30 shrink-0">
              MS
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>MARK SECURITY</span>
              </div>
              <div className="text-[11px] text-blue-400 font-medium">
                Suporte & Operações
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Sections */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gestão Corporativa
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin Section (Strict Server Validation) */}
          {permissions.podeGerenciarUsuarios && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Área Administrativa</span>
              </div>
              <nav className="space-y-1">
                {adminItems
                  .filter((i) => i.show)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-amber-200/90 hover:text-white hover:bg-amber-950/30 border border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-slate-950 text-amber-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          Exclusivo
                        </span>
                      </button>
                    );
                  })}
              </nav>
            </div>
          )}

          {/* Legacy TI Modules (Preserving existing matrix equipment & OS) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operações de TI Matriz
            </div>
            <nav className="space-y-1">
              {legacyTiItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile & Footer Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: user?.avatarCor || '#2563EB' }}
              >
                {user?.nome.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.nome}
                </div>
                <div className="text-[11px] font-medium text-amber-400 truncate">
                  {getUserDisplayRole(user || null)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSettingsModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Configurações Técnicas"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
