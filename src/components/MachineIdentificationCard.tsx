import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { MachineType } from '../types/checklist';
import {
  Store,
  Laptop,
  Calendar,
  User,
  Hash,
  Printer,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const MachineIdentificationCard: React.FC = () => {
  const { machine, updateMachine } = useChecklist();

  const handleTypeSelect = (tipo: MachineType) => {
    updateMachine({ tipo });
  };

  const isFormValid =
    Boolean(machine.identificacao.trim()) &&
    Boolean(machine.loja.trim()) &&
    Boolean(machine.tecnico.trim()) &&
    Boolean(machine.data.trim());

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dados da Máquina & Operação</span>
            {isFormValid && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Preenchido
              </span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Preencha a identificação antes de iniciar as tarefas de formatação e homologação.
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Etapa Obrigatória</span>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Machine ID */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-600" />
            Número / ID da Máquina <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={machine.identificacao}
            onChange={(e) => updateMachine({ identificacao: e.target.value })}
            placeholder="Ex: PDV-01 ou EST-03"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium text-slate-900 text-sm transition-all"
          />
        </div>

        {/* Loja */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            Loja / Unidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={machine.loja}
            onChange={(e) => updateMachine({ loja: e.target.value })}
            placeholder="Ex: Loja 01 - Centro"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium text-slate-900 text-sm transition-all"
          />
        </div>

        {/* Técnico */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Técnico Responsável <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={machine.tecnico}
            onChange={(e) => updateMachine({ tecnico: e.target.value })}
            placeholder="Ex: Carlos Silva"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium text-slate-900 text-sm transition-all"
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Data do Atendimento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={machine.data}
            onChange={(e) => updateMachine({ data: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium text-slate-900 text-sm transition-all"
          />
        </div>
      </div>

      {/* Machine Type Selection (PDV vs Escritório) */}
      <div className="pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Tipo de Máquina <span className="text-red-500">*</span>
          <span className="font-normal text-slate-400 lowercase ml-1">
            (define as etapas aplicáveis do checklist)
          </span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card PDV */}
          <div
            onClick={() => handleTypeSelect('PDV')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
              machine.tipo === 'PDV'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${
                machine.tipo === 'PDV' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">PDV / Frente de Caixa</span>
                {machine.tipo === 'PDV' && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Selecionado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Terminal de frente de caixa para vendas. <strong className="text-slate-800">Não exige pacote Office</strong>. Habilita etapas do Full PDV.
              </p>
            </div>
          </div>

          {/* Card Escritório */}
          <div
            onClick={() => handleTypeSelect('ESCRITORIO')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
              machine.tipo === 'ESCRITORIO'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${
                machine.tipo === 'ESCRITORIO' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Laptop className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">Escritório / Administrativo</span>
                {machine.tipo === 'ESCRITORIO' && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    Selecionado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Estação de trabalho administrativa ou gerência. <strong className="text-slate-800">Exige verificação de Microsoft Office</strong> (Word/Excel).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Periférico extra: Impressor */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
            <Printer className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800">
              Esta máquina utiliza Impressor?
            </span>
            <p className="text-xs text-slate-500">
              Quando desativado, oculta as etapas do módulo Impressor do checklist.
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={machine.utilizaImpressor}
            onChange={(e) => updateMachine({ utilizaImpressor: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};
