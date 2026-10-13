import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { isStepApplicable, isItemApplicable } from '../utils/checklistGenerator';
import { Check } from 'lucide-react';

export const StepNavigation: React.FC = () => {
  const {
    steps,
    currentStepIndex,
    setCurrentStepIndex,
    itemsState,
    machine,
    setViewMode,
  } = useChecklist();

  return (
    <nav className="bg-white border-b border-slate-200/80 sticky top-[73px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center overflow-x-auto no-scrollbar py-2 gap-1.5 scroll-smooth">
          {steps.map((step, index) => {
            const isApplicable = isStepApplicable(step, machine);
            const isCurrent = currentStepIndex === index;

            let stepTotal = 0;
            let stepDone = 0;

            if (isApplicable) {
              const checkIt = (it: any) => {
                if (isItemApplicable(it, machine)) {
                  stepTotal++;
                  if (itemsState[it.id]) stepDone++;
                }
              };

              step.items.forEach(checkIt);
              step.subsections?.forEach((sub) => sub.items.forEach(checkIt));
            }

            const isStepComplete = isApplicable && stepTotal > 0 && stepDone === stepTotal;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(index);
                  setViewMode('step');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                    : isStepComplete
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/80'
                    : !isApplicable
                    ? 'bg-slate-100 text-slate-400 opacity-60 cursor-pointer'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isStepComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isStepComplete ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                </span>

                <span>{step.shortTitle}</span>

                {!isApplicable ? (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">
                    N/A
                  </span>
                ) : (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                      isCurrent
                        ? 'bg-blue-700/80 text-blue-100'
                        : isStepComplete
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {stepDone}/{stepTotal}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
