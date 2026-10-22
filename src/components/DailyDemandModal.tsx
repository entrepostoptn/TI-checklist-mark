import React, { useState } from 'react';
import {
  DailyDemand,
  DailyDemandCategory,
  DailyDemandStatus,
  DailyDemandPriority,
  DEMAND_CATEGORY_LABELS,
} from '../types/dailyDemand';
import { useDailyDemands } from '../context/DailyDemandsContext';
import { useBranches } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Plus,
  PhoneCall,
  KeyRound,
  Store,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface DailyDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandToEdit?: DailyDemand | null;
}

export const DailyDemandModal: React.FC<DailyDemandModalProps> = ({
  isOpen,
  onClose,
  demandToEdit,
}) => {
  const { addDemand, updateDemand } = useDailyDemands();
  const { branches } = useBranches();
  const { user } = useAuth();

  const [titulo, setTitulo] = useState(demandToEdit?.titulo || '');
  const [categoria, setCategoria] = useState<DailyDemandCategory>(
    demandToEdit?.categoria || 'CHAMADO_OPERADORA'
  );
  const [operadoraOuEmpresa, setOperadoraOuEmpresa] = useState(
    demandToEdit?.operadoraOuEmpresa || 'Vivo'
  );
  const [protocoloExterno, setProtocoloExterno] = useState(
    demandToEdit?.protocoloExterno || ''
  );
  const [lojaId, setLojaId] = useState(demandToEdit?.lojaId || branches[0]?.id || '');
  const [prioridade, setPrioridade] = useState<DailyDemandPriority>(
    demandToEdit?.prioridade || 'MEDIA'
  );
  const [status, setStatus] = useState<DailyDemandStatus>(
    demandToEdit?.status || 'ABERTO'
  );
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState(
    demandToEdit?.tecnicoResponsavel || user?.nome || 'Carlos Silva'
  );
  const [prazoEstimado, setPrazoEstimado] = useState(
    demandToEdit?.prazoEstimado || ''
  );
  const [descricao, setDescricao] = useState(demandToEdit?.descricao || '');
  const [andamentoInicial, setAndamentoInicial] = useState('');
  const [contatoLocal, setContatoLocal] = useState(demandToEdit?.contatoLocal || '');
  const [linkAcessoRemoto, setLinkAcessoRemoto] = useState(
    demandToEdit?.linkAcessoRemoto || ''
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setFormError('Por favor, informe o título e a descrição da demanda.');
      return;
    }

    const selectedBranch = branches.find((b) => b.id === lojaId) || branches[0];
    const storeName = selectedBranch ? selectedBranch.nomeFantasia : 'Geral';

    if (demandToEdit) {
      updateDemand(demandToEdit.id, {
        titulo: titulo.trim(),
        categoria,
        operadoraOuEmpresa: operadoraOuEmpresa.trim() || undefined,
        protocoloExterno: protocoloExterno.trim() || undefined,
        lojaId,
        lojaNome: storeName,
        prioridade,
        status,
        tecnicoResponsavel: tecnicoResponsavel.trim(),
        prazoEstimado: prazoEstimado.trim() || undefined,
        descricao: descricao.trim(),
        contatoLocal: contatoLocal.trim() || undefined,
        linkAcessoRemoto: linkAcessoRemoto.trim() || undefined,
      });
    } else {
      addDemand({
        titulo: titulo.trim(),
        categoria,
        operadoraOuEmpresa: operadoraOuEmpresa.trim() || undefined,
        protocoloExterno: protocoloExterno.trim() || undefined,
        lojaId,
        lojaNome: storeName,
        prioridade,
        status,
        tecnicoResponsavel: tecnicoResponsavel.trim(),
        prazoEstimado: prazoEstimado.trim() || undefined,
        descricao: descricao.trim(),
        andamentoInicial: andamentoInicial.trim() || undefined,
        contatoLocal: contatoLocal.trim() || undefined,
        linkAcessoRemoto: linkAcessoRemoto.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Demandas & Chamados Diários
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {demandToEdit ? 'Editar Chamado / Demanda' : 'Anotar Novo Chamado / Demanda'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Categoria Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Tipo / Categoria da Demanda *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  'CHAMADO_OPERADORA',
                  'ACESSO_REMOTO',
                  'SISTEMA_PDV',
                  'INFRAESTRUTURA',
                  'FORNECEDOR_EXTERNO',
                  'OUTRO',
                ] as DailyDemandCategory[]
              ).map((cat) => {
                const isSelected = categoria === cat;
                const label = DEMAND_CATEGORY_LABELS[cat].label;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      if (cat === 'CHAMADO_OPERADORA' && !operadoraOuEmpresa) {
                        setOperadoraOuEmpresa('Vivo');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Título da Demanda *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Chamado Vivo Fibra — Queda do link Loja 03, Acesso AnyDesk Totvs..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
            />
          </div>

          {/* Operadora/Empresa & Protocolo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Empresa / Operadora Envolvida
              </label>
              <input
                type="text"
                value={operadoraOuEmpresa}
                onChange={(e) => setOperadoraOuEmpresa(e.target.value)}
                placeholder="Ex: Vivo, Claro, Totvs, Elgin, Toledo..."
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Protocolo / Nº Chamado Externo
              </label>
              <input
                type="text"
                value={protocoloExterno}
                onChange={(e) => setProtocoloExterno(e.target.value)}
                placeholder="Ex: 20261020-884912, Ticket #4410..."
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Loja / Filial vinculada (aba Lojas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Loja / Filial Vinculada *
              </label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tipo === 'MATRIZ' ? '🏢 MATRIZ' : `🏬 Filial ${b.idOriginal}`} — {b.nomeFantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Contato no Local / Telefone (Opcional)
              </label>
              <input
                type="text"
                value={contatoLocal}
                onChange={(e) => setContatoLocal(e.target.value)}
                placeholder="Ex: Renata (Gerente) - Ramal 103"
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Status, Prioridade e Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DailyDemandStatus)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold"
              >
                <option value="ABERTO">Aberto / Pendente</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="AGUARDANDO_TERCEIRO">Aguardando Terceiro (Vivo/Provedor)</option>
                <option value="CONCLUIDO">Concluído / Resolvido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as DailyDemandPriority)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica (Loja parada)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Técnico Responsável
              </label>
              <input
                type="text"
                value={tecnicoResponsavel}
                onChange={(e) => setTecnicoResponsavel(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Prazo e Link/ID de Acesso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Prazo / Previsão de Retorno
              </label>
              <input
                type="text"
                value={prazoEstimado}
                onChange={(e) => setPrazoEstimado(e.target.value)}
                placeholder="Ex: Hoje até 14:00, Técnico previsto para amanhã cedo..."
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                ID de Acesso Remoto / IP (Se houver)
              </label>
              <input
                type="text"
                value={linkAcessoRemoto}
                onChange={(e) => setLinkAcessoRemoto(e.target.value)}
                placeholder="Ex: AnyDesk: 541 829 104, TeamViewer: 104 982 12..."
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Descrição da Demanda / O que precisa ser feito *
            </label>
            <textarea
              rows={3}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema ou a demanda do dia a dia..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
            />
          </div>

          {/* Andamento inicial (apenas ao criar novo) */}
          {!demandToEdit && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Primeira Anotação de Andamento (Opcional)
              </label>
              <input
                type="text"
                value={andamentoInicial}
                onChange={(e) => setAndamentoInicial(e.target.value)}
                placeholder="Ex: Aberto chamado na central Vivo, atendente informou prazo de 4 horas."
                className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{demandToEdit ? 'Salvar Alterações' : 'Salvar Demanda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
