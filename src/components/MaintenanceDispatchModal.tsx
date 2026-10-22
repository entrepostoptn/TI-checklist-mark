import React, { useState } from 'react';
import { MaintenanceRecord } from '../types/maintenance';
import { X, Truck, Calendar, User, Store, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MaintenanceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord | null;
  onConfirmDispatch: (id: string, data: { tecnicoRetirada: string; destinoLoja: string; dataHora?: string; observacoes?: string }) => void;
}

export const MaintenanceDispatchModal: React.FC<MaintenanceDispatchModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmDispatch,
}) => {
  const { user } = useAuth();
  const [tecnicoRetirada, setTecnicoRetirada] = useState(user?.nome || 'Renan Mendes');
  const [destinoLoja, setDestinoLoja] = useState(record?.lojaDestino || record?.lojaOrigem || '');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tecnicoRetirada.trim()) {
      setError('Por favor, informe o técnico responsável pela retirada.');
      return;
    }
    if (!destinoLoja.trim()) {
      setError('Informe a loja de destino.');
      return;
    }

    onConfirmDispatch(record.id, {
      tecnicoRetirada: tecnicoRetirada.trim(),
      destinoLoja: destinoLoja.trim(),
      dataHora: new Date(dataHora).toISOString(),
      observacoes: observacoes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Logística de Saída do Lab
              </span>
              <h2 className="text-base font-extrabold text-white">Registrar Retirada para Transporte</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Machine Summary */}
        <div className="bg-purple-50/70 p-3.5 border-b border-purple-100 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-slate-900">{record.equipamentoNome}</div>
            <div className="text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-purple-700">{record.numeroOs}</span>
              {record.patrimonio && <span>• Pat: <b>{record.patrimonio}</b></span>}
              {record.numeroSerie && <span>• SN: {record.numeroSerie}</span>}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            Testes OK
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Técnico que está Retirando *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={tecnicoRetirada}
                onChange={(e) => setTecnicoRetirada(e.target.value)}
                placeholder="Nome do técnico que fará o transporte"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Loja / Filial de Destino *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={destinoLoja}
                onChange={(e) => setDestinoLoja(e.target.value)}
                placeholder="Ex: Loja 01 Alphaville, Loja 02 Osasco..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Data e Horário da Retirada
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações do Despacho (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Embalado com plástico bolha, cabo de força e fonte externa acompanham o kit."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Retirada</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
