import React, { useState } from 'react';
import { useBranchChecklists } from '../context/BranchChecklistContext';
import { useBranches } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { ChecklistTemplate, ChecklistTemplateItem } from '../types/branchChecklist';
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Building2,
  CheckCircle2,
  Layers,
  ArrowRight,
  X,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';

interface ChecklistTemplatesViewProps {
  onApplyTemplateToBranch: (templateId: string, branchId: string) => void;
}

export const ChecklistTemplatesView: React.FC<ChecklistTemplatesViewProps> = ({
  onApplyTemplateToBranch,
}) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useBranchChecklists();
  const { branches } = useBranches();
  const { permissions } = useAuth();

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Operacional');
  const [formDescription, setFormDescription] = useState('');
  const [formItems, setFormItems] = useState<Array<{ titulo: string; categoria: string; obrigatorio: boolean }>>([
    { titulo: 'Verificação visual de abertura e iluminação', categoria: 'Instalações', obrigatorio: true },
    { titulo: 'Conexão dos PDVs e comunicação com retaguarda', categoria: 'TI & Caixa', obrigatorio: true },
  ]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Geral');
  const [formError, setFormError] = useState<string | null>(null);

  // Open Create
  const handleOpenCreate = () => {
    setFormName('');
    setFormCategory('Operacional');
    setFormDescription('');
    setFormItems([
      { titulo: 'Conferência inicial de PDVs e caixas', categoria: 'TI & PDV', obrigatorio: true },
      { titulo: 'Verificação das balanças Toledo e MGV', categoria: 'Balanças', obrigatorio: true },
      { titulo: 'Inspeção térmica dos balcões de frios', categoria: 'Alimentos', obrigatorio: true },
    ]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (tpl: ChecklistTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.nome);
    setFormCategory(tpl.categoria);
    setFormDescription(tpl.descricao || '');
    setFormItems(
      tpl.itens.map((i) => ({
        titulo: i.titulo,
        categoria: i.categoria,
        obrigatorio: i.obrigatorio,
      }))
    );
    setFormError(null);
  };

  // Add Item to Form
  const handleAddItemToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setFormItems([
      ...formItems,
      {
        titulo: newItemTitle.trim(),
        categoria: newItemCategory.trim() || 'Geral',
        obrigatorio: true,
      },
    ]);
    setNewItemTitle('');
  };

  // Remove Item from Form
  const handleRemoveItemFromForm = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Save New Template
  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('O nome do modelo é obrigatório.');
      return;
    }
    if (formItems.length === 0) {
      setFormError('Adicione pelo menos um item ao modelo.');
      return;
    }

    const items: ChecklistTemplateItem[] = formItems.map((it, idx) => ({
      id: `tpl_it_${Date.now()}_${idx}`,
      titulo: it.titulo,
      categoria: it.categoria,
      obrigatorio: it.obrigatorio,
    }));

    const res = addTemplate({
      nome: formName.trim(),
      categoria: formCategory.trim(),
      descricao: formDescription.trim() || undefined,
      itens: items,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
    } else {
      setFormError(res.error || 'Erro ao criar modelo.');
    }
  };

  // Save Edit (Increments version)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    if (!formName.trim()) {
      setFormError('O nome do modelo é obrigatório.');
      return;
    }
    if (formItems.length === 0) {
      setFormError('Adicione pelo menos um item ao modelo.');
      return;
    }

    const items: ChecklistTemplateItem[] = formItems.map((it, idx) => ({
      id: `tpl_it_${Date.now()}_${idx}`,
      titulo: it.titulo,
      categoria: it.categoria,
      obrigatorio: it.obrigatorio,
    }));

    const res = updateTemplate(editingTemplate.id, {
      nome: formName.trim(),
      categoria: formCategory.trim(),
      descricao: formDescription.trim() || undefined,
      itens: items,
    });

    if (res.success) {
      setEditingTemplate(null);
    } else {
      setFormError(res.error || 'Erro ao atualizar modelo.');
    }
  };

  // Apply Template to Branch
  const handleApply = () => {
    if (!applyingTemplate || !selectedBranchId) return;
    onApplyTemplateToBranch(applyingTemplate.id, selectedBranchId);
    setApplyingTemplate(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Modelos de Checklist Reutilizáveis
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
              {templates.length} modelos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Padronização operacional para aplicação na Matriz e nas filiais Mark Security. Cada preenchimento preserva a versão snapshot original.
          </p>
        </div>

        {permissions.podeGerenciarModelos && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Modelo</span>
          </button>
        )}
      </div>

      {/* Templates Grid (Requirement 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-3">
              {/* Top Category & Version Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {tpl.categoria}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  Versão {tpl.versao}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">{tpl.nome}</h3>
                {tpl.descricao && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.descricao}
                  </p>
                )}
              </div>

              {/* Items Summary */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Itens Padronizados</span>
                  <span className="text-amber-700 font-mono font-bold">{tpl.itens.length} itens</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {tpl.itens.slice(0, 4).map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="text-xs text-slate-600 flex items-center gap-1.5 truncate"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{it.titulo}</span>
                    </div>
                  ))}
                  {tpl.itens.length > 4 && (
                    <div className="text-[10px] font-bold text-slate-400 pl-5">
                      + {tpl.itens.length - 4} outros itens cadastrados
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 p-3 px-5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setApplyingTemplate(tpl)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Aplicar a uma Filial</span>
              </button>

              <div className="flex items-center gap-1">
                {permissions.podeGerenciarModelos && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Editar modelo (Gera nova versão)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {permissions.podeGerenciarModelos && templates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Deseja desativar o modelo "${tpl.nome}"?`)) {
                        deleteTemplate(tpl.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir modelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Aplicar Modelo a uma Unidade (Requirement 4) */}
      {applyingTemplate && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Aplicar Modelo na Rede</span>
              </h3>
              <button
                type="button"
                onClick={() => setApplyingTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800">{applyingTemplate.nome}</div>
              <div className="text-slate-500">
                Versão snapshot vinculada: <b>v{applyingTemplate.versao}</b> ({applyingTemplate.itens.length} itens)
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O modelo será instanciado de forma 100% independente para a filial escolhida. Caso este modelo seja editado no futuro, o checklist desta unidade preservará os itens da versão original.
            </p>

            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">
                Selecione a Filial de Destino:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.idOriginal} — {b.nomeFantasia} ({b.tipo === 'MATRIZ' ? 'Matriz' : 'Filial'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setApplyingTemplate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Criar Checklist na Filial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Criar / Editar Modelo */}
      {(isCreateModalOpen || editingTemplate) && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <span>{editingTemplate ? `Editar Modelo (Gerará Versão ${editingTemplate.versao + 1})` : 'Novo Modelo de Checklist'}</span>
                </h3>
                {editingTemplate && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    Checklists preenchidos anteriormente continuarão na versão snapshot v{editingTemplate.versao}.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={editingTemplate ? handleSaveEdit : handleSaveCreate}
              className="space-y-4 text-xs flex-1 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Modelo *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Auditoria de Balanças & MGV"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: TI, Abertura, Fiscal..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Finalidade e orientações gerais deste modelo..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Itens do Modelo */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Itens a serem Verificados ({formItems.length})
                </span>

                <div className="space-y-2">
                  {formItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{it.titulo}</div>
                          <div className="text-[10px] text-slate-400">{it.categoria}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromForm(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo item */}
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 mt-2">
                  <span className="font-bold text-blue-900 block text-[11px]">Adicionar Novo Item:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Descrição do item..."
                      className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      placeholder="Categoria"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    + Inserir no Modelo
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {editingTemplate ? 'Salvar Nova Versão' : 'Criar Modelo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
