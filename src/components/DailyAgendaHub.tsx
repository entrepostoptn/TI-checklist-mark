import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { useDailyDemands } from '../context/DailyDemandsContext';
import { useDailyTasks } from '../context/DailyTasksContext';
import { useBranches } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { MaintenanceRecord } from '../types/maintenance';
import { DailyDemand } from '../types/dailyDemand';
import { TaskPriority } from '../types/task';
import { formatDateBR, formatDateTimeBR, calculateDaysBetween } from '../utils/dateFormatter';
import { MaintenanceDispatchModal } from './MaintenanceDispatchModal';
import { MaintenanceDeliveryModal } from './MaintenanceDeliveryModal';
import { MaintenanceDetailModal } from './MaintenanceDetailModal';
import { DailyDemandModal } from './DailyDemandModal';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  PhoneCall,
  Store,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Wrench,
  ChevronRight,
  Filter,
  Flame,
  ArrowRight,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';

export const DailyAgendaHub: React.FC = () => {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { records, registerDispatch, registerDelivery } = useMaintenance();
  const { demands, changeDemandStatus, addProgressUpdate } = useDailyDemands();
  const {
    todayPendingTasks,
    overdueTasks,
    completedTodayTasks,
    addTask,
    toggleTask,
    deleteTask,
  } = useDailyTasks();

  // Modals state
  const [selectedRecordForDispatch, setSelectedRecordForDispatch] = useState<MaintenanceRecord | null>(null);
  const [selectedRecordForDelivery, setSelectedRecordForDelivery] = useState<MaintenanceRecord | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);
  const [selectedDemandToEdit, setSelectedDemandToEdit] = useState<DailyDemand | null>(null);
  const [isNewDemandModalOpen, setIsNewDemandModalOpen] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStoreId, setNewTaskStoreId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIA');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Active Tab Filter: 'all' | 'returns' | 'tickets' | 'bench' | 'tasks'
  const [activeTab, setActiveTab] = useState<'all' | 'returns' | 'tickets' | 'bench' | 'tasks'>('all');

  // Quick Inline Note for a Ticket
  const [quickNoteTicketId, setQuickNoteTicketId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // 1. Pending Machine Returns: finished in lab (DISPONIVEL_ENVIO) or in transit (RETIRADA_TRANSPORTE)
  const pendingReturns = useMemo(() => {
    return records
      .filter((r) => r.status === 'DISPONIVEL_ENVIO' || r.status === 'RETIRADA_TRANSPORTE')
      .sort((a, b) => {
        const daysA = calculateDaysBetween(a.dataHoraConclusao || a.dataHoraEntrada);
        const daysB = calculateDaysBetween(b.dataHoraConclusao || b.dataHoraEntrada);
        return daysB - daysA; // Most delayed first
      });
  }, [records]);

  // 2. Open Tickets to follow up or confirm (Vivo, AnyDesk, Links, etc.)
  const pendingTickets = useMemo(() => {
    return demands
      .filter((d) => d.status !== 'CONCLUIDO' && d.status !== 'CANCELADO')
      .sort((a, b) => {
        if (a.prioridade === 'ALTA' && b.prioridade !== 'ALTA') return -1;
        if (b.prioridade === 'ALTA' && a.prioridade !== 'ALTA') return 1;
        return calculateDaysBetween(b.dataAbertura) - calculateDaysBetween(a.dataAbertura);
      });
  }, [demands]);

  // 3. Machines on Lab Bench (EM_MANUTENCAO, PENDENTE, RECEBIDA)
  const labBenchMachines = useMemo(() => {
    return records
      .filter((r) => r.status === 'EM_MANUTENCAO' || r.status === 'PENDENTE' || r.status === 'RECEBIDA')
      .sort((a, b) => {
        return calculateDaysBetween(b.dataHoraEntrada) - calculateDaysBetween(a.dataHoraEntrada);
      });
  }, [records]);

  // Summary counts
  const totalPendingActions =
    pendingReturns.length +
    pendingTickets.length +
    overdueTasks.length +
    todayPendingTasks.length;

  const todayFormatted = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Handlers for Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      const selectedStore = branches.find((b) => b.id === newTaskStoreId);
      await addTask({
        titulo: newTaskTitle.trim(),
        lojaId: selectedStore?.id,
        lojaNome: selectedStore?.nomeFantasia,
        prioridade: newTaskPriority,
        responsavelNome: user?.nome || 'Técnico de Plantão',
      });
      setNewTaskTitle('');
      setNewTaskStoreId('');
      setNewTaskPriority('MEDIA');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // 1-Click Ticket Resolution Confirmation
  const handleConfirmTicketDone = (demand: DailyDemand) => {
    const confirmationText = `Chamado confirmado e finalizado com sucesso por ${user?.nome || 'Técnico'} na Agenda Diária.`;
    addProgressUpdate(demand.id, confirmationText, 'CONCLUIDO');
  };

  const handleSaveQuickNote = (ticketId: string) => {
    if (!quickNoteText.trim()) return;
    addProgressUpdate(ticketId, quickNoteText.trim(), undefined, user?.nome || 'Técnico');
    setQuickNoteText('');
    setQuickNoteTicketId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Agenda do Dia & Resumo de Tarefas */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              Agenda & Tarefas do Dia
              {totalPendingActions > 0 ? (
                <span className="bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  {totalPendingActions} pendências hoje
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                  Tudo em dia!
                </span>
              )}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Painel prático de execução diária. Acompanhe máquinas prontas aguardando devolução às lojas, chamados com provedores a confirmar e suas tarefas com rollover automático.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Returns */}
            <button
              onClick={() => setActiveTab('returns')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'returns'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Truck className="w-4 h-4 text-amber-400" />
                <span className="text-xl font-black text-amber-300">{pendingReturns.length}</span>
              </div>
              <div className="text-[11px] font-semibold mt-1">Devolver p/ Loja</div>
            </button>

            {/* Tickets */}
            <button
              onClick={() => setActiveTab('tickets')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'tickets'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md ring-2 ring-sky-400/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <PhoneCall className="w-4 h-4 text-sky-400" />
                <span className="text-xl font-black text-sky-300">{pendingTickets.length}</span>
              </div>
              <div className="text-[11px] font-semibold mt-1">Confirmar Chamados</div>
            </button>

            {/* Lab Bench */}
            <button
              onClick={() => setActiveTab('bench')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'bench'
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span className="text-xl font-black text-indigo-300">{labBenchMachines.length}</span>
              </div>
              <div className="text-[11px] font-semibold mt-1">Bancada Lab</div>
            </button>

            {/* Daily Tasks */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTab === 'tasks'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md ring-2 ring-purple-400/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                <span className="text-xl font-black text-purple-300">
                  {overdueTasks.length + todayPendingTasks.length}
                </span>
              </div>
              <div className="text-[11px] font-semibold mt-1">Minhas Tarefas</div>
            </button>
          </div>
        </div>

        {/* Quick Add Task Input Form */}
        <form onSubmit={handleCreateTask} className="mt-5 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Anotar tarefa ou lembrete para hoje... (ex: Entregar PDV na Loja 02, Cobrar retorno da Vivo, etc.)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={newTaskStoreId}
              onChange={(e) => setNewTaskStoreId(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Vincular a Loja (opcional)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nomeFantasia}
                </option>
              ))}
            </select>

            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALTA">Prioridade Alta</option>
              <option value="MEDIA">Prioridade Média</option>
              <option value="BAIXA">Prioridade Baixa</option>
            </select>

            <button
              type="submit"
              disabled={isSubmittingTask || !newTaskTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar à Agenda</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Visão Geral do Dia ({totalPendingActions})</span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Devoluções a Lojas ({pendingReturns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Chamados a Confirmar ({pendingTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bench')}
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
            activeTab === 'bench'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Bancada Lab ({labBenchMachines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tarefas Pessoais ({overdueTasks.length + todayPendingTasks.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: 🚨 DEVOLUÇÕES URGENTES PARA AS LOJAS           */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'returns') && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Truck className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Máquinas Concluídas Aguardando Devolução à Loja
                </h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingReturns.length} {pendingReturns.length === 1 ? 'máquina' : 'máquinas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Máquinas que já passaram por testes e manutenção no laboratório e agora precisam ser retiradas e entregues na loja de origem.
              </p>
            </div>
          </div>

          {pendingReturns.length === 0 ? (
            <div className="p-8 text-center bg-amber-50/50 rounded-xl border border-dashed border-amber-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Tudo entregue nas lojas!</p>
              <p className="text-xs text-slate-500">
                Nenhuma máquina concluída aguardando transporte ou entrega para as lojas no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReturns.map((record) => {
                const daysCompleted = calculateDaysBetween(record.dataHoraConclusao);
                const daysInLab = calculateDaysBetween(record.dataHoraEntrada);
                const isOverdue = daysCompleted > 0;

                return (
                  <div
                    key={record.id}
                    className={`rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                      record.status === 'RETIRADA_TRANSPORTE'
                        ? 'bg-blue-50/40 border-blue-200'
                        : isOverdue
                        ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <div>
                      {/* Rollover / Overdue Alert Banner */}
                      {isOverdue && record.status === 'DISPONIVEL_ENVIO' && (
                        <div className="bg-rose-100/80 border border-rose-300 rounded-lg px-3 py-1.5 mb-3 flex items-center justify-between text-rose-900 text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Concluída {formatDateBR(record.dataHoraConclusao)} (há {daysCompleted}{' '}
                              {daysCompleted === 1 ? 'dia' : 'dias'}) — TEM QUE DEVOLVER!
                            </span>
                          </span>
                          <span className="text-[11px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                            {daysInLab} dias em manutenção
                          </span>
                        </div>
                      )}

                      {record.status === 'RETIRADA_TRANSPORTE' && (
                        <div className="bg-blue-100/80 border border-blue-300 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-1.5 text-blue-900 text-xs font-bold">
                          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Em transporte com {record.tecnicoRetirada || 'técnico'} — Confirmar entrega na filial!</span>
                        </div>
                      )}

                      {/* Header info */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                              OS #{record.numeroOs}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              Patr: {record.patrimonio || 'S/N'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            {record.equipamentoNome}
                          </h3>
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            record.status === 'RETIRADA_TRANSPORTE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {record.status === 'RETIRADA_TRANSPORTE' ? 'Em Transporte' : 'Pronta p/ Devolução'}
                        </span>
                      </div>

                      {/* Store destination */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <Store className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">
                            Loja de Destino: {record.lojaDestino || record.lojaOrigem || 'Não definida'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Técnico bancada: {record.tecnicoBancada || record.tecnicoConclusao || 'Laboratório'}
                          </div>
                        </div>
                      </div>

                      {(record.servicosExecutados || record.problemasEncontrados) && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 italic">
                          "{record.servicosExecutados || record.problemasEncontrados}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons: 1-Click to Dispatch / Deliver */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedRecordForDetail(record)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                      >
                        Ver Checklist & OS
                      </button>

                      {record.status === 'DISPONIVEL_ENVIO' ? (
                        <button
                          onClick={() => setSelectedRecordForDispatch(record)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Registrar Retirada / Devolver</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRecordForDelivery(record)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Entrega na Loja</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: 📞 CHAMADOS OPERACIONAIS A CONFIRMAR (Vivo, etc) */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'tickets') && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                  <PhoneCall className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Chamados do Dia a Dia a Confirmar
                </h2>
                <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingTickets.length} pendentes
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Chamados de operadoras (Vivo, Claro), acessos AnyDesk e provedores. Marque como finalizado assim que a loja confirmar o restabelecimento.
              </p>
            </div>

            <button
              onClick={() => setIsNewDemandModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Chamado</span>
            </button>
          </div>

          {pendingTickets.length === 0 ? (
            <div className="p-8 text-center bg-sky-50/50 rounded-xl border border-dashed border-sky-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Nenhum chamado pendente!</p>
              <p className="text-xs text-slate-500">
                Todos os chamados de links, Vivo e acessos remotos foram conferidos e encerrados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTickets.map((ticket) => {
                const daysOpen = calculateDaysBetween(ticket.dataAbertura);
                const lastUpdate = ticket.andamentos?.[ticket.andamentos.length - 1];

                return (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-sky-200 bg-sky-50/20 p-4.5 flex flex-col justify-between hover:border-sky-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                            {ticket.operadoraOuEmpresa || 'Chamado'}
                          </span>
                          {ticket.protocoloExterno && (
                            <span className="text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Prot: {ticket.protocoloExterno}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              ticket.prioridade === 'ALTA'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ticket.prioridade}
                          </span>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysOpen === 0 ? 'Aberto hoje' : `Aberto há ${daysOpen}d`}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-2">
                        {ticket.titulo}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{ticket.lojaNome}</span>
                      </div>

                      {ticket.descricao && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {ticket.descricao}
                        </p>
                      )}

                      {/* Latest Progress Update */}
                      {lastUpdate && (
                        <div className="mt-2.5 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                            <span>Último Andamento ({formatDateTimeBR(lastUpdate.dataHora)})</span>
                            <span className="text-slate-400">{lastUpdate.autor}</span>
                          </div>
                          <p className="text-slate-700 mt-1 italic">
                            "{lastUpdate.descricao}"
                          </p>
                        </div>
                      )}

                      {/* Quick inline note input */}
                      {quickNoteTicketId === ticket.id && (
                        <div className="mt-3 p-2 bg-white rounded-lg border border-sky-300 shadow-sm space-y-2">
                          <input
                            type="text"
                            placeholder="Como está? Já andou? Anote aqui..."
                            value={quickNoteText}
                            onChange={(e) => setQuickNoteText(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setQuickNoteTicketId(null);
                                setQuickNoteText('');
                              }}
                              className="text-[11px] px-2 py-1 text-slate-500 hover:text-slate-700"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveQuickNote(ticket.id)}
                              className="text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1 rounded"
                            >
                              Salvar Andamento
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedDemandToEdit(ticket)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-white"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => {
                            setQuickNoteTicketId(ticket.id);
                            setQuickNoteText('');
                          }}
                          className="text-xs text-sky-700 hover:text-sky-900 font-semibold px-2 py-1 rounded hover:bg-sky-100"
                        >
                          + Andamento
                        </button>
                      </div>

                      <button
                        onClick={() => handleConfirmTicketDone(ticket)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar Finalizado</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: 🔧 MÁQUINAS NA BANCADA DO LABORATÓRIO         */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'bench') && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Wrench className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Máquinas em Bancada / Manutenção Pendente
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {labBenchMachines.length} em bancada
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Equipamentos em processo de teste, reparo ou aguardando peças de reposição no laboratório.
              </p>
            </div>
          </div>

          {labBenchMachines.length === 0 ? (
            <div className="p-8 text-center bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Bancada liberada!</p>
              <p className="text-xs text-slate-500">
                Nenhuma máquina em manutenção ou com pendência de bancada neste momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labBenchMachines.map((record) => {
                const daysInLab = calculateDaysBetween(record.dataHoraEntrada);
                const checklistKeys = [
                  'testeInicializacao',
                  'testeMemoriaRam',
                  'testeArmazenamento',
                  'testePortasComunicacao',
                  'testeRedeConectividade',
                  'testeTermicoCooler',
                  'testeFonteAlimentacao',
                  'testePerifericos',
                  'testeSistemaOperacional',
                  'limpezaInternaExterna',
                  'testesFinaisAprovados',
                ] as const;
                const approvedCount = checklistKeys.filter((k) => record.checklist?.[k]).length;

                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-4 flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          OS #{record.numeroOs}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            record.status === 'PENDENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : record.status === 'RECEBIDA'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {record.status === 'PENDENTE'
                            ? 'Pendente'
                            : record.status === 'RECEBIDA'
                            ? 'Recebida'
                            : 'Em Manutenção'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-2">
                        {record.equipamentoNome}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.lojaOrigem}</span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">
                          {approvedCount}/11 testes feitos
                        </span>
                        <span className="text-amber-700 font-bold">
                          {daysInLab === 0 ? 'Entrou hoje' : `${daysInLab} dias no lab`}
                        </span>
                      </div>

                      {record.motivoNaoConcluida && (
                        <div className="mt-2 text-xs bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded">
                          <span className="font-bold">Motivo: </span>
                          {record.motivoNaoConcluida}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      <button
                        onClick={() => setSelectedRecordForDetail(record)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Abrir Bancada de Testes</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: 📝 MINHA AGENDA & TAREFAS PESSOAIS            */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'tasks') && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Tarefas e Lembretes da Equipe
                </h2>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {overdueTasks.length + todayPendingTasks.length} ativas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tarefas com rollover automático: o que não for finalizado hoje continuará visível amanhã com aviso de dias atrasados.
              </p>
            </div>
          </div>

          {/* Overdue / Rollover Tasks from past days */}
          {overdueTasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Tarefas de Dias Anteriores (Rollover / Atrasadas)</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.map((task) => {
                  const daysLate = calculateDaysBetween(task.dataAgendada);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-rose-50/80 border border-rose-300 flex items-center justify-between gap-3 transition-all hover:bg-rose-100/60"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <Square className="w-5 h-5 text-rose-400" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {task.titulo}
                            </span>
                            <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                              Não feita em {formatDateBR(task.dataAgendada)} (há {daysLate}d)
                            </span>
                          </div>
                          {task.lojaNome && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <Store className="w-3 h-3 text-slate-400" />
                              <span>{task.lojaNome}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-white/80 transition-colors"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Programadas para Hoje</span>
            </div>

            {todayPendingTasks.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Nenhuma tarefa manual agendada para hoje. Use a barra acima para adicionar lembretes rápidos!
              </div>
            ) : (
              <div className="space-y-2">
                {todayPendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Square className="w-5 h-5 text-slate-400" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {task.titulo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task.prioridade === 'ALTA'
                                ? 'bg-rose-100 text-rose-800'
                                : task.prioridade === 'MEDIA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {task.prioridade}
                          </span>
                        </div>
                        {task.lojaNome && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{task.lojaNome}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Today (Collapsible/Preview) */}
          {completedTodayTasks.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Concluídas Hoje ({completedTodayTasks.length})</span>
              </div>
              <div className="space-y-1.5">
                {completedTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 opacity-70">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-emerald-600 hover:text-slate-400 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <span className="line-through text-slate-600 font-medium">
                        {task.titulo}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Concluída às {task.concluidaEm ? formatDateTimeBR(task.concluidaEm).split('às')[1] : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS INTEGRATION                                       */}
      {/* ======================================================== */}

      {/* Dispatch Modal (Registrar Retirada / Devolver) */}
      <MaintenanceDispatchModal
        isOpen={!!selectedRecordForDispatch}
        onClose={() => setSelectedRecordForDispatch(null)}
        record={selectedRecordForDispatch}
        onConfirmDispatch={(id, data) => {
          registerDispatch(id, data);
          setSelectedRecordForDispatch(null);
        }}
      />

      {/* Delivery Modal (Confirmar Entrega na Loja) */}
      <MaintenanceDeliveryModal
        isOpen={!!selectedRecordForDelivery}
        onClose={() => setSelectedRecordForDelivery(null)}
        record={selectedRecordForDelivery}
        onConfirmDelivery={(id, data) => {
          registerDelivery(id, data);
          setSelectedRecordForDelivery(null);
        }}
      />

      {/* Detail / Testing Workbench Modal */}
      <MaintenanceDetailModal
        isOpen={!!selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
        record={selectedRecordForDetail}
        onOpenDispatchModal={(rec) => {
          setSelectedRecordForDetail(null);
          setSelectedRecordForDispatch(rec);
        }}
      />

      {/* Daily Demand Modal */}
      <DailyDemandModal
        isOpen={isNewDemandModalOpen || !!selectedDemandToEdit}
        onClose={() => {
          setIsNewDemandModalOpen(false);
          setSelectedDemandToEdit(null);
        }}
        demandToEdit={selectedDemandToEdit}
      />
    </div>
  );
};
