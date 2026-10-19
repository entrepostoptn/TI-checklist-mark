import React, { useState, useEffect } from 'react';
import {
  CctvInfrastructureEquipment,
  CctvInfraType,
} from '../types/cctv';
import {
  Server,
  X,
  HardDrive,
  Tv,
  Network,
  Cpu,
  BatteryCharging,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CctvInfraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equip: CctvInfrastructureEquipment) => void;
  equipToEdit: CctvInfrastructureEquipment | null;
  initialPosition?: { x: number; y: number };
}

const INFRA_TYPES: { id: CctvInfraType; label: string; icon: any; defaultDesc: string }[] = [
  { id: 'DVR_NVR', label: 'DVR / NVR (Gravador)', icon: HardDrive, defaultDesc: 'Gravador Central 32 Canais - HD 4TB WD Purple' },
  { id: 'RACK_TI', label: 'Rack de TI / Bastidor', icon: Server, defaultDesc: 'Rack 12U Fechado com Chave' },
  { id: 'MONITOR_TV', label: 'Monitor / TV Vigilância', icon: Tv, defaultDesc: 'Monitor 32" HDMI Frente de Loja / Gerência' },
  { id: 'SWITCH_POE', label: 'Switch PoE', icon: Network, defaultDesc: 'Switch Gigabit 16 Portas PoE+ 250W' },
  { id: 'PONTO_REDE', label: 'Ponto de Rede / Patch', icon: Network, defaultDesc: 'Ponto RJ45 Cat6 Conector Fêmea' },
  { id: 'NOBREAK', label: 'Nobreak / UPS', icon: BatteryCharging, defaultDesc: 'Nobreak Senoidal 1500VA Autonomia 2h' },
  { id: 'CAIXA_PASSAGEM', label: 'Caixa de Passagem', icon: Layers, defaultDesc: 'Caixa VBOX Hermética IP66' },
];

export const CctvInfraModal: React.FC<CctvInfraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipToEdit,
  initialPosition,
}) => {
  const [tipo, setTipo] = useState<CctvInfraType>('DVR_NVR');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [modelo, setModelo] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (equipToEdit) {
      setTipo(equipToEdit.tipo);
      setCodigo(equipToEdit.codigo);
      setNome(equipToEdit.nome);
      setModelo(equipToEdit.modelo || '');
      setEspecificacao(equipToEdit.especificacao || '');
      setIpAddress(equipToEdit.ipAddress || '');
      setObservacoes(equipToEdit.observacoes || '');
    } else {
      setTipo('DVR_NVR');
      setCodigo('NVR-01');
      setNome('NVR Principal 32ch');
      setModelo('Intelbras NVD 7132');
      setEspecificacao('32 Canais 4K / 2x HD 8TB Purple');
      setIpAddress('192.168.1.200');
      setObservacoes('');
    }
    setErrorMessage('');
  }, [equipToEdit, isOpen]);

  const handleTypeSelect = (newType: CctvInfraType) => {
    setTipo(newType);
    const item = INFRA_TYPES.find((t) => t.id === newType);
    if (item && !equipToEdit) {
      const prefix = newType === 'DVR_NVR' ? 'NVR' : newType === 'RACK_TI' ? 'RACK' : newType === 'SWITCH_POE' ? 'SW' : 'EQ';
      setCodigo(`${prefix}-01`);
      setNome(item.label);
      setEspecificacao(item.defaultDesc);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !codigo.trim()) {
      setErrorMessage('Informe o código e o nome do equipamento.');
      return;
    }

    const payload: CctvInfrastructureEquipment = {
      id: equipToEdit ? equipToEdit.id : `infra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim(),
      tipo,
      posicaoX: equipToEdit ? equipToEdit.posicaoX : initialPosition?.x || 250,
      posicaoY: equipToEdit ? equipToEdit.posicaoY : initialPosition?.y || 250,
      modelo: modelo.trim() || undefined,
      especificacao: especificacao.trim() || undefined,
      ipAddress: ipAddress.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {equipToEdit ? `Editar Equipamento (${equipToEdit.codigo})` : 'Novo Equipamento de Infraestrutura'}
              </h3>
              <p className="text-xs text-slate-400">Gravador NVR/DVR, Racks, Monitores e Rede</p>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tipo de Equipamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Equipamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INFRA_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeSelect(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      tipo === t.id
                        ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${tipo === t.id ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs text-slate-800 leading-tight truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: NVR-01"
                className="w-full text-xs font-bold font-mono px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificação do Equipamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gravador NVR Frente de Caixa"
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo / Fabricante</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Intelbras NVD 7132"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço IP / Porta</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.200"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Especificações &amp; Capacidade</label>
            <input
              type="text"
              value={especificacao}
              onChange={(e) => setEspecificacao(e.target.value)}
              placeholder="Ex: 32 Canais / 4TB HD / 16p PoE / 2x HDMI"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas</label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Ponto de monitoramento exclusivo da gerência"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {equipToEdit ? 'Atualizar Equipamento' : 'Posicionar no Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
