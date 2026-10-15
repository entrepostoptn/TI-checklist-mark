import React, { useState, useMemo } from 'react';
import { useAudit } from '../context/AuditContext';
import { useBranches } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { AuditLog, AuditActionType, AuditRecordType } from '../types/audit';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building2,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  Eye,
} from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
  const { logs, stats, exportAuditToCsv } = useAudit();
  const { branches } = useBranches();
  const { users } = useAuth();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('TODOS');
  const [selectedBranch, setSelectedBranch] = useState<string>('TODAS');
  const [selectedRecordType, setSelectedRecordType] = useState<string>('TODOS');
  const [selectedAction, setSelectedAction] = useState<string>('TODAS');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedUser !== 'TODOS' && log.usuarioId !== selectedUser && log.usuarioNome !== selectedUser) {
        return false;
      }
      if (selectedBranch !== 'TODAS' && log.unidadeId !== selectedBranch && log.unidadeNome !== selectedBranch) {
        return false;
      }
      if (selectedRecordType !== 'TODOS' && log.tipoRegistro !== selectedRecordType) {
        return false;
      }
      if (selectedAction !== 'TODAS' && log.acao !== selectedAction) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        log.usuarioNome.toLowerCase().includes(lower) ||
        (log.unidadeNome && log.unidadeNome.toLowerCase().includes(lower)) ||
        (log.campoModificado && log.campoModificado.toLowerCase().includes(lower)) ||
        (log.valorNovo && log.valorNovo.toLowerCase().includes(lower)) ||
        (log.valorAnterior && log.valorAnterior.toLowerCase().includes(lower)) ||
        (log.motivo && log.motivo.toLowerCase().includes(lower)) ||
        (log.detalhes && log.detalhes.toLowerCase().includes(lower)) ||
        log.acao.toLowerCase().includes(lower)
      );
    });
  }, [logs, selectedUser, selectedBranch, selectedRecordType, selectedAction, searchTerm]);

  // Unique actions in logs
  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.acao));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Histórico de Modificações & Auditoria
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold font-mono">
              {logs.length} registros
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Trilha de auditoria permanente, imutável e somente-leitura. Armazenamento seguro de todas as operações críticas.
          </p>
        </div>

        <button
          type="button"
          onClick={exportAuditToCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Security Banner: Imutabilidade (Requirement 5) */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Trilha de Governança e Segurança Ativa</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono">
                SOMENTE LEITURA
              </span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Registros mantidos em partição separada. Senhas nunca são expostas em texto. Nenhuma exclusão ou adulteração é permitida.
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuário, filial, motivo, campo ou alteração..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter User */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TODOS">Todos os Usuários</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.perfil})
                </option>
              ))}
            </select>

            {/* Filter Branch */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TODAS">Todas as Filiais/Matriz</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.idOriginal} — {b.nomeFantasia}
                </option>
              ))}
            </select>

            {/* Filter Record Type */}
            <select
              value={selectedRecordType}
              onChange={(e) => setSelectedRecordType(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="FILIAL">Filial / Matriz</option>
              <option value="CHECKLIST">Checklist</option>
              <option value="MODELO">Modelo</option>
              <option value="USUARIO">Usuário</option>
              <option value="AUTENTICACAO">Autenticação</option>
            </select>

            {/* Filter Action */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TODAS">Todas as Ações</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            {(searchTerm || selectedUser !== 'TODOS' || selectedBranch !== 'TODAS' || selectedRecordType !== 'TODOS' || selectedAction !== 'TODAS') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedUser('TODOS');
                  setSelectedBranch('TODAS');
                  setSelectedRecordType('TODOS');
                  setSelectedAction('TODAS');
                }}
                className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View: High-efficiency, touch-friendly Audit Cards */}
      <div className="block md:hidden space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 text-xs">
            Nenhum registro de modificação encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const dateObj = new Date(log.dataHora);
            const formattedDate = dateObj.toLocaleDateString('pt-BR');
            const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2.5"
              >
                {/* Header: User & Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {log.usuarioNome.charAt(0)}
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate">{log.usuarioNome}</span>
                  </div>

                  <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                    <span className="font-bold">{formattedDate}</span> <span className="text-slate-400">{formattedTime}</span>
                  </div>
                </div>

                {/* Badges: Action & Unit */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      log.acao === 'LOGIN' || log.acao === 'CONCLUSAO' || log.acao === 'ATIVACAO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.acao === 'INATIVACAO' || log.acao === 'EXCLUSAO'
                        ? 'bg-rose-100 text-rose-800'
                        : log.acao === 'REABERTURA'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.acao}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                    {log.tipoRegistro}
                  </span>

                  {log.unidadeNome && (
                    <span className="text-[11px] text-slate-600 flex items-center gap-1 truncate max-w-[180px]">
                      <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{log.unidadeNome}</span>
                    </span>
                  )}
                </div>

                {/* Modified Field and Values */}
                {(log.campoModificado || log.valorAnterior || log.valorNovo) && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                    {log.campoModificado && (
                      <div className="text-[11px] font-semibold text-slate-600">
                        Campo: <span className="text-slate-900">{log.campoModificado}</span>
                      </div>
                    )}
                    {(log.valorAnterior || log.valorNovo) && (
                      <div className="font-mono text-[11px] space-y-0.5">
                        {log.valorAnterior && (
                          <div className="text-slate-400 line-through truncate">
                            {log.valorAnterior}
                          </div>
                        )}
                        {log.valorNovo && (
                          <div className="text-emerald-700 font-bold truncate">
                            {log.valorNovo}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Details / Reason */}
                <div className="text-xs text-slate-700">
                  <div>{log.detalhes || 'Operação registrada'}</div>
                  {log.motivo && (
                    <div className="text-[11px] text-amber-800 font-semibold italic mt-0.5">
                      Motivo: "{log.motivo}"
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Audit Logs Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Unidade Relacionada</th>
                <th className="py-3 px-4">Tipo / Ação</th>
                <th className="py-3 px-4">Campo Modificado</th>
                <th className="py-3 px-4">Valor Anterior / Novo</th>
                <th className="py-3 px-4">Motivo / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum registro de modificação encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.dataHora);
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Data e Hora */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        <div className="font-bold text-slate-900">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Usuário */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {log.usuarioNome.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{log.usuarioNome}</span>
                        </div>
                      </td>

                      {/* Unidade */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.unidadeNome ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[180px]">{log.unidadeNome}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Geral / Sistema</span>
                        )}
                      </td>

                      {/* Tipo / Ação */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.tipoRegistro}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              log.acao === 'LOGIN' || log.acao === 'CONCLUSAO' || log.acao === 'ATIVACAO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.acao === 'INATIVACAO' || log.acao === 'EXCLUSAO'
                                ? 'bg-rose-100 text-rose-800'
                                : log.acao === 'REABERTURA'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.acao}
                          </span>
                        </div>
                      </td>

                      {/* Campo Modificado */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {log.campoModificado || '—'}
                      </td>

                      {/* Valor Anterior / Novo */}
                      <td className="py-3 px-4 text-xs">
                        {log.valorAnterior || log.valorNovo ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {log.valorAnterior && (
                              <div className="text-slate-400 line-through truncate max-w-[150px]">
                                {log.valorAnterior}
                              </div>
                            )}
                            {log.valorNovo && (
                              <div className="text-emerald-700 font-bold truncate max-w-[150px]">
                                {log.valorNovo}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Motivo / Detalhes */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 font-medium">
                          {log.detalhes || 'Operação registrada'}
                        </div>
                        {log.motivo && (
                          <div className="text-[11px] text-amber-800 font-semibold italic mt-0.5">
                            Motivo: "{log.motivo}"
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
