import React, { useState } from 'react';
import {
  MaintenanceRecord,
  MaintenanceChecklist,
  MaintenancePiece,
  MAINTENANCE_STATUS_LABELS,
} from '../types/maintenance';
import { useMaintenance } from '../context/MaintenanceContext';
import { useAuth } from '../context/AuthContext';
import { formatDateBR, formatDateTimeBR } from '../utils/dateFormatter';
import {
  X,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Laptop,
  Store,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Calendar,
  User,
  History,
  Tag,
  ShieldCheck,
  AlertCircle,
  Truck,
  FileCheck2,
  Cpu,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord | null;
  onOpenDispatchModal?: (record: MaintenanceRecord) => void;
  onOpenDeliveryModal?: (record: MaintenanceRecord) => void;
}

export const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onOpenDispatchModal,
  onOpenDeliveryModal,
}) => {
  const { user } = useAuth();
  const {
    saveChecklistAndDiagnostics,
    finalizeMaintenance,
    startTesting,
  } = useMaintenance();

  const [activeTab, setActiveTab] = useState<'bancada' | 'logistica' | 'historico'>('bancada');

  // Technician working on bench
  const [tecnicoBancada, setTecnicoBancada] = useState(
    record?.tecnicoBancada || user?.nome || 'Carlos Silva'
  );

  // Checklist state
  const [checklist, setChecklist] = useState<MaintenanceChecklist>(() => {
    return record?.checklist || {
      testeInicializacao: false,
      testeMemoriaRam: false,
      testeArmazenamento: false,
      testePortasComunicacao: false,
      testeRedeConectividade: false,
      testeTermicoCooler: false,
      testeFonteAlimentacao: false,
      testePerifericos: false,
      testeSistemaOperacional: false,
      limpezaInternaExterna: false,
      testesFinaisAprovados: false,
    };
  });

  // Diagnostics and work description
  const [problemasEncontrados, setProblemasEncontrados] = useState(
    record?.problemasEncontrados || ''
  );
  const [alteracoesExecutadas, setAlteracoesExecutadas] = useState(
    record?.alteracoesExecutadas || ''
  );
  const [servicosExecutados, setServicosExecutados] = useState(
    record?.servicosExecutados || ''
  );

  // Pieces
  const [pecas, setPecas] = useState<MaintenancePiece[]>(() => {
    return record?.pecasNecessarias || [];
  });
  const [novaPecaDesc, setNovaPecaDesc] = useState('');
  const [novaPecaQtd, setNovaPecaQtd] = useState(1);
  const [novaPecaSerial, setNovaPecaSerial] = useState('');
  const [novaPecaStatus, setNovaPecaStatus] = useState<'UTILIZADA' | 'AGUARDANDO_CHEGADA'>('UTILIZADA');

  // Finalization Dialog State
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [finishDecision, setFinishDecision] = useState<'CONCLUIDA' | 'PENDENTE'>('CONCLUIDA');
  const [limpezaOk, setLimpezaOk] = useState(true);
  const [testesFinaisOk, setTestesFinaisOk] = useState(true);
  const [motivoNaoConcluida, setMotivoNaoConcluida] = useState(record?.motivoNaoConcluida || '');

  // Notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const statusCfg = MAINTENANCE_STATUS_LABELS[record.status];

  // Helper toggle checklist
  const handleToggleChecklist = (key: keyof MaintenanceChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAllChecks = (value: boolean) => {
    setChecklist({
      testeInicializacao: value,
      testeMemoriaRam: value,
      testeArmazenamento: value,
      testePortasComunicacao: value,
      testeRedeConectividade: value,
      testeTermicoCooler: value,
      testeFonteAlimentacao: value,
      testePerifericos: value,
      testeSistemaOperacional: value,
      limpezaInternaExterna: value,
      testesFinaisAprovados: value,
    });
  };

  // Add piece to list
  const handleAddPiece = () => {
    if (!novaPecaDesc.trim()) return;
    const newPiece: MaintenancePiece = {
      id: `p_${Date.now()}`,
      descricao: novaPecaDesc.trim(),
      quantidade: novaPecaQtd,
      numeroSerie: novaPecaSerial.trim() || undefined,
      status: novaPecaStatus,
      dataRegistro: new Date().toISOString(),
    };
    setPecas((prev) => [...prev, newPiece]);
    setNovaPecaDesc('');
    setNovaPecaSerial('');
    setNovaPecaQtd(1);
  };

  const handleRemovePiece = (id: string) => {
    setPecas((prev) => prev.filter((p) => p.id !== id));
  };

  // Quick symptom tag click
  const handleAddQuickSymptom = (tag: string) => {
    setProblemasEncontrados((prev) => (prev ? `${prev}; ${tag}` : tag));
  };

  // Save Progress draft
  const handleSaveDraft = () => {
    saveChecklistAndDiagnostics(
      record.id,
      checklist,
      problemasEncontrados,
      pecas,
      alteracoesExecutadas,
      servicosExecutados,
      tecnicoBancada
    );
    setSaveSuccessMsg('Progresso e testes salvos com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Submit Finalization
  const handleConfirmFinalization = () => {
    setFinishError(null);
    if (finishDecision === 'CONCLUIDA') {
      const res = finalizeMaintenance(record.id, {
        approved: true,
        limpezaOk,
        testesFinaisOk,
        techName: tecnicoBancada,
      });
      if (res.success) {
        setShowFinishDialog(false);
        onClose();
      } else {
        setFinishError(res.error || 'Erro ao finalizar');
      }
    } else {
      if (!motivoNaoConcluida.trim()) {
        setFinishError('O motivo da pendência é obrigatório.');
        return;
      }
      const res = finalizeMaintenance(record.id, {
        approved: false,
        motivoNaoConcluida: motivoNaoConcluida.trim(),
        techName: tecnicoBancada,
      });
      if (res.success) {
        setShowFinishDialog(false);
        onClose();
      } else {
        setFinishError(res.error || 'Erro ao registrar pendência');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <Laptop className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-600 text-white">
                  {record.numeroOs}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badgeBg} ${statusCfg.textBadge}`}
                >
                  {statusCfg.label}
                </span>
                <span className="text-xs text-slate-300">
                  {record.tipoEquipamento} • {record.lojaOrigem}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>{record.equipamentoNome}</span>
                {record.patrimonio && (
                  <span className="text-xs font-mono text-slate-300 font-normal">
                    (Pat: {record.patrimonio})
                  </span>
                )}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('bancada')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'bancada'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Bancada de Testes & Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logistica')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'logistica'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Despacho & Entrega na Loja</span>
              {(record.retiradaRegistrada || record.entregaRegistrada) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico & Auditoria</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-800">
                {record.historicoEventos.length}
              </span>
            </button>
          </div>

          {record.status === 'RECEBIDA' && (
            <button
              type="button"
              onClick={() => startTesting(record.id, tecnicoBancada)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Assumir Bancada</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Pending Alert banner if record is PENDENTE */}
          {record.status === 'PENDENTE' && record.motivoNaoConcluida && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs block text-rose-950">
                  Manutenção Pendente (Não Concluída)
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Motivo registrado: <b>{record.motivoNaoConcluida}</b>
                </p>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: BANCADA DE TESTES & CHECKLIST */}
          {/* =============================================================== */}
          {activeTab === 'bancada' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Technician Header */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">Técnico de Bancada:</span>
                  <input
                    type="text"
                    value={tecnicoBancada}
                    onChange={(e) => setTecnicoBancada(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs w-44"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Entrada: <b>{formatDateTimeBR(record.dataHoraEntrada)}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleAllChecks(true)}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Marcar Todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAllChecks(false)}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Checklist Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Checklist dos Testes Técnicos Realizados
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {Object.values(checklist).filter(Boolean).length} de 11 aprovados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'testeInicializacao', label: '1. Inicialização, BIOS & POST sem erros' },
                    { key: 'testeMemoriaRam', label: '2. Memória RAM (Estresse e integridade)' },
                    { key: 'testeArmazenamento', label: '3. Saúde do Disco (SMART SSD / HD)' },
                    { key: 'testePortasComunicacao', label: '4. Portas USB, Seriais e Comunicação' },
                    { key: 'testeRedeConectividade', label: '5. Rede Ethernet Cabeada / Wi-Fi' },
                    { key: 'testeTermicoCooler', label: '6. Temperatura CPU & Limpeza Cooler' },
                    { key: 'testeFonteAlimentacao', label: '7. Fonte de Alimentação & Tensões' },
                    { key: 'testePerifericos', label: '8. Periféricos (Balança / Impressora / Leitor)' },
                    { key: 'testeSistemaOperacional', label: '9. Sistema Operacional & Drivers PDV' },
                    { key: 'limpezaInternaExterna', label: '10. Limpeza Técnica Interna & Higienização' },
                    { key: 'testesFinaisAprovados', label: '11. Teste Final de Bancada sob Estresse' },
                  ].map((item) => {
                    const isChecked = checklist[item.key as keyof MaintenanceChecklist];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleChecklist(item.key as keyof MaintenanceChecklist)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs">{item.label}</span>
                        </div>
                        {isChecked && (
                          <span className="text-[10px] uppercase font-black text-emerald-700">OK</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Problemas Encontrados */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Problemas Encontrados no Diagnóstico
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>Tags rápidas:</span>
                    {['Lentidão / Boot', 'Superaquecimento', 'Curto Fonte', 'SSD Danificado', 'Placa de Rede'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddQuickSymptom(tag)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                        >
                          +{tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={problemasEncontrados}
                  onChange={(e) => setProblemasEncontrados(e.target.value)}
                  placeholder="Descreva detalhadamente os problemas constatados durante os testes de bancada..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Peças Necessárias / Substituídas */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Peças Necessárias / Substituídas ({pecas.length})
                  </span>
                </div>

                {/* Add inline piece */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Descrição da Peça</label>
                    <input
                      type="text"
                      placeholder="Ex: SSD 240GB Kingston, Fonte Dell 180W, Cabo Serial..."
                      value={novaPecaDesc}
                      onChange={(e) => setNovaPecaDesc(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Qtd</label>
                    <input
                      type="number"
                      min={1}
                      value={novaPecaQtd}
                      onChange={(e) => setNovaPecaQtd(parseInt(e.target.value, 10) || 1)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nº Serial (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: KNG-88910"
                      value={novaPecaSerial}
                      onChange={(e) => setNovaPecaSerial(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPiece}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Pieces list */}
                {pecas.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {pecas.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{p.descricao}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            Qtd: {p.quantidade}
                          </span>
                          {p.numeroSerie && (
                            <span className="font-mono text-[10px] text-blue-700">SN: {p.numeroSerie}</span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              p.status === 'UTILIZADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status === 'UTILIZADA' ? 'Instalada' : 'Aguardando Chegada'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePiece(p.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alterações e Serviços Executados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Alterações Executadas (Hardware / Configuração)
                  </label>
                  <textarea
                    rows={2}
                    value={alteracoesExecutadas}
                    onChange={(e) => setAlteracoesExecutadas(e.target.value)}
                    placeholder="Ex: Substituição de pasta térmica por prata; upgrade de RAM para 16GB..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Serviços Técnicos Executados
                  </label>
                  <textarea
                    rows={2}
                    value={servicosExecutados}
                    onChange={(e) => setServicosExecutados(e.target.value)}
                    placeholder="Ex: Formatação com imagem padrão Windows 10, configuração do PDV e driver da impressora..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-blue-600" />
                  <span>Salvar Progresso</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFinishDecision('PENDENTE');
                      setShowFinishDialog(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Finalizar como Não Concluída (Pendente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFinishDecision('CONCLUIDA');
                      setShowFinishDialog(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar Manutenção (Concluída)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: DESPACHO & ENTREGA NA LOJA */}
          {/* =============================================================== */}
          {activeTab === 'logistica' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  <span>Fluxo de Retirada e Entrega na Loja</span>
                </h3>
                <p className="text-slate-500 text-xs">
                  Após a conclusão dos testes no laboratório, a máquina fica com status <b>Disponível para envio à loja</b>, permitindo o registro de saída para transporte e a subsequente confirmação de entrega.
                </p>

                {/* Step 1: Retirada */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Retirada para Transporte</span>
                      {record.retiradaRegistrada ? (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Registrada
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          Aguardando Retirada
                        </span>
                      )}
                    </div>

                    {record.retiradaRegistrada ? (
                      <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                        <div>Técnico de Transporte: <b>{record.tecnicoRetirada}</b></div>
                        <div>Destino: <b>{record.destinoEnvio || record.lojaDestino}</b></div>
                        <div>Data/Hora: <b>{formatDateTimeBR(record.dataHoraRetirada)}</b></div>
                        {record.observacoesRetirada && (
                          <div className="text-slate-500 italic">"{record.observacoesRetirada}"</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        A máquina ainda está no laboratório aguardando retirada pelo técnico de suporte externo.
                      </p>
                    )}
                  </div>

                  {!record.retiradaRegistrada && record.status === 'DISPONIVEL_ENVIO' && onOpenDispatchModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDispatchModal(record)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
                    >
                      Registrar Retirada
                    </button>
                  )}
                </div>

                {/* Step 2: Entrega */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Entrega e Instalação na Loja</span>
                      {record.entregaRegistrada ? (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Entregue
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          Pendente
                        </span>
                      )}
                    </div>

                    {record.entregaRegistrada ? (
                      <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                        <div>Técnico que Entregou: <b>{record.tecnicoEntrega}</b></div>
                        <div>Recebido por: <b>{record.responsavelRecebimentoLoja}</b></div>
                        <div>Data/Hora da Entrega: <b>{formatDateTimeBR(record.dataHoraEntrega)}</b></div>
                        {record.observacoesEntrega && (
                          <div className="text-slate-500 italic">"{record.observacoesEntrega}"</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        A confirmação de entrega pode ser realizada assim que a máquina for transportada e colocada em produção na loja.
                      </p>
                    )}
                  </div>

                  {record.retiradaRegistrada && !record.entregaRegistrada && onOpenDeliveryModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDeliveryModal(record)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
                    >
                      Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: HISTÓRICO COMPLETO & AUDITORIA */}
          {/* =============================================================== */}
          {activeTab === 'historico' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Histórico Completo da Máquina vinculado à {record.numeroOs}</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {record.historicoEventos.length} registros cronológicos
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {record.historicoEventos.map((ev, index) => {
                  const isFirst = index === 0;
                  return (
                    <div key={ev.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ${
                          isFirst ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-400'
                        }`}
                      />

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900">{ev.descricao}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {formatDateTimeBR(ev.dataHora)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                            {ev.responsavel}
                          </span>
                          <span className="text-slate-400">• Tipo: {ev.tipo}</span>
                        </div>

                        {ev.detalhes && (
                          <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700">
                            {ev.detalhes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finalization Confirmation Dialog */}
      {showFinishDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  finishDecision === 'CONCLUIDA'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {finishDecision === 'CONCLUIDA' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {finishDecision === 'CONCLUIDA'
                    ? 'Concluir Manutenção'
                    : 'Registrar como Não Concluída (Pendente)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {finishDecision === 'CONCLUIDA'
                    ? 'A máquina será marcada como "Disponível para envio à loja".'
                    : 'A máquina permanecerá pendente com o motivo registrado.'}
                </p>
              </div>
            </div>

            {finishError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                {finishError}
              </div>
            )}

            {finishDecision === 'CONCLUIDA' ? (
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limpezaOk}
                    onChange={(e) => setLimpezaOk(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-slate-800">
                    Limpeza técnica interna e higienização externa concluídas
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testesFinaisOk}
                    onChange={(e) => setTestesFinaisOk(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-slate-800">
                    Testes finais de bancada e estresse sob carga 100% aprovados
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800 mb-1">
                  Motivo da Pendência (Obrigatório) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoNaoConcluida}
                  onChange={(e) => setMotivoNaoConcluida(e.target.value)}
                  placeholder="Ex: Aguardando chegada de placa-mãe Dell; aguardando aprovação de orçamento pela gerência da loja..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                />
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowFinishDialog(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalization}
                className={`px-5 py-2 rounded-xl text-white font-extrabold shadow-sm cursor-pointer ${
                  finishDecision === 'CONCLUIDA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {finishDecision === 'CONCLUIDA' ? 'Confirmar e Liberar para Envio' : 'Registrar Pendência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
