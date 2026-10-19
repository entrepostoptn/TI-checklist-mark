import React, { useState, useEffect } from 'react';
import {
  CctvCamera,
  CctvCameraType,
  CctvTechnology,
  CctvCameraStatus,
} from '../types/cctv';
import {
  Video,
  X,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Wifi,
  Eye,
  Hash,
} from 'lucide-react';

interface CctvCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (camera: CctvCamera) => void;
  cameraToEdit: CctvCamera | null;
  initialPosition?: { x: number; y: number };
  existingCamerasCount: number;
}

const CAMERA_TYPES: { id: CctvCameraType; label: string; desc: string; defaultFov: number; defaultAlcance: number }[] = [
  { id: 'DOME', label: 'Dome (Teto/Interior)', desc: 'Ideal para frente de caixa, corredores e salão', defaultFov: 95, defaultAlcance: 12 },
  { id: 'BULLET', label: 'Bullet (Parede/Fachada)', desc: 'Foco direcional, estacionamento e entradas', defaultFov: 80, defaultAlcance: 20 },
  { id: 'SPEED_DOME_PTZ', label: 'Speed Dome / PTZ', desc: 'Giro 360° e zoom óptico motorizado', defaultFov: 65, defaultAlcance: 35 },
  { id: 'FISHEYE_360', label: '360° Fisheye / Olho de Peixe', desc: 'Visão panorâmica hemisférica sem ponto cego', defaultFov: 360, defaultAlcance: 10 },
  { id: 'VARIFOCAL', label: 'Varifocal Motorizada', desc: 'Ajuste dinâmico de lente e ângulo óptico', defaultFov: 75, defaultAlcance: 18 },
  { id: 'TERMICA', label: 'Térmica / Detecção Calor', desc: 'Monitoramento perimetral e câmaras frias', defaultFov: 50, defaultAlcance: 25 },
];

const RESOLUTIONS = [
  '2MP Full HD (1080p)',
  '3MP (2K)',
  '4MP Quad HD (1440p)',
  '5MP Super HD',
  '8MP 4K Ultra HD',
];

const TECHNOLOGIES: { id: CctvTechnology; label: string }[] = [
  { id: 'IP_POE', label: 'IP / Cabo de Rede PoE' },
  { id: 'HD_CVI', label: 'HD-CVI (Intelbras)' },
  { id: 'HD_TVI', label: 'HD-TVI (Hikvision)' },
  { id: 'AHD', label: 'AHD Analógico HD' },
  { id: 'WI_FI', label: 'Wi-Fi / Sem Fio' },
  { id: 'ANALOGICO', label: 'Analógico CVBS' },
];

const CONE_COLORS = [
  { label: 'Azul (Padrão)', value: '#3B82F6' },
  { label: 'Verde (Frente de Caixa)', value: '#10B981' },
  { label: 'Âmbar (Entradas / Portas)', value: '#F59E0B' },
  { label: 'Roxo (Açougue / Frios)', value: '#8B5CF6' },
  { label: 'Vermelho (Estoque / Cofre)', value: '#EF4444' },
  { label: 'Ciano (Corredores)', value: '#06B6D4' },
];

export const CctvCameraModal: React.FC<CctvCameraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cameraToEdit,
  initialPosition,
  existingCamerasCount,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<CctvCameraType>('DOME');
  const [tecnologia, setTecnologia] = useState<CctvTechnology>('IP_POE');
  const [resolucao, setResolucao] = useState('2MP Full HD (1080p)');
  const [marcaModelo, setMarcaModelo] = useState('Intelbras VHD 3230 B');
  const [lente, setLente] = useState('2.8mm');
  const [alcanceMetros, setAlcanceMetros] = useState(15);
  const [anguloAberturaGraus, setAnguloAberturaGraus] = useState(90);
  const [direcaoGraus, setDirecaoGraus] = useState(0);
  const [alturaInstalacao, setAlturaInstalacao] = useState(2.8);
  const [canalDvr, setCanalDvr] = useState<number | ''>('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState<CctvCameraStatus>('OPERACIONAL');
  const [corIdentificacao, setCorIdentificacao] = useState('#3B82F6');
  const [observacoes, setObservacoes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (cameraToEdit) {
      setCodigo(cameraToEdit.codigo);
      setNome(cameraToEdit.nome);
      setTipo(cameraToEdit.tipo);
      setTecnologia(cameraToEdit.tecnologia);
      setResolucao(cameraToEdit.resolucao);
      setMarcaModelo(cameraToEdit.marcaModelo);
      setLente(cameraToEdit.lente || '2.8mm');
      setAlcanceMetros(cameraToEdit.alcanceMetros);
      setAnguloAberturaGraus(cameraToEdit.anguloAberturaGraus);
      setDirecaoGraus(cameraToEdit.direcaoGraus);
      setAlturaInstalacao(cameraToEdit.alturaInstalacaoMetros || 2.8);
      setCanalDvr(cameraToEdit.canalDvr || '');
      setIpAddress(cameraToEdit.ipAddress || '');
      setStatus(cameraToEdit.status);
      setCorIdentificacao(cameraToEdit.corIdentificacao || '#3B82F6');
      setObservacoes(cameraToEdit.observacoes || '');
    } else {
      const nextNum = existingCamerasCount + 1;
      setCodigo(`CAM-${String(nextNum).padStart(2, '0')}`);
      setNome(`Câmera ${String(nextNum).padStart(2, '0')}`);
      setTipo('DOME');
      setTecnologia('IP_POE');
      setResolucao('2MP Full HD (1080p)');
      setMarcaModelo('Intelbras VHD 3230 B');
      setLente('2.8mm');
      setAlcanceMetros(12);
      setAnguloAberturaGraus(95);
      setDirecaoGraus(90);
      setAlturaInstalacao(2.8);
      setCanalDvr(nextNum <= 32 ? nextNum : '');
      setIpAddress(nextNum <= 50 ? `192.168.1.${100 + nextNum}` : '');
      setStatus('OPERACIONAL');
      setCorIdentificacao('#3B82F6');
      setObservacoes('');
    }
    setErrorMessage('');
  }, [cameraToEdit, existingCamerasCount, isOpen]);

  // Ao mudar o tipo de câmera, ajusta automaticamente valores de FOV e alcance sugeridos
  const handleTypeChange = (newType: CctvCameraType) => {
    setTipo(newType);
    const preset = CAMERA_TYPES.find((t) => t.id === newType);
    if (preset) {
      setAnguloAberturaGraus(preset.defaultFov);
      setAlcanceMetros(preset.defaultAlcance);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !codigo.trim()) {
      setErrorMessage('O código e a identificação da câmera são obrigatórios.');
      return;
    }

    const cameraPayload: CctvCamera = {
      id: cameraToEdit ? cameraToEdit.id : `cam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim(),
      tipo,
      tecnologia,
      resolucao,
      marcaModelo: marcaModelo.trim(),
      lente: lente.trim() || undefined,
      alcanceMetros: Number(alcanceMetros) || 12,
      anguloAberturaGraus: Number(anguloAberturaGraus) || 90,
      direcaoGraus: Number(direcaoGraus) || 0,
      posicaoX: cameraToEdit ? cameraToEdit.posicaoX : initialPosition?.x || 200,
      posicaoY: cameraToEdit ? cameraToEdit.posicaoY : initialPosition?.y || 200,
      alturaInstalacaoMetros: Number(alturaInstalacao) || 2.8,
      canalDvr: canalDvr ? Number(canalDvr) : undefined,
      ipAddress: ipAddress.trim() || undefined,
      status,
      corIdentificacao,
      observacoes: observacoes.trim() || undefined,
    };

    onSave(cameraPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {cameraToEdit ? `Editar Câmera (${cameraToEdit.codigo})` : 'Nova Câmera de Segurança'}
              </h3>
              <p className="text-xs text-slate-400">
                Parâmetros ópticos, ângulo de visão, canal DVR e especificações técnicas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seção 1: Identificação Básica */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Identificação & Localização na Loja
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código da Câmera <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex: CAM-01"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Posição na Loja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Frente de Caixa 01 / Entrada Principal"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Tipo de Câmera & Tecnologia */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Tipo e Formato Físico
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAMERA_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    tipo === t.id
                      ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 leading-tight">{t.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tecnologia</label>
                <select
                  value={tecnologia}
                  onChange={(e) => setTecnologia(e.target.value as CctvTechnology)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {TECHNOLOGIES.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolução</label>
                <select
                  value={resolucao}
                  onChange={(e) => setResolucao(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Operacional</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CctvCameraStatus)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="OPERACIONAL">🟢 Operacional (Ativa)</option>
                  <option value="PLANEJADA">🟡 Planejada (Futura)</option>
                  <option value="MANUTENCAO">🔴 Em Manutenção</option>
                  <option value="SUBSTITUICAO">⚪ Substituição</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Campo de Visão & Alcance Óptico (FOV) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                Campo de Visão (FOV) &amp; Direcionamento Gráfico
              </span>
              <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                {tipo === 'FISHEYE_360' ? '360° Panorâmico' : `${anguloAberturaGraus}° abertura | ${alcanceMetros}m alcance`}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Direção / Rotação (0 a 360°) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Direção (Giro):</span>
                  <span className="font-mono font-bold text-blue-600">{direcaoGraus}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={direcaoGraus}
                  onChange={(e) => setDirecaoGraus(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Norte (0°)</span>
                  <span>Leste (90°)</span>
                  <span>Sul (180°)</span>
                  <span>Oeste (270°)</span>
                </div>
              </div>

              {/* Ângulo de Abertura (FOV) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Abertura da Lente:</span>
                  <span className="font-mono font-bold text-blue-600">{anguloAberturaGraus}°</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="130"
                  step="5"
                  disabled={tipo === 'FISHEYE_360'}
                  value={anguloAberturaGraus}
                  onChange={(e) => setAnguloAberturaGraus(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer disabled:opacity-30"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Fechada (30°)</span>
                  <span>Normal (85°)</span>
                  <span>Ampla (120°)</span>
                </div>
              </div>

              {/* Alcance em Metros */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Alcance Efetivo:</span>
                  <span className="font-mono font-bold text-blue-600">{alcanceMetros} metros</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="45"
                  step="1"
                  value={alcanceMetros}
                  onChange={(e) => setAlcanceMetros(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Curto (5m)</span>
                  <span>Médio (20m)</span>
                  <span>Longo (45m)</span>
                </div>
              </div>
            </div>

            {/* Cor do Feixe / Cone */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-700">Cor do Cone de Cobertura:</span>
              <div className="flex items-center gap-1.5">
                {CONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setCorIdentificacao(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      corIdentificacao === c.value ? 'scale-125 border-slate-900 shadow-md ring-2 ring-white' : 'border-transparent hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Seção 4: Conexão, DVR e Rede */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              Canal Gravador (DVR/NVR) &amp; Rede
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Canal DVR/NVR</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={canalDvr}
                  onChange={(e) => setCanalDvr(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ex: 01"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço IP</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.101"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lente</label>
                <input
                  type="text"
                  value={lente}
                  onChange={(e) => setLente(e.target.value)}
                  placeholder="Ex: 2.8mm"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Altura Instalação</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.5"
                  max="12"
                  value={alturaInstalacao}
                  onChange={(e) => setAlturaInstalacao(Number(e.target.value))}
                  placeholder="2.8 metros"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marca &amp; Modelo</label>
                <input
                  type="text"
                  value={marcaModelo}
                  onChange={(e) => setMarcaModelo(e.target.value)}
                  placeholder="Ex: Intelbras VHD 3230 B"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas</label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Ponto com iluminação direta, requer WDR ativo"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {cameraToEdit ? 'Atualizar Câmera' : 'Adicionar ao Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
