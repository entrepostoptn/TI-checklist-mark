import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCctv } from '../context/CctvContext';
import { useAuth } from '../context/AuthContext';
import { useBranches } from '../context/BranchContext';
import { useClients } from '../context/ClientContext';
import {
  CctvCamera,
  CctvInfrastructureEquipment,
  CctvFloorplanElement,
  CctvCameraType,
  CctvCameraStatus,
  CctvInfraType,
  CctvProject,
} from '../types/cctv';
import { BranchUnit } from '../types/branch';
import { Store } from '../types/client';
import { CctvCameraModal } from './CctvCameraModal';
import { CctvInfraModal } from './CctvInfraModal';
import { CctvPermissionsModal } from './CctvPermissionsModal';
import {
  Video,
  Shield,
  Layers,
  Building2,
  Store as StoreIcon,
  Plus,
  Trash2,
  Edit2,
  RotateCw,
  Eye,
  EyeOff,
  Save,
  Download,
  Printer,
  Undo2,
  Redo2,
  History,
  Grid,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Square,
  Minus,
  DoorOpen,
  Tag,
  Upload,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Server,
  HardDrive,
  Tv,
  Network,
  Cpu,
  Lock,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  Search,
  Filter,
  Sparkles,
  Move,
} from 'lucide-react';

type ToolMode =
  | 'SELECT'
  | 'ADD_CAMERA'
  | 'ADD_INFRA'
  | 'DRAW_WALL'
  | 'DRAW_DOOR'
  | 'DRAW_ZONE'
  | 'MEASURE'
  | 'ERASE';

export const CctvProjectView: React.FC = () => {
  const { user, isMatheus, permissions } = useAuth();
  const { branches } = useBranches();
  const { stores } = useClients();
  const {
    projects,
    activeProject,
    selectedBranchId,
    selectedStoreId,
    canEdit,
    canAccess,
    selectLocation,
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
    canUndo,
    canRedo,
    stats,
  } = useCctv();

  // Active tool and interaction state
  const [activeTool, setActiveTool] = useState<ToolMode>('SELECT');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedInfraId, setSelectedInfraId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Modals state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraToEdit, setCameraToEdit] = useState<CctvCamera | null>(null);
  const [isInfraModalOpen, setIsInfraModalOpen] = useState(false);
  const [infraToEdit, setInfraToEdit] = useState<CctvInfrastructureEquipment | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isEquipmentListOpen, setIsEquipmentListOpen] = useState(false);

  // Canvas Viewport transform (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging elements state
  const [draggedItem, setDraggedItem] = useState<{
    type: 'CAMERA' | 'INFRA' | 'ELEMENT';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Drawing elements temporary state (walls, zones, doors)
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null);
  const [newZoneLabel, setNewZoneLabel] = useState('Salão Principal');
  const [newZoneColor, setNewZoneColor] = useState('#E0F2FE');

  // Canvas container reference
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification / toast feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Pre-select first branch if none selected
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      const firstActive = branches.find((b) => b.status === 'ativa') || branches[0];
      const matchingStores = stores.filter((s: Store) => s.clienteId === firstActive.id || s.cidade === firstActive.municipio);
      const firstStoreId = matchingStores[0]?.id;
      selectLocation(firstActive.id, firstStoreId);
    }
  }, [branches, selectedBranchId, selectLocation, stores]);

  // Handle branch switch
  const handleBranchChange = (branchId: string) => {
    const matchingStores = stores.filter((s: Store) => s.clienteId === branchId);
    const storeId = matchingStores[0]?.id;
    selectLocation(branchId, storeId);
  };

  // Handle store switch
  const handleStoreChange = (storeId: string) => {
    if (selectedBranchId) {
      selectLocation(selectedBranchId, storeId === 'all' ? undefined : storeId);
    }
  };

  // Available stores for selected branch
  const currentStores = useMemo(() => {
    if (!selectedBranchId) return [];
    return stores.filter((s: Store) => s.clienteId === selectedBranchId || s.cidade === activeProject?.branchName);
  }, [selectedBranchId, stores, activeProject]);

  // Selected camera / infra objects
  const selectedCamera = useMemo(() => {
    if (!activeProject || !selectedCameraId) return null;
    return activeProject.cameras.find((c) => c.id === selectedCameraId) || null;
  }, [activeProject, selectedCameraId]);

  const selectedInfra = useMemo(() => {
    if (!activeProject || !selectedInfraId) return null;
    return activeProject.equipamentos.find((e) => e.id === selectedInfraId) || null;
  }, [activeProject, selectedInfraId]);

  // Dimensions & Scale
  const escala = activeProject?.escalaPixelsPorMetro || 28;
  const dimMetros = activeProject?.dimensoesMetros || { largura: 35, comprimento: 25 };
  const canvasWidth = dimMetros.largura * escala;
  const canvasHeight = dimMetros.comprimento * escala;

  // Coordinate conversion helper: client mouse event to canvas coordinate
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else if (e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rawX = (clientX - rect.left - panOffset.x) / zoom;
      const rawY = (clientY - rect.top - panOffset.y) / zoom;

      // Snap to grid if enabled
      if (activeProject?.gridSnap && activeTool !== 'SELECT') {
        const snapStep = (activeProject.gridTamanhoMetros || 1) * escala;
        return {
          x: Math.round(rawX / snapStep) * snapStep,
          y: Math.round(rawY / snapStep) * snapStep,
        };
      }

      return { x: Math.max(0, rawX), y: Math.max(0, rawY) };
    },
    [panOffset, zoom, activeProject, escala, activeTool]
  );

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Escape, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo && canEdit) redo();
        } else {
          if (canUndo && canEdit) undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (canRedo && canEdit) redo();
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!canEdit) return;
        if (selectedCameraId) {
          removeCamera(selectedCameraId);
          setSelectedCameraId(null);
          showToast('Câmera removida.');
        } else if (selectedInfraId) {
          removeInfraEquipment(selectedInfraId);
          setSelectedInfraId(null);
          showToast('Equipamento de infraestrutura removido.');
        } else if (selectedElementId) {
          removeFloorplanElement(selectedElementId);
          setSelectedElementId(null);
          showToast('Elemento da planta removido.');
        }
      } else if (e.key === 'Escape') {
        setActiveTool('SELECT');
        setSelectedCameraId(null);
        setSelectedInfraId(null);
        setSelectedElementId(null);
        setDrawingStart(null);
        setDrawingCurrent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    canEdit,
    undo,
    redo,
    selectedCameraId,
    selectedInfraId,
    selectedElementId,
    removeCamera,
    removeInfraEquipment,
    removeFloorplanElement,
  ]);

  // Upload background blueprint (PDF / PNG / JPG)
  const handleUploadBlueprint = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.includes('pdf')) {
      showToast('Para melhor precisão, recomendamos converter páginas de PDF em imagem PNG/JPG.', 'info');
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setBackgroundImage(dataUrl, file.name);
      showToast(`Planta baixa "${file.name}" carregada com sucesso!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeProject) return;

    // Pan canvas with middle click or space key or if in SELECT mode clicking background
    if ('button' in e && (e.button === 1 || (e.button === 0 && e.altKey))) {
      setIsPanning(true);
      const mouseEvent = e as React.MouseEvent;
      setPanStart({ x: mouseEvent.clientX - panOffset.x, y: mouseEvent.clientY - panOffset.y });
      return;
    }

    const coords = getCanvasCoords(e);

    // If drawing tools active and user can edit
    if (!canEdit) {
      if (activeTool !== 'SELECT') {
        showToast('Você está em modo de somente leitura.', 'info');
      }
      return;
    }

    if (activeTool === 'ADD_CAMERA') {
      const nextNum = activeProject.cameras.length + 1;
      const initialCam: Omit<CctvCamera, 'id' | 'codigo'> = {
        nome: `Câmera ${nextNum}`,
        tipo: 'DOME',
        tecnologia: 'IP_POE',
        resolucao: '2MP Full HD (1080p)',
        marcaModelo: 'Intelbras VHD 3230 B',
        alcanceMetros: 12,
        anguloAberturaGraus: 90,
        direcaoGraus: 90,
        posicaoX: coords.x,
        posicaoY: coords.y,
        status: 'OPERACIONAL',
        corIdentificacao: '#3B82F6',
      };
      addCamera(initialCam);
      showToast(`Câmera CAM-${String(nextNum).padStart(2, '0')} posicionada no mapa.`);
      setActiveTool('SELECT');
      return;
    }

    if (activeTool === 'ADD_INFRA') {
      const initialInfra: Omit<CctvInfrastructureEquipment, 'id' | 'codigo'> = {
        nome: 'NVR Central 32ch',
        tipo: 'DVR_NVR',
        posicaoX: coords.x,
        posicaoY: coords.y,
        modelo: 'Intelbras NVD 7132',
        especificacao: '32 Canais / 4TB Purple',
      };
      addInfraEquipment(initialInfra);
      showToast('Equipamento de infraestrutura posicionado.');
      setActiveTool('SELECT');
      return;
    }

    if (['DRAW_WALL', 'DRAW_DOOR', 'DRAW_ZONE', 'MEASURE'].includes(activeTool)) {
      setDrawingStart(coords);
      setDrawingCurrent(coords);
      return;
    }

    // Default SELECT: deselect if clicking blank canvas
    if (activeTool === 'SELECT') {
      setSelectedCameraId(null);
      setSelectedInfraId(null);
      setSelectedElementId(null);
    }
  };

  // Canvas Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPanOffset({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
      return;
    }

    const coords = getCanvasCoords(e);

    // If dragging an element
    if (draggedItem && canEdit) {
      const targetX = Math.max(10, coords.x - draggedItem.offsetX);
      const targetY = Math.max(10, coords.y - draggedItem.offsetY);

      if (draggedItem.type === 'CAMERA') {
        updateCamera(draggedItem.id, { posicaoX: targetX, posicaoY: targetY });
      } else if (draggedItem.type === 'INFRA') {
        updateInfraEquipment(draggedItem.id, { posicaoX: targetX, posicaoY: targetY });
      } else if (draggedItem.type === 'ELEMENT') {
        updateFloorplanElement(draggedItem.id, { x1: targetX, y1: targetY });
      }
      return;
    }

    // If drawing
    if (drawingStart) {
      setDrawingCurrent(coords);
    }
  };

  // Canvas Mouse Up
  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (draggedItem) {
      setDraggedItem(null);
      return;
    }

    if (drawingStart && drawingCurrent && canEdit) {
      const dx = drawingCurrent.x - drawingStart.x;
      const dy = drawingCurrent.y - drawingStart.y;
      const distancePx = Math.sqrt(dx * dx + dy * dy);

      if (distancePx > 10) {
        if (activeTool === 'DRAW_WALL') {
          const compMetros = parseFloat((distancePx / escala).toFixed(2));
          addFloorplanElement({
            tipo: 'PAREDE',
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: drawingCurrent.x,
            y2: drawingCurrent.y,
            espessuraLinha: 8,
            cor: '#1E293B',
            medidaMetros: compMetros,
          });
          showToast(`Parede de ${compMetros}m adicionada.`);
        } else if (activeTool === 'DRAW_DOOR') {
          const compMetros = parseFloat((distancePx / escala).toFixed(2));
          addFloorplanElement({
            tipo: 'PORTA',
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: drawingCurrent.x,
            y2: drawingCurrent.y,
            espessuraLinha: 5,
            cor: '#D97706',
            rotulo: 'Porta',
            medidaMetros: compMetros,
          });
          showToast('Porta adicionada na planta.');
        } else if (activeTool === 'DRAW_ZONE') {
          const minX = Math.min(drawingStart.x, drawingCurrent.x);
          const minY = Math.min(drawingStart.y, drawingCurrent.y);
          const w = Math.abs(dx);
          const h = Math.abs(dy);
          addFloorplanElement({
            tipo: 'AMBIENTE_ZONA',
            x1: minX,
            y1: minY,
            largura: w,
            altura: h,
            rotulo: newZoneLabel || 'Ambiente',
            cor: newZoneColor,
          });
          showToast(`Zona "${newZoneLabel}" demarcada.`);
        } else if (activeTool === 'MEASURE') {
          const compMetros = parseFloat((distancePx / escala).toFixed(2));
          addFloorplanElement({
            tipo: 'MEDIDA_COTA',
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: drawingCurrent.x,
            y2: drawingCurrent.y,
            rotulo: `${compMetros}m`,
            medidaMetros: compMetros,
            cor: '#2563EB',
          });
          showToast(`Cota de ${compMetros}m registrada.`);
        }
      }

      setDrawingStart(null);
      setDrawingCurrent(null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 30, y: 30 });
  };

  // Rotate selected camera by angle delta
  const handleRotateCamera = (delta: number) => {
    if (!selectedCamera || !canEdit) return;
    const newDir = (selectedCamera.direcaoGraus + delta + 360) % 360;
    updateCamera(selectedCamera.id, { direcaoGraus: newDir });
  };

  // Save project manually with instant feedback
  const [isSaving, setIsSaving] = useState(false);
  const handleManualSave = async () => {
    setIsSaving(true);
    const success = await saveProject();
    setIsSaving(false);
    if (success) {
      showToast('Projeto salvo no Firebase e sincronizado com todos os dispositivos!');
    } else {
      showToast('Erro ao salvar no banco central.', 'error');
    }
  };

  // Export High-Res Canvas to PNG Image
  const handleExportPng = () => {
    if (!activeProject) return;

    // Create a temporary high-res canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Grid lines
    if (activeProject.gridVisible) {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      const step = (activeProject.gridTamanhoMetros || 1) * escala;
      for (let x = 0; x <= canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw elements, cameras, legend
    const downloadLink = document.createElement('a');
    downloadLink.download = `Projeto_CFTV_${activeProject.branchName.replace(/\s+/g, '_')}_${Date.now()}.png`;

    // Render floor plan zones
    activeProject.elementosPlanta
      .filter((el) => el.tipo === 'AMBIENTE_ZONA')
      .forEach((zone) => {
        ctx.fillStyle = zone.cor || 'rgba(224, 242, 254, 0.6)';
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.fillRect(zone.x1, zone.y1, zone.largura || 100, zone.altura || 100);
        ctx.strokeRect(zone.x1, zone.y1, zone.largura || 100, zone.altura || 100);

        if (zone.rotulo) {
          ctx.fillStyle = '#1E293B';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(zone.rotulo, zone.x1 + 8, zone.y1 + 20);
        }
      });

    // Render walls
    activeProject.elementosPlanta
      .filter((el) => el.tipo === 'PAREDE')
      .forEach((wall) => {
        ctx.strokeStyle = wall.cor || '#0F172A';
        ctx.lineWidth = wall.espessuraLinha || 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2 || wall.x1, wall.y2 || wall.y1);
        ctx.stroke();
      });

    // Render doors
    activeProject.elementosPlanta
      .filter((el) => el.tipo === 'PORTA')
      .forEach((door) => {
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(door.x1, door.y1);
        ctx.lineTo(door.x2 || door.x1, door.y2 || door.y1);
        ctx.stroke();
      });

    // Render Cameras & FOV Cones
    activeProject.cameras.forEach((cam) => {
      const radiusPx = cam.alcanceMetros * escala;
      const fovRad = (cam.anguloAberturaGraus * Math.PI) / 180;
      const dirRad = ((cam.direcaoGraus - 90) * Math.PI) / 180;
      const startAngle = dirRad - fovRad / 2;
      const endAngle = dirRad + fovRad / 2;

      // Coverage Cone
      ctx.fillStyle = cam.corIdentificacao ? `${cam.corIdentificacao}33` : 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = cam.corIdentificacao || '#3B82F6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cam.posicaoX, cam.posicaoY);
      ctx.arc(cam.posicaoX, cam.posicaoY, radiusPx, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Camera Icon / Marker
      ctx.fillStyle = cam.corIdentificacao || '#2563EB';
      ctx.beginPath();
      ctx.arc(cam.posicaoX, cam.posicaoY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Camera Code Label
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(cam.codigo, cam.posicaoX - 16, cam.posicaoY + 24);
    });

    // Render Infrastructure Equipment
    activeProject.equipamentos.forEach((eq) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(eq.posicaoX - 12, eq.posicaoY - 12, 24, 24);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(eq.posicaoX - 12, eq.posicaoY - 12, 24, 24);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(eq.codigo, eq.posicaoX - 14, eq.posicaoY + 22);
    });

    // Header banner with title
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, 42);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`MARK SECURITY — ${activeProject.nomeProjeto}`, 16, 26);
    ctx.font = '12px sans-serif';
    ctx.fillText(`Total: ${activeProject.cameras.length} Câmeras | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, canvas.width - 320, 26);

    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.click();
    showToast('Planta baixa exportada em PNG de alta definição!');
  };

  // Print Project or Save as PDF
  const handlePrintProject = () => {
    window.print();
  };

  // Permission checks
  if (!canAccess) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Módulo CFTV Oculto e Restrito</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          O módulo de <strong>Projeto de Câmeras (CFTV)</strong> está temporariamente oculto e restrito ao administrador <strong>Matheus Guarnieri</strong>.
          {user?.username === 'marcos' && (
            <span className="block mt-2 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium text-xs">
              Sua conta ainda não recebeu permissão de visualização para este módulo. Solicite ao Matheus para habilitar seu acesso.
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Header & Location Selector Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md flex items-center justify-center shrink-0 w-12 h-12">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Projeto de Câmeras (CFTV)
              </h1>
              {!canEdit && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Modo Somente Visualização
                </span>
              )}
              {isMatheus && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Gestão Matheus
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Planta baixa interativa com posicionamento, campo de visão (FOV), infraestrutura e sincronização global
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Permissions button for Matheus */}
          {isMatheus && (
            <button
              type="button"
              onClick={() => setIsPermissionsModalOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Gerenciar permissões de Marcos para este módulo"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Permissões Marcos</span>
            </button>
          )}

          {/* Version History */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Histórico de Versões do Projeto"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Versões</span>
            {activeProject?.historicoVersoes?.length ? (
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] flex items-center justify-center font-bold">
                {activeProject.historicoVersoes.length}
              </span>
            ) : null}
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPng}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar imagem PNG em alta resolução"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar PNG</span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrintProject}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          {/* Manual Save */}
          {canEdit && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Projeto'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Location Filter & Live KPI Counters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Filial & Loja Selector Card */}
        <div className="md:col-span-6 lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Localização do Projeto
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Filial / Matriz:</label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.idOriginal ? `[${b.idOriginal}] ` : ''}{b.nomeFantasia} ({b.municipio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Loja / Setor:</label>
              <select
                value={selectedStoreId || 'all'}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Planta Geral / Salão Principal</option>
                {currentStores.map((st: Store) => (
                  <option key={st.id} value={st.id}>
                    {st.codigoLoja ? `[${st.codigoLoja}] ` : ''}{st.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="md:col-span-6 lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full text-center">
            {/* Total Cameras */}
            <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100">
              <div className="text-xl sm:text-2xl font-black text-blue-700">{stats.totalCameras}</div>
              <div className="text-[10px] font-bold text-blue-900 uppercase">Câmeras Total</div>
            </div>

            {/* Operacionais */}
            <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
              <div className="text-xl sm:text-2xl font-black text-emerald-700">{stats.camerasOperacionais}</div>
              <div className="text-[10px] font-bold text-emerald-900 uppercase">Ativas</div>
            </div>

            {/* Planejadas */}
            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100">
              <div className="text-xl sm:text-2xl font-black text-amber-700">{stats.camerasPlanejadas}</div>
              <div className="text-[10px] font-bold text-amber-900 uppercase">Planejadas</div>
            </div>

            {/* Manutenção */}
            <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 hidden sm:block">
              <div className="text-xl sm:text-2xl font-black text-rose-700">{stats.camerasManutencao}</div>
              <div className="text-[10px] font-bold text-rose-900 uppercase">Manutenção</div>
            </div>

            {/* DVR / Infra */}
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <div className="text-xl sm:text-2xl font-black text-slate-800">{stats.totalInfra}</div>
              <div className="text-[10px] font-bold text-slate-700 uppercase">Itens Infra</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toast / Feedback message */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : notification.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Floor Plan Interactive Editor Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Editor Toolbar */}
        <div className="p-2.5 sm:p-3 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Left tools group */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Selection tool */}
            <button
              type="button"
              onClick={() => setActiveTool('SELECT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'SELECT' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Modo Seleção e Movimento (Arraste câmeras e itens)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Selecionar / Mover</span>
            </button>

            {/* Add Camera Tool */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActiveTool('ADD_CAMERA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTool === 'ADD_CAMERA'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Clique no mapa para posicionar uma câmera"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Inserir Câmera</span>
              </button>
            )}

            {/* Add Infra Tool */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActiveTool('ADD_INFRA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTool === 'ADD_INFRA'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Clique no mapa para posicionar DVR, Rack ou Switch"
              >
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>+ DVR / Rack / Infra</span>
              </button>
            )}

            {/* Draw Wall */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActiveTool('DRAW_WALL')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTool === 'DRAW_WALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Desenhar paredes na planta (arraste do início ao fim)"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden md:inline">Parede</span>
              </button>
            )}

            {/* Draw Door */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActiveTool('DRAW_DOOR')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTool === 'DRAW_DOOR' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Desenhar porta ou vão de passagem"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Porta</span>
              </button>
            )}

            {/* Draw Room / Zone */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActiveTool('DRAW_ZONE')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTool === 'DRAW_ZONE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Demarcar ambiente ou zona (arraste retângulo)"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ambiente</span>
              </button>
            )}

            {/* Measure */}
            <button
              type="button"
              onClick={() => setActiveTool('MEASURE')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'MEASURE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Inserir linha de cota com medida em metros reais"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Medir</span>
            </button>
          </div>

          {/* Right utility group (Undo, Redo, Zoom, Grid, Import Blueprint) */}
          <div className="flex items-center gap-1.5">
            {/* Undo / Redo */}
            {canEdit && (
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Refazer (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={() => toggleGrid()}
              className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeProject?.gridVisible ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Alternar grade métrica (Grid)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* Zoom In/Out/Reset */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-[11px] font-mono text-slate-200 hover:text-white cursor-pointer"
                title="Resetar Zoom e Enquadramento"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Import Blueprint Button */}
            {canEdit && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadBlueprint}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Importar planta em PDF, PNG ou JPG como base"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importar Planta</span>
                </button>
              </>
            )}

            {/* Scale & Dimensions Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Ajustar Dimensões e Escala da Loja"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Camera / Infra Quick Inspector Bar (when item is clicked) */}
        {selectedCamera && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white font-mono">
                {selectedCamera.codigo}
              </span>
              <span className="font-bold text-slate-900">{selectedCamera.nome}</span>
              <span className="text-slate-500">
                ({selectedCamera.tipo} • {selectedCamera.resolucao})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-blue-300 text-blue-800">
                Alcance: {selectedCamera.alcanceMetros}m • Ângulo: {selectedCamera.anguloAberturaGraus}° • Giro: {selectedCamera.direcaoGraus}°
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1.5">
                {/* Rotate Buttons */}
                <button
                  type="button"
                  onClick={() => handleRotateCamera(-15)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-bold flex items-center gap-1 cursor-pointer"
                  title="Girar 15° para a esquerda"
                >
                  <RotateCw className="w-3 h-3 -scale-x-100" /> -15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateCamera(15)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-bold flex items-center gap-1 cursor-pointer"
                  title="Girar 15° para a direita"
                >
                  <RotateCw className="w-3 h-3" /> +15°
                </button>

                {/* Edit Details */}
                <button
                  type="button"
                  onClick={() => {
                    setCameraToEdit(selectedCamera);
                    setIsCameraModalOpen(true);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => {
                    removeCamera(selectedCamera.id);
                    setSelectedCameraId(null);
                    showToast('Câmera removida.');
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                  title="Excluir Câmera"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Infra Inspector */}
        {selectedInfra && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold px-2 py-0.5 rounded bg-amber-600 text-white font-mono">
                {selectedInfra.codigo}
              </span>
              <span className="font-bold text-slate-900">{selectedInfra.nome}</span>
              <span className="text-slate-500">({selectedInfra.tipo})</span>
              {selectedInfra.ipAddress && (
                <span className="font-mono text-[11px] text-slate-600">IP: {selectedInfra.ipAddress}</span>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInfraToEdit(selectedInfra);
                    setIsInfraModalOpen(true);
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeInfraEquipment(selectedInfra.id);
                    setSelectedInfraId(null);
                    showToast('Equipamento removido.');
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                  title="Excluir Equipamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* The Interactive Canvas Area */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchStart={handleCanvasMouseDown}
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={handleCanvasMouseUp}
          className="relative w-full h-[600px] lg:h-[720px] bg-slate-100 overflow-hidden select-none cursor-crosshair touch-none"
        >
          {/* Transformed Stage */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
            }}
            className="relative bg-white shadow-xl border-2 border-slate-300 transition-none"
          >
            {/* 1. Grid Background Overlay */}
            {activeProject?.gridVisible && (
              <svg
                width={canvasWidth}
                height={canvasHeight}
                className="absolute inset-0 pointer-events-none z-0"
              >
                <defs>
                  <pattern
                    id="grid-pattern"
                    width={escala * (activeProject.gridTamanhoMetros || 1)}
                    height={escala * (activeProject.gridTamanhoMetros || 1)}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${escala * (activeProject.gridTamanhoMetros || 1)} 0 L 0 0 0 ${
                        escala * (activeProject.gridTamanhoMetros || 1)
                      }`}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            )}

            {/* 2. Imported Blueprint Background Image */}
            {activeProject?.imagemPlantaFundo && (
              <img
                src={activeProject.imagemPlantaFundo}
                alt="Planta Baixa Importada"
                style={{
                  opacity: activeProject.imagemPlantaOpacidade ?? 0.75,
                  transform: `scale(${activeProject.imagemPlantaEscala || 1}) translate(${
                    activeProject.imagemPlantaOffsetX || 0
                  }px, ${activeProject.imagemPlantaOffsetY || 0}px)`,
                  transformOrigin: '0 0',
                }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-1"
              />
            )}

            {/* 3. SVG Elements: Zones, Walls, Doors, Measurements, FOV Cones */}
            <svg
              width={canvasWidth}
              height={canvasHeight}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              {/* Zones / Rooms */}
              {activeProject?.elementosPlanta
                .filter((el) => el.tipo === 'AMBIENTE_ZONA')
                .map((zone) => (
                  <g key={zone.id} className="pointer-events-auto cursor-pointer">
                    <rect
                      x={zone.x1}
                      y={zone.y1}
                      width={zone.largura || 100}
                      height={zone.altura || 100}
                      fill={zone.cor || 'rgba(224, 242, 254, 0.5)'}
                      stroke="#94A3B8"
                      strokeWidth={selectedElementId === zone.id ? 2.5 : 1}
                      strokeDasharray="4 2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(zone.id);
                      }}
                    />
                    {zone.rotulo && (
                      <text
                        x={zone.x1 + 10}
                        y={zone.y1 + 22}
                        fill="#334155"
                        fontSize="12"
                        fontWeight="bold"
                        className="select-none pointer-events-none font-sans"
                      >
                        {zone.rotulo}
                      </text>
                    )}
                  </g>
                ))}

              {/* Walls */}
              {activeProject?.elementosPlanta
                .filter((el) => el.tipo === 'PAREDE')
                .map((wall) => (
                  <g key={wall.id} className="pointer-events-auto cursor-pointer">
                    <line
                      x1={wall.x1}
                      y1={wall.y1}
                      x2={wall.x2 || wall.x1}
                      y2={wall.y2 || wall.y1}
                      stroke={selectedElementId === wall.id ? '#2563EB' : wall.cor || '#0F172A'}
                      strokeWidth={wall.espessuraLinha || 8}
                      strokeLinecap="round"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(wall.id);
                      }}
                    />
                    {wall.medidaMetros && (
                      <text
                        x={(wall.x1 + (wall.x2 || wall.x1)) / 2}
                        y={(wall.y1 + (wall.y2 || wall.y1)) / 2 - 8}
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="select-none pointer-events-none bg-white font-mono"
                      >
                        {wall.medidaMetros}m
                      </text>
                    )}
                  </g>
                ))}

              {/* Doors */}
              {activeProject?.elementosPlanta
                .filter((el) => el.tipo === 'PORTA')
                .map((door) => (
                  <g key={door.id} className="pointer-events-auto cursor-pointer">
                    <line
                      x1={door.x1}
                      y1={door.y1}
                      x2={door.x2 || door.x1}
                      y2={door.y2 || door.y1}
                      stroke="#D97706"
                      strokeWidth="5"
                      strokeDasharray="2 3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(door.id);
                      }}
                    />
                  </g>
                ))}

              {/* Measurements / Dimensions */}
              {activeProject?.elementosPlanta
                .filter((el) => el.tipo === 'MEDIDA_COTA')
                .map((cota) => (
                  <g key={cota.id} className="pointer-events-auto cursor-pointer">
                    <line
                      x1={cota.x1}
                      y1={cota.y1}
                      x2={cota.x2 || cota.x1}
                      y2={cota.y2 || cota.y1}
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={(cota.x1 + (cota.x2 || cota.x1)) / 2}
                      y={(cota.y1 + (cota.y2 || cota.y1)) / 2 - 6}
                      fill="#2563EB"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono bg-white"
                    >
                      {cota.rotulo || `${cota.medidaMetros}m`}
                    </text>
                  </g>
                ))}

              {/* Currently Drawing Shape Preview */}
              {drawingStart && drawingCurrent && (
                <g>
                  {activeTool === 'DRAW_WALL' && (
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={drawingCurrent.x}
                      y2={drawingCurrent.y}
                      stroke="#2563EB"
                      strokeWidth="8"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  )}
                  {activeTool === 'DRAW_DOOR' && (
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={drawingCurrent.x}
                      y2={drawingCurrent.y}
                      stroke="#D97706"
                      strokeWidth="4"
                      strokeDasharray="2 2"
                    />
                  )}
                  {activeTool === 'DRAW_ZONE' && (
                    <rect
                      x={Math.min(drawingStart.x, drawingCurrent.x)}
                      y={Math.min(drawingStart.y, drawingCurrent.y)}
                      width={Math.abs(drawingCurrent.x - drawingStart.x)}
                      height={Math.abs(drawingCurrent.y - drawingStart.y)}
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                  )}
                  {activeTool === 'MEASURE' && (
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={drawingCurrent.x}
                      y2={drawingCurrent.y}
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  )}
                </g>
              )}

              {/* Camera Coverage FOV Cones */}
              {activeProject?.cameras.map((cam) => {
                const radiusPx = cam.alcanceMetros * escala;
                const isFisheye = cam.tipo === 'FISHEYE_360' || cam.anguloAberturaGraus >= 360;
                const fovRad = (cam.anguloAberturaGraus * Math.PI) / 180;
                const dirRad = ((cam.direcaoGraus - 90) * Math.PI) / 180;
                const startAngle = dirRad - fovRad / 2;
                const endAngle = dirRad + fovRad / 2;

                const isSelected = selectedCameraId === cam.id;
                const coneColor = cam.corIdentificacao || '#3B82F6';

                if (isFisheye) {
                  return (
                    <circle
                      key={`cone_${cam.id}`}
                      cx={cam.posicaoX}
                      cy={cam.posicaoY}
                      r={radiusPx}
                      fill={coneColor}
                      fillOpacity={isSelected ? '0.35' : '0.18'}
                      stroke={coneColor}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray="4 2"
                    />
                  );
                }

                // Arc path for directional cone
                const x1 = cam.posicaoX + radiusPx * Math.cos(startAngle);
                const y1 = cam.posicaoY + radiusPx * Math.sin(startAngle);
                const x2 = cam.posicaoX + radiusPx * Math.cos(endAngle);
                const y2 = cam.posicaoY + radiusPx * Math.sin(endAngle);
                const largeArcFlag = fovRad > Math.PI ? 1 : 0;

                const pathData = `M ${cam.posicaoX} ${cam.posicaoY} L ${x1} ${y1} A ${radiusPx} ${radiusPx} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                return (
                  <path
                    key={`cone_${cam.id}`}
                    d={pathData}
                    fill={coneColor}
                    fillOpacity={isSelected ? '0.35' : '0.2'}
                    stroke={coneColor}
                    strokeWidth={isSelected ? '2' : '1'}
                  />
                );
              })}
            </svg>

            {/* 4. Interactive Camera Markers on Map */}
            {activeProject?.cameras.map((cam) => {
              const isSelected = selectedCameraId === cam.id;
              const markerBg = cam.corIdentificacao || '#2563EB';

              return (
                <div
                  key={cam.id}
                  style={{
                    left: `${cam.posicaoX}px`,
                    top: `${cam.posicaoY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedCameraId(cam.id);
                    setSelectedInfraId(null);
                    if (canEdit && activeTool === 'SELECT') {
                      const coords = getCanvasCoords(e);
                      setDraggedItem({
                        type: 'CAMERA',
                        id: cam.id,
                        offsetX: coords.x - cam.posicaoX,
                        offsetY: coords.y - cam.posicaoY,
                      });
                    }
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setSelectedCameraId(cam.id);
                    setSelectedInfraId(null);
                    if (canEdit && activeTool === 'SELECT') {
                      const coords = getCanvasCoords(e);
                      setDraggedItem({
                        type: 'CAMERA',
                        id: cam.id,
                        offsetX: coords.x - cam.posicaoX,
                        offsetY: coords.y - cam.posicaoY,
                      });
                    }
                  }}
                  className={`absolute z-30 flex flex-col items-center cursor-move group pointer-events-auto`}
                >
                  {/* Camera Icon Marker with Direction Arrow */}
                  <div
                    style={{ backgroundColor: markerBg }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 ${
                      isSelected ? 'border-amber-400 ring-4 ring-amber-300/60 scale-110' : 'border-white'
                    } transition-all`}
                  >
                    <Video className="w-4 h-4" />
                  </div>

                  {/* Direction pointer needle */}
                  <div
                    style={{
                      transform: `rotate(${cam.direcaoGraus}deg)`,
                      transformOrigin: 'center center',
                    }}
                    className="absolute -top-1 w-2 h-2 pointer-events-none"
                  >
                    <div className="w-1.5 h-3 bg-amber-400 rounded-full mx-auto shadow-xs" />
                  </div>

                  {/* Camera Code Badge */}
                  <span
                    className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-xs ${
                      isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900/90 text-white'
                    }`}
                  >
                    {cam.codigo}
                  </span>
                </div>
              );
            })}

            {/* 5. Interactive Infrastructure Equipment Markers */}
            {activeProject?.equipamentos.map((eq) => {
              const isSelected = selectedInfraId === eq.id;

              return (
                <div
                  key={eq.id}
                  style={{
                    left: `${eq.posicaoX}px`,
                    top: `${eq.posicaoY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedInfraId(eq.id);
                    setSelectedCameraId(null);
                    if (canEdit && activeTool === 'SELECT') {
                      const coords = getCanvasCoords(e);
                      setDraggedItem({
                        type: 'INFRA',
                        id: eq.id,
                        offsetX: coords.x - eq.posicaoX,
                        offsetY: coords.y - eq.posicaoY,
                      });
                    }
                  }}
                  className={`absolute z-20 flex flex-col items-center cursor-move group pointer-events-auto`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md border-2 ${
                      isSelected ? 'border-amber-400 ring-4 ring-amber-300/60 bg-amber-600' : 'border-white bg-slate-800'
                    }`}
                  >
                    {eq.tipo === 'DVR_NVR' ? (
                      <HardDrive className="w-3.5 h-3.5" />
                    ) : eq.tipo === 'RACK_TI' ? (
                      <Server className="w-3.5 h-3.5" />
                    ) : eq.tipo === 'MONITOR_TV' ? (
                      <Tv className="w-3.5 h-3.5" />
                    ) : (
                      <Network className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="mt-0.5 px-1 rounded text-[9px] font-mono font-bold bg-slate-900 text-amber-300">
                    {eq.codigo}
                  </span>
                </div>
              );
            })}

            {/* Scale Marker in bottom left of canvas */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs z-30 text-[10px] font-mono text-slate-700 flex items-center gap-2">
              <span className="font-bold">Escala:</span>
              <span>1m = {escala}px</span>
              <span className="text-slate-400">|</span>
              <span>
                {dimMetros.largura}m x {dimMetros.comprimento}m
              </span>
            </div>
          </div>
        </div>

        {/* Footer Tabs & Drawer Bar: Camera List, Infrastructure, Technical Legend */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEquipmentListOpen(!isEquipmentListOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEquipmentListOpen ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Lista de Câmeras ({activeProject?.cameras.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLegendOpen ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Legenda Técnica</span>
            </button>
          </div>

          <div className="text-slate-500 text-[11px] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Persistência em tempo real no Firebase Firestore</span>
          </div>
        </div>
      </div>

      {/* 5. Collapsible Equipment List Panel */}
      {isEquipmentListOpen && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Inventário e Posicionamento de Câmeras — {activeProject?.branchName}
              </h3>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setCameraToEdit(null);
                  setIsCameraModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Câmera
              </button>
            )}
          </div>

          {activeProject?.cameras.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
              Nenhuma câmera cadastrada para esta loja ainda. Use a ferramenta "+ Inserir Câmera" na barra superior para posicionar no mapa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Identificação / Ponto</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Modelo / Marca</th>
                    <th className="p-2.5">Canal DVR</th>
                    <th className="p-2.5">Alcance / FOV</th>
                    <th className="p-2.5">Status</th>
                    {canEdit && <th className="p-2.5 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProject?.cameras.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCameraId(c.id);
                        setSelectedInfraId(null);
                      }}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                        selectedCameraId === c.id ? 'bg-blue-50 font-bold' : ''
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold text-blue-700">{c.codigo}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{c.nome}</td>
                      <td className="p-2.5 text-slate-600">{c.tipo}</td>
                      <td className="p-2.5 text-slate-600">{c.marcaModelo}</td>
                      <td className="p-2.5 font-mono">{c.canalDvr ? `CH-${c.canalDvr}` : '—'}</td>
                      <td className="p-2.5 font-mono">
                        {c.alcanceMetros}m ({c.anguloAberturaGraus}°)
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'OPERACIONAL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'PLANEJADA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setCameraToEdit(c);
                                setIsCameraModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeCamera(c.id);
                                if (selectedCameraId === c.id) setSelectedCameraId(null);
                                showToast('Câmera removida.');
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Technical Legend Panel */}
      {isLegendOpen && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Legenda Técnica e Simbologia
            </h3>
            <button
              type="button"
              onClick={() => setIsLegendOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Câmera Dome</div>
                <div className="text-[11px] text-slate-500">Teto / Salão / Caixas</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Câmera Bullet</div>
                <div className="text-[11px] text-slate-500">Parede / Perímetro</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">DVR / NVR</div>
                <div className="text-[11px] text-slate-500">Gravador Central</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Rack de TI</div>
                <div className="text-[11px] text-slate-500">Bastidor / Switches PoE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Settings Modal for Dimensions & Scale */}
      {isSettingsModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" /> Dimensões e Escala da Loja
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Largura Real (metros):</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    defaultValue={activeProject.dimensoesMetros.largura}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 30;
                      updateDimensionsAndScale({
                        largura: val,
                        comprimento: activeProject.dimensoesMetros.comprimento,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comprimento Real (metros):</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    defaultValue={activeProject.dimensoesMetros.comprimento}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 20;
                      updateDimensionsAndScale({
                        largura: activeProject.dimensoesMetros.largura,
                        comprimento: val,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Escala de Visualização (Pixels por Metro):
                </label>
                <input
                  type="range"
                  min="15"
                  max="50"
                  step="1"
                  defaultValue={activeProject.escalaPixelsPorMetro}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateDimensionsAndScale(activeProject.dimensoesMetros, val);
                  }}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>15px/m (Visão ampla)</span>
                  <span className="font-bold text-blue-600">{activeProject.escalaPixelsPorMetro} px/m</span>
                  <span>50px/m (Alto detalhe)</span>
                </div>
              </div>

              {/* Background plant opacity slider if image exists */}
              {activeProject.imagemPlantaFundo && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 mb-1">Opacidade da Imagem de Fundo:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    defaultValue={activeProject.imagemPlantaOpacidade || 0.75}
                    onChange={(e) => {
                      updateBackgroundSettings({ opacidade: parseFloat(e.target.value) });
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>10% (Sutil)</span>
                    <button
                      type="button"
                      onClick={() => setBackgroundImage(undefined, undefined)}
                      className="text-rose-600 hover:underline font-bold text-[11px]"
                    >
                      Remover Imagem de Fundo
                    </button>
                    <span>100% (Sólido)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Concluir Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Version History Modal */}
      {isHistoryModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Histórico de Versões do Projeto
              </h3>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Snapshot input */}
            {canEdit && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Descrição da versão (Ex: Revisão frente de caixa)..."
                  id="snapshot-desc-input"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('snapshot-desc-input') as HTMLInputElement;
                    const desc = el?.value?.trim() || `Versão ${new Date().toLocaleTimeString('pt-BR')}`;
                    createVersionSnapshot(desc);
                    if (el) el.value = '';
                    showToast('Versão gravada no histórico!');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  Salvar Versão
                </button>
              </div>
            )}

            {/* List of Previous Snapshots */}
            <div className="max-h-72 overflow-y-auto space-y-2">
              {!activeProject.historicoVersoes || activeProject.historicoVersoes.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhuma versão salva anteriormente para esta loja.
                </div>
              ) : (
                activeProject.historicoVersoes.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{snap.descricao}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(snap.dataHora).toLocaleString('pt-BR')} • {snap.autorNome} • {snap.totalCameras} Câmeras
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja restaurar a versão "${snap.descricao}"?`)) {
                            restoreVersionSnapshot(snap.id);
                            setIsHistoryModalOpen(false);
                            showToast('Versão anterior restaurada com sucesso!');
                          }
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Camera Modal (Create / Edit) */}
      {isCameraModalOpen && (
        <CctvCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => {
            setIsCameraModalOpen(false);
            setCameraToEdit(null);
          }}
          onSave={(cam) => {
            if (cameraToEdit) {
              updateCamera(cam.id, cam);
              showToast(`Câmera ${cam.codigo} atualizada!`);
            } else {
              addCamera(cam);
              showToast(`Câmera ${cam.codigo} inserida no projeto!`);
            }
            setIsCameraModalOpen(false);
            setCameraToEdit(null);
          }}
          cameraToEdit={cameraToEdit}
          existingCamerasCount={activeProject?.cameras.length || 0}
        />
      )}

      {/* 10. Infra Modal (Create / Edit) */}
      {isInfraModalOpen && (
        <CctvInfraModal
          isOpen={isInfraModalOpen}
          onClose={() => {
            setIsInfraModalOpen(false);
            setInfraToEdit(null);
          }}
          onSave={(eq) => {
            if (infraToEdit) {
              updateInfraEquipment(eq.id, eq);
              showToast(`Equipamento ${eq.codigo} atualizado!`);
            } else {
              addInfraEquipment(eq);
              showToast(`Equipamento ${eq.codigo} cadastrado!`);
            }
            setIsInfraModalOpen(false);
            setInfraToEdit(null);
          }}
          equipToEdit={infraToEdit}
        />
      )}

      {/* 11. Permissions Modal (Matheus control of Marcos) */}
      <CctvPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};
