import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuditLog, AuditActionType, AuditRecordType, AuditFilterOptions } from '../types/audit';
import { INITIAL_AUDIT_LOGS } from '../constants/initialPataNegraData';
import { subscribeToAuditLogs, syncSaveAuditLog } from '../services/firestoreSync';

interface AuditContextType {
  logs: AuditLog[];
  filterOptions: AuditFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<AuditFilterOptions>>;
  filteredLogs: AuditLog[];
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'dataHora'>) => void;
  exportAuditToCsv: () => void;
  clearFilters: () => void;
  stats: {
    totalLogs: number;
    filiaisLogs: number;
    checklistLogs: number;
    authLogs: number;
    usuariosLogs: number;
  };
}

const STORAGE_KEY_AUDIT = 'ptn_audit_logs_v2';

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (saved) {
        const parsed: AuditLog[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });

  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({
    busca: '',
    tipoRegistro: 'TODOS',
    acao: 'TODAS',
  });

  // Sincronização em tempo real via Firestore
  useEffect(() => {
    const unsub = subscribeToAuditLogs(
      (remoteLogs) => {
        setLogs(remoteLogs);
        try {
          localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(remoteLogs));
        } catch {}
      },
      (err) => console.warn('Audit logs sync error:', err)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Registro imutável de auditoria sincronizado globalmente
  const addAuditLog = useCallback((entry: Omit<AuditLog, 'id' | 'dataHora'>) => {
    const newLog: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataHora: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
    syncSaveAuditLog(newLog).catch((err) => console.warn('Erro ao salvar log de auditoria no Firestore:', err));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterOptions({
      busca: '',
      tipoRegistro: 'TODOS',
      acao: 'TODAS',
    });
  }, []);

  // Filtros avançados
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterOptions.tipoRegistro && filterOptions.tipoRegistro !== 'TODOS' && log.tipoRegistro !== filterOptions.tipoRegistro) {
        return false;
      }
      if (filterOptions.acao && filterOptions.acao !== 'TODAS' && log.acao !== filterOptions.acao) {
        return false;
      }
      if (filterOptions.usuarioId && log.usuarioId !== filterOptions.usuarioId) {
        return false;
      }
      if (filterOptions.unidadeId && log.unidadeId !== filterOptions.unidadeId) {
        return false;
      }

      if (!filterOptions.busca.trim()) return true;
      const lower = filterOptions.busca.toLowerCase();
      return (
        log.usuarioNome.toLowerCase().includes(lower) ||
        (log.unidadeNome && log.unidadeNome.toLowerCase().includes(lower)) ||
        (log.campoModificado && log.campoModificado.toLowerCase().includes(lower)) ||
        (log.valorNovo && log.valorNovo.toLowerCase().includes(lower)) ||
        (log.motivo && log.motivo.toLowerCase().includes(lower)) ||
        (log.detalhes && log.detalhes.toLowerCase().includes(lower)) ||
        log.acao.toLowerCase().includes(lower)
      );
    });
  }, [logs, filterOptions]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      totalLogs: logs.length,
      filiaisLogs: logs.filter((l) => l.tipoRegistro === 'FILIAL').length,
      checklistLogs: logs.filter((l) => l.tipoRegistro === 'CHECKLIST').length,
      authLogs: logs.filter((l) => l.tipoRegistro === 'AUTENTICACAO').length,
      usuariosLogs: logs.filter((l) => l.tipoRegistro === 'USUARIO').length,
    };
  }, [logs]);

  // Exportação para CSV auditável
  const exportAuditToCsv = useCallback(() => {
    const headers = [
      'Data e Hora',
      'Usuário',
      'Unidade',
      'Tipo de Registro',
      'Ação',
      'Campo Modificado',
      'Valor Anterior',
      'Valor Novo',
      'Motivo / Detalhes',
    ];

    const rows = filteredLogs.map((l) => [
      new Date(l.dataHora).toLocaleString('pt-BR'),
      l.usuarioNome,
      l.unidadeNome || '—',
      l.tipoRegistro,
      l.acao,
      l.campoModificado || '—',
      l.valorAnterior || '—',
      l.valorNovo || '—',
      `"${(l.motivo || l.detalhes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_modificacoes_pata_negra_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  return (
    <AuditContext.Provider
      value={{
        logs,
        filterOptions,
        setFilterOptions,
        filteredLogs,
        addAuditLog,
        exportAuditToCsv,
        clearFilters,
        stats,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
