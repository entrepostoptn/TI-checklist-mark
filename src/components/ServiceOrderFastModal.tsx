import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { Client, Store } from '../types/client';
import { Equipment, EquipmentType } from '../types/equipment';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderPriority, ServiceOrderType } from '../types/serviceOrder';
import { formatDateBR } from '../utils/dateFormatter';
import {
  X,
  Building2,
  Store as StoreIcon,
  Laptop,
  Wrench,
  Search,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  AlertTriangle,
  History,
  Clock,
  Printer,
  Scale,
  Video,
  Router,
  Server,
  Network,
  Sparkles,
} from 'lucide-react';

interface ServiceOrderFastModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStore?: Store | null;
  preselectedEquipment?: Equipment | null;
  onOrderCreated?: (order: ServiceOrder) => void;
}

export const ServiceOrderFastModal: React.FC<ServiceOrderFastModalProps> = ({
  isOpen,
  onClose,
  preselectedStore,
  preselectedEquipment,
  onOrderCreated,
}) => {
  const { clients, stores } = useClients();
  const { equipments, addEquipment } = useEquipment();
  const { addOrder, getOrdersByEquipmentId } = useServiceOrders();

  // Wizard Steps (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (preselectedEquipment && preselectedStore) return 4;
    if (preselectedStore) return 3;
    return 1;
  });

  // Selected entities
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (preselectedStore) return preselectedStore.clienteId;
    if (preselectedEquipment?.clienteId) return preselectedEquipment.clienteId;
    return clients[0]?.id || '';
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    if (preselectedStore) return preselectedStore.id;
    if (preselectedEquipment?.lojaId) return preselectedEquipment.lojaId;
    return '';
  });

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(() => {
    return preselectedEquipment?.id || '';
  });

  const [isWithoutEquipment, setIsWithoutEquipment] = useState<boolean>(false);

  // Search terms in wizard
  const [clientSearch, setClientSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Inline "Novo Equipamento" Drawer State
  const [showInlineNewEquipment, setShowInlineNewEquipment] = useState(false);
  const [newEqTipo, setNewEqTipo] = useState<EquipmentType>('PDV');
  const [newEqNome, setNewEqNome] = useState('');
  const [newEqPosicao, setNewEqPosicao] = useState('');
  const [newEqMarca, setNewEqMarca] = useState('');
  const [newEqModelo, setNewEqModelo] = useState('');
  const [newEqSerial, setNewEqSerial] = useState('');
  const [newEqIp, setNewEqIp] = useState('');

  // Step 4 Service Order Form State
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState('Carlos Silva');
  const [categoriaAtendimento, setCategoriaAtendimento] = useState('PDV & Frente de Caixa');
  const [tipoServico, setTipoServico] = useState<ServiceOrderType>('corretivo');
  const [prioridade, setPrioridade] = useState<ServiceOrderPriority>('ALTA');
  const [defeitoRelatado, setDefeitoRelatado] = useState('');
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');
  const [procedimentosExecutados, setProcedimentosExecutados] = useState('');
  const [pecasTrocadas, setPecasTrocadas] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus>('ABERTA');

  if (!isOpen) return null;

  // Selected Entities Objects
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId);

  // Filtered Clients (Step 1)
  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const lower = clientSearch.toLowerCase();
    return (
      c.razaoSocial.toLowerCase().includes(lower) ||
      (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(lower)) ||
      (c.codigo && c.codigo.toLowerCase().includes(lower)) ||
      (c.cnpj && c.cnpj.includes(lower))
    );
  });

  // Filtered Stores for Selected Client (Step 2)
  const availableStores = stores.filter((s) => s.clienteId === selectedClientId);
  const filteredStores = availableStores.filter((s) => {
    if (!storeSearch.trim()) return true;
    const lower = storeSearch.toLowerCase();
    return (
      s.nome.toLowerCase().includes(lower) ||
      s.codigoLoja.toLowerCase().includes(lower) ||
      s.cidade.toLowerCase().includes(lower) ||
      s.endereco.toLowerCase().includes(lower)
    );
  });

  // Filtered Equipments for Selected Store (Step 3)
  const storeEquipments = equipments.filter(
    (e) =>
      e.lojaId === selectedStoreId ||
      (selectedStore && e.lojaNome && e.lojaNome.toLowerCase() === selectedStore.nome.toLowerCase()) ||
      (selectedStore && e.lojaOrigem && e.lojaOrigem.toLowerCase() === selectedStore.nome.toLowerCase())
  );

  const filteredEquipments = storeEquipments.filter((e) => {
    if (!equipmentSearch.trim()) return true;
    const lower = equipmentSearch.toLowerCase();
    return (
      e.nome.toLowerCase().includes(lower) ||
      e.patrimonio.toLowerCase().includes(lower) ||
      (e.numeroSerie && e.numeroSerie.toLowerCase().includes(lower)) ||
      (e.posicaoCaixa && e.posicaoCaixa.toLowerCase().includes(lower)) ||
      (e.marcaModelo && e.marcaModelo.toLowerCase().includes(lower)) ||
      e.tipo.toLowerCase().includes(lower)
    );
  });

  // Previous Orders for Selected Equipment (Item 6 do prompt)
  const previousOrders = selectedEquipmentId ? getOrdersByEquipmentId(selectedEquipmentId) : [];

  // Handle saving new equipment directly during opening (Item 5 & 8 do prompt)
  const handleSaveInlineEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqNome.trim() || !selectedStore) return;

    const res = addEquipment({
      nome: newEqNome.trim(),
      patrimonio: '', // auto-generated
      tipo: newEqTipo,
      marca: newEqMarca.trim() || undefined,
      modelo: newEqModelo.trim() || undefined,
      marcaModelo: `${newEqMarca.trim()} ${newEqModelo.trim()}`.trim() || undefined,
      numeroSerie: newEqSerial.trim() || undefined,
      enderecoIp: newEqIp.trim() || undefined,
      posicaoCaixa: newEqPosicao.trim() || undefined,
      clienteId: selectedStore.clienteId,
      clienteNome: selectedStore.clienteNome,
      lojaId: selectedStore.id,
      lojaNome: selectedStore.nome,
      lojaOrigem: selectedStore.nome,
      localizacaoAtual: 'LOJA',
      status: 'EM_USO',
      dataPrimeiroCadastro: new Date().toISOString().split('T')[0],
      tecnicoResponsavel,
    });

    if (res.success && res.equipment) {
      setSelectedEquipmentId(res.equipment.id);
      setIsWithoutEquipment(false);
      setShowInlineNewEquipment(false);
      // Auto advance to step 4
      setCurrentStep(4);
    } else {
      alert(res.error || 'Erro ao cadastrar equipamento');
    }
  };

  // Submit complete Service Order
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defeitoRelatado.trim()) {
      alert('Por favor, informe a descrição do problema relatado.');
      return;
    }

    const machineIdent = isWithoutEquipment
      ? `Infraestrutura / Rede — ${selectedStore?.nome || 'Loja'}`
      : selectedEquipment?.nome || 'Equipamento TI';

    const newOs = addOrder({
      clienteId: selectedClient?.id,
      clienteNome: selectedClient?.nomeFantasia || selectedClient?.razaoSocial,
      lojaId: selectedStore?.id,
      lojaNome: selectedStore?.nome,
      lojaOrigem: selectedStore?.nome || 'Loja',
      lojaDestino: selectedStore?.nome,
      equipamentoId: isWithoutEquipment ? undefined : selectedEquipment?.id,
      equipamentoNome: isWithoutEquipment ? undefined : selectedEquipment?.nome,
      semEquipamento: isWithoutEquipment,
      identificacao: machineIdent,
      patrimonio: isWithoutEquipment ? undefined : selectedEquipment?.patrimonio,
      numeroSerie: isWithoutEquipment ? undefined : selectedEquipment?.numeroSerie,
      tipo: isWithoutEquipment ? 'OUTRO' : (selectedEquipment?.tipo as any) || 'PDV',
      tecnicoResponsavel,
      status,
      prioridade,
      categoriaAtendimento,
      tipoServico,
      defeitoRelatado: defeitoRelatado.trim(),
      diagnosticoTecnico: diagnosticoTecnico.trim() || undefined,
      procedimentosExecutados: procedimentosExecutados.trim() || undefined,
      servicosExecutados: procedimentosExecutados.trim() || undefined,
      pecasTrocadas: pecasTrocadas.trim() || undefined,
      dataEntrada: new Date().toISOString().split('T')[0],
      dataHoraAbertura: new Date().toISOString(),
      observacoes: observacoes.trim() || undefined,
      checklistProgresso: 0,
      checklistConcluido: false,
    });

    onOrderCreated?.(newOs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                Atendimento Técnico
              </span>
              <span className="text-xs text-slate-300">
                Abertura Rápida de Ordem de Serviço
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <span>Nova Ordem de Serviço</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Navigation Indicator */}
        <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 1
                  ? 'text-blue-700 font-extrabold'
                  : currentStep > 1
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                1
              </span>
              <span className="hidden sm:inline">Cliente</span>
            </button>

            <span className="text-slate-300">➔</span>

            <button
              type="button"
              disabled={!selectedClientId}
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 2
                  ? 'text-blue-700 font-extrabold'
                  : currentStep > 2
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                2
              </span>
              <span className="hidden sm:inline">Loja</span>
            </button>

            <span className="text-slate-300">➔</span>

            <button
              type="button"
              disabled={!selectedStoreId}
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 3
                  ? 'text-blue-700 font-extrabold'
                  : currentStep > 3
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 3 ? 'bg-blue-600 text-white' : currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                3
              </span>
              <span className="hidden sm:inline">Equipamento</span>
            </button>

            <span className="text-slate-300">➔</span>

            <button
              type="button"
              disabled={!selectedStoreId}
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 4 ? 'text-blue-700 font-extrabold' : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                4
              </span>
              <span className="hidden sm:inline">Atendimento</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          {/* =============================================================== */}
          {/* ETAPA 1 — Selecionar o Cliente (Matriz) */}
          {/* =============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Etapa 1 — Selecione o Cliente Matriz</h3>
                  <p className="text-slate-500">Escolha a empresa ou rede atendida para carregar as filiais vinculadas.</p>
                </div>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou código do cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Clients list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredClients.map((client) => {
                  const isSelected = selectedClientId === client.id;
                  const clientStoreCount = stores.filter((s) => s.clienteId === client.id).length;

                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        // Auto clear store if changing client
                        if (selectedStore?.clienteId !== client.id) {
                          setSelectedStoreId('');
                          setSelectedEquipmentId('');
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {client.nomeFantasia || client.razaoSocial}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                              {client.codigo}
                            </span>
                            {client.cnpj && <span>CNPJ: {client.cnpj}</span>}
                            <span>• {clientStoreCount} loja(s) vinculada(s)</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  disabled={!selectedClientId}
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Avançar para Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 2 — Selecionar a Loja / Filial */}
          {/* =============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Etapa 2 — Selecione a Loja de {selectedClient?.nomeFantasia || selectedClient?.razaoSocial}
                  </h3>
                  <p className="text-slate-500">Exibindo apenas lojas vinculadas ao cliente selecionado.</p>
                </div>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, número da loja ou cidade..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Stores list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredStores.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Nenhuma loja cadastrada para este cliente.
                  </div>
                ) : (
                  filteredStores.map((store) => {
                    const isSelected = selectedStoreId === store.id;
                    const eqCount = equipments.filter(
                      (e) => e.lojaId === store.id || (e.lojaNome && e.lojaNome.toLowerCase() === store.nome.toLowerCase())
                    ).length;

                    return (
                      <div
                        key={store.id}
                        onClick={() => {
                          setSelectedStoreId(store.id);
                          setSelectedEquipmentId('');
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <StoreIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{store.nome}</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                Cód: {store.codigoLoja}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{store.endereco}, {store.cidade} - {store.estado}</span>
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-1.5">
                              {store.responsavelLocal && <span>Resp: <strong>{store.responsavelLocal}</strong></span>}
                              {store.telefone && <span>Tel: <strong>{store.telefone}</strong></span>}
                              <span className="text-blue-700 font-bold">• {eqCount} equipamentos cadastrados</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedStoreId}
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Avançar para Equipamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 3 — Selecionar o Equipamento (+ Novo Equipamento / Sem Equipamento) */}
          {/* =============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Etapa 3 — Selecione o Equipamento de {selectedStore?.nome}
                  </h3>
                  <p className="text-slate-500">
                    Escolha a máquina cadastrada, registre um novo equipamento na hora ou abra OS sem equipamento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInlineNewEquipment(!showInlineNewEquipment)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Novo Equipamento</span>
                </button>
              </div>

              {/* Option: Atendimento sem equipamento (Rede / Infra / Manutenção Geral) */}
              <div
                onClick={() => {
                  setIsWithoutEquipment(true);
                  setSelectedEquipmentId('');
                  setShowInlineNewEquipment(false);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isWithoutEquipment
                    ? 'bg-amber-50/90 border-amber-500 ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isWithoutEquipment ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Atendimento sem equipamento específico
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Problemas de rede, internet, cabeamento estruturado, infraestrutura ou manutenção geral da loja.
                    </div>
                  </div>
                </div>

                {isWithoutEquipment && (
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                )}
              </div>

              {/* Compact Inline Form: Cadastrar Novo Equipamento diretamente na OS */}
              {showInlineNewEquipment && (
                <form
                  onSubmit={handleSaveInlineEquipment}
                  className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                    <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Cadastrar Equipamento e Vincular a esta OS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewEquipment(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-bold">
                    {(['PDV', 'COMPUTADOR', 'IMPRESSORA', 'BALANCA', 'DVR', 'ROTEADOR', 'SWITCH', 'OUTRO'] as EquipmentType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewEqTipo(t)}
                        className={`py-1 px-1.5 rounded-lg text-center text-[11px] ${
                          newEqTipo === t ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Nome / Identificação *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: PDV 03, Impressora Caixa 02"
                        value={newEqNome}
                        onChange={(e) => setNewEqNome(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Posição / Caixa</label>
                      <input
                        type="text"
                        placeholder="Ex: Caixa 03, Balcão Frios"
                        value={newEqPosicao}
                        onChange={(e) => setNewEqPosicao(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Marca</label>
                      <input
                        type="text"
                        placeholder="Ex: Dell, Toledo, Epson"
                        value={newEqMarca}
                        onChange={(e) => setNewEqMarca(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: OptiPlex, Prix 5"
                        value={newEqModelo}
                        onChange={(e) => setNewEqModelo(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Número de Série (se houver)</label>
                      <input
                        type="text"
                        placeholder="Service Tag / Serial"
                        value={newEqSerial}
                        onChange={(e) => setNewEqSerial(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInlineNewEquipment(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </form>
              )}

              {/* Equipments search in this store */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar equipamento pelo código, nome, número do caixa, marca ou modelo..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Equipments list in store */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEquipments.length === 0 ? (
                  <div className="p-5 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Nenhum equipamento encontrado nesta loja com este termo.
                  </div>
                ) : (
                  filteredEquipments.map((eq) => {
                    const isSelected = selectedEquipmentId === eq.id && !isWithoutEquipment;

                    return (
                      <div
                        key={eq.id}
                        onClick={() => {
                          setSelectedEquipmentId(eq.id);
                          setIsWithoutEquipment(false);
                          setShowInlineNewEquipment(false);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{eq.nome}</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {eq.patrimonio}
                              </span>
                              {eq.posicaoCaixa && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                  {eq.posicaoCaixa}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{eq.marcaModelo || eq.tipo}</span>
                              {eq.numeroSerie && <span>• Serial: <strong className="font-mono">{eq.numeroSerie}</strong></span>}
                              {eq.enderecoIp && <span>• IP: <strong className="font-mono">{eq.enderecoIp}</strong></span>}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Item 6 do prompt: Exibir histórico anterior do equipamento selecionado */}
              {selectedEquipment && !isWithoutEquipment && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-blue-600" />
                      Histórico Anterior de Atendimentos ({previousOrders.length})
                    </span>
                    {previousOrders.length > 0 && (
                      <span className="text-[11px] text-blue-700 font-semibold">
                        Último em: {formatDateBR(previousOrders[0].dataEntrada)}
                      </span>
                    )}
                  </div>

                  {previousOrders.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic">
                      Primeiro atendimento registrado para este equipamento no sistema.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {previousOrders.slice(0, 3).map((oldOs) => (
                        <div key={oldOs.id} className="p-2 rounded-lg bg-white border border-blue-100 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-blue-700 font-mono">{oldOs.numeroOs}</span>
                            <span className="text-slate-500">{formatDateBR(oldOs.dataEntrada)} • {oldOs.tecnicoResponsavel}</span>
                          </div>
                          <div className="text-slate-800">
                            <strong>Problema:</strong> {oldOs.defeitoRelatado}
                          </div>
                          {(oldOs.solucaoAplicada || oldOs.servicosExecutados) && (
                            <div className="text-emerald-800 font-medium">
                              <strong>Solução:</strong> {oldOs.solucaoAplicada || oldOs.servicosExecutados}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedEquipmentId && !isWithoutEquipment}
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Avançar para Detalhes da OS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 4 — Registrar o Atendimento Técnico */}
          {/* =============================================================== */}
          {currentStep === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in duration-150">
              {/* Context Summary Header */}
              <div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-200/90 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Cliente Matriz:</span>
                  <strong className="text-slate-900 font-bold">{selectedClient?.nomeFantasia || selectedClient?.razaoSocial}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Loja / Filial:</span>
                  <strong className="text-slate-900 font-bold">{selectedStore?.nome}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Equipamento:</span>
                  <strong className="text-blue-700 font-bold">
                    {isWithoutEquipment ? 'Infraestrutura Geral da Loja' : selectedEquipment?.nome || 'Equipamento'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Técnico Responsável</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={tecnicoResponsavel}
                    onChange={(e) => setTecnicoResponsavel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria do Atendimento</label>
                  <select
                    value={categoriaAtendimento}
                    onChange={(e) => setCategoriaAtendimento(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="PDV & Frente de Caixa">PDV & Frente de Caixa</option>
                    <option value="Balança e Automação">Balança e Automação</option>
                    <option value="Impressora Térmica">Impressora Térmica</option>
                    <option value="Rede e Conectividade">Rede e Conectividade</option>
                    <option value="Computador Administrativo">Computador Administrativo</option>
                    <option value="CFTV & Segurança">CFTV & Segurança</option>
                    <option value="Sistema / Software">Sistema / Software</option>
                    <option value="Outro Atendimento">Outro Atendimento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Serviço</label>
                  <select
                    value={tipoServico}
                    onChange={(e) => setTipoServico(e.target.value as ServiceOrderType)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="corretivo">Manutenção Corretiva</option>
                    <option value="preventivo">Manutenção Preventiva</option>
                    <option value="instalacao">Instalação de Novo Equipamento</option>
                    <option value="configuracao">Configuração / Carga de Parâmetros</option>
                    <option value="atualizacao">Atualização de Sistema / Drivers</option>
                    <option value="outro">Outro Tipo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as ServiceOrderPriority)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica (Interrupção de Venda/Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Inicial</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="ABERTA">Aberta / Pendente</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                    <option value="CONCLUIDA">Concluída na Loja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição do Problema Relatado <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descreva o sintoma ou defeito informado pela loja (ex: frente de caixa não inicia Windows, tela azul, erro de porta serial da balança...)"
                  value={defeitoRelatado}
                  onChange={(e) => setDefeitoRelatado(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Diagnóstico Técnico <span className="text-slate-400 font-normal">(pode ser preenchido durante o atendimento)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Análise do técnico sobre a causa raiz do problema..."
                    value={diagnosticoTecnico}
                    onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Procedimentos Executados <span className="text-slate-400 font-normal">(pode ser atualizado depois)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ações realizadas (ex: troca de cabo de rede, reinicialização de switch, reinstalação de driver...)"
                    value={procedimentosExecutados}
                    onChange={(e) => setProcedimentosExecutados(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peças ou Componentes Utilizados</label>
                  <input
                    type="text"
                    placeholder="Ex: SSD 240GB Kingston, Cabo patch cord Cat6, Fonte 12V..."
                    value={pecasTrocadas}
                    onChange={(e) => setPecasTrocadas(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observações de Atendimento</label>
                  <input
                    type="text"
                    placeholder="Instruções para o operador ou notas internas..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Abrir Ordem de Serviço</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
