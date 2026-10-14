import React, { useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { isStepApplicable, isItemApplicable } from '../utils/checklistGenerator';
import { ChecklistItem } from './ChecklistItem';
import { MachineIdentificationCard } from './MachineIdentificationCard';
import { UTIL_MS_PROGRAMS } from '../constants/defaultConfig';
import {
  CheckCheck,
  Printer,
  Sparkles,
  HardDrive,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const AllStepsView: React.FC = () => {
  const {
    steps,
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

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Modo Visão Contínua
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            Todas as Etapas do Checklist
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Rolar e marcar tarefas sem trocar de aba. As etapas não aplicáveis ao tipo{' '}
            <span className="font-semibold text-white">({machine.tipo === 'PDV' ? 'PDV' : 'Escritório'})</span> estão ocultas automaticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('summary')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto shrink-0"
        >
          Ir para Resumo
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Machine Data */}
      <MachineIdentificationCard />

      {/* Steps loop */}
      {steps.map((step) => {
        if (step.id === 'step_identificacao') return null;
        const isApplicable = isStepApplicable(step, machine);
        if (!isApplicable) return null;

        let stepTotal = 0;
        let stepDone = 0;
        const countItem = (item: any) => {
          if (isItemApplicable(item, machine)) {
            stepTotal++;
            if (itemsState[item.id]) stepDone++;
          }
        };
        step.items.forEach(countItem);
        step.subsections?.forEach((sub) => sub.items.forEach(countItem));
        const isAllStepDone = stepTotal > 0 && stepDone === stepTotal;

        return (
          <section
            key={step.id}
            id={step.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6"
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                    Etapa {step.number}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {step.title}
                  </h3>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {stepDone}/{stepTotal}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {step.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => markStepAll(step.id, !isAllStepDone)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all self-start sm:self-auto shrink-0 ${
                  isAllStepDone
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {isAllStepDone ? 'Desmarcar Todas' : 'Concluir Etapa'}
              </button>
            </div>

            {/* Special box for UTIL MS */}
            {step.id === 'step_util_ms' && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    Conteúdo recomendado para {config.pastaUtilMs}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`cmd.exe /c mkdir "${config.pastaUtilMs}"`);
                      setCopiedUtil(true);
                      setTimeout(() => setCopiedUtil(false), 2000);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded font-mono transition-colors ${
                      copiedUtil ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    {copiedUtil ? 'Copiado!' : 'Copiar mkdir'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {UTIL_MS_PROGRAMS.map((prog, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span>{prog.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special box for Impressora */}
            {step.id === 'step_impressora' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                <Printer className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Padrão da empresa: <strong>{config.impressoraPadrao}</strong> (modelos térmicos TM-T20 / TM-T20X).
                </span>
              </div>
            )}

            {/* Special box for Teste Final */}
            {step.id === 'step_teste_final' && (
              <div className="p-3.5 rounded-xl bg-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Sincronizar testes finais com as tarefas já concluídas das etapas anteriores.</span>
                </div>
                <button
                  type="button"
                  onClick={syncFinalTestFromSteps}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shrink-0 self-start sm:self-auto"
                >
                  Sincronizar Testes
                </button>
              </div>
            )}

            {/* Step Direct Items */}
            {step.items.length > 0 && (
              <div className="space-y-2.5">
                {step.items
                  .filter((it) => isItemApplicable(it, machine))
                  .map((it) => (
                    <ChecklistItem key={it.id} item={it} />
                  ))}
              </div>
            )}

            {/* Subsections if any */}
            {step.subsections && step.subsections.length > 0 && (
              <div className="space-y-4 pt-2">
                {step.subsections.map((sub) => (
                  <div key={sub.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          {sub.code}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                          {sub.title}
                        </h4>
                      </div>
                      {sub.badge && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {sub.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 space-y-2">
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

            {/* Step Observation */}
            <div className="pt-2">
              <input
                type="text"
                value={stepNotes[step.id] || ''}
                onChange={(e) => setStepNote(step.id, e.target.value)}
                placeholder={`Observação para ${step.shortTitle} (opcional)...`}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 text-slate-700"
              />
            </div>
          </section>
        );
      })}

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => setViewMode('summary')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          Ver Resumo Geral do Atendimento
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
