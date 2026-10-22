import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { MaintenanceRecord, MaintenanceStatus, MAINTENANCE_STATUS_LABELS } from '../types/maintenance';
import { MaintenanceDetailModal } from './MaintenanceDetailModal';
import { MaintenanceDispatchModal } from './MaintenanceDispatchModal';
import { MaintenanceDeliveryModal } from './MaintenanceDeliveryModal';
import { formatDateTimeBR, formatDateBR } from '../utils/dateFormatter';
import {
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Laptop,
  Truck,
  Store,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Cpu,
  ChevronRight,
  CheckSquare,
  PackageCheck,
  FileCheck2,
} from 'lucide-react';

export const MaintenanceDashboardView: React.FC = () => {
  const {
    records,
    selectedMonth,
    setSelectedMonth,
    stats,
    registerDispatch,
    registerDelivery,
  } = useMaintenance();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | MaintenanceStatus>('TODAS');
  const [activeTabFilter, setActiveTabFilter] = useState<
    'TODAS' | 'EM_BANCADA' | 'PENDENTES' | 'DISPONIVEIS' | 'LOGISTICA'
  >('TODAS');

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);
  const [recordForDispatch, setRecordForDispatch] = useState<MaintenanceRecord | null>(null);
  const [recordForDelivery, setRecordForDelivery] = useState<MaintenanceRecord | null>(null);

  // Month options generator (last 6 months)
  const monthOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      list.push({
        value: val,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      });
    }
    return list;
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Tab Quick Filter
      if (activeTabFilter === 'EM_BANCADA' && r.status !== 'EM_MANUTENCAO' && r.status !== 'RECEBIDA') {
        return false;
      }
      if (activeTabFilter === 'PENDENTES' && r.status !== 'PENDENTE') {
        return false;
      }
      if (activeTabFilter === 'DISPONIVEIS' && r.status !== 'DISPONIVEL_ENVIO') {
        return false;
      }
      if (
        activeTabFilter === 'LOGISTICA' &&
        r.status !== 'RETIRADA_TRANSPORTE' &&
        r.status !== 'ENTREGUE_LOJA'
      ) {
        return false;
      }

      // Status dropdown filter
      if (statusFilter !== 'TODAS' && r.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const clean = searchTerm.toLowerCase();
        const matchesEq = r.equipamentoNome.toLowerCase().includes(clean);
        const matchesOs = r.numeroOs.toLowerCase().includes(clean);
        const matchesPat = (r.patrimonio || '').toLowerCase().includes(clean);
        const matchesSerial = (r.numeroSerie || '').toLowerCase().includes(clean);
        const matchesLoja = (r.lojaOrigem || '').toLowerCase().includes(clean);
        const matchesMotivo = (r.motivoNaoConcluida || '').toLowerCase().includes(clean);
        const matchesTech = (r.tecnicoBancada || r.tecnicoAbertura || '').toLowerCase().includes(clean);

        if (
          !matchesEq &&
          !matchesOs &&
          !matchesPat &&
          !matchesSerial &&
          !matchesLoja &&
          !matchesMotivo &&
          !matchesTech
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, activeTabFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Month Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
              Laboratório Técnico Mark Security
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tempo Real & Sincronizado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Fila & Fluxo de Manutenção de Máquinas</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Gestão integrada às Ordens de Serviço: bancada de testes, peças, checklist de liberação, despacho e confirmação de entrega nas filiais.
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center gap-3 shrink-0">
          <Calendar className="w-5 h-5 text-blue-300 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-300">
              Período dos Indicadores
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-extrabold text-xs sm:text-sm outline-none cursor-pointer pr-4"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5 Real-Time Monthly KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Recebidas no Mês */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Máquinas Recebidas</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalRecebidasMes}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">no período</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold inline-block self-start">
            Via abertura de OS
          </div>
        </div>

        {/* 2. Em Manutenção */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Em Manutenção</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {stats.emManutencao}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">na bancada</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold inline-block self-start">
            Testes em andamento
          </div>
        </div>

        {/* 3. Pendentes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Pendentes</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {stats.pendentes}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">com motivo</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md font-semibold inline-block self-start">
            Aguardando peça/aprovação
          </div>
        </div>

        {/* 4. Concluídas */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Concluídas no Mês</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats.concluidasMes}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">testes OK</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold inline-block self-start">
            Higienizadas e limpas
          </div>
        </div>

        {/* 5. Disponíveis para Envio */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 border border-teal-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-teal-50/50 to-white">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-teal-900">Disponíveis p/ Envio</span>
            <div className="p-1.5 rounded-xl bg-teal-100 text-teal-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-700">
              {stats.disponiveisEnvio}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">prontas</span>
          </div>
          <div className="mt-2 text-[10px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md font-extrabold inline-block self-start">
            Aguardando retirada
          </div>
        </div>
      </div>

      {/* Main Queue Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Quick Filter Tabs & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTabFilter('TODAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabFilter === 'TODAS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas as Máquinas ({records.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('EM_BANCADA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabFilter === 'EM_BANCADA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Em Bancada / Testes ({stats.emManutencao})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('PENDENTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabFilter === 'PENDENTES'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Pendentes ({stats.pendentes})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('DISPONIVEIS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabFilter === 'DISPONIVEIS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Disponíveis para Envio ({stats.disponiveisEnvio})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('LOGISTICA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabFilter === 'LOGISTICA'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Transporte & Entregues ({stats.retiradasEmTransito + stats.entreguesMes})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar máquina, OS, patrimônio, serial, loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
            />
          </div>
        </div>

        {/* Machine Queue List / Table */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Laptop className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm">Nenhuma máquina encontrada neste filtro.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ao abrir uma Ordem de Serviço na aba de OS, a máquina entrará automaticamente nesta fila.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((r) => {
              const cfg = MAINTENANCE_STATUS_LABELS[r.status];
              const approvedChecksCount = Object.values(r.checklist).filter(Boolean).length;

              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        r.status === 'EM_MANUTENCAO'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'PENDENTE'
                          ? 'bg-rose-100 text-rose-700'
                          : r.status === 'DISPONIVEL_ENVIO'
                          ? 'bg-teal-100 text-teal-700'
                          : r.status === 'RETIRADA_TRANSPORTE'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Laptop className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                          {r.numeroOs}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.textBadge}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-slate-500">
                          {r.tipoEquipamento}
                        </span>
                        {r.patrimonio && (
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Pat: {r.patrimonio}
                          </span>
                        )}
                        {r.numeroSerie && (
                          <span className="font-mono text-[10px] text-slate-500">
                            SN: {r.numeroSerie}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {r.equipamentoNome}
                      </h3>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>Origem: <b>{r.lojaOrigem}</b></span>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span>
                          Entrada: <b>{formatDateBR(r.dataHoraEntrada)}</b>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span>
                          Técnico: <b>{r.tecnicoBancada || r.tecnicoAbertura}</b>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="text-blue-700 font-semibold">
                          Checklist: {approvedChecksCount}/11
                        </span>
                      </div>

                      {/* Display Pending Reason if PENDENTE */}
                      {r.status === 'PENDENTE' && r.motivoNaoConcluida && (
                        <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            Motivo da Pendência: <b>{r.motivoNaoConcluida}</b>
                          </span>
                        </div>
                      )}

                      {/* Display Dispatch / Delivery details if in transit or delivered */}
                      {r.status === 'RETIRADA_TRANSPORTE' && (
                        <div className="mt-1.5 p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-[11px] flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>
                            Retirado por <b>{r.tecnicoRetirada}</b> em {formatDateTimeBR(r.dataHoraRetirada)} para envio a <b>{r.destinoEnvio || r.lojaDestino}</b>.
                          </span>
                        </div>
                      )}

                      {r.status === 'ENTREGUE_LOJA' && (
                        <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Entregue por <b>{r.tecnicoEntrega}</b> e recebido por <b>{r.responsavelRecebimentoLoja}</b> em {formatDateTimeBR(r.dataHoraEntrega)}.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* If ready for dispatch, show quick dispatch button */}
                    {r.status === 'DISPONIVEL_ENVIO' && (
                      <button
                        type="button"
                        onClick={() => setRecordForDispatch(r)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Registrar Retirada</span>
                      </button>
                    )}

                    {/* If in transit, show quick delivery confirmation button */}
                    {r.status === 'RETIRADA_TRANSPORTE' && (
                      <button
                        type="button"
                        onClick={() => setRecordForDelivery(r)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar Entrega</span>
                      </button>
                    )}

                    {/* Main Workbench & Dossier button */}
                    <button
                      type="button"
                      onClick={() => setSelectedRecordForDetail(r)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Bancada & Checklist</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Detail Workbench & Checklist */}
      {selectedRecordForDetail && (
        <MaintenanceDetailModal
          isOpen={Boolean(selectedRecordForDetail)}
          onClose={() => setSelectedRecordForDetail(null)}
          record={selectedRecordForDetail}
          onOpenDispatchModal={(rec) => {
            setSelectedRecordForDetail(null);
            setRecordForDispatch(rec);
          }}
          onOpenDeliveryModal={(rec) => {
            setSelectedRecordForDetail(null);
            setRecordForDelivery(rec);
          }}
        />
      )}

      {/* MODAL 2: Dispatch / Withdrawal */}
      {recordForDispatch && (
        <MaintenanceDispatchModal
          isOpen={Boolean(recordForDispatch)}
          onClose={() => setRecordForDispatch(null)}
          record={recordForDispatch}
          onConfirmDispatch={registerDispatch}
        />
      )}

      {/* MODAL 3: Store Delivery Confirmation */}
      {recordForDelivery && (
        <MaintenanceDeliveryModal
          isOpen={Boolean(recordForDelivery)}
          onClose={() => setRecordForDelivery(null)}
          record={recordForDelivery}
          onConfirmDelivery={registerDelivery}
        />
      )}
    </div>
  );
};
