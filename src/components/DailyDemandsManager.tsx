import React, { useState, useMemo } from 'react';
import { useDailyDemands } from '../context/DailyDemandsContext';
import {
  DailyDemand,
  DailyDemandStatus,
  DailyDemandCategory,
  DEMAND_CATEGORY_LABELS,
  DEMAND_STATUS_LABELS,
} from '../types/dailyDemand';
import { DailyDemandModal } from './DailyDemandModal';
import { formatDateTimeBR, formatDateBR } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';
import {
  PhoneCall,
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Store,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Edit2,
  Trash2,
  Tag,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export const DailyDemandsManager: React.FC = () => {
  const {
    demands,
    stats,
    addProgressUpdate,
    changeDemandStatus,
    deleteDemand,
  } = useDailyDemands();
  const { user } = useAuth();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demandToEdit, setDemandToEdit] = useState<DailyDemand | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'TODAS' | DailyDemandStatus>('TODAS');
  const [categoryFilter, setCategoryFilter] = useState<'TODAS' | DailyDemandCategory>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Expandable cards for andamentos
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Inline note text state for each card
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});
  const [inlineNextStatus, setInlineNextStatus] = useState<Record<string, DailyDemandStatus>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddInlineUpdate = (demand: DailyDemand) => {
    const text = (inlineNotes[demand.id] || '').trim();
    if (!text) return;

    const nextStatus = inlineNextStatus[demand.id] || demand.status;
    addProgressUpdate(demand.id, text, nextStatus, user?.nome || 'Técnico');

    setInlineNotes((prev) => ({ ...prev, [demand.id]: '' }));
  };

  // Filtered demands
  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      if (statusFilter !== 'TODAS' && d.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'TODAS' && d.categoria !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const clean = searchTerm.toLowerCase();
        const matchesTitle = d.titulo.toLowerCase().includes(clean);
        const matchesDesc = d.descricao.toLowerCase().includes(clean);
        const matchesProto = (d.protocoloExterno || '').toLowerCase().includes(clean);
        const matchesOper = (d.operadoraOuEmpresa || '').toLowerCase().includes(clean);
        const matchesLoja = d.lojaNome.toLowerCase().includes(clean);
        const matchesTech = d.tecnicoResponsavel.toLowerCase().includes(clean);
        const matchesAndamentos = d.andamentos.some((a) => a.descricao.toLowerCase().includes(clean));

        if (
          !matchesTitle &&
          !matchesDesc &&
          !matchesProto &&
          !matchesOper &&
          !matchesLoja &&
          !matchesTech &&
          !matchesAndamentos
        ) {
          return false;
        }
      }
      return true;
    });
  }, [demands, statusFilter, categoryFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-400/30">
              Rotina & Atendimento Operacional
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado em Tempo Real
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-purple-400" />
            <span>Demandas & Chamados do Dia a Dia</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Acompanhe chamados de operadoras (Vivo, Claro), liberações de acesso remoto (AnyDesk, VPN), suporte de sistemas e demandas diárias com registro de andamento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDemandToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>+ Anotar Chamado / Demanda</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Abertos */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ABERTO' ? 'TODAS' : 'ABERTO')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ABERTO' ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Chamados Abertos</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-700">
            {stats.totalAbertos}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Aguardando atendimento
          </div>
        </div>

        {/* 2. Em Andamento */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'EM_ANDAMENTO' ? 'TODAS' : 'EM_ANDAMENTO')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'EM_ANDAMENTO' ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Em Andamento</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600">
            {stats.emAndamento}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Em tratativa pelos técnicos
          </div>
        </div>

        {/* 3. Aguardando Terceiro (Vivo / Provedor) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'AGUARDANDO_TERCEIRO' ? 'TODAS' : 'AGUARDANDO_TERCEIRO')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'AGUARDANDO_TERCEIRO' ? 'ring-2 ring-orange-500 border-orange-400 bg-orange-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Aguardando Terceiro</span>
            <div className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-orange-600">
            {stats.aguardandoTerceiro}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Vivo, Claro ou técnicos externos
          </div>
        </div>

        {/* 4. Concluídos */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'CONCLUIDO' ? 'TODAS' : 'CONCLUIDO')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'CONCLUIDO' ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Concluídos</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">
            {stats.concluidos}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Resolvidos com sucesso
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Quick Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('TODAS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === 'TODAS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas as Categorias
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('CHAMADO_OPERADORA')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === 'CHAMADO_OPERADORA'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📞 Operadoras (Vivo/Claro)
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('ACESSO_REMOTO')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === 'ACESSO_REMOTO'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🔑 Acesso Remoto & VPN
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('SISTEMA_PDV')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === 'SISTEMA_PDV'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            💻 Sistema & TEF
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por protocolo, título, loja, nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs"
          />
        </div>
      </div>

      {/* Demands Cards List */}
      {filteredDemands.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 shadow-sm">
          <PhoneCall className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm">Nenhum chamado ou demanda encontrada.</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Clique no botão acima para anotar um chamado da Vivo, solicitação de acesso remoto ou demanda diária.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDemands.map((demand) => {
            const statusCfg = DEMAND_STATUS_LABELS[demand.status];
            const catCfg = DEMAND_CATEGORY_LABELS[demand.categoria];
            const isExpanded = expandedCards[demand.id] ?? true; // expanded by default to see andamentos!

            return (
              <div
                key={demand.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Demand Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusCfg.badgeBg} ${statusCfg.textBadge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                        <span>{statusCfg.label}</span>
                      </span>

                      {/* Category Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {catCfg.label}
                      </span>

                      {/* External Protocol */}
                      {demand.protocoloExterno && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                          Protocolo: {demand.protocoloExterno}
                        </span>
                      )}

                      {/* Operadora / Empresa */}
                      {demand.operadoraOuEmpresa && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {demand.operadoraOuEmpresa}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {demand.titulo}
                    </h3>

                    <p className="text-xs text-slate-700">
                      {demand.descricao}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap pt-1">
                      <span className="flex items-center gap-1 text-slate-800 font-semibold">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{demand.lojaNome}</span>
                      </span>

                      <span className="text-slate-300">•</span>

                      <span>
                        Técnico: <b>{demand.tecnicoResponsavel}</b>
                      </span>

                      <span className="text-slate-300">•</span>

                      <span>
                        Abertura: <b>{formatDateTimeBR(demand.dataAbertura)}</b>
                      </span>

                      {demand.prazoEstimado && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                            Prazo: {demand.prazoEstimado}
                          </span>
                        </>
                      )}

                      {demand.linkAcessoRemoto && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                            {demand.linkAcessoRemoto}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Quick Selector */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDemandToEdit(demand);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar Demanda"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir a demanda "${demand.titulo}"?`)) {
                          deleteDemand(demand.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Demanda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(demand.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span>Andamento ({demand.andamentos.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Section: Andamentos & Como Está (Expandable) */}
                {isExpanded && (
                  <div className="bg-slate-50/90 border-t border-slate-200 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <span>Histórico de Andamentos & Ocorrências</span>
                      </span>

                      {/* Quick Status Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        {demand.status !== 'EM_ANDAMENTO' && (
                          <button
                            type="button"
                            onClick={() => changeDemandStatus(demand.id, 'EM_ANDAMENTO')}
                            className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold cursor-pointer"
                          >
                            ▶ Mover p/ Em Andamento
                          </button>
                        )}

                        {demand.status !== 'AGUARDANDO_TERCEIRO' && (
                          <button
                            type="button"
                            onClick={() => changeDemandStatus(demand.id, 'AGUARDANDO_TERCEIRO')}
                            className="px-2 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold cursor-pointer"
                          >
                            ⏳ Aguardando Terceiro (Vivo)
                          </button>
                        )}

                        {demand.status !== 'CONCLUIDO' && (
                          <button
                            type="button"
                            onClick={() => changeDemandStatus(demand.id, 'CONCLUIDO')}
                            className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Concluir Demanda</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Quick Add Note Input */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <input
                        type="text"
                        placeholder="Anotar novo andamento (ex: 'Liguei na Vivo, técnico a caminho', 'Acesso remoto liberado')..."
                        value={inlineNotes[demand.id] || ''}
                        onChange={(e) =>
                          setInlineNotes((prev) => ({ ...prev, [demand.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddInlineUpdate(demand);
                          }
                        }}
                        className="flex-1 px-2.5 py-1 rounded-lg outline-none text-xs text-slate-800 placeholder-slate-400"
                      />

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <select
                          value={inlineNextStatus[demand.id] || demand.status}
                          onChange={(e) =>
                            setInlineNextStatus((prev) => ({
                              ...prev,
                              [demand.id]: e.target.value as DailyDemandStatus,
                            }))
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 outline-none"
                        >
                          <option value="ABERTO">Status: Aberto</option>
                          <option value="EM_ANDAMENTO">Status: Em Andamento</option>
                          <option value="AGUARDANDO_TERCEIRO">Status: Aguardando Terceiro</option>
                          <option value="CONCLUIDO">Status: Concluído</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleAddInlineUpdate(demand)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Registrar</span>
                        </button>
                      </div>
                    </div>

                    {/* Timeline of Andamentos */}
                    <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
                      {demand.andamentos.map((andamento) => (
                        <div
                          key={andamento.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex flex-col gap-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span>{andamento.autor}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatDateTimeBR(andamento.dataHora)}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed pl-3">
                            {andamento.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Nova / Editar Demanda */}
      {isModalOpen && (
        <DailyDemandModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          demandToEdit={demandToEdit}
        />
      )}
    </div>
  );
};
