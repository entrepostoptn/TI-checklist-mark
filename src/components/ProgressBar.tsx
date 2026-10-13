import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

export const ProgressBar: React.FC = () => {
  const {
    progressPercent,
    completedTasks,
    pendingTasks,
    totalTasks,
    status,
    uncompletedItemsList,
    setCurrentStepIndex,
    setViewMode,
  } = useChecklist();

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main indicators */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {progressPercent}%
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Progresso
              </span>
            </div>

            {/* Counters */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm">{completedTasks}</span>
                <span className="font-medium text-emerald-700">concluídas</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-sm">{pendingTasks}</span>
                <span className="font-medium text-amber-700">pendentes</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-slate-800">{totalTasks} etapas</span>
              </div>
            </div>
          </div>

          {/* Status pill & remaining notice */}
          <div className="flex items-center gap-2">
            {status === 'Concluído' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Todas as etapas validadas!
              </div>
            ) : pendingTasks > 0 && completedTasks > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (uncompletedItemsList.length > 0) {
                    setCurrentStepIndex(uncompletedItemsList[0].stepIndex);
                    setViewMode('step');
                  }
                }}
                className="group flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/90 hover:bg-amber-200/90 px-3 py-1.5 rounded-lg transition-colors border border-amber-300 text-left"
                title="Pular para primeira pendência"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[240px]">
                  Próxima pendência: <strong>{uncompletedItemsList[0]?.itemLabel}</strong>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden border border-slate-200/60 shadow-inner">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
