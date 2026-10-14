import React, { useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { isStepApplicable, isItemApplicable } from '../utils/checklistGenerator';
import { ChecklistItem } from './ChecklistItem';
import { MachineIdentificationCard } from './MachineIdentificationCard';
import { UTIL_MS_PROGRAMS } from '../constants/defaultConfig';
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Printer,
  Sparkles,
  MessageSquare,
  AlertCircle,
  HardDrive,
  Terminal,
} from 'lucide-react';

export const StepContent: React.FC = () => {
  const {
    steps,
    currentStepIndex,
    nextStep,
    prevStep,
    machine,
    config,
    itemsState,
    markStepAll,
    stepNotes,
    setStepNote,
    syncFinalTestFromSteps,
    setViewMode,
  } = useChecklist();

  const [copiedUtil, setCopiedUtil] = useState(false);

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const isApplicable = isStepApplicable(currentStep, machine);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  let stepTotal = 0;
  let stepDone = 0;
  const countItem = (item: any) => {
    if (isItemApplicable(item, machine)) {
      stepTotal++;
      if (itemsState[item.id]) stepDone++;
    }
  };
  currentStep.items.forEach(countItem);
  currentStep.subsections?.forEach((sub) => sub.items.forEach(countItem));
  const isAllStepDone = stepTotal > 0 && stepDone === stepTotal;

  return (
    <div className="space-y-6">
      {/* Step Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                Etapa {currentStep.number} de {steps.length}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentStep.title}
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {currentStep.description}
            </p>
          </div>

          {isApplicable && stepTotal > 0 && (
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => markStepAll(currentStep.id, !isAllStepDone)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  isAllStepDone
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                {isAllStepDone ? 'Desmarcar Todas' : 'Concluir Etapa'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Special Content: Step 1 */}
      {currentStep.id === 'step_identificacao' && (
        <MachineIdentificationCard />
      )}

      {/* Not Applicable Notice */}
      {!isApplicable ? (
        <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">
            Etapa Não Aplicável para esta Máquina
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Esta etapa foi dispensada porque a máquina está configurada como{' '}
            <strong className="text-slate-700 font-semibold">
              {machine.tipo === 'PDV' ? 'PDV / Frente de Caixa' : 'Escritório'}
            </strong>
            {!machine.utilizaImpressor && currentStep.id === 'step_impressor' ? ' e a opção Impressor está desligada' : ''}.
          </p>
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
          >
            Avançar para a próxima etapa
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          {/* Step 4 (UTIL MS) */}
          {currentStep.id === 'step_util_ms' && (
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Estrutura da Pasta {config.pastaUtilMs}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Centralize todos os utilitários de suporte e instaladores neste diretório.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`cmd.exe /c mkdir "${config.pastaUtilMs}"`);
                    setCopiedUtil(true);
                    setTimeout(() => setCopiedUtil(false), 2000);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg shadow-xs transition-colors ${
                    copiedUtil ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {copiedUtil ? 'Copiado!' : 'Copiar mkdir'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {UTIL_MS_PROGRAMS.map((prog, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-semibold">{prog.name}</strong>
                      <p className="text-[11px] text-slate-400">{prog.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 (Impressora) */}
          {currentStep.id === 'step_impressora' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900">
              <Printer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Padrão da Empresa: {config.impressoraPadrao}</span>
                <p className="text-amber-800/90 mt-0.5">
                  A impressora mais utilizada como padrão de lojas é <strong>{config.impressoraPadrao}</strong> (modelos térmicos TM-T20X / TM-T20).
                </p>
              </div>
            </div>
          )}

          {/* Step 9 (Teste Final) */}
          {currentStep.id === 'step_teste_final' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white border border-blue-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <h4 className="text-sm font-bold tracking-tight">
                    Sincronizador Automático de Homologação
                  </h4>
                </div>
                <p className="text-xs text-blue-200 max-w-xl">
                  Clique abaixo para validar os testes correspondentes em lote com base nas etapas anteriores concluídas.
                </p>
              </div>
              <button
                type="button"
                onClick={syncFinalTestFromSteps}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Sincronizar com Etapas Concluídas
              </button>
            </div>
          )}

          {/* Direct Items List */}
          {currentStep.items.length > 0 && (
            <div className="space-y-3">
              {currentStep.items
                .filter((item) => isItemApplicable(item, machine))
                .map((item) => (
                  <ChecklistItem key={item.id} item={item} />
                ))}
            </div>
          )}

          {/* Subsections (e.g. MGV 6.1 a 6.8) */}
          {currentStep.subsections && currentStep.subsections.length > 0 && (
            <div className="space-y-6 pt-2">
              {currentStep.subsections.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  <div className="bg-slate-50/90 px-4 sm:px-6 py-3 border-b border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                        {sub.code}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">
                        {sub.title}
                      </h3>
                    </div>
                    {sub.badge && (
                      <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {sub.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    {sub.items
                      .filter((it) => isItemApplicable(it, machine))
                      .map((it) => (
                        <ChecklistItem key={it.id} item={it} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step Observations Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Observações / Ocorrências desta etapa (Opcional)
            </label>
            <textarea
              rows={2}
              value={stepNotes[currentStep.id] || ''}
              onChange={(e) => setStepNote(currentStep.id, e.target.value)}
              placeholder="Ex: Driver instalado via pendrive; IP da balança respondeu com 2ms; etc."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-800"
            />
          </div>
        </>
      )}

      {/* Step Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={isFirstStep}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            isFirstStep
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          {isLastStep ? (
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Ver Resumo Final
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Próxima Etapa
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
