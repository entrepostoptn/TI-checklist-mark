import React, { useState, useEffect } from 'react';
import {
  Equipment,
  EquipmentType,
  EquipmentLocation,
  EquipmentStatus,
  StorageType,
} from '../types/equipment';
import { useEquipment } from '../context/EquipmentContext';
import {
  X,
  Laptop,
  Store,
  Hash,
  Cpu,
  HardDrive,
  Save,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit?: Equipment | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipmentToEdit,
}) => {
  const { addEquipment, updateEquipment } = useEquipment();

  const [nome, setNome] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tipo, setTipo] = useState<EquipmentType>('PDV');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [lojaOrigem, setLojaOrigem] = useState('');
  const [localizacaoAtual, setLocalizacaoAtual] = useState<EquipmentLocation>('LOJA');
  const [status, setStatus] = useState<EquipmentStatus>('EM_USO');
  const [processador, setProcessador] = useState('');
  const [memoriaRamGb, setMemoriaRamGb] = useState<number>(8);
  const [ramModulos, setRamModulos] = useState('');
  const [armazenamentoValor, setArmazenamentoValor] = useState<number>(240);
  const [armazenamentoUnidade, setArmazenamentoUnidade] = useState<'GB' | 'TB'>('GB');
  const [tipoArmazenamento, setTipoArmazenamento] = useState<StorageType>('SSD_SATA');
  const [placaMae, setPlacaMae] = useState('');
  const [sistemaOperacional, setSistemaOperacional] = useState('Windows 10 Pro 64-bit');
  const [perifericos, setPerifericos] = useState('');
  
  // Requisito 14: Lojas, Filiais, Setor & Caixa
  const [filialNome, setFilialNome] = useState('');
  const [setor, setSetor] = useState('');
  const [numeroCaixa, setNumeroCaixa] = useState('');
  const [nomeWindows, setNomeWindows] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');

  // Requisito 14: Acesso Remoto
  const [anydeskId, setAnydeskId] = useState('');
  const [teamviewerId, setTeamviewerId] = useState('');
  const [remotePassword, setRemotePassword] = useState('');

  const [dataPrimeiroCadastro, setDataPrimeiroCadastro] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [observacoes, setObservacoes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (equipmentToEdit) {
      setNome(equipmentToEdit.nome || '');
      setPatrimonio(equipmentToEdit.patrimonio || '');
      setNumeroSerie(equipmentToEdit.numeroSerie || '');
      setTipo(equipmentToEdit.tipo || 'PDV');
      setMarcaModelo(equipmentToEdit.marcaModelo || '');
      setLojaOrigem(equipmentToEdit.lojaOrigem || equipmentToEdit.lojaNome || '');
      setLocalizacaoAtual(equipmentToEdit.localizacaoAtual || 'LOJA');
      setStatus(equipmentToEdit.status || 'EM_USO');
      setProcessador(equipmentToEdit.processador || '');
      setMemoriaRamGb(equipmentToEdit.memoriaRamGb ?? 8);
      setRamModulos(equipmentToEdit.ramModulos || '');
      setArmazenamentoValor(equipmentToEdit.armazenamentoValor ?? 240);
      setArmazenamentoUnidade(equipmentToEdit.armazenamentoUnidade || 'GB');
      setTipoArmazenamento(equipmentToEdit.tipoArmazenamento || 'SSD_SATA');
      setPlacaMae(equipmentToEdit.placaMae || '');
      setSistemaOperacional(equipmentToEdit.sistemaOperacional || 'Windows 10 Pro 64-bit');
      setPerifericos(equipmentToEdit.perifericos || '');
      setFilialNome(equipmentToEdit.filialNome || '');
      setSetor(equipmentToEdit.setor || '');
      setNumeroCaixa(equipmentToEdit.numeroCaixa || equipmentToEdit.posicaoCaixa || '');
      setNomeWindows(equipmentToEdit.nomeWindows || '');
      setDataAquisicao(equipmentToEdit.dataAquisicao || '');
      setAnydeskId(equipmentToEdit.anydeskId || '');
      setTeamviewerId(equipmentToEdit.teamviewerId || '');
      setRemotePassword(equipmentToEdit.remotePassword || '');
      setDataPrimeiroCadastro(equipmentToEdit.dataPrimeiroCadastro || new Date().toISOString().split('T')[0]);
      setObservacoes(equipmentToEdit.observacoes || '');
    } else {
      setNome('');
      setPatrimonio('');
      setNumeroSerie('');
      setTipo('PDV');
      setMarcaModelo('');
      setLojaOrigem('');
      setLocalizacaoAtual('LOJA');
      setStatus('EM_USO');
      setProcessador('Intel Core i3');
      setMemoriaRamGb(8);
      setRamModulos('1x 8GB DDR4');
      setArmazenamentoValor(240);
      setArmazenamentoUnidade('GB');
      setTipoArmazenamento('SSD_SATA');
      setPlacaMae('');
      setSistemaOperacional('Windows 10 Pro 64-bit');
      setPerifericos('');
      setFilialNome('');
      setSetor('Frente de Caixa');
      setNumeroCaixa('Caixa 01');
      setNomeWindows('');
      setDataAquisicao('');
      setAnydeskId('');
      setTeamviewerId('');
      setRemotePassword('');
      setDataPrimeiroCadastro(new Date().toISOString().split('T')[0]);
      setObservacoes('');
    }
    setErrorMessage(null);
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim() || !patrimonio.trim() || !numeroSerie.trim() || !lojaOrigem.trim()) {
      setErrorMessage('Preencha os campos obrigatórios: Nome, Patrimônio, Número de Série e Loja.');
      return;
    }

    const payload = {
      nome: nome.trim(),
      patrimonio: patrimonio.trim(),
      numeroSerie: numeroSerie.trim(),
      tipo,
      marcaModelo: marcaModelo.trim(),
      lojaOrigem: lojaOrigem.trim(),
      lojaNome: lojaOrigem.trim(),
      localizacaoAtual,
      status,
      processador: processador.trim(),
      memoriaRamGb,
      ramModulos: ramModulos.trim(),
      armazenamentoValor,
      armazenamentoUnidade,
      tipoArmazenamento,
      placaMae: placaMae.trim(),
      sistemaOperacional: sistemaOperacional.trim(),
      perifericos: perifericos.trim(),
      filialNome: filialNome.trim(),
      setor: setor.trim(),
      numeroCaixa: numeroCaixa.trim(),
      posicaoCaixa: numeroCaixa.trim() || setor.trim(),
      nomeWindows: nomeWindows.trim(),
      dataAquisicao: dataAquisicao.trim(),
      anydeskId: anydeskId.trim(),
      teamviewerId: teamviewerId.trim(),
      remotePassword: remotePassword.trim(),
      dataPrimeiroCadastro,
      observacoes: observacoes.trim(),
    };

    if (equipmentToEdit) {
      const result = updateEquipment(equipmentToEdit.id, payload);

      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao atualizar equipamento.');
        return;
      }
    } else {
      const result = addEquipment(payload);

      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao cadastrar equipamento.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {equipmentToEdit ? `Editar Equipamento (${equipmentToEdit.nome})` : 'Novo Cadastro de Equipamento'}
              </h3>
              <p className="text-xs text-slate-400">
                Cadastro patrimonial e controle de especificações técnicas
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

        {/* Error alert if any */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section: Identificação & Patrimônio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Identificação & Patrimônio
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Padronizado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: PDV-01 ou EST-03"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Patrimônio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  placeholder="Ex: PAT-0042"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 uppercase"
                />
                <span className="text-[10px] text-slate-400">Identificador único</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Série (Service Tag) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ex: BRJ9045-DEL"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 uppercase"
                />
                <span className="text-[10px] text-slate-400">Identificador de hardware</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Equipamento
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as EquipmentType)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                >
                  <option value="PDV">PDV / Frente de Caixa</option>
                  <option value="COMPUTADOR">Computador / Desktop</option>
                  <option value="NOTEBOOK">Notebook</option>
                  <option value="OUTRO">Outro Equipamento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca & Modelo
                </label>
                <input
                  type="text"
                  value={marcaModelo}
                  onChange={(e) => setMarcaModelo(e.target.value)}
                  placeholder="Ex: Dell OptiPlex 3050"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loja ou Setor de Origem <span className="text-red-500">*</span>
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
            </div>

            {/* Hierarquia de Loja, Filial e Caixa */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filial
                </label>
                <input
                  type="text"
                  value={filialNome}
                  onChange={(e) => setFilialNome(e.target.value)}
                  placeholder="Ex: Filial Centro"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Setor
                </label>
                <input
                  type="text"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Frente de Caixa"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Caixa / Posição
                </label>
                <input
                  type="text"
                  value={numeroCaixa}
                  onChange={(e) => setNumeroCaixa(e.target.value)}
                  placeholder="Ex: Caixa 01"
                  className="w-full text-xs font-bold text-blue-800 px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do PC (Hostname Windows)
                </label>
                <input
                  type="text"
                  value={nomeWindows}
                  onChange={(e) => setNomeWindows(e.target.value)}
                  placeholder="Ex: SRV-PDV01-ALPHA"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section: Acesso Remoto Integrado (AnyDesk / TeamViewer) */}
          <div className="space-y-3 bg-red-50/40 p-4 rounded-xl border border-red-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Central de Acesso Remoto (AnyDesk / TeamViewer)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ID AnyDesk
                </label>
                <input
                  type="text"
                  value={anydeskId}
                  onChange={(e) => setAnydeskId(e.target.value)}
                  placeholder="Ex: 541 829 104"
                  className="w-full text-xs font-mono font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400">ID para suporte remoto</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID TeamViewer (Contingência)
                </label>
                <input
                  type="text"
                  value={teamviewerId}
                  onChange={(e) => setTeamviewerId(e.target.value)}
                  placeholder="Ex: 1 409 382 710"
                  className="w-full text-xs font-mono font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha / Instrução de Acesso
                </label>
                <input
                  type="text"
                  value={remotePassword}
                  onChange={(e) => setRemotePassword(e.target.value)}
                  placeholder="Ex: Padrão TI da Empresa"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Status e Localização Atual */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Localização & Status Operacional
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localização Física Atual
                </label>
                <select
                  value={localizacaoAtual}
                  onChange={(e) => setLocalizacaoAtual(e.target.value as EquipmentLocation)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                >
                  <option value="LOJA">🏪 Na Loja (Produção)</option>
                  <option value="ESCRITORIO">🏢 No Escritório de TI (Bancada)</option>
                  <option value="ESTOQUE">📦 Estoque Central de Reservas</option>
                  <option value="ASSISTENCIA">🔧 Assistência Técnica Externa</option>
                  <option value="OUTRO">📍 Outro Local</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Atual da Máquina
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                >
                  <option value="EM_USO">🟢 Em Uso na Loja</option>
                  <option value="AGUARDANDO_MANUTENCAO">🟡 Aguardando Manutenção</option>
                  <option value="EM_MANUTENCAO">🟠 Em Manutenção (Na Bancada)</option>
                  <option value="DISPONIVEL_RETIRADA">🔵 Disponível para Retirada (Pronta)</option>
                  <option value="RETIRADO">🟣 Retirado / A Caminho</option>
                  <option value="DESATIVADO">⚪ Desativado / Sucata</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Especificações Técnicas de Hardware */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Especificações Técnicas de Hardware
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Processador (CPU)
                </label>
                <input
                  type="text"
                  value={processador}
                  onChange={(e) => setProcessador(e.target.value)}
                  placeholder="Ex: Intel Core i3-7100 3.4GHz"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Memória RAM (GB)
                </label>
                <select
                  value={memoriaRamGb}
                  onChange={(e) => setMemoriaRamGb(parseInt(e.target.value, 10))}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                >
                  <option value={4}>4 GB</option>
                  <option value={8}>8 GB (Padrão)</option>
                  <option value={16}>16 GB</option>
                  <option value={32}>32 GB</option>
                  <option value={64}>64 GB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Armazenamento
                </label>
                <select
                  value={tipoArmazenamento}
                  onChange={(e) => setTipoArmazenamento(e.target.value as StorageType)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                >
                  <option value="SSD_SATA">SSD SATA III (2.5")</option>
                  <option value="SSD_NVME">SSD M.2 NVMe</option>
                  <option value="HD">HD Mecânico (SATA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacidade Armazenamento
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={armazenamentoValor}
                    onChange={(e) => setArmazenamentoValor(parseInt(e.target.value, 10) || 0)}
                    className="w-2/3 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                  />
                  <select
                    value={armazenamentoUnidade}
                    onChange={(e) => setArmazenamentoUnidade(e.target.value as 'GB' | 'TB')}
                    className="w-1/3 text-xs font-bold px-2 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600"
                  >
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sistema Operacional
                </label>
                <input
                  type="text"
                  value={sistemaOperacional}
                  onChange={(e) => setSistemaOperacional(e.target.value)}
                  placeholder="Ex: Windows 10 Pro 64-bit"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data do Primeiro Cadastro
                </label>
                <input
                  type="date"
                  value={dataPrimeiroCadastro}
                  onChange={(e) => setDataPrimeiroCadastro(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Placa-Mãe (Motherboard)
                </label>
                <input
                  type="text"
                  value={placaMae}
                  onChange={(e) => setPlacaMae(e.target.value)}
                  placeholder="Ex: Dell 0W7T6K / ASUS H310M"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Módulos de RAM / Barramento
                </label>
                <input
                  type="text"
                  value={ramModulos}
                  onChange={(e) => setRamModulos(e.target.value)}
                  placeholder="Ex: 1x 8GB DDR4 2666MHz SODIMM"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Aquisição da Máquina
                </label>
                <input
                  type="date"
                  value={dataAquisicao}
                  onChange={(e) => setDataAquisicao(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periféricos & Componentes Conectados
              </label>
              <input
                type="text"
                value={perifericos}
                onChange={(e) => setPerifericos(e.target.value)}
                placeholder="Ex: Leitor Elgin Quick Scan, Gaveta Menno, Impressora Elgin I9, Teclado Gertec TEC 55"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Section: Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Gerais do Equipamento
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Máquina do Caixa 02; acompanha leitor de código de barras Honeywell; licença OEM gravada na BIOS..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
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
            {equipmentToEdit ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
          </button>
        </div>
      </div>
    </div>
  );
};
