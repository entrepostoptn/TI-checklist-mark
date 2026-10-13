import React, { useState, useEffect } from 'react';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderPriority } from '../types/serviceOrder';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { MachineType } from '../types/checklist';
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
} from 'lucide-react';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: ServiceOrder | null;
  onOpenChecklistForMachine?: (machineData: { identificacao: string; loja: string; tecnico: string; tipo: MachineType }) => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  onOpenChecklistForMachine,
}) => {
  const { addOrder, updateOrder } = useServiceOrders();

  const [identificacao, setIdentificacao] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [tipo, setTipo] = useState<MachineType>('PDV');
  const [lojaOrigem, setLojaOrigem] = useState('');
  const [lojaDestino, setLojaDestino] = useState('');
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus>('REPARO_ESCRITORIO');
  const [prioridade, setPrioridade] = useState<ServiceOrderPriority>('MEDIA');
  const [defeitoRelatado, setDefeitoRelatado] = useState('');
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');
  const [servicosExecutados, setServicosExecutados] = useState('');
  const [pecasTrocadas, setPecasTrocadas] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (orderToEdit) {
      setIdentificacao(orderToEdit.identificacao);
      setPatrimonio(orderToEdit.patrimonio || '');
      setTipo(orderToEdit.tipo);
      setLojaOrigem(orderToEdit.lojaOrigem);
      setLojaDestino(orderToEdit.lojaDestino || '');
      setTecnicoResponsavel(orderToEdit.tecnicoResponsavel);
      setStatus(orderToEdit.status);
      setPrioridade(orderToEdit.prioridade);
      setDefeitoRelatado(orderToEdit.defeitoRelatado);
      setDiagnosticoTecnico(orderToEdit.diagnosticoTecnico || '');
      setServicosExecutados(orderToEdit.servicosExecutados || '');
      setPecasTrocadas(orderToEdit.pecasTrocadas || '');
      setDataEntrada(orderToEdit.dataEntrada);
      setDataPrevisao(orderToEdit.dataPrevisao || '');
      setObservacoes(orderToEdit.observacoes || '');
    } else {
      // Default new order
      setIdentificacao('');
      setPatrimonio('');
      setTipo('PDV');
      setLojaOrigem('');
      setLojaDestino('');
      setTecnicoResponsavel('');
      setStatus('REPARO_ESCRITORIO');
      setPrioridade('MEDIA');
      setDefeitoRelatado('');
      setDiagnosticoTecnico('');
      setServicosExecutados('');
      setPecasTrocadas('');
      setDataEntrada(new Date().toISOString().split('T')[0]);
      setDataPrevisao('');
      setObservacoes('');
    }
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificacao.trim() || !lojaOrigem.trim()) {
      alert('Por favor, informe a identificação da máquina e a loja de origem.');
      return;
    }

    if (orderToEdit) {
      updateOrder(orderToEdit.id, {
        identificacao,
        patrimonio,
        tipo,
        lojaOrigem,
        lojaDestino,
        tecnicoResponsavel,
        status,
        prioridade,
        defeitoRelatado,
        diagnosticoTecnico,
        servicosExecutados,
        pecasTrocadas,
        dataEntrada,
        dataPrevisao,
        observacoes,
      });
    } else {
      addOrder({
        identificacao,
        patrimonio,
        tipo,
        lojaOrigem,
        lojaDestino,
        tecnicoResponsavel,
        status,
        prioridade,
        defeitoRelatado,
        diagnosticoTecnico,
        servicosExecutados,
        pecasTrocadas,
        dataEntrada,
        dataPrevisao,
        observacoes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {orderToEdit ? `Editar Ordem de Serviço (${orderToEdit.numeroOs})` : 'Nova Ordem de Serviço'}
              </h3>
              <p className="text-xs text-slate-400">
                Controle de entrada, diagnóstico e destinação do equipamento
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
          {/* Status & Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Status Atual da Máquina <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="REPARO_ESCRITORIO">🟡 No Escritório para Reparo</option>
                <option value="RESERVA">🔵 Máquina Reserva (Estoque de Backup)</option>
                <option value="PRONTA">🟢 Pronta para Entrega / Liberada</option>
                <option value="EM_OPERACAO">🟣 Em Operação na Loja</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {status === 'RESERVA'
                  ? 'Equipamento disponível para socorro imediato de lojas.'
                  : status === 'REPARO_ESCRITORIO'
                  ? 'Em manutenção/formatação na bancada do escritório.'
                  : status === 'PRONTA'
                  ? 'Aguardando retirada ou envio para a loja.'
                  : 'Equipamento rodando em produção na loja.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Prioridade do Atendimento
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as ServiceOrderPriority)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="BAIXA">🟢 Baixa (Prevenção)</option>
                <option value="MEDIA">🔵 Média (Padrão)</option>
                <option value="ALTA">🟠 Alta (Loja aguardando)</option>
                <option value="URGENTE">🔴 Urgente (Caixa/Loja Parada)</option>
              </select>
            </div>
          </div>

          {/* Machine Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Identificação do Equipamento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identificação / Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={identificacao}
                  onChange={(e) => setIdentificacao(e.target.value)}
                  placeholder="Ex: PDV-02 ou EST-01"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patrimônio / Service Tag
                </label>
                <input
                  type="text"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  placeholder="Ex: PAT-0082"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Equipamento
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTipo('PDV')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      tipo === 'PDV'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    PDV
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('ESCRITORIO')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      tipo === 'ESCRITORIO'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    Escritório
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stores & Technician */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              Lojas & Técnico Responsável
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loja de Origem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lojaOrigem}
                  onChange={(e) => setLojaOrigem(e.target.value)}
                  placeholder="Ex: Loja 01 - Centro ou Estoque"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loja de Destino (Opcional)
                </label>
                <input
                  type="text"
                  value={lojaDestino}
                  onChange={(e) => setLojaDestino(e.target.value)}
                  placeholder="Ex: Loja 02 - Shopping"
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
            </div>
          </div>

          {/* Problem & Diagnostic */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Diagnóstico & Manutenção
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Defeito Relatado / Motivo da Entrada no Escritório
              </label>
              <textarea
                rows={2}
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                placeholder="Ex: Computador reiniciando sozinho; tela azul; lentidão extrema; substituição preventiva..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico
                </label>
                <textarea
                  rows={2}
                  value={diagnosticoTecnico}
                  onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                  placeholder="Ex: HD com setores defeituosos; pasta térmica ressecada; necessidade de reinstalar MGV..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serviços Executados & Peças Trocadas
                </label>
                <textarea
                  rows={2}
                  value={servicosExecutados}
                  onChange={(e) => setServicosExecutados(e.target.value)}
                  placeholder="Ex: Substituído por SSD 240GB Kingston; limpeza interna; formatação completa..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Dates & Observations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Entrada no Escritório
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
                Data de Previsão de Entrega
              </label>
              <input
                type="date"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Gerais
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Acompanha fonte de 12V e cabo serial; deixar reservado na prateleira B..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onOpenChecklistForMachine && orderToEdit && (
            <button
              type="button"
              onClick={() => {
                onOpenChecklistForMachine({
                  identificacao: orderToEdit.identificacao,
                  loja: orderToEdit.lojaOrigem,
                  tecnico: orderToEdit.tecnicoResponsavel,
                  tipo: orderToEdit.tipo,
                });
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              Executar Checklist Desta Máquina
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {orderToEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
