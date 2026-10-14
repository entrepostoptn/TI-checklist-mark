import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CompanyConfig,
  MachineIdentification,
  ChecklistStatus,
  SavedChecklistRecord,
  ChecklistStep,
  ChecklistItem,
} from '../types/checklist';
import {
  DEFAULT_COMPANY_CONFIG,
  INITIAL_MACHINE_IDENTIFICATION,
} from '../constants/defaultConfig';
import {
  getChecklistSteps,
  isStepApplicable,
  isItemApplicable,
} from '../utils/checklistGenerator';
import {
  subscribeToChecklistRecords,
  syncSaveChecklistRecord,
  syncDeleteChecklistRecord,
} from '../services/firestoreSync';

interface ChecklistContextType {
  machine: MachineIdentification;
  updateMachine: (data: Partial<MachineIdentification>) => void;
  config: CompanyConfig;
  updateConfig: (newConfig: Partial<CompanyConfig>) => void;
  resetConfigToDefaults: () => void;
  
  steps: ChecklistStep[];
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  viewMode: 'step' | 'all' | 'summary';
  setViewMode: (mode: 'step' | 'all' | 'summary') => void;
  
  itemsState: Record<string, boolean>;
  toggleItem: (itemId: string) => void;
  setItemState: (itemId: string, state: boolean) => void;
  markStepAll: (stepId: string, done: boolean) => void;
  
  stepNotes: Record<string, string>;
  setStepNote: (stepId: string, note: string) => void;
  finalObservations: string;
  setFinalObservations: (obs: string) => void;
  
  // Computed stats
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progressPercent: number;
  status: ChecklistStatus;
  isAllCompleted: boolean;
  canMarkAsFinished: boolean;
  uncompletedItemsList: { stepTitle: string; itemLabel: string; stepIndex: number }[];
  
  // Actions
  syncFinalTestFromSteps: () => void;
  resetChecklist: () => void;
  saveCurrentChecklist: () => SavedChecklistRecord;
  loadSavedChecklist: (recordId: string) => void;
  deleteSavedChecklist: (recordId: string) => void;
  savedRecords: SavedChecklistRecord[];
  
  // Notification toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ChecklistContext = createContext<ChecklistContextType | null>(null);

const STORAGE_KEY_CONFIG = 'it_checklist_config_v2';
const STORAGE_KEY_ACTIVE = 'it_checklist_active_v2';
const STORAGE_KEY_RECORDS = 'it_checklist_records_v2';

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Config
  const [config, setConfig] = useState<CompanyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? { ...DEFAULT_COMPANY_CONFIG, ...JSON.parse(saved) } : DEFAULT_COMPANY_CONFIG;
    } catch {
      return DEFAULT_COMPANY_CONFIG;
    }
  });

  // Machine info
  const [machine, setMachine] = useState<MachineIdentification>(() => {
    try {
      const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (active) {
        const parsed = JSON.parse(active);
        return parsed.machine || INITIAL_MACHINE_IDENTIFICATION;
      }
    } catch {
      // ignore
    }
    return INITIAL_MACHINE_IDENTIFICATION;
  });

  // Items state (checked or unchecked)
  const [itemsState, setItemsState] = useState<Record<string, boolean>>(() => {
    try {
      const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (active) {
        const parsed = JSON.parse(active);
        return parsed.itemsState || {};
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Notes per step
  const [stepNotes, setStepNotes] = useState<Record<string, string>>(() => {
    try {
      const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (active) {
        const parsed = JSON.parse(active);
        return parsed.stepNotes || {};
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Final observations
  const [finalObservations, setFinalObservations] = useState<string>(() => {
    try {
      const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (active) {
        const parsed = JSON.parse(active);
        return parsed.finalObservations || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Current view mode and step
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'step' | 'all' | 'summary'>('step');

  // Saved records history
  const [savedRecords, setSavedRecords] = useState<SavedChecklistRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Sync Identification step items state based on machine inputs
  useEffect(() => {
    setItemsState((prev) => {
      const updated = { ...prev };
      let changed = false;

      const hasId = Boolean(machine.identificacao.trim());
      if (updated['id_maquina_preenchido'] !== hasId) {
        updated['id_maquina_preenchido'] = hasId;
        changed = true;
      }

      const hasLoja = Boolean(machine.loja.trim());
      if (updated['id_loja_preenchido'] !== hasLoja) {
        updated['id_loja_preenchido'] = hasLoja;
        changed = true;
      }

      const hasTecnico = Boolean(machine.tecnico.trim());
      if (updated['id_tecnico_preenchido'] !== hasTecnico) {
        updated['id_tecnico_preenchido'] = hasTecnico;
        changed = true;
      }

      if (updated['id_tipo_selecionado'] !== true) {
        updated['id_tipo_selecionado'] = true;
        changed = true;
      }

      return changed ? updated : prev;
    });
  }, [machine.identificacao, machine.loja, machine.tecnico, machine.tipo]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving config', e);
    }
  }, [config]);

  // Persist active checklist state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_ACTIVE,
        JSON.stringify({
          machine,
          itemsState,
          stepNotes,
          finalObservations,
        })
      );
    } catch (e) {
      console.error('Error saving active state', e);
    }
  }, [machine, itemsState, stepNotes, finalObservations]);

  // Real-time sync for saved checklist records
  useEffect(() => {
    const unsub = subscribeToChecklistRecords(
      (remoteRecords) => {
        setSavedRecords(remoteRecords);
        try {
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(remoteRecords));
        } catch {
          // ignore
        }
      },
      (err) => console.warn('Checklist records sync error:', err)
    );
    return () => unsub();
  }, []);

  // Compute steps dynamically
  const steps = useMemo(() => {
    return getChecklistSteps(config, machine);
  }, [config, machine]);

  // Compute applicable items & completion stats
  const { totalTasks, completedTasks, pendingTasks, progressPercent, status, uncompletedItemsList } = useMemo(() => {
    let total = 0;
    let completed = 0;
    const uncompleted: { stepTitle: string; itemLabel: string; stepIndex: number }[] = [];

    steps.forEach((step, sIdx) => {
      if (!isStepApplicable(step, machine)) return;

      const collectItem = (item: ChecklistItem) => {
        if (!isItemApplicable(item, machine)) return;
        total += 1;
        const isDone = Boolean(itemsState[item.id]);
        if (isDone) {
          completed += 1;
        } else {
          uncompleted.push({
            stepTitle: step.shortTitle || step.title,
            itemLabel: item.label,
            stepIndex: sIdx,
          });
        }
      };

      step.items.forEach(collectItem);

      if (step.subsections) {
        step.subsections.forEach((sub) => {
          sub.items.forEach(collectItem);
        });
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let st: ChecklistStatus = 'Pendente';
    if (completed === 0) {
      st = 'Pendente';
    } else if (completed === total && total > 0) {
      st = 'Concluído';
    } else {
      st = 'Em andamento';
    }

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: total - completed,
      progressPercent: percent,
      status: st,
      uncompletedItemsList: uncompleted,
    };
  }, [steps, machine, itemsState]);

  const isAllCompleted = totalTasks > 0 && completedTasks === totalTasks;
  const canMarkAsFinished = isAllCompleted && Boolean(machine.identificacao.trim()) && Boolean(machine.loja.trim()) && Boolean(machine.tecnico.trim());

  // Item toggle
  const toggleItem = useCallback((itemId: string) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  const setItemState = useCallback((itemId: string, state: boolean) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: state,
    }));
  }, []);

  // Mark all items in a step
  const markStepAll = useCallback((stepId: string, done: boolean) => {
    const targetStep = steps.find((s) => s.id === stepId);
    if (!targetStep) return;

    setItemsState((prev) => {
      const next = { ...prev };
      const setOne = (id: string, cond?: any) => {
        if (!cond || isItemApplicable({ conditionalType: cond } as any, machine)) {
          next[id] = done;
        }
      };

      targetStep.items.forEach((it) => setOne(it.id, it.conditionalType));
      targetStep.subsections?.forEach((sub) => {
        sub.items.forEach((it) => setOne(it.id, it.conditionalType));
      });
      return next;
    });

    showToast(done ? `Tarefas de "${targetStep.shortTitle}" marcadas como concluídas!` : `Tarefas de "${targetStep.shortTitle}" desmarcadas.`);
  }, [steps, machine, showToast]);

  // Synchronize Final Test from previous steps
  const syncFinalTestFromSteps = useCallback(() => {
    const syncMap: Record<string, string[]> = {
      final_win_ativado: ['win_verificar_ativado', 'win_confirmar_licenca'],
      final_win_atualizado: ['win_update'],
      final_drivers_ok: ['win_drivers'],
      final_rede_ok: ['win_rede'],
      final_util_ms_criada: ['util_criar_pasta'],
      final_progs_instalados: ['util_conferir_arquivos'],
      final_impressora_func: ['imp_teste_impressao', 'imp_conferir_padrao'],
      final_mgv_func: ['mgv_confirmar_abertura'],
      final_balanca_ip: ['mgv_testar_comunicacao', 'mgv_informar_ip'],
      final_depto_geral: ['mgv_config_departamento'],
      final_etiqueta_conf: ['mgv_selecionar_etiqueta', 'mgv_confirmar_tamanho'],
      final_pasta_carga: ['mgv_criar_pasta_carga', 'mgv_confirmar_pasta_carga'],
      final_carga_auto: ['mgv_auto_ativar', 'mgv_auto_confirmar'],
      final_carga_remota: ['mgv_remota_ativar', 'mgv_remota_confirmar'],
      final_itens_mgv: ['mgv_itens_importar', 'mgv_itens_confirmar'],
      final_impressor_func: ['imp_mod_testar_impressao', 'imp_mod_confirmar_comunicacao'],
      final_full_pdv_func: ['pdv_teste_operacao', 'pdv_testar_abertura'],
    };

    let syncedCount = 0;
    setItemsState((prev) => {
      const next = { ...prev };
      Object.entries(syncMap).forEach(([finalId, sourceIds]) => {
        const allSourcesDone = sourceIds.every((src) => Boolean(prev[src]));
        if (allSourcesDone) {
          next[finalId] = true;
          syncedCount++;
        }
      });
      return next;
    });

    showToast(`Teste Final sincronizado! ${syncedCount} itens validados.`);
  }, [showToast]);

  const updateMachine = useCallback((data: Partial<MachineIdentification>) => {
    setMachine((prev) => ({ ...prev, ...data }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<CompanyConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    showToast('Parâmetros da empresa atualizados com sucesso!');
  }, [showToast]);

  const resetConfigToDefaults = useCallback(() => {
    setConfig(DEFAULT_COMPANY_CONFIG);
    showToast('Parâmetros restaurados para o padrão de fábrica.');
  }, [showToast]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setViewMode('summary');
    }
  }, [currentStepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex]);

  const setStepNote = useCallback((stepId: string, note: string) => {
    setStepNotes((prev) => ({ ...prev, [stepId]: note }));
  }, []);

  const resetChecklist = useCallback((skipConfirm: boolean = false) => {
    const doReset = () => {
      setMachine({
        ...INITIAL_MACHINE_IDENTIFICATION,
        data: new Date().toISOString().split('T')[0],
      });
      setItemsState({});
      setStepNotes({});
      setFinalObservations('');
      setCurrentStepIndex(0);
      setViewMode('step');
      showToast('Checklist reiniciado para novo atendimento.');
    };

    doReset();
  }, [showToast]);

  const saveCurrentChecklist = useCallback((): SavedChecklistRecord => {
    const record: SavedChecklistRecord = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      machine: { ...machine },
      config: { ...config },
      itemsState: { ...itemsState },
      stepNotes: { ...stepNotes },
      status,
      progressPercent,
      completedTasks,
      totalTasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalObservations,
    };

    setSavedRecords((prev) => [record, ...prev]);
    syncSaveChecklistRecord(record).catch((err) => {
      console.error('Falha ao salvar checklist no Firestore', err);
    });
    showToast(`Atendimento de "${machine.identificacao || 'Máquina'}" salvo no histórico!`);
    return record;
  }, [machine, config, itemsState, stepNotes, status, progressPercent, completedTasks, totalTasks, finalObservations, showToast]);

  const loadSavedChecklist = useCallback((recordId: string) => {
    const rec = savedRecords.find((r) => r.id === recordId);
    if (!rec) return;

    setMachine(rec.machine);
    setConfig(rec.config || config);
    setItemsState(rec.itemsState);
    setStepNotes(rec.stepNotes || {});
    setFinalObservations(rec.finalObservations || '');
    setCurrentStepIndex(0);
    setViewMode('summary');
    showToast(`Atendimento de "${rec.machine.identificacao}" carregado.`);
  }, [savedRecords, config, showToast]);

  const deleteSavedChecklist = useCallback((recordId: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== recordId));
    syncDeleteChecklistRecord(recordId).catch((err) => {
      console.error('Falha ao excluir checklist no Firestore', err);
    });
    showToast('Registro excluído do histórico.');
  }, [showToast]);

  return (
    <ChecklistContext.Provider
      value={{
        machine,
        updateMachine,
        config,
        updateConfig,
        resetConfigToDefaults,
        steps,
        currentStepIndex,
        setCurrentStepIndex,
        nextStep,
        prevStep,
        viewMode,
        setViewMode,
        itemsState,
        toggleItem,
        setItemState,
        markStepAll,
        stepNotes,
        setStepNote,
        finalObservations,
        setFinalObservations,
        totalTasks,
        completedTasks,
        pendingTasks,
        progressPercent,
        status,
        isAllCompleted,
        canMarkAsFinished,
        uncompletedItemsList,
        syncFinalTestFromSteps,
        resetChecklist,
        saveCurrentChecklist,
        loadSavedChecklist,
        deleteSavedChecklist,
        savedRecords,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};
