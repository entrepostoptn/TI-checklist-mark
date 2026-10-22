import React, { useState } from 'react';
import { MaintenanceRecord } from '../types/maintenance';
import { X, CheckCircle2, Calendar, User, Store, AlertCircle, FileCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MaintenanceDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord | null;
  onConfirmDelivery: (id: string, data: { tecnicoEntrega: string; responsavelLoja: string; dataHora?: string; observacoes?: string }) => void;
}

export const MaintenanceDeliveryModal: React.FC<MaintenanceDeliveryModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmDelivery,
}) => {
  const { user } = useAuth();
  const [tecnicoEntrega, setTecnicoEntrega] = useState(record?.tecnicoRetirada || user?.nome || 'Renan Mendes');
  const [responsavelLoja, setResponsavelLoja] = useState('');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [observacoes, setObservacoes] = useState('');
  const [testeNoLocalOk, setTesteNoLocalOk] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tecnicoEntrega.trim()) {
      setError('Por favor, informe o técnico que realizou a entrega.');
      return;
    }
    if (!responsavelLoja.trim()) {
      setError('Por favor, informe o nome e cargo de quem recebeu o equipamento na loja.');
      return;
    }

    onConfirmDelivery(record.id, {
      tecnicoEntrega: tecnicoEntrega.trim(),
      responsavelLoja: responsavelLoja.trim(),
      dataHora: new Date(dataHora).toISOString(),
      observacoes: `${observacoes.trim()}${testeNoLocalOk ? ' [Teste no local aprovado]' : ''}`.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Finalização de Atendimento
              </span>
              <h2 className="text-base font-extrabold text-white">Confirmar Entrega na Loja</h2>
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
        <div className="bg-emerald-50/70 p-3.5 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-slate-900">{record.equipamentoNome}</div>
            <div className="text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-emerald-700">{record.numeroOs}</span>
              <span>• Destino: <b>{record.destinoEnvio || record.lojaDestino || record.lojaOrigem}</b></span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
            Em Trânsito
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
              Técnico que Entregou / Instalou *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={tecnicoEntrega}
                onChange={(e) => setTecnicoEntrega(e.target.value)}
                placeholder="Nome do técnico que realizou a entrega física"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Responsável que Recebeu na Loja *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={responsavelLoja}
                onChange={(e) => setResponsavelLoja(e.target.value)}
                placeholder="Ex: Carlos (Gerente de Loja), Marcos (Operador de Caixa)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Data e Horário da Entrega
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={testeNoLocalOk}
              onChange={(e) => setTesteNoLocalOk(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold text-slate-700">
              Equipamento ligado e testado em funcionamento no local da loja (Sem erros)
            </span>
          </label>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações da Entrega / Protocolo (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Conectado na rede, IP fixado 192.168.10.15, impresso comprovante de teste com o operador."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
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
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Finalizar OS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
