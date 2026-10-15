import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth, getUserDisplayRole } from './context/AuthContext';
import { AuditProvider } from './context/AuditContext';
import { BranchProvider } from './context/BranchContext';
import { BranchChecklistProvider, useBranchChecklists } from './context/BranchChecklistContext';
import { SyncProvider, useSync } from './context/SyncContext';
import { ClientProvider } from './context/ClientContext';
import { ChecklistProvider, useChecklist } from './context/ChecklistContext';
import { ServiceOrderProvider } from './context/ServiceOrderContext';
import { EquipmentProvider } from './context/EquipmentContext';

// Components
import { LoginScreen } from './components/LoginScreen';
import { SidebarNavigation, SystemPage } from './components/SidebarNavigation';
import { DashboardView } from './components/DashboardView';
import { BranchesManager } from './components/BranchesManager';
import { BranchChecklistsView } from './components/BranchChecklistsView';
import { ChecklistTemplatesView } from './components/ChecklistTemplatesView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { UserManagerView } from './components/UserManagerView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';

// Existing Matrix TI Components (Preserving full legacy functionality)
import { EquipmentManager } from './components/EquipmentManager';
import { ServiceOrderManager } from './components/ServiceOrderManager';
import { ReportsManager } from './components/ReportsManager';
import { StepNavigation } from './components/StepNavigation';
import { StepContent } from './components/StepContent';
import { AllStepsView } from './components/AllStepsView';
import { FinalSummary } from './components/FinalSummary';
import { ProgressBar } from './components/ProgressBar';

// Modals
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { QuickCommandsModal } from './components/QuickCommandsModal';
import { SyncStatusModal } from './components/SyncStatusModal';
import { MultiDeviceModal } from './components/MultiDeviceModal';
import { ServiceOrderModal } from './components/ServiceOrderModal';

// Types
import { BranchUnit } from './types/branch';
import { Equipment } from './types/equipment';
import { MachineType } from './types/checklist';

// Icons
import {
  Menu,
  Shield,
  WifiOff,
  Cloud,
  Smartphone,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  UserCheck,
  Building2,
  Lock,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, login, logout, permissions } = useAuth();
  const { viewMode, setViewMode, toastMessage, showToast, config, updateMachine } = useChecklist();
  const { isOnline, status: syncStatus } = useSync();
  const { createChecklistFromTemplate } = useBranchChecklists();

  // Primary navigation (Default: Dashboard)
  const [currentPage, setCurrentPage] = useState<SystemPage>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cross-module linking state
  const [selectedBranchForChecklist, setSelectedBranchForChecklist] = useState<BranchUnit | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMultiDeviceOpen, setIsMultiDeviceOpen] = useState(false);

  // Direct OS Modal from Equipment or Branch
  const [isDirectOsModalOpen, setIsDirectOsModalOpen] = useState(false);
  const [directOsEquipment, setDirectOsEquipment] = useState<Equipment | null>(null);
  const [directOsStoreName, setDirectOsStoreName] = useState<string | null>(null);

  // If user is not authenticated, show professional Login Screen (Requirement 6)
  if (!user) {
    return <LoginScreen />;
  }

  // Callback to start TI machine checklist
  const handleStartChecklistForMachine = (machineData: {
    identificacao: string;
    loja: string;
    tecnico: string;
    tipo: MachineType;
  }) => {
    updateMachine({
      identificacao: machineData.identificacao,
      loja: machineData.loja,
      tecnico: machineData.tecnico,
      tipo: machineData.tipo,
    });
    setCurrentPage('legacy_it_checklist');
    setViewMode('step');
    showToast(`Checklist iniciado para a máquina ${machineData.identificacao}!`);
  };

  const handleOpenServiceOrderForMachine = (equipment: Equipment) => {
    setDirectOsEquipment(equipment);
    setIsDirectOsModalOpen(true);
  };

  // Branch action handler: open checklist for branch
  const handleOpenChecklistForBranch = (branch: BranchUnit) => {
    setSelectedBranchForChecklist(branch);
    setCurrentPage('checklists');
  };

  // Apply template to branch from Templates view
  const handleApplyTemplateToBranch = (templateId: string, branchId: string) => {
    const res = createChecklistFromTemplate(branchId, templateId);
    if (res.success) {
      showToast('Checklist criado com sucesso a partir do modelo!');
      setCurrentPage('checklists');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans selection:bg-amber-200">
      {/* Sidebar Navigation (Requirement 10) */}
      <SidebarNavigation
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Status Warning Bar */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm z-30">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Operando offline. Os dados salvos localmente continuam acessíveis e serão sincronizados automaticamente quando a rede retornar.
            </span>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="underline hover:text-amber-100 font-bold ml-2 cursor-pointer"
            >
              Diagnóstico
            </button>
          </div>
        )}

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
            <div className="bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 max-w-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Top Navbar Header */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight uppercase">
                  Mark Security
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-xs sm:text-sm font-bold text-blue-700">
                  {currentPage === 'dashboard' && 'Dashboard Operacional'}
                  {currentPage === 'branches' && 'Matrizes e Filiais'}
                  {currentPage === 'checklists' && 'Checklists das Unidades'}
                  {currentPage === 'templates' && 'Modelos de Checklist'}
                  {currentPage === 'knowledge_base' && 'Base de Conhecimento'}
                  {currentPage === 'audit' && 'Histórico de Modificações'}
                  {currentPage === 'users' && 'Gerenciamento de Usuários'}
                  {currentPage === 'legacy_equipments' && 'Equipamentos & TI'}
                  {currentPage === 'legacy_service_orders' && 'Ordens de Serviço'}
                  {currentPage === 'legacy_it_checklist' && 'Checklist Formatação TI'}
                  {currentPage === 'legacy_reports' && 'Relatórios Operacionais'}
                </span>
              </div>
            </div>
          </div>

          {/* Discrete User Identification & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Discrete User Identification after login (Requirement 2) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-xs"
                style={{ backgroundColor: user.avatarCor || (user.perfil === 'ADMIN' ? '#2563EB' : '#10B981') }}
              >
                {user.nome.charAt(0)}
              </div>
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">{user.nome}</span>
                <span className="text-slate-400 text-[10px]">—</span>
                <span className="text-amber-800 font-bold text-[11px] shrink-0">{getUserDisplayRole(user)}</span>
              </div>
            </div>

            {/* Mobile PWA button */}
            <button
              type="button"
              onClick={() => setIsMultiDeviceOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold"
              title="Acesso Celular / QR Code"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="hidden xl:inline">Celular</span>
            </button>

            {/* Cloud Sync Diagnostic */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Sincronização Nuvem"
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span className="hidden xl:inline">Nuvem</span>
            </button>

            {/* Technical settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Parâmetros Técnicos"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* TI Formatting Checklist specific bars (only visible during TI checklist) */}
        {currentPage === 'legacy_it_checklist' && (
          <>
            <ProgressBar />
            {viewMode === 'step' && <StepNavigation />}
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Section 1: Dashboard */}
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentPage}
              onOpenNewChecklistModal={() => setCurrentPage('checklists')}
              onOpenNewServiceOrderModal={() => setIsDirectOsModalOpen(true)}
            />
          )}

          {/* Section 2: Matrizes e Filiais (Hierarquia: Matrizes -> Filiais -> Atendimentos) */}
          {currentPage === 'branches' && (
            <BranchesManager
              onOpenChecklistForBranch={handleOpenChecklistForBranch}
              onOpenAuditForBranch={() => setCurrentPage('audit')}
              onOpenServiceOrderForBranch={(branch) => {
                setDirectOsStoreName(branch.nomeFantasia);
                setIsDirectOsModalOpen(true);
              }}
            />
          )}

          {/* Section 3: Checklists das Unidades (Requirement 3) */}
          {currentPage === 'checklists' && (
            <BranchChecklistsView
              initialBranchFilter={selectedBranchForChecklist?.id}
              onClearInitialBranchFilter={() => setSelectedBranchForChecklist(null)}
            />
          )}

          {/* Section 4: Modelos de Checklist (Requirement 4) */}
          {currentPage === 'templates' && (
            <ChecklistTemplatesView
              onApplyTemplateToBranch={handleApplyTemplateToBranch}
            />
          )}

          {/* Section 5: Histórico de Modificações e Auditoria (Requirement 5) */}
          {currentPage === 'audit' && <AuditHistoryView />}

          {/* Section 6: Base de Conhecimento Operacional */}
          {currentPage === 'knowledge_base' && <KnowledgeBaseView />}

          {/* Section 7: Gerenciamento de Usuários (Acesso estrito para administradores) */}
          {currentPage === 'users' && (
            permissions.podeGerenciarUsuarios ? (
              <UserManagerView />
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h2 className="text-base font-bold text-slate-800">Acesso Restrito ao Administrador</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Apenas usuários com perfil administrativo têm permissão para acessar o gerenciamento de contas e redefinição de senhas.
                </p>
              </div>
            )
          )}

          {/* Legacy Module: Equipamentos & TI */}
          {currentPage === 'legacy_equipments' && (
            <EquipmentManager
              onStartChecklistForMachine={handleStartChecklistForMachine}
              onOpenServiceOrderForMachine={handleOpenServiceOrderForMachine}
            />
          )}

          {/* Legacy Module: Ordens de Serviço */}
          {currentPage === 'legacy_service_orders' && (
            <ServiceOrderManager onStartChecklistForMachine={handleStartChecklistForMachine} />
          )}

          {/* Legacy Module: Relatórios */}
          {currentPage === 'legacy_reports' && <ReportsManager />}

          {/* Legacy Module: Checklist de Formatação TI */}
          {currentPage === 'legacy_it_checklist' && (
            <>
              {viewMode === 'step' && <StepContent />}
              {viewMode === 'all' && <AllStepsView />}
              {viewMode === 'summary' && <FinalSummary />}
            </>
          )}
        </main>
      </div>

      {/* Direct OS Modal from Equipment or Branch */}
      {isDirectOsModalOpen && (
        <ServiceOrderModal
          isOpen={isDirectOsModalOpen}
          onClose={() => {
            setIsDirectOsModalOpen(false);
            setDirectOsEquipment(null);
            setDirectOsStoreName(null);
          }}
          initialEquipment={directOsEquipment}
          initialStoreName={directOsStoreName || undefined}
          onOpenChecklistForMachine={handleStartChecklistForMachine}
        />
      )}

      {/* Global Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <QuickCommandsModal isOpen={isCommandsOpen} onClose={() => setIsCommandsOpen(false)} />
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        userRole={user.perfil === 'ADMIN' ? 'GESTOR' : 'TECNICO'}
      />
      <MultiDeviceModal isOpen={isMultiDeviceOpen} onClose={() => setIsMultiDeviceOpen(false)} />
    </div>
  );
};

// Global Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro na aplicação:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ops! Ocorreu uma instabilidade</h2>
            <p className="text-sm text-slate-300 mb-6">
              A aplicação encontrou um erro inesperado ao carregar. Nenhum dado cadastrado foi perdido.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-700/60 text-left text-xs font-mono text-rose-300 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Sistema
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuditProvider>
          <BranchProvider>
            <BranchChecklistProvider>
              <SyncProvider>
                <ClientProvider>
                  <EquipmentProvider>
                    <ServiceOrderProvider>
                      <ChecklistProvider>
                        <MainApp />
                      </ChecklistProvider>
                    </ServiceOrderProvider>
                  </EquipmentProvider>
                </ClientProvider>
              </SyncProvider>
            </BranchChecklistProvider>
          </BranchProvider>
        </AuditProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
