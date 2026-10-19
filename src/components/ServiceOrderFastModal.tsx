import React, { useState, useMemo } from 'react';
import { useBranches } from '../context/BranchContext';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { BranchUnit } from '../types/branch';
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
  Building,
} from 'lucide-react';

interface ServiceOrderFastModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBranch?: BranchUnit | null;
  preselectedStore?: any;
  preselectedEquipment?: Equipment | null;
  onOrderCreated?: (order: ServiceOrder) => void;
}

export const ServiceOrderFastModal: React.FC<ServiceOrderFastModalProps> = ({
  isOpen,
  onClose,
  preselectedBranch,
  preselectedStore,
  preselectedEquipment,
  onOrderCreated,
}) => {
  const { branches, matriz, filiais } = useBranches();
  const { equipments, addEquipment } = useEquipment();
  const { addOrder, getOrdersByEquipmentId } = useServiceOrders();

  // Wizard Steps (1: Matriz/Filial, 2: Equipamento, 3: Atendimento)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (preselectedEquipment && (preselectedBranch || preselectedStore)) return 3;
    if (preselectedBranch || preselectedStore) return 2;
    return 1;
  });

  // Selected Branch (Matriz ou Filial da aba Lojas)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (preselectedBranch?.id) return preselectedBranch.id;
    if (preselectedStore?.id) return preselectedStore.id;
    if (preselectedEquipment?.lojaId) return preselectedEquipment.lojaId;
    return branches[0]?.id || '';
  });

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(() => {
    return preselectedEquipment?.id || '';
  });

  const [isWithoutEquipment, setIsWithoutEquipment] = useState<boolean>(false);

  // Search and filter terms in wizard
  const [branchSearch, setBranchSearch] = useState('');
  const [branchFilterType, setBranchFilterType] = useState<'TODAS' | 'MATRIZ' | 'FILIAL'>('TODAS');
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

  // Step 3 Service Order Form State
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
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected Branch Object from Aba Lojas
  const selectedBranch: BranchUnit | undefined =
    branches.find((b) => b.id === selectedBranchId) ||
    branches.find((b) => b.nomeFantasia === preselectedStore?.nome) ||
    branches[0];

  const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId);

  // Filtered Branches from Aba Lojas (Step 1)
  const filteredBranches = branches.filter((b) => {
    if (branchFilterType !== 'TODAS' && b.tipo !== branchFilterType) {
      return false;
    }
    if (!branchSearch.trim()) return true;
    const lower = branchSearch.toLowerCase();
    return (
      b.nomeFantasia.toLowerCase().includes(lower) ||
      b.razaoSocial.toLowerCase().includes(lower) ||
      b.idOriginal.toLowerCase().includes(lower) ||
      b.municipio.toLowerCase().includes(lower) ||
      b.endereco.toLowerCase().includes(lower) ||
      (b.cnpj && b.cnpj.includes(lower))
    );
  });

  // Filtered Equipments for Selected Branch (Step 2)
  const branchEquipments = equipments.filter((e) => {
    if (!selectedBranch) return false;
    return (
      e.lojaId === selectedBranch.id ||
      (e.lojaNome && e.lojaNome.toLowerCase() === selectedBranch.nomeFantasia.toLowerCase()) ||
      (e.lojaOrigem && e.lojaOrigem.toLowerCase() === selectedBranch.nomeFantasia.toLowerCase()) ||
      (e.lojaNome && e.lojaNome.includes(`Loja ${selectedBranch.idOriginal}`)) ||
      (e.lojaOrigem && e.lojaOrigem.includes(`Loja ${selectedBranch.idOriginal}`))
    );
  });

  const filteredEquipments = branchEquipments.filter((e) => {
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

  // Previous Orders for Selected Equipment
  const previousOrders = selectedEquipmentId ? getOrdersByEquipmentId(selectedEquipmentId) : [];

  // Handle saving new equipment directly during opening
  const handleSaveInlineEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqNome.trim() || !selectedBranch) return;

    const res = addEquipment({
      nome: newEqNome.trim(),
      patrimonio: '',
      tipo: newEqTipo,
      marca: newEqMarca.trim() || undefined,
      modelo: newEqModelo.trim() || undefined,
      marcaModelo: `${newEqMarca.trim()} ${newEqModelo.trim()}`.trim() || undefined,
      numeroSerie: newEqSerial.trim() || undefined,
      enderecoIp: newEqIp.trim() || undefined,
      posicaoCaixa: newEqPosicao.trim() || undefined,
      clienteId: selectedBranch.id,
      clienteNome: selectedBranch.tipo === 'MATRIZ' ? selectedBranch.nomeFantasia : 'Mark Security',
      lojaId: selectedBranch.id,
      lojaNome: selectedBranch.nomeFantasia,
      lojaOrigem: selectedBranch.nomeFantasia,
      localizacaoAtual: 'LOJA',
      status: 'EM_USO',
      dataPrimeiroCadastro: new Date().toISOString().split('T')[0],
      tecnicoResponsavel,
    });

    if (res.success && res.equipment) {
      setSelectedEquipmentId(res.equipment.id);
      setIsWithoutEquipment(false);
      setShowInlineNewEquipment(false);
      setFormError(null);
      setCurrentStep(3);
    } else {
      setFormError(res.error || 'Erro ao cadastrar equipamento');
    }
  };

  // Submit complete Service Order
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defeitoRelatado.trim()) {
      setFormError('Por favor, informe a descrição do problema relatado.');
      return;
    }
    if (!selectedBranch) {
      setFormError('Selecione uma filial ou matriz cadastrada.');
      return;
    }
    setFormError(null);

    const machineIdent = isWithoutEquipment
      ? `Infraestrutura / Rede — ${selectedBranch.nomeFantasia}`
      : selectedEquipment?.nome || 'Equipamento TI';

    const newOs = addOrder({
      clienteId: selectedBranch.tipo === 'MATRIZ' ? selectedBranch.id : (selectedBranch.matrizVinculadaId || 'branch_ptn_matriz'),
      clienteNome: selectedBranch.tipo === 'MATRIZ' ? selectedBranch.nomeFantasia : 'Mark Security',
      lojaId: selectedBranch.id,
      lojaNome: selectedBranch.nomeFantasia,
      lojaOrigem: selectedBranch.nomeFantasia,
      lojaDestino: selectedBranch.nomeFantasia,
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

        {/* 3-Step Navigation Indicator */}
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
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 1
                    ? 'bg-blue-600 text-white'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                1
              </span>
              <span>1. Matriz / Filial</span>
            </button>

            <span className="text-slate-300">➔</span>

            <button
              type="button"
              disabled={!selectedBranchId}
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 2
                  ? 'text-blue-700 font-extrabold'
                  : currentStep > 2
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 2
                    ? 'bg-blue-600 text-white'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                2
              </span>
              <span>2. Equipamento</span>
            </button>

            <span className="text-slate-300">➔</span>

            <button
              type="button"
              disabled={!selectedBranchId}
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 3 ? 'text-blue-700 font-extrabold' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                3
              </span>
              <span>3. Atendimento</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 1 — Selecionar a Matriz ou Filial (da aba Lojas) */}
          {/* =============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Etapa 1 — Selecione a Matriz ou Filial
                  </h3>
                  <p className="text-slate-500">
                    Selecione a unidade cadastrada na aba Lojas para direcionar o atendimento técnico.
                  </p>
                </div>

                {/* Filter Tabs: TODAS, MATRIZ, FILIAIS */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBranchFilterType('TODAS')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      branchFilterType === 'TODAS'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todas ({branches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchFilterType('MATRIZ')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      branchFilterType === 'MATRIZ'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Matriz ({matriz ? 1 : 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchFilterType('FILIAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      branchFilterType === 'FILIAL'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏬 Filiais ({filiais.length})
                  </button>
                </div>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por código (ex: 01, 02), nome da loja, município ou endereço..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Branches list */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredBranches.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Nenhuma unidade encontrada para esta pesquisa.
                  </div>
                ) : (
                  filteredBranches.map((branch) => {
                    const isSelected = selectedBranchId === branch.id;
                    const eqCount = equipments.filter(
                      (e) =>
                        e.lojaId === branch.id ||
                        (e.lojaNome && e.lojaNome.toLowerCase() === branch.nomeFantasia.toLowerCase()) ||
                        (e.lojaOrigem && e.lojaOrigem.toLowerCase() === branch.nomeFantasia.toLowerCase()) ||
                        (e.lojaNome && e.lojaNome.includes(`Loja ${branch.idOriginal}`))
                    ).length;

                    return (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setSelectedBranchId(branch.id);
                          setSelectedEquipmentId('');
                          setIsWithoutEquipment(false);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                              branch.tipo === 'MATRIZ'
                                ? 'bg-amber-100 text-amber-800'
                                : isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {branch.tipo === 'MATRIZ' ? (
                              <Building2 className="w-5 h-5" />
                            ) : (
                              <StoreIcon className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  branch.tipo === 'MATRIZ'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-blue-100 text-blue-800 font-mono'
                                }`}
                              >
                                {branch.tipo === 'MATRIZ' ? 'MATRIZ' : `FILIAL ${branch.idOriginal}`}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {branch.nomeFantasia}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>
                                {branch.endereco}, {branch.municipio} - {branch.uf}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-1.5 flex-wrap">
                              {branch.responsavelLocal && (
                                <span>
                                  Resp: <strong>{branch.responsavelLocal}</strong>
                                </span>
                              )}
                              {branch.telefone && (
                                <span>
                                  Tel: <strong>{branch.telefone}</strong>
                                </span>
                              )}
                              <span className="text-blue-700 font-bold">
                                • {eqCount} equipamentos cadastrados
                              </span>
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
                <div className="text-xs text-slate-500">
                  {selectedBranch && (
                    <span>
                      Selecionada: <b className="text-slate-900">{selectedBranch.nomeFantasia}</b>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedBranchId}
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Avançar para Equipamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 2 — Selecionar o Equipamento (+ Novo / Sem Equipamento) */}
          {/* =============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Selected Branch Banner */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    {selectedBranch?.tipo === 'MATRIZ' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <StoreIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-700">
                      Unidade Selecionada (Aba Lojas)
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      {selectedBranch?.nomeFantasia}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Trocar Loja
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Etapa 2 — Selecione o Equipamento
                  </h3>
                  <p className="text-slate-500">
                    Escolha uma máquina desta unidade, abra OS de infraestrutura ou registre um novo equipamento.
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

              {/* Option: Atendimento sem equipamento (Rede / Infra / Geral) */}
              <div
                onClick={() => {
                  setIsWithoutEquipment(true);
                  setSelectedEquipmentId('');
                  setShowInlineNewEquipment(false);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isWithoutEquipment
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isWithoutEquipment ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Atendimento sem equipamento físico específico
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Problemas de internet, link de contingência Claro, cabeamento estruturado, infraestrutura ou manutenção geral desta unidade.
                    </div>
                  </div>
                </div>

                {isWithoutEquipment && (
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                )}
              </div>

              {/* Compact Inline Form: Cadastrar Novo Equipamento */}
              {showInlineNewEquipment && (
                <form
                  onSubmit={handleSaveInlineEquipment}
                  className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                    <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Cadastrar Equipamento em {selectedBranch?.nomeFantasia}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewEquipment(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                        className={`py-1 px-1.5 rounded-lg text-center text-[11px] cursor-pointer ${
                          newEqTipo === t
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
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
                        placeholder="Ex: PDV 04, Impressora Caixa 02"
                        value={newEqNome}
                        onChange={(e) => setNewEqNome(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Posição / Setor</label>
                      <input
                        type="text"
                        placeholder="Ex: Caixa 02, Balcão de Frios"
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
                        placeholder="Ex: OptiPlex 3050"
                        value={newEqModelo}
                        onChange={(e) => setNewEqModelo(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Nº de Série</label>
                      <input
                        type="text"
                        placeholder="Ex: BRJ9045-DEL"
                        value={newEqSerial}
                        onChange={(e) => setNewEqSerial(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setShowInlineNewEquipment(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </form>
              )}

              {/* Search box for equipments */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar máquina por nome, patrimônio, posição ou serial..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Equipments list */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredEquipments.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Nenhum equipamento cadastrado ainda nesta unidade. Você pode cadastrar um no botão acima ou selecionar a opção de atendimento sem equipamento.
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
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {eq.tipo === 'PDV' || eq.tipo === 'COMPUTADOR' ? (
                              <Laptop className="w-4 h-4" />
                            ) : eq.tipo === 'IMPRESSORA' ? (
                              <Printer className="w-4 h-4" />
                            ) : eq.tipo === 'BALANCA' ? (
                              <Scale className="w-4 h-4" />
                            ) : eq.tipo === 'DVR' ? (
                              <Video className="w-4 h-4" />
                            ) : eq.tipo === 'ROTEADOR' ? (
                              <Router className="w-4 h-4" />
                            ) : eq.tipo === 'SWITCH' ? (
                              <Network className="w-4 h-4" />
                            ) : (
                              <Server className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {eq.nome}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {eq.tipo}
                              </span>
                              {eq.patrimonio && (
                                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/50">
                                  {eq.patrimonio}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {eq.posicaoCaixa && <span>Posição: {eq.posicaoCaixa}</span>}
                              {eq.marcaModelo && <span>• {eq.marcaModelo}</span>}
                              {eq.numeroSerie && <span>• SN: {eq.numeroSerie}</span>}
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

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Loja</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedEquipmentId && !isWithoutEquipment}
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Avançar para Atendimento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* ETAPA 3 — Formulário de Atendimento e Defeito Relatado */}
          {/* =============================================================== */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in duration-150">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Branch Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                      {selectedBranch?.tipo === 'MATRIZ' ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <StoreIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        {selectedBranch?.tipo === 'MATRIZ' ? 'Matriz' : `Filial ${selectedBranch?.idOriginal}`}
                      </div>
                      <div className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                        {selectedBranch?.nomeFantasia}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>

                {/* Equipment Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      {isWithoutEquipment ? <Network className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Equipamento</div>
                      <div className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                        {isWithoutEquipment ? 'Infraestrutura / Sem Equipamento' : selectedEquipment?.nome}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>
              </div>

              {/* History Alert if Equipment had previous tickets */}
              {previousOrders.length > 0 && !isWithoutEquipment && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-600" />
                    <span>Histórico Técnico: {previousOrders.length} OS anteriores para este equipamento</span>
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Último atendimento: <b>{previousOrders[0]?.numeroOs}</b> ({previousOrders[0]?.status}) em{' '}
                    {formatDateBR(previousOrders[0]?.dataEntrada)}. Defeito anterior: "{previousOrders[0]?.defeitoRelatado}"
                  </div>
                </div>
              )}

              {/* Operational Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Técnico Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={tecnicoResponsavel}
                    onChange={(e) => setTecnicoResponsavel(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    placeholder="Nome do técnico de atendimento"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoria do Atendimento
                  </label>
                  <select
                    value={categoriaAtendimento}
                    onChange={(e) => setCategoriaAtendimento(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
                  >
                    <option value="PDV & Frente de Caixa">PDV & Frente de Caixa</option>
                    <option value="Balança e Automação">Balança e Automação</option>
                    <option value="Rede e Infraestrutura">Rede e Infraestrutura</option>
                    <option value="Impressora / ECF">Impressora / ECF</option>
                    <option value="Computador / Escritório">Computador / Escritório</option>
                    <option value="CFTV / Câmeras">CFTV / Câmeras</option>
                    <option value="Servidor / Retaguarda">Servidor / Retaguarda</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Serviço
                  </label>
                  <select
                    value={tipoServico}
                    onChange={(e) => setTipoServico(e.target.value as ServiceOrderType)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
                  >
                    <option value="corretivo">Manutenção Corretiva</option>
                    <option value="preventivo">Manutenção Preventiva</option>
                    <option value="instalacao">Instalação & Ativação</option>
                    <option value="configuracao">Configuração & Ajustes</option>
                    <option value="atualizacao">Atualização de Sistema</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as ServiceOrderPriority)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica (Loja / PDV Parado)</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Inicial da OS
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                  >
                    <option value="ABERTA">Aberta / Nova</option>
                    <option value="EM_ANDAMENTO">Em Atendimento</option>
                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Defeito Relatado / Motivo do Chamado *
                </label>
                <textarea
                  required
                  rows={3}
                  value={defeitoRelatado}
                  onChange={(e) => setDefeitoRelatado(e.target.value)}
                  placeholder="Ex: Frente de caixa travando no fechamento de cupom fiscal; balança não comunica com sistema..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Diagnóstico Técnico Inicial (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosticoTecnico}
                    onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                    placeholder="Ex: Falha na porta COM3, SSD com setores corrompidos..."
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Procedimentos / Peças Previstas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={procedimentosExecutados}
                    onChange={(e) => setProcedimentosExecutados(e.target.value)}
                    placeholder="Ex: Troca de cabo serial, regravação de imagem padrão Windows..."
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Gerais (Opcional)
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Contato no local: Carlos (Gerente), ramal 102."
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Abrir Ordem de Serviço</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
