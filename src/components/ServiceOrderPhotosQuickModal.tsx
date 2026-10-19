import React, { useState } from 'react';
import { ServiceOrder } from '../types/serviceOrder';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { ServiceOrderPhotoUpload } from './ServiceOrderPhotoUpload';
import { X, Camera, Save, CheckCircle2 } from 'lucide-react';

interface ServiceOrderPhotosQuickModalProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceOrderPhotosQuickModal: React.FC<ServiceOrderPhotosQuickModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { updateOrder } = useServiceOrders();

  const [fotoAbertura, setFotoAbertura] = useState<string | undefined>(order?.fotoAbertura);
  const [fotoFechamento, setFotoFechamento] = useState<string | undefined>(order?.fotoFechamento);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Sync when order changes
  React.useEffect(() => {
    if (order) {
      setFotoAbertura(order.fotoAbertura);
      setFotoFechamento(order.fotoFechamento);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = () => {
    updateOrder(order.id, {
      fotoAbertura,
      fotoFechamento,
    });
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3 border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Evidências Fotográficas da OS
                </h3>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {order.numeroOs}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.identificacao} — {order.lojaNome || order.lojaOrigem}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast confirmation */}
        {isSavedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Fotos da OS salvas com sucesso no banco de dados!</span>
          </div>
        )}

        {/* Scrollable Photos Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            Adicione ou atualize as fotos de <strong>Abertura</strong> (ao iniciar o atendimento/receber a máquina) e de <strong>Fechamento</strong> (com o equipamento consertado ou em pleno funcionamento). As fotos são otimizadas e sincronizadas automaticamente.
          </p>

          <ServiceOrderPhotoUpload
            fotoAbertura={fotoAbertura}
            onChangeFotoAbertura={setFotoAbertura}
            fotoFechamento={fotoFechamento}
            onChangeFotoFechamento={setFotoFechamento}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Fotos da OS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
