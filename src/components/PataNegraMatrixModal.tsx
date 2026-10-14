import React, { useState, useMemo } from 'react';
import {
  Store as StoreIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Building2,
  Check,
  RefreshCw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Client, Store } from '../types/client';

interface PataNegraMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pataNegraClient?: Client;
  stores: Store[];
  onOpenAddStore: (clientId?: string) => void;
  onOpenEditStore: (store: Store) => void;
  onRequestDeleteStore: (store: Store) => void;
  onToggleStatus: (storeId: string) => void;
  onBatchUpsert: (
    list: Array<Omit<Store, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>
  ) => { success: boolean; created: number; updated: number };
}

export const PataNegraMatrixModal: React.FC<PataNegraMatrixModalProps> = ({
  isOpen,
  onClose,
  pataNegraClient,
  stores,
  onOpenAddStore,
  onOpenEditStore,
  onRequestDeleteStore,
  onToggleStatus,
  onBatchUpsert,
}) => {
  const [filterStatus, setFilterStatus] = useState<'TODAS' | 'ATIVAS' | 'INATIVAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBatchPasteOpen, setIsBatchPasteOpen] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Filiais vinculadas ao cliente Pata Negra
  const pataStores = useMemo(() => {
    if (!pataNegraClient) return [];
    return stores
      .filter((s) => s.clienteId === pataNegraClient.id)
      .sort((a, b) => {
        // Ordenar numericamente pelo código da loja (1 a 43) se numérico
        const numA = parseInt(a.codigoLoja.replace(/\D/g, ''), 10);
        const numB = parseInt(b.codigoLoja.replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.codigoLoja.localeCompare(b.codigoLoja, undefined, { numeric: true });
      });
  }, [stores, pataNegraClient]);

  // Contagens
  const totalStores = pataStores.length;
  const activeStores = pataStores.filter((s) => s.status === 'ativo').length;
  const inactiveStores = pataStores.filter((s) => s.status === 'inativo').length;

  // Lojas filtradas para exibição
  const filteredStores = useMemo(() => {
    return pataStores.filter((s) => {
      if (filterStatus === 'ATIVAS' && s.status !== 'ativo') return false;
      if (filterStatus === 'INATIVAS' && s.status !== 'inativo') return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        s.codigoLoja.toLowerCase().includes(lower) ||
        s.nome.toLowerCase().includes(lower) ||
        s.cidade.toLowerCase().includes(lower) ||
        s.endereco.toLowerCase().includes(lower) ||
        (s.telefone && s.telefone.includes(lower)) ||
        (s.cep && s.cep.includes(lower))
      );
    });
  }, [pataStores, filterStatus, searchTerm]);

  if (!isOpen) return null;

  const handleToggle = (store: Store) => {
    onToggleStatus(store.id);
    const newStatus = store.status === 'ativo' ? 'Inativa (🔴 Bolinha Vermelha)' : 'Ativa (🟢 Bolinha Verde)';
    setFeedback(`Loja ${store.codigoLoja} — ${store.nome} atualizada para: ${newStatus}`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleProcessBatch = () => {
    if (!batchText.trim() || !pataNegraClient) return;

    // Processa linhas no formato: Código | Nome Fantasia | Endereço | CEP | Telefone | Município | Status
    // ou dados tabulares
    const lines = batchText.trim().split('\n');
    const parsedStores: Array<Omit<Store, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.toLowerCase().startsWith('código') || line.toLowerCase().startsWith('codigo')) {
        continue;
      }

      // Tenta split por tab, pipe ou ponto e vírgula
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split('|');
      if (parts.length < 2) parts = line.split(';');

      if (parts.length >= 2) {
        const codigoRaw = parts[0]?.trim() || '';
        const nomeRaw = parts[1]?.trim() || '';
        const enderecoRaw = parts[2]?.trim() || '';
        const cepRaw = parts[3]?.trim() || '';
        const telRaw = parts[4]?.trim() || '';
        const cidadeRaw = parts[5]?.trim() || 'São Paulo';
        const statusRaw = parts[6]?.trim().toLowerCase() || 'ativo';

        const isInactive = statusRaw.includes('inativ') || statusRaw.includes('vermelh') || statusRaw === '0' || statusRaw === 'f';
        const padCode = codigoRaw.replace(/\D/g, '').padStart(2, '0') || codigoRaw;

        parsedStores.push({
          clienteId: pataNegraClient.id,
          clienteNome: pataNegraClient.nomeFantasia || pataNegraClient.razaoSocial,
          codigoLoja: padCode,
          nome: nomeRaw || `Loja ${padCode} — Pata Negra`,
          endereco: enderecoRaw || 'Endereço a confirmar',
          cep: cepRaw || undefined,
          telefone: telRaw || undefined,
          cidade: cidadeRaw,
          estado: 'SP',
          status: isInactive ? 'inativo' : 'ativo',
        });
      }
    }

    if (parsedStores.length > 0) {
      const result = onBatchUpsert(parsedStores);
      setFeedback(`Importação/Atualização concluída: ${result.created} criadas, ${result.updated} atualizadas.`);
      setBatchText('');
      setIsBatchPasteOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback('Nenhum dado válido identificado. Use o formato: Código | Nome | Endereço | CEP | Telefone | Cidade');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PTN-01 • Lojas 1 a 43
                </span>
                <span className="text-xs text-slate-300">Grupo Pata Negra</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Matriz Cadastral de Filiais — Pata Negra
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchPasteOpen(!isBatchPasteOpen)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar / Atualizar Lote</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950">
              ✕
            </button>
          </div>
        )}

        {/* Legend & KPIs Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block shadow-xs" />
              <strong className="text-slate-800">Bolinha Verde:</strong>
              <span className="text-slate-600">Loja Ativa em Operação ({activeStores})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 inline-block shadow-xs" />
              <strong className="text-slate-800">Bolinha Vermelha:</strong>
              <span className="text-slate-600">Loja Inativa preservada sem exclusão ({inactiveStores})</span>
            </div>
            <div className="text-slate-500 font-medium">
              Total no grupo: <strong className="text-slate-900">{totalStores}</strong> lojas
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddStore(pataNegraClient?.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Nova Filial</span>
          </button>
        </div>

        {/* Batch Paste Drawer (optional) */}
        {isBatchPasteOpen && (
          <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 space-y-2 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Info className="w-4 h-4 text-emerald-700" />
                <span>Atualização / Inserção em Lote (Lojas 1 a 43)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPasteOpen(false)}
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                Fechar
              </button>
            </div>
            <p className="text-slate-600 text-[11px]">
              Cole linhas copiadas de tabela ou texto formatado com separador (tabulação ou |). Exemplo:
              <br />
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800">
                01 | Matriz Alphaville | Alameda Araguaia, 1200 | 06455-000 | (11) 4198-8801 | Barueri | ativo
              </code>
            </p>
            <textarea
              rows={4}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="Cole as filiais aqui..."
              className="w-full p-2.5 bg-white rounded-xl border border-emerald-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleProcessBatch}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold"
              >
                Processar e Atualizar Lojas
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código (1 a 43), nome, endereço, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterStatus('TODAS')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterStatus === 'TODAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({totalStores})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ATIVAS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                filterStatus === 'ATIVAS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ativas ({activeStores})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('INATIVAS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                filterStatus === 'INATIVAS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300" />
              Inativas ({inactiveStores})
            </button>
          </div>
        </div>

        {/* Stores Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
              <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Nenhuma loja encontrada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchTerm
                  ? `Nenhum resultado para "${searchTerm}". Tente outro termo.`
                  : 'Nenhuma filial cadastrada com os filtros selecionados.'}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onOpenAddStore(pataNegraClient?.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm"
                >
                  + Cadastrar Nova Loja
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-16">ID (Cód)</th>
                    <th className="py-3 px-3 w-32">Status Visual</th>
                    <th className="py-3 px-3">Nome Fantasia (Exibição)</th>
                    <th className="py-3 px-3">Endereço & CEP</th>
                    <th className="py-3 px-3">Telefone</th>
                    <th className="py-3 px-3">Município / UF</th>
                    <th className="py-3 px-3 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map((store) => {
                    const isAtiva = store.status === 'ativo';

                    return (
                      <tr
                        key={store.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !isAtiva ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* ID da Empresa (Código da Loja 1 a 43) */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                            {store.codigoLoja}
                          </span>
                        </td>

                        {/* Status Visual: Bolinha Verde vs Bolinha Vermelha com Toggle direto */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(store)}
                            title="Clique para alternar o status da loja (Ativa/Inativa)"
                            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-xs ${
                              isAtiva
                                ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100/90 text-rose-800 border-rose-300 hover:bg-rose-200'
                            }`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ${
                                isAtiva
                                  ? 'bg-emerald-500 ring-emerald-200'
                                  : 'bg-rose-500 ring-rose-200'
                              }`}
                            />
                            <span>{isAtiva ? 'Ativa' : 'Inativa'}</span>
                          </button>
                        </td>

                        {/* Nome Fantasia */}
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {store.nome}
                          </div>
                          {store.responsavelLocal && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Resp: {store.responsavelLocal}
                            </div>
                          )}
                        </td>

                        {/* Endereço & CEP */}
                        <td className="py-3 px-3 text-slate-600 max-w-xs">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">{store.endereco}</span>
                          </div>
                          {store.cep && (
                            <span className="font-mono text-[10px] text-slate-500 block ml-4">
                              CEP: {store.cep}
                            </span>
                          )}
                        </td>

                        {/* Telefone */}
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {store.telefone ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {store.telefone}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Município / UF */}
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {store.cidade} - {store.estado}
                        </td>

                        {/* Ações: Alterar e Excluir */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenEditStore(store)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Alterar cadastro da loja"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteStore(store)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir cadastro da loja"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Regra Pata Negra: numeração 1 a 43 preservada; lojas com bolinha vermelha mantidas como inativas.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Fechar Matriz
          </button>
        </div>
      </div>
    </div>
  );
};
