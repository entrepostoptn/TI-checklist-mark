import React, { useState } from 'react';
import { ChecklistItem as ItemType } from '../types/checklist';
import { useChecklist } from '../context/ChecklistContext';
import { Check, Copy, CheckCheck, Terminal } from 'lucide-react';

interface ChecklistItemProps {
  item: ItemType;
  showCategoryBadge?: string;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, showCategoryBadge }) => {
  const { itemsState, toggleItem } = useChecklist();
  const isChecked = Boolean(itemsState[item.id]);
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.commandToCopy) return;

    navigator.clipboard.writeText(item.commandToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={() => toggleItem(item.id)}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
        isChecked
          ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
          : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Big Touch-Friendly Checkbox */}
      <div className="pt-0.5 shrink-0">
        <div
          role="checkbox"
          aria-checked={isChecked}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 font-bold ${
            isChecked
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/20'
              : 'border-2 border-slate-300 group-hover:border-blue-500 bg-white text-transparent group-hover:bg-blue-50/50'
          }`}
        >
          <Check className={`w-4 h-4 stroke-[3] transition-transform ${isChecked ? 'scale-100' : 'scale-50'}`} />
        </div>
      </div>

      {/* Item Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {showCategoryBadge && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {showCategoryBadge}
              </span>
            )}
            <h4
              className={`text-sm sm:text-base font-semibold tracking-tight transition-colors ${
                isChecked ? 'text-emerald-950 font-bold' : 'text-slate-800'
              }`}
            >
              {item.label}
            </h4>
          </div>

          {isChecked && (
            <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              Feito
            </span>
          )}
        </div>

        {item.sublabel && (
          <p
            className={`text-xs sm:text-sm mt-1 transition-colors leading-relaxed ${
              isChecked ? 'text-emerald-800/80' : 'text-slate-600'
            }`}
          >
            {item.sublabel}
          </p>
        )}

        {item.commandToCopy && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleCopyCommand}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-mono border transition-all ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title="Copiar comando rápido"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-sans font-medium text-[11px]">Copiado!</span>
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[220px] sm:max-w-md">{item.commandToCopy}</span>
                  <Copy className="w-3 h-3 text-slate-400 ml-1" />
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Clique para copiar comando)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
