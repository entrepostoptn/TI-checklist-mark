import React, { useState, useCallback } from 'react';
import { ChecklistProvider, useChecklist } from './context/ChecklistContext';
import { ServiceOrderProvider, useServiceOrders } from './context/ServiceOrderContext';
import { EquipmentProvider, useEquipment } from './context/EquipmentContext';
import { Header, MainAppTab } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { StepNavigation } from './components/StepNavigation';
import { StepContent } from './components/StepContent';
import { AllStepsView } from './components/AllStepsView';
import { FinalSummary } from './components/FinalSummary';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { QuickCommandsModal } from './components/QuickCommandsModal';
import { ServiceOrderManager } from './components/ServiceOrderManager';
import { EquipmentManager } from './components/EquipmentManager';
import { ReportsManager } from './components/ReportsManager';
import { ServiceOrderModal } from './components/ServiceOrderModal';
import { Equipment } from './types/equipment';
import { MachineType } from './types/checklist';
import { CheckCircle2, Sliders, Shield, AlertTriangle } from 'lucide-react';

const MainApp: React.FC = () => {
  const { viewMode, setViewMode, toastMessage, showToast, config, updateMachine } = useChecklist();
  
  // Navigation & Modals
  const [activeMainTab, setActiveMainTab] = useState<MainAppTab>('equipments');
  const [userRole, setUserRole] = useState<'GESTOR' | 'TECNICO'>(() => {
    try {
      const stored = localStorage.getItem('it_user_role');
      if (stored === 'GESTOR' || stored === 'TECNICO') return stored;
    } catch {}
    return 'GESTOR';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);

  // Quick action from equipment to OS modal
  const [isDirectOsModalOpen, setIsDirectOsModalOpen] = useState(false);
  const [directOsEquipment, setDirectOsEquipment] = useState<Equipment | null>(null);

  const handleSetUserRole = (role: 'GESTOR' | 'TECNICO') => {
    setUserRole(role);
    try {
      localStorage.setItem('it_user_role', role);
    } catch {}
    showToast(`Perfil alterado para ${role === 'GESTOR' ? 'Gestor de TI' : 'Técnico de TI'}`);
  };

  const handleStartChecklistForMachine = useCallback(
    (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => {
      updateMachine({
        identificacao: machineData.identificacao,
        loja: machineData.loja,
        tecnico: machineData.tecnico,
        tipo: machineData.tipo,
      });
      setActiveMainTab('checklist');
      setViewMode('step');
      showToast(`Checklist iniciado para a máquina ${machineData.identificacao}!`);
    },
    [updateMachine, setViewMode, showToast]
  );

  const handleOpenServiceOrderForMachine = useCallback((equipment: Equipment) => {
    setDirectOsEquipment(equipment);
    setIsDirectOsModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 max-w-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Header
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
        userRole={userRole}
        setUserRole={handleSetUserRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCommands={() => setIsCommandsOpen(true)}
      />

      {/* Progress & Stat Bar (Active when in Checklist tab) */}
      {activeMainTab === 'checklist' && <ProgressBar />}

      {/* Step Navigation Tabs (active during checklist step view) */}
      {activeMainTab === 'checklist' && viewMode === 'step' && <StepNavigation />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Module 1: Equipamentos & Patrimônio */}
        {activeMainTab === 'equipments' && (
          <EquipmentManager
            onStartChecklistForMachine={handleStartChecklistForMachine}
            onOpenServiceOrderForMachine={handleOpenServiceOrderForMachine}
          />
        )}

        {/* Module 2: Ordens de Serviço & Estoque */}
        {activeMainTab === 'service_orders' && (
          <ServiceOrderManager onStartChecklistForMachine={handleStartChecklistForMachine} />
        )}

        {/* Module 3: Relatórios Operacionais */}
        {activeMainTab === 'reports' && <ReportsManager />}

        {/* Module 4: Checklist de Formatação */}
        {activeMainTab === 'checklist' && (
          <>
            {viewMode === 'step' && <StepContent />}
            {viewMode === 'all' && <AllStepsView />}
            {viewMode === 'summary' && <FinalSummary />}
          </>
        )}
      </main>

      {/* Footer Info & Active Company Parameters Summary */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span className="font-semibold text-slate-700">Padrões Ativos da Empresa:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
              Balança {config.balancaNumero} (IP: {config.balancaIp})
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
              Depto {config.departamentoNumero} ({config.departamentoNome})
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
              Etiqueta {config.etiquetaCodigo} ({config.etiquetaTamanho})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Perfil: <strong className="text-slate-700">{userRole === 'GESTOR' ? 'Gestor de TI' : 'Técnico de TI'}</strong>
            </span>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Alterar parâmetros
            </button>
          </div>
        </div>
      </footer>

      {/* Direct OS Modal from Equipment */}
      {isDirectOsModalOpen && (
        <ServiceOrderModal
          isOpen={isDirectOsModalOpen}
          onClose={() => {
            setIsDirectOsModalOpen(false);
            setDirectOsEquipment(null);
          }}
          initialEquipment={directOsEquipment}
          onOpenChecklistForMachine={handleStartChecklistForMachine}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <QuickCommandsModal
        isOpen={isCommandsOpen}
        onClose={() => setIsCommandsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <EquipmentProvider>
      <ServiceOrderProvider>
        <ChecklistProvider>
          <MainApp />
        </ChecklistProvider>
      </ServiceOrderProvider>
    </EquipmentProvider>
  );
}
