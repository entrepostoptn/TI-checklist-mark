import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChecklistTemplate,
  BranchChecklist,
  ChecklistItemStatus,
  ChecklistOverallStatus,
  BranchChecklistItem,
} from '../types/branchChecklist';
import {
  INITIAL_CHECKLIST_TEMPLATES as INITIAL_TEMPLATES,
  INITIAL_BRANCH_CHECKLISTS,
} from '../constants/initialPataNegraData';
import { useAudit } from './AuditContext';
import { useAuth } from './AuthContext';
import { useBranches } from './BranchContext';
import {
  subscribeToBranchChecklists,
  syncSaveBranchChecklist,
  syncDeleteBranchChecklist,
  subscribeToChecklistTemplates,
  syncSaveChecklistTemplate,
  syncDeleteChecklistTemplate,
} from '../services/firestoreSync';

interface CreateChecklistParams {
  unidadeId: string;
  templateId?: string;
  nome: string;
  categoria: string;
  itensIniciais?: Array<{ titulo: string; categoria: string; descricao?: string }>;
}

interface BranchChecklistContextType {
  templates: ChecklistTemplate[];
  checklists: BranchChecklist[];
  activeChecklistId: string | null;
  setActiveChecklistId: (id: string | null) => void;

  // Templates
  addTemplate: (
    data: Omit<ChecklistTemplate, 'id' | 'versao' | 'criadoEm' | 'atualizadoEm'>
  ) => { success: boolean; template?: ChecklistTemplate; error?: string };
  updateTemplate: (
    id: string,
    patch: Partial<ChecklistTemplate>
  ) => { success: boolean; error?: string };
  deleteTemplate: (id: string) => { success: boolean; error?: string };
  getTemplateById: (id: string) => ChecklistTemplate | undefined;

  // Checklists
  createChecklistFromTemplate: (
    unidadeId: string,
    templateId: string,
    customNome?: string
  ) => { success: boolean; checklist?: BranchChecklist; error?: string };
  createCustomChecklist: (
    params: CreateChecklistParams
  ) => { success: boolean; checklist?: BranchChecklist; error?: string };
  getChecklistById: (id: string) => BranchChecklist | undefined;
  getChecklistsByUnit: (unidadeId: string) => BranchChecklist[];
  
  updateChecklistItem: (
    checklistId: string,
    itemId: string,
    patch: { status?: ChecklistItemStatus; observacao?: string; evidenciaUrl?: string }
  ) => void;
  addItemToChecklist: (
    checklistId: string,
    item: { titulo: string; categoria: string; descricao?: string }
  ) => void;
  removeItemFromChecklist: (checklistId: string, itemId: string) => void;
  
  saveChecklistDraft: (
    checklistId: string,
    observacoesGerais?: string
  ) => { success: boolean; error?: string };
  completeChecklist: (
    checklistId: string,
    observacoesGerais?: string
  ) => { success: boolean; error?: string; hasNonConformity?: boolean };
  reopenChecklist: (
    checklistId: string,
    motivo: string
  ) => { success: boolean; error?: string };
  deleteChecklist: (checklistId: string) => { success: boolean; error?: string };

  // Estatísticas e Indicadores
  stats: {
    total: number;
    pendentes: number;
    emAndamento: number;
    concluidos: number;
    naoConformes: number;
  };
  recentNonConformities: Array<{
    checklistId: string;
    unidadeNome: string;
    itemTitulo: string;
    observacao?: string;
    data: string;
  }>;
}

const STORAGE_KEY_TEMPLATES = 'ptn_checklist_templates_v2';
const STORAGE_KEY_CHECKLISTS = 'ptn_branch_checklists_v2';

const BranchChecklistContext = createContext<BranchChecklistContextType | undefined>(undefined);

export const BranchChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addAuditLog } = useAudit();
  const { user } = useAuth();
  const { getBranchById } = useBranches();

  // Templates
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TEMPLATES;
  });

  // Checklists
  const [checklists, setChecklists] = useState<BranchChecklist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKLISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BRANCH_CHECKLISTS;
  });

  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKLISTS, JSON.stringify(checklists));
    } catch {}
  }, [checklists]);

  // Sincronização em tempo real via Firestore para computador e celular
  useEffect(() => {
    const unsubTemplates = subscribeToChecklistTemplates(
      (remoteTpls) => {
        setTemplates(remoteTpls);
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(remoteTpls));
        } catch {}
      },
      (err) => console.warn('Templates sync error:', err)
    );

    const unsubChecklists = subscribeToBranchChecklists(
      (remoteChecklists) => {
        setChecklists(remoteChecklists);
        try {
          localStorage.setItem(STORAGE_KEY_CHECKLISTS, JSON.stringify(remoteChecklists));
        } catch {}
      },
      (err) => console.warn('Checklists sync error:', err)
    );

    return () => {
      unsubTemplates();
      unsubChecklists();
    };
  }, []);

  // Gestão de Modelos
  const getTemplateById = useCallback((id: string) => templates.find((t) => t.id === id), [templates]);

  const addTemplate = useCallback(
    (data: Omit<ChecklistTemplate, 'id' | 'versao' | 'criadoEm' | 'atualizadoEm'>) => {
      const newTemplate: ChecklistTemplate = {
        ...data,
        id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        versao: 1,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      setTemplates((prev) => [newTemplate, ...prev]);
      syncSaveChecklistTemplate(newTemplate).catch((err) => console.warn('Erro ao salvar modelo no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        tipoRegistro: 'MODELO',
        acao: 'CRIACAO',
        detalhes: `Novo modelo de checklist criado: "${newTemplate.nome}" (v1) com ${newTemplate.itens.length} itens.`,
      });

      return { success: true, template: newTemplate };
    },
    [addAuditLog, user]
  );

  const updateTemplate = useCallback(
    (id: string, patch: Partial<ChecklistTemplate>) => {
      const existing = templates.find((t) => t.id === id);
      if (!existing) return { success: false, error: 'Modelo não encontrado' };

      // Incrementa a versão para assegurar que checklists já preenchidos mantenham snapshot
      const newVersion = existing.versao + 1;
      const updated: ChecklistTemplate = {
        ...existing,
        ...patch,
        id: existing.id,
        versao: newVersion,
        atualizadoEm: new Date().toISOString(),
      };

      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      syncSaveChecklistTemplate(updated).catch((err) => console.warn('Erro ao atualizar modelo no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        tipoRegistro: 'MODELO',
        acao: 'EDICAO',
        campoModificado: 'versao',
        valorAnterior: `v${existing.versao}`,
        valorNovo: `v${newVersion}`,
        motivo: 'Atualização e versionamento de modelo de checklist',
        detalhes: `Modelo "${updated.nome}" atualizado para versão v${newVersion}. Checklists antigos preservam snapshot v${existing.versao}.`,
      });

      return { success: true };
    },
    [templates, addAuditLog, user]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      const existing = templates.find((t) => t.id === id);
      if (!existing) return { success: false, error: 'Modelo não encontrado' };

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      syncDeleteChecklistTemplate(id).catch((err) => console.warn('Erro ao excluir modelo no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        tipoRegistro: 'MODELO',
        acao: 'EXCLUSAO',
        detalhes: `Modelo de checklist "${existing.nome}" (v${existing.versao}) desativado/removido.`,
      });

      return { success: true };
    },
    [templates, addAuditLog, user]
  );

  // Gestão de Checklists
  const getChecklistById = useCallback((id: string) => checklists.find((c) => c.id === id), [checklists]);
  const getChecklistsByUnit = useCallback(
    (unidadeId: string) => checklists.filter((c) => c.unidadeId === unidadeId),
    [checklists]
  );

  // Aplicação de Modelo a uma Unidade (com snapshot independente e versão do modelo)
  const createChecklistFromTemplate = useCallback(
    (unidadeId: string, templateId: string, customNome?: string) => {
      const unit = getBranchById(unidadeId);
      if (!unit) return { success: false, error: 'Unidade não encontrada' };

      const template = templates.find((t) => t.id === templateId);
      if (!template) return { success: false, error: 'Modelo não encontrado' };

      const nowIso = new Date().toISOString();
      const newItems: BranchChecklistItem[] = template.itens.map((ti, index) => ({
        id: `item_${Date.now()}_${index}`,
        templateItemId: ti.id,
        titulo: ti.titulo,
        descricao: ti.descricao,
        categoria: ti.categoria,
        status: 'PENDENTE',
      }));

      const newChecklist: BranchChecklist = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        unidadeId: unit.id,
        unidadeNome: unit.nomeFantasia,
        unidadeCnpj: unit.cnpj,
        nome: customNome || `${template.nome} — ${unit.idOriginal}`,
        categoria: template.categoria,
        templateId: template.id,
        templateVersao: template.versao, // Snapshot da versão original
        responsavelId: user?.id || 'user_operador',
        responsavelNome: user?.nome || 'Operador',
        dataCriacao: nowIso,
        dataAtualizacao: nowIso,
        status: 'PENDENTE',
        itens: newItems,
      };

      setChecklists((prev) => [newChecklist, ...prev]);
      syncSaveBranchChecklist(newChecklist).catch((err) => console.warn('Erro ao salvar checklist no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        unidadeId: unit.id,
        unidadeNome: unit.nomeFantasia,
        tipoRegistro: 'CHECKLIST',
        acao: 'CRIACAO',
        detalhes: `Checklist "${newChecklist.nome}" gerado a partir do modelo "${template.nome}" (v${template.versao}) para a unidade ${unit.idOriginal}.`,
      });

      return { success: true, checklist: newChecklist };
    },
    [getBranchById, templates, user, addAuditLog]
  );

  // Criar Checklist Exclusivo / Avulso para Filial
  const createCustomChecklist = useCallback(
    (params: CreateChecklistParams) => {
      const unit = getBranchById(params.unidadeId);
      if (!unit) return { success: false, error: 'Unidade não encontrada' };

      const nowIso = new Date().toISOString();
      const newItems: BranchChecklistItem[] = (params.itensIniciais || []).map((it, idx) => ({
        id: `item_c_${Date.now()}_${idx}`,
        titulo: it.titulo,
        descricao: it.descricao,
        categoria: it.categoria,
        status: 'PENDENTE',
      }));

      const newChecklist: BranchChecklist = {
        id: `chk_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        unidadeId: unit.id,
        unidadeNome: unit.nomeFantasia,
        unidadeCnpj: unit.cnpj,
        nome: params.nome,
        categoria: params.categoria,
        templateId: params.templateId,
        templateVersao: params.templateId ? 1 : undefined,
        responsavelId: user?.id || 'user_operador',
        responsavelNome: user?.nome || 'Operador',
        dataCriacao: nowIso,
        dataAtualizacao: nowIso,
        status: 'PENDENTE',
        itens: newItems,
      };

      setChecklists((prev) => [newChecklist, ...prev]);
      syncSaveBranchChecklist(newChecklist).catch((err) => console.warn('Erro ao salvar checklist no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        unidadeId: unit.id,
        unidadeNome: unit.nomeFantasia,
        tipoRegistro: 'CHECKLIST',
        acao: 'CRIACAO',
        detalhes: `Checklist personalizado "${newChecklist.nome}" criado para a unidade ${unit.idOriginal}.`,
      });

      return { success: true, checklist: newChecklist };
    },
    [getBranchById, user, addAuditLog]
  );

  // Atualizar Item do Checklist
  const updateChecklistItem = useCallback(
    (
      checklistId: string,
      itemId: string,
      patch: { status?: ChecklistItemStatus; observacao?: string; evidenciaUrl?: string }
    ) => {
      setChecklists((prev) =>
        prev.map((chk) => {
          if (chk.id !== checklistId) return chk;

          const updatedItems = chk.itens.map((it) => {
            if (it.id !== itemId) return it;
            return {
              ...it,
              ...patch,
              atualizadoEm: new Date().toISOString(),
            };
          });

          // Se estava PENDENTE e começou a ser preenchido, passa para EM_ANDAMENTO
          let newOverallStatus = chk.status;
          if (chk.status === 'PENDENTE' && patch.status && patch.status !== 'PENDENTE') {
            newOverallStatus = 'EM_ANDAMENTO';
          }

          const updatedChecklist = {
            ...chk,
            itens: updatedItems,
            status: newOverallStatus,
            dataAtualizacao: new Date().toISOString(),
          };

          syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao atualizar checklist no Firestore:', err));

          return updatedChecklist;
        })
      );
    },
    []
  );

  // Adicionar e Remover itens dinamicamente
  const addItemToChecklist = useCallback(
    (checklistId: string, item: { titulo: string; categoria: string; descricao?: string }) => {
      const nowIso = new Date().toISOString();
      const newItem: BranchChecklistItem = {
        id: `item_add_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        titulo: item.titulo,
        categoria: item.categoria,
        descricao: item.descricao,
        status: 'PENDENTE',
        atualizadoEm: nowIso,
      };

      setChecklists((prev) =>
        prev.map((c) => {
          if (c.id !== checklistId) return c;
          const updatedChecklist = {
            ...c,
            itens: [...c.itens, newItem],
            dataAtualizacao: nowIso,
          };
          syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao salvar item no Firestore:', err));
          return updatedChecklist;
        })
      );

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        tipoRegistro: 'CHECKLIST',
        acao: 'EDICAO',
        campoModificado: 'itens',
        detalhes: `Item "${item.titulo}" adicionado ao checklist.`,
      });
    },
    [addAuditLog, user]
  );

  const removeItemFromChecklist = useCallback(
    (checklistId: string, itemId: string) => {
      setChecklists((prev) =>
        prev.map((c) => {
          if (c.id !== checklistId) return c;
          const updatedChecklist = {
            ...c,
            itens: c.itens.filter((i) => i.id !== itemId),
            dataAtualizacao: new Date().toISOString(),
          };
          syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao remover item no Firestore:', err));
          return updatedChecklist;
        })
      );

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        tipoRegistro: 'CHECKLIST',
        acao: 'EDICAO',
        campoModificado: 'itens',
        detalhes: `Item removido do checklist pelo operador.`,
      });
    },
    [addAuditLog, user]
  );

  // Salvar Rascunho sem Concluir Imediatamente (Permite retomar depois)
  const saveChecklistDraft = useCallback(
    (checklistId: string, observacoesGerais?: string) => {
      const existing = checklists.find((c) => c.id === checklistId);
      if (!existing) return { success: false, error: 'Checklist não encontrado' };

      const nowIso = new Date().toISOString();
      const isAnyDone = existing.itens.some((i) => i.status !== 'PENDENTE');
      const newStatus = isAnyDone ? 'EM_ANDAMENTO' : existing.status;

      const updatedChecklist: BranchChecklist = {
        ...existing,
        status: newStatus,
        observacoesGerais: observacoesGerais !== undefined ? observacoesGerais : existing.observacoesGerais,
        dataAtualizacao: nowIso,
      };

      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
      syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao salvar rascunho no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        unidadeId: existing.unidadeId,
        unidadeNome: existing.unidadeNome,
        tipoRegistro: 'CHECKLIST',
        acao: 'EDICAO',
        detalhes: `Preenchimento intermediário do checklist "${existing.nome}" salvo com sucesso.`,
      });

      return { success: true };
    },
    [checklists, addAuditLog, user]
  );

  // Finalizar Checklist com Validações
  const completeChecklist = useCallback(
    (checklistId: string, observacoesGerais?: string) => {
      const existing = checklists.find((c) => c.id === checklistId);
      if (!existing) return { success: false, error: 'Checklist não encontrado' };

      // Validação: não pode finalizar com itens ainda Pendentes sem justificativa
      const pendingItems = existing.itens.filter((i) => i.status === 'PENDENTE');
      if (pendingItems.length > 0) {
        return {
          success: false,
          error: `Não é possível finalizar. Existem ${pendingItems.length} item(ns) pendente(s) de avaliação. Marque como Conforme, Não Conforme ou Não Aplicável.`,
        };
      }

      const hasNonConformity = existing.itens.some((i) => i.status === 'NAO_CONFORME');
      const finalStatus: ChecklistOverallStatus = hasNonConformity ? 'NAO_CONFORME' : 'CONCLUIDO';
      const nowIso = new Date().toISOString();

      const updatedChecklist: BranchChecklist = {
        ...existing,
        status: finalStatus,
        dataConclusao: nowIso,
        dataAtualizacao: nowIso,
        observacoesGerais: observacoesGerais !== undefined ? observacoesGerais : existing.observacoesGerais,
      };

      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
      syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao concluir checklist no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Operador',
        unidadeId: existing.unidadeId,
        unidadeNome: existing.unidadeNome,
        tipoRegistro: 'CHECKLIST',
        acao: 'CONCLUSAO',
        campoModificado: 'status',
        valorAnterior: existing.status,
        valorNovo: finalStatus,
        detalhes: `Checklist "${existing.nome}" finalizado com status ${finalStatus}. ${
          hasNonConformity ? 'Inconformidades registradas para tratativa técnica.' : '100% de conformidade operacional.'
        }`,
      });

      return { success: true, hasNonConformity };
    },
    [checklists, addAuditLog, user]
  );

  // Reabertura de Checklist Concluído (Exige permissão e motivo registrado)
  const reopenChecklist = useCallback(
    (checklistId: string, motivo: string) => {
      const cleanMotivo = motivo.trim();
      if (!cleanMotivo || cleanMotivo.length < 5) {
        return { success: false, error: 'Informe uma justificativa válida para reabrir o checklist (mínimo 5 caracteres).' };
      }

      const existing = checklists.find((c) => c.id === checklistId);
      if (!existing) return { success: false, error: 'Checklist não encontrado' };

      const nowIso = new Date().toISOString();
      const reopenRecord = {
        data: nowIso,
        responsavelId: user?.id || 'admin',
        responsavelNome: user?.nome || 'Administrador',
        motivo: cleanMotivo,
      };

      const updatedChecklist: BranchChecklist = {
        ...existing,
        status: 'EM_ANDAMENTO' as ChecklistOverallStatus,
        dataConclusao: undefined,
        dataAtualizacao: nowIso,
        historicoReabertura: [...(existing.historicoReabertura || []), reopenRecord],
      };

      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
      syncSaveBranchChecklist(updatedChecklist).catch((err) => console.warn('Erro ao reabrir checklist no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'admin',
        usuarioNome: user?.nome || 'Administrador',
        unidadeId: existing.unidadeId,
        unidadeNome: existing.unidadeNome,
        tipoRegistro: 'CHECKLIST',
        acao: 'REABERTURA',
        campoModificado: 'status',
        valorAnterior: existing.status,
        valorNovo: 'EM_ANDAMENTO',
        motivo: cleanMotivo,
        detalhes: `Checklist "${existing.nome}" reaberto por ${user?.nome}. Motivo: ${cleanMotivo}`,
      });

      return { success: true };
    },
    [checklists, addAuditLog, user]
  );

  const deleteChecklist = useCallback(
    (checklistId: string) => {
      const existing = checklists.find((c) => c.id === checklistId);
      if (!existing) return { success: false, error: 'Checklist não encontrado' };

      setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
      syncDeleteBranchChecklist(checklistId).catch((err) => console.warn('Erro ao excluir checklist no Firestore:', err));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        unidadeId: existing.unidadeId,
        unidadeNome: existing.unidadeNome,
        tipoRegistro: 'CHECKLIST',
        acao: 'EXCLUSAO',
        detalhes: `Checklist "${existing.nome}" excluído pelo administrador.`,
      });

      return { success: true };
    },
    [checklists, addAuditLog, user]
  );

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: checklists.length,
      pendentes: checklists.filter((c) => c.status === 'PENDENTE').length,
      emAndamento: checklists.filter((c) => c.status === 'EM_ANDAMENTO').length,
      concluidos: checklists.filter((c) => c.status === 'CONCLUIDO').length,
      naoConformes: checklists.filter((c) => c.status === 'NAO_CONFORME').length,
    };
  }, [checklists]);

  // Lista de não conformidades recentes para o Dashboard
  const recentNonConformities = useMemo(() => {
    const list: Array<{
      checklistId: string;
      unidadeNome: string;
      itemTitulo: string;
      observacao?: string;
      data: string;
    }> = [];

    for (const chk of checklists) {
      for (const it of chk.itens) {
        if (it.status === 'NAO_CONFORME') {
          list.push({
            checklistId: chk.id,
            unidadeNome: chk.unidadeNome,
            itemTitulo: it.titulo,
            observacao: it.observacao,
            data: chk.dataAtualizacao,
          });
        }
      }
    }

    return list.slice(0, 8);
  }, [checklists]);

  return (
    <BranchChecklistContext.Provider
      value={{
        templates,
        checklists,
        activeChecklistId,
        setActiveChecklistId,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplateById,
        createChecklistFromTemplate,
        createCustomChecklist,
        getChecklistById,
        getChecklistsByUnit,
        updateChecklistItem,
        addItemToChecklist,
        removeItemFromChecklist,
        saveChecklistDraft,
        completeChecklist,
        reopenChecklist,
        deleteChecklist,
        stats,
        recentNonConformities,
      }}
    >
      {children}
    </BranchChecklistContext.Provider>
  );
};

export const useBranchChecklists = () => {
  const context = useContext(BranchChecklistContext);
  if (!context) {
    throw new Error('useBranchChecklists must be used within a BranchChecklistProvider');
  }
  return context;
};
