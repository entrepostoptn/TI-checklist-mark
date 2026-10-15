import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BranchUnit, BranchFilterOptions, BranchStatus } from '../types/branch';
import { INITIAL_PATA_NEGRA_BRANCHES, MATRIZ_PATA_NEGRA } from '../constants/initialPataNegraData';
import { useAudit } from './AuditContext';
import { useAuth } from './AuthContext';

interface BranchContextType {
  branches: BranchUnit[];
  filteredBranches: BranchUnit[];
  filterOptions: BranchFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<BranchFilterOptions>>;
  matriz: BranchUnit;
  filiais: BranchUnit[];
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  getBranchById: (id: string) => BranchUnit | undefined;
  getBranchByCnpj: (cnpj: string) => BranchUnit | undefined;
  addBranch: (data: Omit<BranchUnit, 'id' | 'criadoEm' | 'atualizadoEm'>) => { success: boolean; branch?: BranchUnit; error?: string };
  updateBranch: (id: string, patch: Partial<BranchUnit>, motivo?: string) => { success: boolean; error?: string };
  toggleBranchStatus: (id: string, motivo?: string) => { success: boolean; branch?: BranchUnit; error?: string };
  importBranchesBatch: (list: Array<Partial<BranchUnit>>) => { success: boolean; created: number; updated: number };
  exportBranchesToCsv: () => void;
  clearFilters: () => void;
}

const STORAGE_KEY_BRANCHES = 'ptn_branches_master_v2';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addAuditLog } = useAudit();
  const { user } = useAuth();

  const [branches, setBranches] = useState<BranchUnit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRANCHES);
      if (saved) {
        const parsed: BranchUnit[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PATA_NEGRA_BRANCHES;
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<BranchFilterOptions>({
    busca: '',
    municipio: '',
    uf: '',
    status: 'TODAS',
    ordenarPor: 'codigo',
    ordemDirecao: 'asc',
  });

  // Salva no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(branches));
    } catch {}
  }, [branches]);

  // Contadores
  const totalCount = branches.length;
  const activeCount = branches.filter((b) => b.status === 'ativa').length;
  const inactiveCount = branches.filter((b) => b.status === 'inativa').length;

  const matriz = useMemo(() => {
    return branches.find((b) => b.tipo === 'MATRIZ') || MATRIZ_PATA_NEGRA;
  }, [branches]);

  const filiais = useMemo(() => {
    return branches.filter((b) => b.tipo === 'FILIAL');
  }, [branches]);

  const getBranchById = useCallback((id: string) => branches.find((b) => b.id === id), [branches]);
  const getBranchByCnpj = useCallback(
    (cnpj: string) => {
      const clean = cnpj.replace(/\D/g, '');
      return branches.find((b) => b.cnpj.replace(/\D/g, '') === clean);
    },
    [branches]
  );

  // Adicionar Filial com validação rigorosa de CNPJ (evita duplicatas)
  const addBranch = useCallback(
    (data: Omit<BranchUnit, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
      const cleanCnpj = data.cnpj.trim();
      if (!cleanCnpj) {
        return { success: false, error: 'O CNPJ é obrigatório para cadastrar a filial.' };
      }

      // Checa duplicidade por CNPJ
      const existingByCnpj = branches.find((b) => b.cnpj.replace(/\D/g, '') === cleanCnpj.replace(/\D/g, ''));
      if (existingByCnpj) {
        return {
          success: false,
          error: `O CNPJ "${cleanCnpj}" já está cadastrado para a unidade "${existingByCnpj.nomeFantasia}" (ID: ${existingByCnpj.idOriginal}). Atualize o cadastro existente em vez de duplicar.`,
        };
      }

      const cleanNome = data.nomeFantasia.trim();
      if (!cleanNome) {
        return { success: false, error: 'O Nome Fantasia é obrigatório.' };
      }

      const newId = `branch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      const newBranch: BranchUnit = {
        ...data,
        id: newId,
        idOriginal: data.idOriginal || String(branches.length + 1).padStart(2, '0'),
        nomeFantasia: cleanNome,
        razaoSocial: data.razaoSocial.trim() || cleanNome,
        status: data.status || 'ativa',
        criadoEm: nowIso,
        atualizadoEm: nowIso,
      };

      setBranches((prev) => [...prev, newBranch]);

      // Registro de auditoria
      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        unidadeId: newBranch.id,
        unidadeNome: newBranch.nomeFantasia,
        tipoRegistro: 'FILIAL',
        acao: 'CRIACAO',
        detalhes: `Filial ${newBranch.idOriginal} — "${newBranch.nomeFantasia}" cadastrada com CNPJ ${newBranch.cnpj}.`,
      });

      return { success: true, branch: newBranch };
    },
    [branches, addAuditLog, user]
  );

  // Atualizar Filial
  const updateBranch = useCallback(
    (id: string, patch: Partial<BranchUnit>, motivo?: string) => {
      const existing = branches.find((b) => b.id === id);
      if (!existing) return { success: false, error: 'Unidade não encontrada.' };

      // Se alterou CNPJ, verifica se não conflita com outra filial
      if (patch.cnpj && patch.cnpj.replace(/\D/g, '') !== existing.cnpj.replace(/\D/g, '')) {
        const cleanNewCnpj = patch.cnpj.replace(/\D/g, '');
        const duplicate = branches.find((b) => b.id !== id && b.cnpj.replace(/\D/g, '') === cleanNewCnpj);
        if (duplicate) {
          return {
            success: false,
            error: `O CNPJ "${patch.cnpj}" já pertence a outra unidade ("${duplicate.nomeFantasia}"). Operação cancelada para evitar duplicidade.`,
          };
        }
      }

      const updatedBranch: BranchUnit = {
        ...existing,
        ...patch,
        id: existing.id,
        criadoEm: existing.criadoEm,
        atualizadoEm: new Date().toISOString(),
      };

      setBranches((prev) => prev.map((b) => (b.id === id ? updatedBranch : b)));

      // Identifica campos modificados para auditoria
      const modifiedFields: string[] = [];
      if (patch.nomeFantasia && patch.nomeFantasia !== existing.nomeFantasia) modifiedFields.push('Nome Fantasia');
      if (patch.razaoSocial && patch.razaoSocial !== existing.razaoSocial) modifiedFields.push('Razão Social');
      if (patch.cnpj && patch.cnpj !== existing.cnpj) modifiedFields.push('CNPJ');
      if (patch.endereco && patch.endereco !== existing.endereco) modifiedFields.push('Endereço');
      if (patch.telefone && patch.telefone !== existing.telefone) modifiedFields.push('Telefone');
      if (patch.status && patch.status !== existing.status) modifiedFields.push('Status');

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Usuário',
        unidadeId: updatedBranch.id,
        unidadeNome: updatedBranch.nomeFantasia,
        tipoRegistro: 'FILIAL',
        acao: 'EDICAO',
        campoModificado: modifiedFields.join(', ') || 'Dados Gerais',
        valorAnterior: existing.nomeFantasia,
        valorNovo: updatedBranch.nomeFantasia,
        motivo: motivo || 'Atualização cadastral da unidade',
        detalhes: `Campos atualizados: ${modifiedFields.join(', ')}`,
      });

      return { success: true };
    },
    [branches, addAuditLog, user]
  );

  // Ativar / Inativar Filial (Respeita regra de não exclusão)
  const toggleBranchStatus = useCallback(
    (id: string, motivo?: string) => {
      const existing = branches.find((b) => b.id === id);
      if (!existing) return { success: false, error: 'Unidade não encontrada' };

      const nextStatus: BranchStatus = existing.status === 'ativa' ? 'inativa' : 'ativa';
      const actionType = nextStatus === 'ativa' ? 'ATIVACAO' : 'INATIVACAO';

      const updatedBranch: BranchUnit = {
        ...existing,
        status: nextStatus,
        atualizadoEm: new Date().toISOString(),
      };

      setBranches((prev) => prev.map((b) => (b.id === id ? updatedBranch : b)));

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Usuário',
        unidadeId: updatedBranch.id,
        unidadeNome: updatedBranch.nomeFantasia,
        tipoRegistro: 'FILIAL',
        acao: actionType,
        campoModificado: 'status',
        valorAnterior: existing.status,
        valorNovo: nextStatus,
        motivo: motivo || (nextStatus === 'inativa' ? 'Unidade marcada como desativada' : 'Reativação operacional da filial'),
        detalhes: `Status da unidade alterado para: ${nextStatus === 'ativa' ? 'Ativa (🟢)' : 'Inativa (🔴)'}`,
      });

      return { success: true, branch: updatedBranch };
    },
    [branches, addAuditLog, user]
  );

  // Importação e Atualização em Lote com verificação de CNPJ
  const importBranchesBatch = useCallback(
    (list: Array<Partial<BranchUnit>>) => {
      let created = 0;
      let updated = 0;

      setBranches((prev) => {
        const next = [...prev];

        for (const item of list) {
          if (!item.cnpj && !item.nomeFantasia) continue;

          const cleanCnpj = (item.cnpj || '').replace(/\D/g, '');
          const cleanCodigo = (item.idOriginal || '').trim().toUpperCase();

          // Localiza por CNPJ (identificador principal) ou por ID da empresa original
          const existingIdx = next.findIndex((b) => {
            if (cleanCnpj && b.cnpj.replace(/\D/g, '') === cleanCnpj) return true;
            if (cleanCodigo && b.idOriginal.trim().toUpperCase() === cleanCodigo) return true;
            return false;
          });

          if (existingIdx >= 0) {
            // Atualiza sem duplicar
            const existing = next[existingIdx];
            const updatedBranch: BranchUnit = {
              ...existing,
              ...item,
              id: existing.id,
              idOriginal: item.idOriginal || existing.idOriginal,
              nomeFantasia: (item.nomeFantasia || existing.nomeFantasia).trim(),
              razaoSocial: (item.razaoSocial || existing.razaoSocial).trim(),
              cnpj: item.cnpj || existing.cnpj,
              status: item.status || existing.status,
              atualizadoEm: new Date().toISOString(),
            };
            next[existingIdx] = updatedBranch;
            updated++;
          } else {
            // Cria novo registro
            const newBranch: BranchUnit = {
              id: `branch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              idOriginal: item.idOriginal || String(next.length + 1).padStart(2, '0'),
              tipo: item.tipo || 'FILIAL',
              cnpj: item.cnpj || '00.000.000/0000-00',
              razaoSocial: item.razaoSocial || item.nomeFantasia || 'Pata Negra Filial',
              nomeFantasia: item.nomeFantasia || `Pata Negra — Loja ${item.idOriginal}`,
              cep: item.cep || '00000-000',
              endereco: item.endereco || 'Endereço em conferência',
              municipio: item.municipio || 'São Paulo',
              uf: item.uf || 'SP',
              telefone: item.telefone,
              status: item.status || 'ativa',
              responsavelLocal: item.responsavelLocal,
              pendenteConferencia: item.pendenteConferencia,
              criadoEm: new Date().toISOString(),
              atualizadoEm: new Date().toISOString(),
            };
            next.push(newBranch);
            created++;
          }
        }

        return next;
      });

      addAuditLog({
        usuarioId: user?.id || 'sistema',
        usuarioNome: user?.nome || 'Administrador',
        tipoRegistro: 'FILIAL',
        acao: 'IMPORTACAO_LOTE',
        detalhes: `Importação em lote concluída: ${created} unidades criadas, ${updated} atualizadas com preservação de histórico.`,
      });

      return { success: true, created, updated };
    },
    [addAuditLog, user]
  );

  // Filtros da tabela principal
  const filteredBranches = useMemo(() => {
    return branches
      .filter((b) => {
        if (filterOptions.status === 'ATIVAS' && b.status !== 'ativa') return false;
        if (filterOptions.status === 'INATIVAS' && b.status !== 'inativa') return false;
        if (filterOptions.municipio && b.municipio.toLowerCase() !== filterOptions.municipio.toLowerCase()) return false;
        if (filterOptions.uf && b.uf.toUpperCase() !== filterOptions.uf.toUpperCase()) return false;

        if (!filterOptions.busca.trim()) return true;
        const lower = filterOptions.busca.toLowerCase();
        const cleanSearchNumbers = filterOptions.busca.replace(/\D/g, '');

        const matchNome = b.nomeFantasia.toLowerCase().includes(lower);
        const matchRazao = b.razaoSocial.toLowerCase().includes(lower);
        const matchCodigo = b.idOriginal.toLowerCase().includes(lower);
        const matchCnpj = cleanSearchNumbers && b.cnpj.replace(/\D/g, '').includes(cleanSearchNumbers);
        const matchCidade = b.municipio.toLowerCase().includes(lower);
        const matchEndereco = b.endereco.toLowerCase().includes(lower);

        return matchNome || matchRazao || matchCodigo || matchCnpj || matchCidade || matchEndereco;
      })
      .sort((a, b) => {
        const factor = filterOptions.ordemDirecao === 'asc' ? 1 : -1;
        if (filterOptions.ordenarPor === 'nome') {
          return a.nomeFantasia.localeCompare(b.nomeFantasia) * factor;
        }
        if (filterOptions.ordenarPor === 'cidade') {
          return a.municipio.localeCompare(b.municipio) * factor;
        }
        if (filterOptions.ordenarPor === 'atualizacao') {
          return (new Date(a.atualizadoEm).getTime() - new Date(b.atualizadoEm).getTime()) * factor;
        }
        // Padrão: Código numérico (1 a 43)
        const numA = parseInt(a.idOriginal.replace(/\D/g, ''), 10);
        const numB = parseInt(b.idOriginal.replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA - numB) * factor;
        }
        return a.idOriginal.localeCompare(b.idOriginal, undefined, { numeric: true }) * factor;
      });
  }, [branches, filterOptions]);

  const clearFilters = useCallback(() => {
    setFilterOptions({
      busca: '',
      municipio: '',
      uf: '',
      status: 'TODAS',
      ordenarPor: 'codigo',
      ordemDirecao: 'asc',
    });
  }, []);

  // Exportação para CSV / Excel
  const exportBranchesToCsv = useCallback(() => {
    const headers = [
      'ID Empresa',
      'Tipo',
      'Nome Fantasia',
      'Razão Social',
      'CNPJ',
      'CEP',
      'Endereço',
      'Município',
      'UF',
      'Telefone',
      'Status',
      'Responsável Local',
      'Última Atualização',
    ];

    const rows = filteredBranches.map((b) => [
      b.idOriginal,
      b.tipo,
      `"${b.nomeFantasia.replace(/"/g, '""')}"`,
      `"${b.razaoSocial.replace(/"/g, '""')}"`,
      b.cnpj,
      b.cep,
      `"${b.endereco.replace(/"/g, '""')}"`,
      b.municipio,
      b.uf,
      b.telefone || '—',
      b.status === 'ativa' ? 'ATIVA' : 'INATIVA',
      `"${(b.responsavelLocal || '').replace(/"/g, '""')}"`,
      new Date(b.atualizadoEm).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `filiais_pata_negra_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredBranches]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        filteredBranches,
        filterOptions,
        setFilterOptions,
        matriz,
        filiais,
        activeCount,
        inactiveCount,
        totalCount,
        selectedBranchId,
        setSelectedBranchId,
        getBranchById,
        getBranchByCnpj,
        addBranch,
        updateBranch,
        toggleBranchStatus,
        importBranchesBatch,
        exportBranchesToCsv,
        clearFilters,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranches = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranches must be used within a BranchProvider');
  }
  return context;
};
