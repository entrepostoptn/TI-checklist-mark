import React, { useState, useEffect, useMemo } from 'react';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderPriority } from '../types/serviceOrder';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { useEquipment } from '../context/EquipmentContext';
import { MachineType } from '../types/checklist';
import { Equipment } from '../types/equipment';
import { formatDateBR, formatShortDateTimeBR } from '../utils/dateFormatter';
import {
  X,
  Wrench,
  Store,
  Laptop,
  Calendar,
  User,
  Hash,
  AlertTriangle,
  Save,
  Tag,
  FileText,
  Search,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: ServiceOrder | null;
  initialEquipment?: Equipment | null;
  onOpenChecklistForMachine?: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  initialEquipment,
  onOpenChecklistForMachine,
}) => {
  const { addOrder, updateOrder } = useServiceOrders();
  const { equipments, updateEquipment, addMovement, addHardwareChange } = useEquipment();

  // Machine selection state
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Fields
  const [identificacao, setIdentificacao] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tipo, setTipo] = useState<MachineType>('PDV');
  const [lojaOrigem, setLojaOrigem] = useState('');
  const [lojaDestino, setLojaDestino] = useState('');
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState('');
  const [responsavelEntrega, setResponsavelEntrega] = useState('');
  const [responsavelRetirada, setResponsavelRetirada] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus>('REPARO_ESCRITORIO');
  const [prioridade, setPrioridade] = useState<ServiceOrderPriority>('MEDIA');
  const [resultadoAtendimento, setResultadoAtendimento] = useState<'CONCLUIDO_SUCESSO' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONDENADO_SUCATA'>('EM_ANDAMENTO');

  const [defeitoRelatado, setDefeitoRelatado] = useState('');
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');
  const [servicosExecutados, setServicosExecutados] = useState('');
  const [pecasTrocadas, setPecasTrocadas] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [dataConclusao, setDataConclusao] = useState('');
  const [dataRetirada, setDataRetirada] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Hardware change form inline (optional quick addition during OS)
  const [hasHardwareChange, setHasHardwareChange] = useState(false);
  const [hwComponente, setHwComponente] = useState('SSD');
  const [hwPecaAntiga, setHwPecaAntiga] = useState('');
  const [hwPecaNova, setHwPecaNova] = useState('');
  const [hwMarcaNova, setHwMarcaNova] = useState('');
  const [hwSerialNova, setHwSerialNova] = useState('');
  const [hwQuantidade, setHwQuantidade] = useState(1);
  const [hwTipoAlteracao, setHwTipoAlteracao] = useState<'RAM' | 'ARMAZENAMENTO' | 'OUTRO'>('ARMAZENAMENTO');
  const [hwSpecAntiga, setHwSpecAntiga] = useState('');
  const [hwSpecNova, setHwSpecNova] = useState('');

  // Filter equipments by search
  const filteredEquipments = useMemo(() => {
    if (!equipmentSearch.trim()) return equipments.slice(0, 8);
    const clean = equipmentSearch.toLowerCase();
    return equipments.filter(
      (e) =>
        e.nome.toLowerCase().includes(clean) ||
        e.patrimonio.toLowerCase().includes(clean) ||
        e.numeroSerie.toLowerCase().includes(clean) ||
        e.lojaOrigem.toLowerCase().includes(clean)
    );
  }, [equipments, equipmentSearch]);

  const selectedEquipment = useMemo(() => {
    return equipments.find((e) => e.id === selectedEquipmentId);
  }, [equipments, selectedEquipmentId]);

  const handleSelectEquipment = (eq: Equipment) => {
    setSelectedEquipmentId(eq.id);
    setIdentificacao(eq.nome);
    setPatrimonio(eq.patrimonio);
    setNumeroSerie(eq.numeroSerie);
    setTipo(eq.tipo === 'PDV' ? 'PDV' : 'ESCRITORIO');
    setLojaOrigem(eq.lojaOrigem);
    if (!lojaDestino) setLojaDestino(eq.lojaOrigem);
    if (!tecnicoResponsavel && eq.tecnicoResponsavel) setTecnicoResponsavel(eq.tecnicoResponsavel);
    setIsDropdownOpen(false);
    setEquipmentSearch('');
  };

  useEffect(() => {
    if (orderToEdit) {
      setSelectedEquipmentId(orderToEdit.equipamentoId || '');
      setIdentificacao(orderToEdit.identificacao);
      setPatrimonio(orderToEdit.patrimonio || '');
      setNumeroSerie(orderToEdit.numeroSerie || '');
      setTipo(orderToEdit.tipo);
      setLojaOrigem(orderToEdit.lojaOrigem);
      setLojaDestino(orderToEdit.lojaDestino || '');
      setTecnicoResponsavel(orderToEdit.tecnicoResponsavel);
      setResponsavelEntrega(orderToEdit.responsavelEntrega || '');
      setResponsavelRetirada(orderToEdit.responsavelRetirada || '');
      setStatus(orderToEdit.status);
      setPrioridade(orderToEdit.prioridade);
      setResultadoAtendimento(orderToEdit.resultadoAtendimento || 'EM_ANDAMENTO');
      setDefeitoRelatado(orderToEdit.defeitoRelatado);
      setDiagnosticoTecnico(orderToEdit.diagnosticoTecnico || '');
      setServicosExecutados(orderToEdit.servicosExecutados || '');
      setPecasTrocadas(orderToEdit.pecasTrocadas || '');
      setDataEntrada(orderToEdit.dataEntrada);
      setDataPrevisao(orderToEdit.dataPrevisao || '');
      setDataConclusao(orderToEdit.dataConclusao || '');
      setDataRetirada(orderToEdit.dataRetirada || '');
      setObservacoes(orderToEdit.observacoes || '');
      setHasHardwareChange(false);
    } else if (initialEquipment) {
      handleSelectEquipment(initialEquipment);
      setStatus('REPARO_ESCRITORIO');
      setPrioridade('MEDIA');
      setResultadoAtendimento('EM_ANDAMENTO');
      setDefeitoRelatado('');
      setDiagnosticoTecnico('');
      setServicosExecutados('');
      setPecasTrocadas('');
      setDataEntrada(new Date().toISOString().split('T')[0]);
      setDataPrevisao('');
      setDataConclusao('');
      setDataRetirada('');
      setObservacoes('');
      setHasHardwareChange(false);
    } else {
      setSelectedEquipmentId('');
      setIdentificacao('');
      setPatrimonio('');
      setNumeroSerie('');
      setTipo('PDV');
      setLojaOrigem('');
      setLojaDestino('');
      setTecnicoResponsavel('Carlos Silva');
      setResponsavelEntrega('');
      setResponsavelRetirada('');
      setStatus('REPARO_ESCRITORIO');
      setPrioridade('MEDIA');
      setResultadoAtendimento('EM_ANDAMENTO');
      setDefeitoRelatado('');
      setDiagnosticoTecnico('');
      setServicosExecutados('');
      setPecasTrocadas('');
      setDataEntrada(new Date().toISOString().split('T')[0]);
      setDataPrevisao('');
      setDataConclusao('');
      setDataRetirada('');
      setObservacoes('');
      setHasHardwareChange(false);
    }
  }, [orderToEdit, initialEquipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificacao.trim() || !lojaOrigem.trim()) {
      alert('Por favor, informe a identificação da máquina e a loja de origem.');
      return;
    }

    const orderPayload = {
      equipamentoId: selectedEquipmentId || undefined,
      identificacao,
      patrimonio,
      numeroSerie,
      tipo,
      lojaOrigem,
      lojaDestino,
      tecnicoResponsavel,
      responsavelEntrega,
      responsavelRetirada,
      status,
      prioridade,
      resultadoAtendimento,
      defeitoRelatado,
      diagnosticoTecnico,
      servicosExecutados,
      pecasTrocadas,
      dataEntrada,
      dataPrevisao,
      dataConclusao: status === 'PRONTA' && !dataConclusao ? new Date().toISOString().split('T')[0] : dataConclusao,
      dataRetirada,
      observacoes,
    };

    let savedOrder: ServiceOrder;

    if (orderToEdit) {
      updateOrder(orderToEdit.id, orderPayload);
      savedOrder = { ...orderToEdit, ...orderPayload };
    } else {
      savedOrder = addOrder(orderPayload);
    }

    // Se houver troca de peças preenchida, salva no histórico de hardware do equipamento
    if (hasHardwareChange && (selectedEquipmentId || orderToEdit?.equipamentoId) && hwPecaNova.trim()) {
      const eqId = selectedEquipmentId || orderToEdit?.equipamentoId!;
      addHardwareChange(
        {
          equipamentoId: eqId,
          equipamentoNome: identificacao,
          patrimonio: patrimonio || '-',
          osId: savedOrder.id,
          numeroOs: savedOrder.numeroOs,
          componenteSubstituido: hwComponente,
          descricaoPecaAntiga: hwPecaAntiga || 'Não identificada',
          componenteInstalado: hwPecaNova,
          marcaModeloNovo: hwMarcaNova || hwPecaNova,
          serialPecaNova: hwSerialNova || undefined,
          quantidade: hwQuantidade,
          tipoAlteracao: hwTipoAlteracao,
          especificacaoAnterior: hwSpecAntiga || undefined,
          especificacaoNova: hwSpecNova || undefined,
          dataSubstituicao: new Date().toISOString().split('T')[0],
          tecnicoResponsavel: tecnicoResponsavel || 'Técnico de TI',
          motivoTroca: defeitoRelatado || 'Substituição em manutenção',
          resultado: 'Peça instalada e testada com sucesso',
        },
        true
      );
    }

    // Sincroniza status no cadastro do equipamento se estiver vinculado
    if (selectedEquipmentId) {
      if (status === 'PRONTA') {
        updateEquipment(selectedEquipmentId, {
          status: 'DISPONIVEL_RETIRADA',
          localizacaoAtual: 'ESCRITORIO',
          dataUltimaManutencao: new Date().toISOString().split('T')[0],
          tecnicoResponsavel,
        });

        // Adiciona registro na linha do tempo do equipamento
        addMovement({
          equipamentoId: selectedEquipmentId,
          equipamentoNome: identificacao,
          patrimonio: patrimonio || '-',
          osId: savedOrder.id,
          numeroOs: savedOrder.numeroOs,
          dataHoraEntrada: `${dataEntrada}T08:30`,
          lojaOrigem,
          destino: lojaDestino || lojaOrigem,
          responsavelEntrega: responsavelEntrega || 'Suporte Loja',
          tecnicoResponsavel: tecnicoResponsavel || 'Carlos Silva',
          motivoEnvio: defeitoRelatado || 'Atendimento técnico',
          problemaRelatado: defeitoRelatado,
          servicoRealizado: servicosExecutados || diagnosticoTecnico,
          resultadoAtendimento: 'CONCLUIDO_SUCESSO',
        });
      } else if (status === 'EM_OPERACAO') {
        updateEquipment(selectedEquipmentId, {
          status: 'EM_USO',
          localizacaoAtual: 'LOJA',
          dataUltimaRetirada: new Date().toISOString(),
          tecnicoResponsavel,
        });
      } else if (status === 'REPARO_ESCRITORIO') {
        updateEquipment(selectedEquipmentId, {
          status: 'EM_MANUTENCAO',
          localizacaoAtual: 'ESCRITORIO',
          dataUltimaEntrada: `${dataEntrada}T08:30`,
          tecnicoResponsavel,
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {orderToEdit ? `Editar Ordem de Serviço (${orderToEdit.numeroOs})` : 'Nova Ordem de Serviço'}
              </h3>
              <p className="text-xs text-slate-400">
                Vinculação a equipamento, diagnóstico técnico, substituição de peças e destinação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. SELEÇÃO E VINCULAÇÃO DE EQUIPAMENTO */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-700" />
                Vínculo com Equipamento Cadastrado
              </span>
              {selectedEquipment && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Máquina Vinculada
                </span>
              )}
            </div>

            {/* Search selector */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={equipmentSearch}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setEquipmentSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder="Pesquisar máquina por nome, patrimônio ou número de série..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600"
                  />
                </div>
                {selectedEquipmentId && (
                  <button
                    type="button"
                    onClick={() => setSelectedEquipmentId('')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
                  >
                    Desvincular
                  </button>
                )}
              </div>

              {/* Autocomplete Results Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredEquipments.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Nenhum equipamento encontrado com este termo.
                    </div>
                  ) : (
                    filteredEquipments.map((eq) => (
                      <div
                        key={eq.id}
                        onClick={() => handleSelectEquipment(eq)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{eq.nome}</span>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {eq.patrimonio}
                          </span>
                          <span className="text-[11px] text-slate-400">ST: {eq.numeroSerie}</span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">{eq.lojaOrigem}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Machine Specs Summary Card */}
            {selectedEquipment && (
              <div className="bg-white p-3 rounded-xl border border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Processador</span>
                  <span className="font-bold text-slate-800">{selectedEquipment.processador || 'Não inf.'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Memória RAM</span>
                  <span className="font-bold text-slate-800">{selectedEquipment.memoriaRamGb} GB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Armazenamento</span>
                  <span className="font-bold text-slate-800">
                    {selectedEquipment.armazenamentoValor} {selectedEquipment.armazenamentoUnidade} ({selectedEquipment.tipoArmazenamento.replace('_', ' ')})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Última Manutenção</span>
                  <span className="font-bold text-slate-800">
                    {formatDateBR(selectedEquipment.dataUltimaManutencao) || 'Nenhuma'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. DADOS PRINCIPAIS: STATUS & PRIORIDADE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Status da OS <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
              >
                <option value="REPARO_ESCRITORIO">🟡 No Escritório para Reparo</option>
                <option value="RESERVA">🔵 Máquina Reserva (Estoque)</option>
                <option value="PRONTA">🟢 Pronta para Entrega</option>
                <option value="EM_OPERACAO">🟣 Em Operação na Loja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as ServiceOrderPriority)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
              >
                <option value="BAIXA">🟢 Baixa (Prevenção)</option>
                <option value="MEDIA">🔵 Média (Padrão)</option>
                <option value="ALTA">🟠 Alta (Loja aguardando)</option>
                <option value="URGENTE">🔴 Urgente (Caixa Parado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Resultado do Atendimento
              </label>
              <select
                value={resultadoAtendimento}
                onChange={(e) => setResultadoAtendimento(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
              >
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO_SUCESSO">Concluído com Sucesso</option>
                <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                <option value="CONDENADO_SUCATA">Condenado / Sucata</option>
              </select>
            </div>
          </div>

          {/* 3. IDENTIFICAÇÃO DO EQUIPAMENTO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Identificação & Setores
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Identificação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={identificacao}
                  onChange={(e) => setIdentificacao(e.target.value)}
                  placeholder="Ex: PDV-02"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patrimônio
                </label>
                <input
                  type="text"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  placeholder="Ex: PAT-0042"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Série (Service Tag)
                </label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ex: BRJ8421-DEL"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTipo('PDV')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                      tipo === 'PDV' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    PDV
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('ESCRITORIO')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                      tipo === 'ESCRITORIO' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Escritório
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loja de Origem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lojaOrigem}
                  onChange={(e) => setLojaOrigem(e.target.value)}
                  placeholder="Ex: Loja 01 - Centro"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destino Após Manutenção
                </label>
                <input
                  type="text"
                  value={lojaDestino}
                  onChange={(e) => setLojaDestino(e.target.value)}
                  placeholder="Ex: Loja 01 - Retorno"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Técnico Responsável
                </label>
                <input
                  type="text"
                  value={tecnicoResponsavel}
                  onChange={(e) => setTecnicoResponsavel(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável pela Entrega
                </label>
                <input
                  type="text"
                  value={responsavelEntrega}
                  onChange={(e) => setResponsavelEntrega(e.target.value)}
                  placeholder="Ex: Marcos Gerente"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 4. DIAGNÓSTICO E MANUTENÇÃO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Problema Relatado & Procedimentos
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problema Informado / Defeito Relatado
              </label>
              <textarea
                rows={2}
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                placeholder="Ex: Travando na tela de boot, reiniciando sozinho ou balança Toledo sem comunicação..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico
                </label>
                <textarea
                  rows={2}
                  value={diagnosticoTecnico}
                  onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                  placeholder="Ex: Setores defeituosos no SSD antigo; memória com erro no MemTest..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procedimentos Realizados
                </label>
                <textarea
                  rows={2}
                  value={servicosExecutados}
                  onChange={(e) => setServicosExecutados(e.target.value)}
                  placeholder="Ex: Limpeza interna, troca de pasta térmica, formatação limpa e checklist..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 5. SUB-SEÇÃO: PEÇAS E ALTERAÇÕES DE HARDWARE */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                Peças e Alterações de Hardware
              </span>

              <button
                type="button"
                onClick={() => setHasHardwareChange(!hasHardwareChange)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {hasHardwareChange ? 'Remover Registro de Peça' : '+ Registrar Troca de Peça Nesta OS'}
              </button>
            </div>

            {hasHardwareChange && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-300 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Componente Substituído</label>
                    <select
                      value={hwComponente}
                      onChange={(e) => setHwComponente(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    >
                      <option value="SSD">Armazenamento (SSD)</option>
                      <option value="HD">Armazenamento (HD)</option>
                      <option value="Memória RAM">Memória RAM</option>
                      <option value="Fonte">Fonte de Alimentação</option>
                      <option value="Placa-Mãe">Placa-Mãe</option>
                      <option value="Processador">Processador</option>
                      <option value="Cooler">Cooler / Ventoinha</option>
                      <option value="Outro">Outro Periférico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Descrição da Peça Antiga</label>
                    <input
                      type="text"
                      placeholder="Ex: HD 500GB Seagate"
                      value={hwPecaAntiga}
                      onChange={(e) => setHwPecaAntiga(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Peça Nova Instalada</label>
                    <input
                      type="text"
                      placeholder="Ex: SSD Kingston A400 240GB"
                      value={hwPecaNova}
                      onChange={(e) => setHwPecaNova(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Marca / Modelo Novo</label>
                    <input
                      type="text"
                      placeholder="Ex: Kingston A400"
                      value={hwMarcaNova}
                      onChange={(e) => setHwMarcaNova(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número de Série Peça Nova</label>
                    <input
                      type="text"
                      placeholder="Ex: KNG-240-8831"
                      value={hwSerialNova}
                      onChange={(e) => setHwSerialNova(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={hwQuantidade}
                      onChange={(e) => setHwQuantidade(parseInt(e.target.value, 10) || 1)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tipo de Upgrade</label>
                    <select
                      value={hwTipoAlteracao}
                      onChange={(e) => setHwTipoAlteracao(e.target.value as any)}
                      className="w-full p-1.5 rounded-md border border-slate-300 bg-white"
                    >
                      <option value="ARMAZENAMENTO">Armazenamento (HD/SSD)</option>
                      <option value="RAM">Memória RAM</option>
                      <option value="OUTRO">Outro componente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Espec. Anterior</label>
                    <input
                      type="text"
                      placeholder="Ex: 8 GB ou 500 GB HD"
                      value={hwSpecAntiga}
                      onChange={(e) => setHwSpecAntiga(e.target.value)}
                      className="w-full p-1.5 rounded-md border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Espec. Nova</label>
                    <input
                      type="text"
                      placeholder="Ex: 16 GB ou 240 GB SSD"
                      value={hwSpecNova}
                      onChange={(e) => setHwSpecNova(e.target.value)}
                      className="w-full p-1.5 rounded-md border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. DATAS E CRONOGRAMA */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Entrada
              </label>
              <input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previsão de Entrega
              </label>
              <input
                type="date"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Conclusão
              </label>
              <input
                type="date"
                value={dataConclusao}
                onChange={(e) => setDataConclusao(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Retirada
              </label>
              <input
                type="date"
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Adicionais
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Equipamento acompanhado de cabo de força e fonte de 12V..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onOpenChecklistForMachine && (
            <button
              type="button"
              onClick={() => {
                onOpenChecklistForMachine({
                  identificacao: identificacao || 'PDV-01',
                  loja: lojaOrigem || 'Loja 01',
                  tecnico: tecnicoResponsavel || 'Carlos Silva',
                  tipo,
                });
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              Executar Checklist Desta Máquina
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {orderToEdit ? 'Salvar Alterações da OS' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
