import React, { useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { isStepApplicable, isItemApplicable } from '../utils/checklistGenerator';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  CheckCheck,
  Save,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  MessageSquare,
} from 'lucide-react';

export const FinalSummary: React.FC = () => {
  const {
    machine,
    config,
    steps,
    itemsState,
    stepNotes,
    finalObservations,
    setFinalObservations,
    progressPercent,
    completedTasks,
    totalTasks,
    status,
    canMarkAsFinished,
    uncompletedItemsList,
    setCurrentStepIndex,
    setViewMode,
    saveCurrentChecklist,
    resetChecklist,
    showToast,
  } = useChecklist();

  const [copiedText, setCopiedText] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleSave = () => {
    saveCurrentChecklist();
    setHasSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePlainTextSummary = () => {
    const lines = [
      `=========================================`,
      `RELATÓRIO OPERACIONAL DE TI - FORMATAÇÃO`,
      `=========================================`,
      `Máquina: ${machine.identificacao || 'Não informada'}`,
      `Tipo: ${machine.tipo === 'PDV' ? 'PDV / Frente de Caixa' : 'Escritório'}`,
      `Loja: ${machine.loja || 'Não informada'}`,
      `Técnico: ${machine.tecnico || 'Não informado'}`,
      `Data: ${machine.data}`,
      `Status: ${status.toUpperCase()} (${progressPercent}% - ${completedTasks}/${totalTasks} concluídas)`,
      `-----------------------------------------`,
      `PARÂMETROS APLICADOS:`,
      `- Balança: ${config.balancaNumero} (IP: ${config.balancaIp})`,
      `- Departamento: ${config.departamentoNumero} - ${config.departamentoNome}`,
      `- Etiqueta: ${config.etiquetaCodigo} (${config.etiquetaTamanho})`,
      `- Pastas: ${config.pastaUtilMs} | ${config.pastaCarga}`,
      `- Impressora Padrão: ${config.impressoraPadrao}`,
      `- Módulo Impressor: ${machine.utilizaImpressor ? 'Ativo' : 'Não utilizado'}`,
      `-----------------------------------------`,
      `ETAPAS CONCLUÍDAS:`,
    ];

    steps.forEach((step) => {
      if (!isStepApplicable(step, machine)) return;

      const collect = (it: any) => {
        if (!isItemApplicable(it, machine)) return;
        const done = Boolean(itemsState[it.id]);
        lines.push(`  [${done ? 'X' : ' '}] ${it.label}`);
      };

      lines.push(`\n[${step.shortTitle}]`);
      step.items.forEach(collect);
      step.subsections?.forEach((sub) => {
        sub.items.forEach(collect);
      });

      if (stepNotes[step.id]) {
        lines.push(`  * Obs: ${stepNotes[step.id]}`);
      }
    });

    if (finalObservations) {
      lines.push(`\nOBSERVAÇÕES FINAIS:`);
      lines.push(finalObservations);
    }

    lines.push(`=========================================`);
    lines.push(`Atendimento conferido por: ${machine.tecnico || 'Técnico Responsável'}`);
    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);

    return lines.join('\n');
  };

  const handleCopyText = () => {
    const text = generatePlainTextSummary();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      showToast('Relatório copiado para a área de transferência!');
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title & Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Fechamento do Atendimento
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Resumo Geral do Checklist
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Revise o status de todas as tarefas, adicione observações finais e emita o comprovante de homologação.
            </p>
          </div>

          <div className="self-start sm:self-auto">
            {status === 'Concluído' ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                Atendimento Concluído (100%)
              </div>
            ) : status === 'Em andamento' ? (
              <div className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-amber-500/20">
                <Clock className="w-5 h-5" />
                Em Andamento ({progressPercent}%)
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-slate-600 text-white font-extrabold text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pendente (0%)
              </div>
            )}
          </div>
        </div>

        {/* Machine Meta Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Máquina</span>
            <span className="text-slate-900 font-bold text-sm">
              {machine.identificacao || 'Não informada'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Tipo</span>
            <span className="text-slate-900 font-bold text-sm">
              {machine.tipo === 'PDV' ? 'PDV / Caixa' : 'Escritório'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Loja</span>
            <span className="text-slate-900 font-bold text-sm">
              {machine.loja || 'Não informada'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Técnico</span>
            <span className="text-slate-900 font-bold text-sm">
              {machine.tecnico || 'Não informado'}
            </span>
          </div>
        </div>
      </div>

      {/* STRICT VALIDATION ALERT IF NOT COMPLETED */}
      {!canMarkAsFinished && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-amber-950">
                Atenção: Não é permitido marcar como "Concluído" enquanto houver etapas pendentes!
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                Todas as tarefas obrigatórias aplicáveis a esta máquina devem estar marcadas como concluídas para validar a homologação.
              </p>
            </div>
          </div>

          {/* Pending items list */}
          {uncompletedItemsList.length > 0 && (
            <div className="bg-white/80 rounded-xl p-4 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 pb-1 border-b border-amber-100">
                <span>Tarefas pendentes para conclusão ({uncompletedItemsList.length}):</span>
                <span>Clique para ir à etapa</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {uncompletedItemsList.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(item.stepIndex);
                      setViewMode('step');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-100/50 hover:bg-amber-100 text-left text-xs text-amber-950 transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                      <span className="font-semibold text-amber-800 shrink-0">
                        [{item.stepTitle}]
                      </span>
                      <span className="truncate">{item.itemLabel}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!machine.identificacao.trim() || !machine.loja.trim() || !machine.tecnico.trim()) && (
            <div className="text-xs text-red-700 bg-red-100/80 p-3 rounded-lg border border-red-200">
              <strong>Atenção aos dados cadastrais:</strong> Certifique-se de preencher a Identificação da Máquina, Loja e Nome do Técnico na Etapa 1.
            </div>
          )}
        </div>
      )}

      {/* FINAL OBSERVATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Parecer Técnico / Observações Finais do Atendimento
        </label>
        <textarea
          rows={4}
          value={finalObservations}
          onChange={(e) => setFinalObservations(e.target.value)}
          placeholder="Descreva detalhes específicos da máquina: troca de peça, IP estático atribuído, número de patrimônio da balança, data de agendamento de entrega, etc."
          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-800"
        />
      </div>

      {/* DETAILED CHECKLIST AUDIT LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            Conferência Detalhada de Todas as Etapas
          </h3>
          <span className="text-xs font-semibold text-slate-600">
            {completedTasks} de {totalTasks} validadas
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {steps.map((step) => {
            const isApplicable = isStepApplicable(step, machine);
            if (!isApplicable) return null;

            return (
              <div key={step.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {step.number}
                    </span>
                    {step.title}
                  </h4>
                  {stepNotes[step.id] && (
                    <span className="text-[11px] text-blue-600 italic">
                      Obs: {stepNotes[step.id]}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                  {step.items
                    .filter((it) => isItemApplicable(it, machine))
                    .map((it) => {
                      const done = Boolean(itemsState[it.id]);
                      return (
                        <div
                          key={it.id}
                          className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                            done ? 'text-emerald-900 bg-emerald-50/70' : 'text-slate-500 bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              done ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                          <span className={done ? 'font-medium' : 'text-slate-500'}>{it.label}</span>
                        </div>
                      );
                    })}

                  {step.subsections?.map((sub) =>
                    sub.items
                      .filter((it) => isItemApplicable(it, machine))
                      .map((it) => {
                        const done = Boolean(itemsState[it.id]);
                        return (
                          <div
                            key={it.id}
                            className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                              done ? 'text-emerald-900 bg-emerald-50/70' : 'text-slate-500 bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                done ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                              }`}
                            >
                              {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </span>
                            <span className={done ? 'font-medium' : 'text-slate-500'}>
                              [{sub.code}] {it.label}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FINAL ACTION TOOLBAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold tracking-tight">Finalização & Exportação</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Gere o relatório impresso, salve no histórico ou copie para o chamado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyText}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              copiedText
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copiedText ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedText ? 'Copiado!' : 'Copiar Texto'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canMarkAsFinished}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              canMarkAsFinished
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
            }`}
            title={
              !canMarkAsFinished
                ? 'Conclua todas as tarefas pendentes para habilitar'
                : 'Salvar checklist no histórico'
            }
          >
            <Save className="w-4 h-4" />
            {hasSaved ? 'Salvo no Histórico' : 'Salvar Atendimento'}
          </button>

          <button
            type="button"
            onClick={resetChecklist}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
            title="Iniciar novo atendimento em branco"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
