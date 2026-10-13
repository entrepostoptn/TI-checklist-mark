import React from 'react';
import { ServiceOrder, STATUS_LABELS } from '../types/serviceOrder';
import { X, Printer, Store, Laptop, Calendar, User, Hash, Wrench, ShieldCheck } from 'lucide-react';

interface ServiceOrderPrintBadgeProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export const ServiceOrderPrintBadge: React.FC<ServiceOrderPrintBadgeProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusInfo = STATUS_LABELS[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Topbar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Etiqueta de Identificação do Gabinete</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto">
          <div className="border-2 border-dashed border-slate-400 p-5 rounded-2xl bg-white text-slate-900 space-y-4 shadow-xs print:border-black print:p-2 print:shadow-none">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm print:bg-black">
                  TI
                </span>
                <div>
                  <h4 className="font-extrabold text-base leading-tight tracking-tight">
                    ORDEM DE SERVIÇO DE TI
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    CONTROLE DE EQUIPAMENTO
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xl font-black text-blue-700 print:text-black">
                  {order.numeroOs}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {order.dataEntrada}
                </span>
              </div>
            </div>

            {/* Prominent Machine & Status Tag */}
            <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200 print:bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Identificação da Máquina
                </span>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {order.identificacao}
                </span>
                {order.patrimonio && (
                  <span className="text-xs text-slate-600 block font-mono">
                    Patrimônio: {order.patrimonio}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-900 text-white print:border print:border-black">
                  {statusInfo.label}
                </span>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  Tipo: {order.tipo === 'PDV' ? 'PDV / Caixa' : 'Escritório'}
                </span>
              </div>
            </div>

            {/* Machine Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Loja de Origem
                </span>
                <span className="font-bold text-slate-800">{order.lojaOrigem}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Técnico Responsável
                </span>
                <span className="font-bold text-slate-800">
                  {order.tecnicoResponsavel || 'Não atribuído'}
                </span>
              </div>
            </div>

            {/* Problem & Services */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Defeito Relatado / Motivo
                </span>
                <p className="font-medium text-slate-800 mt-0.5 leading-snug">
                  {order.defeitoRelatado || 'Revisão e manutenção geral'}
                </p>
              </div>

              {order.servicosExecutados && (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-emerald-50/40">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">
                    Serviços / Peças Trocadas
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5 leading-snug">
                    {order.servicosExecutados}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist Sign-off line */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Checklist Operacional: {order.checklistConcluido ? 'HOMOLOGADO (100%)' : 'EM REVISÃO'}
              </span>
              <span>Assinatura do Técnico: ________________</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Dica: Cole esta etiqueta na lateral do gabinete no escritório.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Etiqueta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
