import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CctvProject,
  CctvCamera,
  CctvInfrastructureEquipment,
  CctvFloorplanElement,
  CctvVersionSnapshot,
  CctvCameraType,
  CctvCameraStatus,
  CctvTechnology,
} from '../types/cctv';
import {
  subscribeToCctvProjects,
  syncSaveCctvProject,
  syncDeleteCctvProject,
} from '../services/firestoreSync';
import { useAuth } from './AuthContext';
import { useBranches } from './BranchContext';

interface CctvContextType {
  projects: CctvProject[];
  activeProject: CctvProject | null;
  selectedBranchId: string | null;
  selectedStoreId: string | null;
  canEdit: boolean;
  canAccess: boolean;
  
  // Navegação e seleção
  selectLocation: (branchId: string, storeId?: string) => void;
  setActiveProject: React.Dispatch<React.SetStateAction<CctvProject | null>>;
  
  // Operações de Projeto
  saveProject: (projectToSave?: CctvProject) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  createNewProjectForLocation: (branchId: string, storeId?: string, customName?: string) => CctvProject;
  
  // Operações de Câmeras
  addCamera: (cameraData: Omit<CctvCamera, 'id' | 'codigo'>) => void;
  updateCamera: (id: string, patch: Partial<CctvCamera>) => void;
  removeCamera: (id: string) => void;
  
  // Operações de Infraestrutura (DVR, Rack, Switch, etc.)
  addInfraEquipment: (infraData: Omit<CctvInfrastructureEquipment, 'id' | 'codigo'>) => void;
  updateInfraEquipment: (id: string, patch: Partial<CctvInfrastructureEquipment>) => void;
  removeInfraEquipment: (id: string) => void;
  
  // Elementos da Planta Baixa (Paredes, Portas, Ambientes, Cotas)
  addFloorplanElement: (element: Omit<CctvFloorplanElement, 'id'>) => void;
  updateFloorplanElement: (id: string, patch: Partial<CctvFloorplanElement>) => void;
  removeFloorplanElement: (id: string) => void;
  clearFloorplanElements: () => void;
  
  // Imagem de Fundo (Planta Baixa importada)
  setBackgroundImage: (dataUrl: string | undefined, fileName?: string) => void;
  updateBackgroundSettings: (patch: { opacidade?: number; escala?: number; offsetX?: number; offsetY?: number }) => void;
  
  // Escala e Dimensões
  updateDimensionsAndScale: (dim: { largura: number; comprimento: number }, escalaPixelsPorMetro?: number) => void;
  toggleGrid: (visible?: boolean, snap?: boolean) => void;
  
  // Histórico de Versões & Undo / Redo
  createVersionSnapshot: (descricao: string) => void;
  restoreVersionSnapshot: (snapshotId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Estatísticas do Projeto Ativo
  stats: {
    totalCameras: number;
    camerasOperacionais: number;
    camerasPlanejadas: number;
    camerasManutencao: number;
    totalInfra: number;
    canaisDvrOcupados: number;
    tiposCount: Record<CctvCameraType, number>;
  };
}

const CctvContext = createContext<CctvContextType | null>(null);

export const CctvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, permissions } = useAuth();
  const { branches } = useBranches();
  
  const [projects, setProjects] = useState<CctvProject[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<CctvProject | null>(null);

  // Pilha de Undo / Redo
  const [historyStack, setHistoryStack] = useState<CctvProject[]>([]);
  const [futureStack, setFutureStack] = useState<CctvProject[]>([]);

  const canAccess = permissions.podeAcessarCctv;
  const canEdit = permissions.podeEditarCctv;

  // 1. Sincronização em tempo real de Projetos CFTV do Firestore
  useEffect(() => {
    if (!canAccess) return;

    const unsub = subscribeToCctvProjects(
      (remoteProjects) => {
        setProjects(remoteProjects);
      },
      (err) => console.warn('CCTV projects sync error:', err)
    );

    return () => unsub();
  }, [canAccess]);

  // Atualiza activeProject quando remoteProjects muda
  useEffect(() => {
    if (!activeProject) return;
    const remote = projects.find((p) => p.id === activeProject.id);
    if (remote && remote.atualizadoEm !== activeProject.atualizadoEm) {
      // Se a versão remota é mais recente que a local (feita por outro aparelho)
      if (new Date(remote.atualizadoEm).getTime() > new Date(activeProject.atualizadoEm).getTime()) {
        setActiveProject(remote);
      }
    }
  }, [projects]);

  // Helper para salvar estado na pilha de Undo antes de modificar
  const recordHistory = useCallback((current: CctvProject) => {
    setHistoryStack((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(current))]);
    setFutureStack([]);
  }, []);

  // 2. Criar novo projeto padrão para filial/loja
  const createNewProjectForLocation = useCallback(
    (branchId: string, storeId?: string, customName?: string): CctvProject => {
      const branch = branches.find((b) => b.id === branchId);
      const branchName = branch ? branch.nomeFantasia : 'Filial Mark Security';
      const branchCode = branch ? branch.idOriginal : undefined;
      const storeName = storeId ? `Loja / Setor ${storeId}` : branchName;
      const projId = `cctv_${branchId}_${storeId || 'principal'}`;

      const newProj: CctvProject = {
        id: projId,
        branchId,
        branchName,
        branchCode,
        storeId,
        storeName,
        nomeProjeto: customName || `Projeto CFTV — ${branchName}`,
        dimensoesMetros: { largura: 30, comprimento: 20 },
        escalaPixelsPorMetro: 28, // 28 pixels = 1 metro
        gridVisible: true,
        gridSnap: true,
        gridTamanhoMetros: 1,
        imagemPlantaOpacidade: 0.75,
        cameras: [],
        equipamentos: [],
        elementosPlanta: [],
        historicoVersoes: [],
        criadoEm: new Date().toISOString(),
        criadoPor: user?.nome || 'Matheus Guarnieri',
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      return newProj;
    },
    [branches, user]
  );

  // 3. Selecionar Filial e Loja
  const selectLocation = useCallback(
    (branchId: string, storeId?: string) => {
      setSelectedBranchId(branchId);
      setSelectedStoreId(storeId || null);

      const targetId = `cctv_${branchId}_${storeId || 'principal'}`;
      const existing = projects.find((p) => p.id === targetId || (p.branchId === branchId && (!storeId || p.storeId === storeId)));

      if (existing) {
        setActiveProject(existing);
      } else {
        const created = createNewProjectForLocation(branchId, storeId);
        setActiveProject(created);
      }
      setHistoryStack([]);
      setFutureStack([]);
    },
    [projects, createNewProjectForLocation]
  );

  // 4. Salvar Projeto no Firestore com sincronização global
  const saveProject = useCallback(
    async (projectToSave?: CctvProject): Promise<boolean> => {
      const target = projectToSave || activeProject;
      if (!target) return false;

      const updated: CctvProject = {
        ...target,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === updated.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = updated;
          return clone;
        }
        return [updated, ...prev];
      });

      try {
        await syncSaveCctvProject(updated);
        return true;
      } catch (err) {
        console.error('Erro ao salvar projeto de câmeras:', err);
        return false;
      }
    },
    [activeProject, user]
  );

  // 5. Excluir Projeto
  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProject?.id === projectId) {
        setActiveProject(null);
      }
      try {
        await syncDeleteCctvProject(projectId);
        return true;
      } catch (err) {
        console.error('Erro ao excluir projeto de câmeras:', err);
        return false;
      }
    },
    [activeProject]
  );

  // 6. Operações de Câmeras
  const addCamera = useCallback(
    (cameraData: Omit<CctvCamera, 'id' | 'codigo'>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const nextNumber = activeProject.cameras.length + 1;
      const codigo = `CAM-${String(nextNumber).padStart(2, '0')}`;
      const newCam: CctvCamera = {
        ...cameraData,
        id: `cam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        codigo,
      };

      const updated: CctvProject = {
        ...activeProject,
        cameras: [...activeProject.cameras, newCam],
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const updateCamera = useCallback(
    (id: string, patch: Partial<CctvCamera>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedCameras = activeProject.cameras.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const updated: CctvProject = {
        ...activeProject,
        cameras: updatedCameras,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const removeCamera = useCallback(
    (id: string) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedCameras = activeProject.cameras.filter((c) => c.id !== id);
      const updated: CctvProject = {
        ...activeProject,
        cameras: updatedCameras,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  // 7. Operações de Infraestrutura
  const addInfraEquipment = useCallback(
    (infraData: Omit<CctvInfrastructureEquipment, 'id' | 'codigo'>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const count = activeProject.equipamentos.filter((e) => e.tipo === infraData.tipo).length + 1;
      const prefix = infraData.tipo === 'DVR_NVR' ? 'NVR' : infraData.tipo === 'RACK_TI' ? 'RACK' : 'INFRA';
      const codigo = `${prefix}-${String(count).padStart(2, '0')}`;

      const newInfra: CctvInfrastructureEquipment = {
        ...infraData,
        id: `infra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        codigo,
      };

      const updated: CctvProject = {
        ...activeProject,
        equipamentos: [...activeProject.equipamentos, newInfra],
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const updateInfraEquipment = useCallback(
    (id: string, patch: Partial<CctvInfrastructureEquipment>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedEquip = activeProject.equipamentos.map((e) => (e.id === id ? { ...e, ...patch } : e));
      const updated: CctvProject = {
        ...activeProject,
        equipamentos: updatedEquip,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const removeInfraEquipment = useCallback(
    (id: string) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedEquip = activeProject.equipamentos.filter((e) => e.id !== id);
      const updated: CctvProject = {
        ...activeProject,
        equipamentos: updatedEquip,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  // 8. Elementos da Planta Baixa (Paredes, Portas, Ambientes, Cotas)
  const addFloorplanElement = useCallback(
    (element: Omit<CctvFloorplanElement, 'id'>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const newElem: CctvFloorplanElement = {
        ...element,
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };

      const updated: CctvProject = {
        ...activeProject,
        elementosPlanta: [...activeProject.elementosPlanta, newElem],
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const updateFloorplanElement = useCallback(
    (id: string, patch: Partial<CctvFloorplanElement>) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedElems = activeProject.elementosPlanta.map((el) => (el.id === id ? { ...el, ...patch } : el));
      const updated: CctvProject = {
        ...activeProject,
        elementosPlanta: updatedElems,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const removeFloorplanElement = useCallback(
    (id: string) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updatedElems = activeProject.elementosPlanta.filter((el) => el.id !== id);
      const updated: CctvProject = {
        ...activeProject,
        elementosPlanta: updatedElems,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const clearFloorplanElements = useCallback(() => {
    if (!activeProject) return;
    recordHistory(activeProject);

    const updated: CctvProject = {
      ...activeProject,
      elementosPlanta: [],
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: user?.nome || 'Matheus Guarnieri',
    };

    setActiveProject(updated);
    syncSaveCctvProject(updated).catch(() => {});
  }, [activeProject, recordHistory, user]);

  // 9. Imagem de Fundo (Planta Baixa)
  const setBackgroundImage = useCallback(
    (dataUrl: string | undefined, fileName?: string) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updated: CctvProject = {
        ...activeProject,
        imagemPlantaFundo: dataUrl,
        imagemPlantaNome: fileName,
        imagemPlantaOpacidade: activeProject.imagemPlantaOpacidade || 0.75,
        imagemPlantaEscala: 1,
        imagemPlantaOffsetX: 0,
        imagemPlantaOffsetY: 0,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const updateBackgroundSettings = useCallback(
    (patch: { opacidade?: number; escala?: number; offsetX?: number; offsetY?: number }) => {
      if (!activeProject) return;

      const updated: CctvProject = {
        ...activeProject,
        imagemPlantaOpacidade: patch.opacidade !== undefined ? patch.opacidade : activeProject.imagemPlantaOpacidade,
        imagemPlantaEscala: patch.escala !== undefined ? patch.escala : activeProject.imagemPlantaEscala,
        imagemPlantaOffsetX: patch.offsetX !== undefined ? patch.offsetX : activeProject.imagemPlantaOffsetX,
        imagemPlantaOffsetY: patch.offsetY !== undefined ? patch.offsetY : activeProject.imagemPlantaOffsetY,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, user]
  );

  // 10. Escala e Dimensões
  const updateDimensionsAndScale = useCallback(
    (dim: { largura: number; comprimento: number }, escalaPixelsPorMetro?: number) => {
      if (!activeProject) return;
      recordHistory(activeProject);

      const updated: CctvProject = {
        ...activeProject,
        dimensoesMetros: dim,
        escalaPixelsPorMetro: escalaPixelsPorMetro || activeProject.escalaPixelsPorMetro,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const toggleGrid = useCallback(
    (visible?: boolean, snap?: boolean) => {
      if (!activeProject) return;

      const updated: CctvProject = {
        ...activeProject,
        gridVisible: visible !== undefined ? visible : !activeProject.gridVisible,
        gridSnap: snap !== undefined ? snap : activeProject.gridSnap,
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject]
  );

  // 11. Histórico de Versões & Undo / Redo
  const createVersionSnapshot = useCallback(
    (descricao: string) => {
      if (!activeProject) return;

      const snapshot: CctvVersionSnapshot = {
        id: `snap_${Date.now()}`,
        dataHora: new Date().toISOString(),
        autorNome: user?.nome || 'Matheus Guarnieri',
        autorId: user?.id || 'admin',
        descricao: descricao || `Versão salva (${activeProject.cameras.length} câmeras)`,
        totalCameras: activeProject.cameras.length,
        dataSnapshot: {
          cameras: JSON.parse(JSON.stringify(activeProject.cameras)),
          equipamentos: JSON.parse(JSON.stringify(activeProject.equipamentos)),
          elementosPlanta: JSON.parse(JSON.stringify(activeProject.elementosPlanta)),
          dimensoesMetros: { ...activeProject.dimensoesMetros },
        },
      };

      const updated: CctvProject = {
        ...activeProject,
        historicoVersoes: [snapshot, ...(activeProject.historicoVersoes || [])],
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, user]
  );

  const restoreVersionSnapshot = useCallback(
    (snapshotId: string) => {
      if (!activeProject) return;
      const snap = (activeProject.historicoVersoes || []).find((s) => s.id === snapshotId);
      if (!snap) return;

      recordHistory(activeProject);

      const updated: CctvProject = {
        ...activeProject,
        cameras: JSON.parse(JSON.stringify(snap.dataSnapshot.cameras)),
        equipamentos: JSON.parse(JSON.stringify(snap.dataSnapshot.equipamentos)),
        elementosPlanta: JSON.parse(JSON.stringify(snap.dataSnapshot.elementosPlanta)),
        dimensoesMetros: { ...snap.dataSnapshot.dimensoesMetros },
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user?.nome || 'Matheus Guarnieri',
      };

      setActiveProject(updated);
      syncSaveCctvProject(updated).catch(() => {});
    },
    [activeProject, recordHistory, user]
  );

  const undo = useCallback(() => {
    if (!activeProject || historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setFutureStack((prev) => [JSON.parse(JSON.stringify(activeProject)), ...prev]);
    setActiveProject(previous);
    syncSaveCctvProject(previous).catch(() => {});
  }, [activeProject, historyStack]);

  const redo = useCallback(() => {
    if (!activeProject || futureStack.length === 0) return;
    const next = futureStack[0];
    setFutureStack((prev) => prev.slice(1));
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(activeProject))]);
    setActiveProject(next);
    syncSaveCctvProject(next).catch(() => {});
  }, [activeProject, futureStack]);

  // 12. Estatísticas calculadas
  const stats = useMemo(() => {
    if (!activeProject) {
      return {
        totalCameras: 0,
        camerasOperacionais: 0,
        camerasPlanejadas: 0,
        camerasManutencao: 0,
        totalInfra: 0,
        canaisDvrOcupados: 0,
        tiposCount: {
          DOME: 0,
          BULLET: 0,
          SPEED_DOME_PTZ: 0,
          FISHEYE_360: 0,
          TERMICA: 0,
          VARIFOCAL: 0,
        },
      };
    }

    let operacionais = 0;
    let planejadas = 0;
    let manutencao = 0;
    const canaisSet = new Set<number>();
    const tiposMap: Record<CctvCameraType, number> = {
      DOME: 0,
      BULLET: 0,
      SPEED_DOME_PTZ: 0,
      FISHEYE_360: 0,
      TERMICA: 0,
      VARIFOCAL: 0,
    };

    activeProject.cameras.forEach((c) => {
      if (c.status === 'OPERACIONAL') operacionais++;
      else if (c.status === 'PLANEJADA') planejadas++;
      else if (c.status === 'MANUTENCAO' || c.status === 'SUBSTITUICAO') manutencao++;

      if (c.canalDvr) canaisSet.add(c.canalDvr);
      if (tiposMap[c.tipo] !== undefined) tiposMap[c.tipo]++;
      else tiposMap.DOME++;
    });

    return {
      totalCameras: activeProject.cameras.length,
      camerasOperacionais: operacionais,
      camerasPlanejadas: planejadas,
      camerasManutencao: manutencao,
      totalInfra: activeProject.equipamentos.length,
      canaisDvrOcupados: canaisSet.size,
      tiposCount: tiposMap,
    };
  }, [activeProject]);

  return (
    <CctvContext.Provider
      value={{
        projects,
        activeProject,
        selectedBranchId,
        selectedStoreId,
        canEdit,
        canAccess,
        selectLocation,
        setActiveProject,
        saveProject,
        deleteProject,
        createNewProjectForLocation,
        addCamera,
        updateCamera,
        removeCamera,
        addInfraEquipment,
        updateInfraEquipment,
        removeInfraEquipment,
        addFloorplanElement,
        updateFloorplanElement,
        removeFloorplanElement,
        clearFloorplanElements,
        setBackgroundImage,
        updateBackgroundSettings,
        updateDimensionsAndScale,
        toggleGrid,
        createVersionSnapshot,
        restoreVersionSnapshot,
        undo,
        redo,
        canUndo: historyStack.length > 0,
        canRedo: futureStack.length > 0,
        stats,
      }}
    >
      {children}
    </CctvContext.Provider>
  );
};

export const useCctv = (): CctvContextType => {
  const context = useContext(CctvContext);
  if (!context) {
    throw new Error('useCctv must be used within a CctvProvider');
  }
  return context;
};
