import React, { useState } from 'react';
import {
  Equipment,
  MovementRecord,
  HardwareChangeRecord,
  EQUIPMENT_STATUS_LABELS,
  LOCATION_LABELS,
} from '../types/equipment';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { MachineType } from '../types/checklist';
import { formatDateBR, formatDateTimeBR, formatShortDateTimeBR, calculateDaysBetween } from '../utils/dateFormatter';
import {
  X,
  Laptop,
  Store,
  Hash,
  Cpu,
  HardDrive,
  Calendar,
  Clock,
  User,
  Wrench,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Tag,
  Edit2,
  FolderOpen,
} from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onEditEquipment: (equipment: Equipment) => void;
  onStartChecklist: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
  onNewServiceOrder: (equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onEditEquipment,
  onStartChecklist,
  onNewServiceOrder,
}) => {
  const {
    getMovementsForEquipment,
    getHardwareChangesForEquipment,
    addMovement,
    addHardwareChange,
  } = useEquipment();

  const { orders } = useServiceOrders();

  const [activeTab, setActiveTab] = useState<'specs' | 'timeline' | 'hardware' | 'orders'>('specs');
  const [showAddMovementForm, setShowAddMovementForm] = useState(false);
  const [showAddHardwareForm, setShowAddHardwareForm] = useState(false);

  // New Movement Form state
  const [movDataHoraEntrada, setMovDataHoraEntrada] = useState(new Date().toISOString().substring(0, 16));
  const [movDataHoraRetirada, setMovDataHoraRetirada] = useState('');
  const [movLojaOrigem, setMovLojaOrigem] = useState('');
  const [movDestino, setMovDestino] = useState('');
  const [movResponsavelEntrega, setMovResponsavelEntrega] = useState('');
  const [movTecnico, setMovTecnico] = useState('');
  const [movResponsavelRetirada, setMovResponsavelRetirada] = useState('');
  const [movMotivo, setMovMotivo] = useState('');
  const [movProblema, setMovProblema] = useState('');
  const [movServico, setMovServico] = useState('');
  const [movResultado, setMovResultado] = useState<'CONCLUIDO_SUCESSO' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONDENADO_SUCATA'>('EM_ANDAMENTO');

  // New Hardware Change Form state
  const [hwComponente, setHwComponente] = useState('SSD');
  const [hwPecaAntiga, setHwPecaAntiga] = useState('');
  const [hwSerialAntiga, setHwSerialAntiga] = useState('');
  const [hwPecaNova, setHwPecaNova] = useState('');
  const [hwMarcaNova, setHwMarcaNova] = useState('');
  const [hwSerialNova, setHwSerialNova] = useState('');
  const [hwQuantidade, setHwQuantidade] = useState(1);
  const [hwTipoAlteracao, setHwTipoAlteracao] = useState<'RAM' | 'ARMAZENAMENTO' | 'PROCESSADOR' | 'OUTRO'>('ARMAZENAMENTO');
  const [hwSpecAntiga, setHwSpecAntiga] = useState('');
  const [hwSpecNova, setHwSpecNova] = useState('');
  const [hwData, setHwData] = useState(new Date().toISOString().split('T')[0]);
  const [hwTecnico, setHwTecnico] = useState('');
  const [hwMotivo, setHwMotivo] = useState('');
  const [hwResultado, setHwResultado] = useState('');

  if (!isOpen || !equipment) return null;

  const movements = getMovementsForEquipment(equipment.id);
  const hardwareChanges = getHardwareChangesForEquipment(equipment.id);
  const linkedOrders = orders.filter(
    (o) => o.equipamentoId === equipment.id || o.identificacao === equipment.nome || (o.patrimonio && o.patrimonio === equipment.patrimonio)
  );

  const statusConfig = EQUIPMENT_STATUS_LABELS[equipment.status];
  const isNoEscritorio = equipment.localizacaoAtual === 'ESCRITORIO' || equipment.status === 'EM_MANUTENCAO' || equipment.status === 'AGUARDANDO_MANUTENCAO';
  const diasNoEscritorio = isNoEscritorio && equipment.dataUltimaEntrada ? calculateDaysBetween(equipment.dataUltimaEntrada) : null;

  const handlePrintDossier = () => {
    window.print();
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    addMovement({
      equipamentoId: equipment.id,
      equipamentoNome: equipment.nome,
      patrimonio: equipment.patrimonio,
      dataHoraEntrada: movDataHoraEntrada,
      dataHoraRetirada: movDataHoraRetirada || undefined,
      lojaOrigem: movLojaOrigem || equipment.lojaNome || equipment.lojaOrigem || 'Não informada',
      destino: movDestino || undefined,
      responsavelEntrega: movResponsavelEntrega || 'Suporte Loja',
      tecnicoResponsavel: movTecnico || 'Carlos Silva',
      responsavelRetirada: movResponsavelRetirada || undefined,
      motivoEnvio: movMotivo || 'Manutenção corretiva',
      problemaRelatado: movProblema || 'Falha de hardware/software',
      servicoRealizado: movServico || undefined,
      resultadoAtendimento: movResultado,
    });
    setShowAddMovementForm(false);
  };

  const handleSaveHardwareChange = (e: React.FormEvent) => {
    e.preventDefault();
    addHardwareChange({
      equipamentoId: equipment.id,
      equipamentoNome: equipment.nome,
      patrimonio: equipment.patrimonio,
      componenteSubstituido: hwComponente,
      descricaoPecaAntiga: hwPecaAntiga,
      serialPecaAntiga: hwSerialAntiga || undefined,
      componenteInstalado: hwPecaNova,
      marcaModeloNovo: hwMarcaNova,
      serialPecaNova: hwSerialNova || undefined,
      quantidade: hwQuantidade,
      tipoAlteracao: hwTipoAlteracao,
      especificacaoAnterior: hwSpecAntiga || undefined,
      especificacaoNova: hwSpecNova || undefined,
      dataSubstituicao: hwData,
      tecnicoResponsavel: hwTecnico || 'Carlos Silva',
      motivoTroca: hwMotivo || 'Peça defeituosa ou upgrade',
      resultado: hwResultado || 'Substituição testada e validada',
    }, true);
    setShowAddHardwareForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Banner */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">
              {equipment.tipo === 'PDV' ? <Store className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  {equipment.nome}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {equipment.patrimonio}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ST: {equipment.numeroSerie}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{equipment.marcaModelo || 'Modelo Não Informado'}</span>
                <span>•</span>
                <span className="text-slate-300">{equipment.lojaOrigem}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border ${statusConfig.badgeBg} ${statusConfig.textBadge}`}
            >
              {statusConfig.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'specs'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Dados Técnicos & Especificações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'timeline'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Linha do Tempo de Movimentações ({movements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'hardware'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Peças & Alterações ({hardwareChanges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Ordens de Serviço ({linkedOrders.length})</span>
          </button>
        </div>

        {/* Modal Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: DADOS TÉCNICOS & ESPECIFICAÇÕES */}
          {activeTab === 'specs' && (
            <div className="space-y-5">
              {/* Alert: Permanência no escritório se aplicável */}
              {isNoEscritorio && diasNoEscritorio !== null && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Equipamento no escritório de TI há <strong>{diasNoEscritorio} {diasNoEscritorio === 1 ? 'dia' : 'dias'}</strong>.
                      Chegada em: {formatDateTimeBR(equipment.dataUltimaEntrada)}.
                    </span>
                  </div>
                  <span className="font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                    Bancada TI
                  </span>
                </div>
              )}

              {/* Hardware Spec Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Processador</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{equipment.processador || 'Não informado'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Memória RAM</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{equipment.memoriaRamGb} GB</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {equipment.armazenamentoValor
                      ? `${equipment.armazenamentoValor} ${equipment.armazenamentoUnidade || 'GB'} ${equipment.tipoArmazenamento ? `(${equipment.tipoArmazenamento.replace('_', ' ')})` : ''}`
                      : 'Não especificado'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Sistema Operacional</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{equipment.sistemaOperacional || 'Windows'}</span>
                </div>
              </div>

              {/* Location & Status Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Localização Atual:</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                    {LOCATION_LABELS[equipment.localizacaoAtual]}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">Loja de Origem:</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                    {equipment.lojaOrigem}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">Técnico de Referência:</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                    {equipment.tecnicoResponsavel || 'Não atribuído'}
                  </span>
                </div>
              </div>

              {/* Timeline Dates Box */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Rastreamento Cronológico de Manutenções
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Última Entrada no Escritório:</span>
                    <span className="font-bold text-slate-800">{formatDateTimeBR(equipment.dataUltimaEntrada)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Última Retirada / Devolução:</span>
                    <span className="font-bold text-slate-800">{formatDateTimeBR(equipment.dataUltimaRetirada)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Última Manutenção Concluída:</span>
                    <span className="font-bold text-slate-800">{formatDateBR(equipment.dataUltimaManutencao)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Data do Primeiro Cadastro:</span>
                    <span className="font-bold text-slate-800">{formatDateBR(equipment.dataPrimeiroCadastro)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {equipment.observacoes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 font-bold block mb-1">Observações do Cadastro:</span>
                  <p className="text-slate-800 leading-relaxed">{equipment.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINHA DO TEMPO (MOVIMENTAÇÕES CRONOLÓGICAS) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Linha do Tempo de Entradas, Saídas e Atendimentos
                  </h4>
                  <p className="text-xs text-slate-500">
                    Histórico completo registrado cronologicamente sem sobrescrever eventos anteriores.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMovementForm(!showAddMovementForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Movimentação
                </button>
              </div>

              {/* Form de nova movimentação */}
              {showAddMovementForm && (
                <form onSubmit={handleSaveMovement} className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase">
                      Novo Registro de Movimentação
                    </span>
                    <button type="button" onClick={() => setShowAddMovementForm(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data e Hora de Entrada no Escritório</label>
                      <input
                        type="datetime-local"
                        required
                        value={movDataHoraEntrada}
                        onChange={(e) => setMovDataHoraEntrada(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data e Hora de Retirada (Se já concluída)</label>
                      <input
                        type="datetime-local"
                        value={movDataHoraRetirada}
                        onChange={(e) => setMovDataHoraRetirada(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Responsável pela Entrega</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Motorista / Gerente"
                        value={movResponsavelEntrega}
                        onChange={(e) => setMovResponsavelEntrega(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Técnico Responsável</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Silva"
                        value={movTecnico}
                        onChange={(e) => setMovTecnico(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Responsável pela Retirada</label>
                      <input
                        type="text"
                        placeholder="Ex: Devolvido para Carlos"
                        value={movResponsavelRetirada}
                        onChange={(e) => setMovResponsavelRetirada(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Motivo do Envio / Problema Relatado</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Não ligava, tela azul, formatação..."
                        value={movProblema}
                        onChange={(e) => setMovProblema(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Serviço Realizado</label>
                      <input
                        type="text"
                        placeholder="Ex: Troca de SSD, formatação, teste de MGV..."
                        value={movServico}
                        onChange={(e) => setMovServico(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <select
                      value={movResultado}
                      onChange={(e) => setMovResultado(e.target.value as any)}
                      className="text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="CONCLUIDO_SUCESSO">🟢 Concluído com Sucesso</option>
                      <option value="EM_ANDAMENTO">🟡 Em Andamento na Bancada</option>
                      <option value="AGUARDANDO_PECA">🟠 Aguardando Chegada de Peça</option>
                      <option value="CONDENADO_SUCATA">🔴 Condenado / Sucata</option>
                    </select>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Salvar Movimentação
                    </button>
                  </div>
                </form>
              )}

              {/* Lista cronológica (Timeline) */}
              {movements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl p-6">
                  <Clock className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Nenhuma movimentação registrada para este equipamento.</p>
                  <p className="text-[11px] text-slate-400">Clique em "Registrar Movimentação" para adicionar a primeira entrada no escritório.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-blue-200 space-y-4">
                  {movements.map((mov) => (
                    <div key={mov.id} className="relative bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2">
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Entrada: {formatDateTimeBR(mov.dataHoraEntrada)}
                          </span>
                          {mov.dataHoraRetirada && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              Retirada: {formatDateTimeBR(mov.dataHoraRetirada)}
                            </span>
                          )}
                          {mov.numeroOs && (
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {mov.numeroOs}
                            </span>
                          )}
                        </div>

                        <span
                          className={`self-start sm:self-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            mov.resultadoAtendimento === 'CONCLUIDO_SUCESSO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.resultadoAtendimento === 'CONDENADO_SUCATA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {mov.resultadoAtendimento === 'CONCLUIDO_SUCESSO'
                            ? 'Concluído com Sucesso'
                            : mov.resultadoAtendimento === 'CONDENADO_SUCATA'
                            ? 'Condenado / Sucata'
                            : 'Em Andamento'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-slate-600">
                        <div>
                          <strong>Origem / Destino:</strong> {mov.lojaOrigem} {mov.destino ? `➔ ${mov.destino}` : ''}
                        </div>
                        <div>
                          <strong>Pessoas:</strong> Entregue por {mov.responsavelEntrega} • Técnico: {mov.tecnicoResponsavel}
                          {mov.responsavelRetirada ? ` • Retirado por: ${mov.responsavelRetirada}` : ''}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800 space-y-1">
                        <div><strong>Motivo / Problema:</strong> {mov.problemaRelatado || mov.motivoEnvio}</div>
                        {mov.servicoRealizado && (
                          <div className="text-emerald-800 font-medium"><strong>Serviço Realizado:</strong> {mov.servicoRealizado}</div>
                        )}
                        {mov.observacoes && (
                          <div className="text-slate-500 italic"><strong>Obs:</strong> {mov.observacoes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PEÇAS E ALTERAÇÕES DE HARDWARE */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Histórico de Peças e Alterações de Hardware
                  </h4>
                  <p className="text-xs text-slate-500">
                    Rastreamento de componentes substituídos, peças antigas vs novas e histórico de upgrades.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddHardwareForm(!showAddHardwareForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Troca de Peça
                </button>
              </div>

              {/* Form de nova troca de peça */}
              {showAddHardwareForm && (
                <form onSubmit={handleSaveHardwareChange} className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase">
                      Registrar Nova Substituição de Componente
                    </span>
                    <button type="button" onClick={() => setShowAddHardwareForm(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Componente Substituído</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: SSD, Memória RAM, Fonte..."
                        value={hwComponente}
                        onChange={(e) => setHwComponente(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tipo de Alteração</label>
                      <select
                        value={hwTipoAlteracao}
                        onChange={(e) => setHwTipoAlteracao(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                      >
                        <option value="ARMAZENAMENTO">Armazenamento (HD/SSD)</option>
                        <option value="RAM">Memória RAM</option>
                        <option value="PROCESSADOR">Processador</option>
                        <option value="OUTRO">Fonte / Placa / Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data da Troca</label>
                      <input
                        type="date"
                        required
                        value={hwData}
                        onChange={(e) => setHwData(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Peça Antiga vs Peça Nova */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div className="space-y-2">
                      <span className="font-bold text-red-700 block uppercase text-[10px]">Peça Antiga (Removida)</span>
                      <input
                        type="text"
                        required
                        placeholder="Descrição da peça antiga (ex: HD 500GB Seagate)"
                        value={hwPecaAntiga}
                        onChange={(e) => setHwPecaAntiga(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Serial/Lote antigo (se houver)"
                        value={hwSerialAntiga}
                        onChange={(e) => setHwSerialAntiga(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Capacidade anterior (ex: 8 GB ou 500 GB HD)"
                        value={hwSpecAntiga}
                        onChange={(e) => setHwSpecAntiga(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-emerald-700 block uppercase text-[10px]">Peça Nova (Instalada)</span>
                      <input
                        type="text"
                        required
                        placeholder="Descrição da peça nova (ex: SSD 240GB Kingston A400)"
                        value={hwPecaNova}
                        onChange={(e) => setHwPecaNova(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Serial da peça nova (se houver)"
                        value={hwSerialNova}
                        onChange={(e) => setHwSerialNova(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Nova capacidade (ex: 16 GB ou 240 GB SSD SATA)"
                        value={hwSpecNova}
                        onChange={(e) => setHwSpecNova(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Motivo da Substituição</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: HD apresentando bad blocks, upgrade de velocidade..."
                        value={hwMotivo}
                        onChange={(e) => setHwMotivo(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Técnico Responsável</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Silva"
                        value={hwTecnico}
                        onChange={(e) => setHwTecnico(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-right pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Salvar Alteração de Hardware
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Peças e Alterações */}
              {hardwareChanges.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl p-6">
                  <HardDrive className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Nenhuma troca de peça registrada para esta máquina.</p>
                  <p className="text-[11px] text-slate-400">As substituições de SSD, memória RAM ou fonte realizadas em ordens de serviço aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hardwareChanges.map((hw) => (
                    <div key={hw.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{hw.componenteSubstituido}</span>
                          {hw.especificacaoAnterior && hw.especificacaoNova && (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                              {hw.especificacaoAnterior} ➔ {hw.especificacaoNova}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-500">
                          {hw.numeroOs && (
                            <span className="font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {hw.numeroOs}
                            </span>
                          )}
                          <span>Data: <strong>{formatDateBR(hw.dataSubstituicao)}</strong></span>
                          <span>•</span>
                          <span>Técnico: <strong>{hw.tecnicoResponsavel}</strong></span>
                        </div>
                      </div>

                      {/* Comparativo Peça Antiga vs Peça Nova */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200/70 text-red-950">
                          <span className="text-[10px] uppercase font-bold text-red-700 block">Peça Removida (Antiga)</span>
                          <span className="font-semibold text-xs block mt-0.5">{hw.descricaoPecaAntiga}</span>
                          {hw.serialPecaAntiga && (
                            <span className="text-[11px] font-mono text-red-800/80 block mt-0.5">
                              S/N: {hw.serialPecaAntiga}
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-emerald-950">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Peça Instalada (Nova)</span>
                          <span className="font-semibold text-xs block mt-0.5">{hw.componenteInstalado}</span>
                          {hw.serialPecaNova && (
                            <span className="text-[11px] font-mono text-emerald-800/80 block mt-0.5">
                              S/N: {hw.serialPecaNova}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 pt-1 space-y-0.5">
                        <div><strong>Motivo da Troca:</strong> {hw.motivoTroca}</div>
                        {hw.resultado && <div><strong>Resultado:</strong> {hw.resultado}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDENS DE SERVIÇO VINCULADAS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Ordens de Serviço do Equipamento
                  </h4>
                  <p className="text-xs text-slate-500">
                    Todas as OS abertas e concluídas para esta máquina com diagnóstico e resultados.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNewServiceOrder(equipment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova OS para esta Máquina
                </button>
              </div>

              {linkedOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl p-6">
                  <Wrench className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Nenhuma ordem de serviço vinculada a este equipamento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedOrders.map((os) => (
                    <div key={os.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {os.numeroOs}
                          </span>
                          <span className="font-semibold text-slate-800">
                            Abertura: {formatDateBR(os.dataEntrada)}
                          </span>
                          {os.dataConclusao && (
                            <span className="text-emerald-700 font-semibold">
                              • Concluída: {formatDateBR(os.dataConclusao)}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {os.status === 'PRONTA' ? 'Pronta para Entrega' : os.status === 'REPARO_ESCRITORIO' ? 'No Escritório (Reparo)' : os.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1 pt-1">
                        <div><strong>Defeito Relatado:</strong> {os.defeitoRelatado}</div>
                        {os.diagnosticoTecnico && (
                          <div><strong>Diagnóstico:</strong> {os.diagnosticoTecnico}</div>
                        )}
                        {os.servicosExecutados && (
                          <div className="text-emerald-800 font-medium"><strong>Serviço:</strong> {os.servicosExecutados}</div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>Técnico: <strong className="text-slate-600">{os.tecnicoResponsavel || 'Geral'}</strong></span>
                        <span>Loja: <strong className="text-slate-600">{os.lojaOrigem}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onStartChecklist({
                  identificacao: equipment.nome,
                  loja: equipment.lojaNome || equipment.lojaOrigem || 'Loja Principal',
                  tecnico: equipment.tecnicoResponsavel || 'Carlos Silva',
                  tipo: equipment.tipo === 'PDV' ? 'PDV' : 'ESCRITORIO',
                });
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Executar Checklist Desta Máquina
            </button>

            <button
              type="button"
              onClick={() => {
                onNewServiceOrder(equipment);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              Abrir Nova OS
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Imprimir Ficha
            </button>

            <button
              type="button"
              onClick={() => {
                onEditEquipment(equipment);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Cadastro
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
