import React, { useState, useMemo } from 'react';
import { useEquipment } from '../context/EquipmentContext';
import { useServiceOrders } from '../context/ServiceOrderContext';
import { Equipment, MovementRecord, HardwareChangeRecord, EQUIPMENT_STATUS_LABELS } from '../types/equipment';
import { ServiceOrder, STATUS_LABELS } from '../types/serviceOrder';
import { formatDateBR, formatDateTimeBR, formatShortDateTimeBR, calculateDaysBetween } from '../utils/dateFormatter';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Store,
  Laptop,
  Wrench,
  RotateCcw,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  History,
  Tag,
  User,
} from 'lucide-react';

type ReportTab = 'manutencao_maquina' | 'entrada_retirada' | 'recorrencia' | 'equipamentos' | 'pecas';

export const ReportsManager: React.FC = () => {
  const { equipments, movements, hardwareChanges } = useEquipment();
  const { orders } = useServiceOrders();

  const [activeReport, setActiveReport] = useState<ReportTab>('manutencao_maquina');

  // Global Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('ALL');
  const [selectedTech, setSelectedTech] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Stores list for filter
  const storesList = useMemo(() => {
    const list = new Set<string>();
    equipments.forEach((e) => e.lojaOrigem && list.add(e.lojaOrigem));
    orders.forEach((o) => o.lojaOrigem && list.add(o.lojaOrigem));
    return Array.from(list).sort();
  }, [equipments, orders]);

  // Technicians list for filter
  const techList = useMemo(() => {
    const list = new Set<string>();
    equipments.forEach((e) => e.tecnicoResponsavel && list.add(e.tecnicoResponsavel));
    orders.forEach((o) => o.tecnicoResponsavel && list.add(o.tecnicoResponsavel));
    movements.forEach((m) => m.tecnicoResponsavel && list.add(m.tecnicoResponsavel));
    hardwareChanges.forEach((h) => h.tecnicoResponsavel && list.add(h.tecnicoResponsavel));
    return Array.from(list).sort();
  }, [equipments, orders, movements, hardwareChanges]);

  // Filter helper by date range
  const matchesDateRange = (dateStr?: string | null) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.substring(0, 10);
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  };

  // 1. DADOS: RELATÓRIO DE MANUTENÇÃO POR MÁQUINA
  const reportMaintenanceData = useMemo(() => {
    return equipments.map((eq) => {
      // Find orders linked to this machine
      const eqOrders = orders.filter(
        (o) =>
          (o.equipamentoId === eq.id || o.identificacao === eq.nome || (o.patrimonio && o.patrimonio === eq.patrimonio)) &&
          matchesDateRange(o.dataEntrada)
      );

      // Find movements
      const eqMovements = movements.filter(
        (m) => m.equipamentoId === eq.id && matchesDateRange(m.dataHoraEntrada)
      );

      // Find hardware changes
      const eqHardware = hardwareChanges.filter(
        (h) => h.equipamentoId === eq.id && matchesDateRange(h.dataSubstituicao)
      );

      // Total maintenances = total unique OSs or movements
      const totalManutencoes = Math.max(eqOrders.length, eqMovements.length);

      // First and last maintenance dates
      const allDates = [
        ...eqOrders.map((o) => o.dataEntrada).filter(Boolean),
        ...eqMovements.map((m) => m.dataHoraEntrada.substring(0, 10)).filter(Boolean),
      ].sort();

      const primeiraManutencao = allDates[0] || eq.dataPrimeiroCadastro;
      const ultimaManutencao = eq.dataUltimaManutencao || allDates[allDates.length - 1] || null;

      // Calculate days between first and last or average interval
      let intervaloMedioDias = '-';
      if (allDates.length >= 2) {
        const diffDays = calculateDaysBetween(allDates[0], allDates[allDates.length - 1]);
        const avg = Math.round(diffDays / (allDates.length - 1));
        intervaloMedioDias = `${avg} dias`;
      }

      // Check recurrent problems (defects that appeared >= 2 times)
      const problemsMap: Record<string, number> = {};
      eqOrders.forEach((o) => {
        if (o.defeitoRelatado) {
          const key = o.defeitoRelatado.trim().toLowerCase();
          problemsMap[key] = (problemsMap[key] || 0) + 1;
        }
      });
      const recurrentProblems = Object.entries(problemsMap)
        .filter(([_, count]) => count >= 2)
        .map(([prob, count]) => `${prob} (${count}x)`);

      return {
        equipment: eq,
        totalManutencoes,
        primeiraManutencao,
        ultimaManutencao,
        intervaloMedioDias,
        orders: eqOrders,
        pecasSubstituidas: eqHardware,
        recurrentProblems,
      };
    }).filter((item) => {
      if (selectedStore !== 'ALL' && item.equipment.lojaOrigem !== selectedStore) return false;
      if (selectedEquipment !== 'ALL' && item.equipment.id !== selectedEquipment) return false;
      if (selectedStatus !== 'ALL' && item.equipment.status !== selectedStatus) return false;
      if (selectedTech !== 'ALL' && item.equipment.tecnicoResponsavel !== selectedTech) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.equipment.nome.toLowerCase().includes(q) ||
          item.equipment.patrimonio.toLowerCase().includes(q) ||
          item.equipment.numeroSerie.toLowerCase().includes(q) ||
          item.equipment.lojaOrigem.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [equipments, orders, movements, hardwareChanges, startDate, endDate, selectedStore, selectedEquipment, selectedStatus, selectedTech, searchQuery]);

  // 2. DADOS: RELATÓRIO DE ENTRADA E RETIRADA
  const reportEntradaRetiradaData = useMemo(() => {
    // Collect all movement records and ongoing orders in office
    return movements.map((mov) => {
      const eq = equipments.find((e) => e.id === mov.equipamentoId);
      const isAindaNoEscritorio = !mov.dataHoraRetirada;
      const permanenciaDias = calculateDaysBetween(
        mov.dataHoraEntrada,
        mov.dataHoraRetirada || new Date().toISOString()
      );

      return {
        mov,
        equipment: eq,
        nome: mov.equipamentoNome || eq?.nome || 'Equipamento',
        patrimonio: mov.patrimonio || eq?.patrimonio || '-',
        lojaOrigem: mov.lojaOrigem || eq?.lojaOrigem || '-',
        dataEntrada: mov.dataHoraEntrada,
        dataRetirada: mov.dataHoraRetirada,
        isAindaNoEscritorio,
        permanenciaDias,
        destino: mov.destino || (eq ? eq.lojaOrigem : 'Loja de Origem'),
        tecnico: mov.tecnicoResponsavel,
        resultado: mov.resultadoAtendimento,
      };
    }).filter((item) => {
      if (!matchesDateRange(item.dataEntrada)) return false;
      if (selectedStore !== 'ALL' && item.lojaOrigem !== selectedStore) return false;
      if (selectedEquipment !== 'ALL' && item.equipment?.id !== selectedEquipment) return false;
      if (selectedTech !== 'ALL' && item.tecnico !== selectedTech) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.nome.toLowerCase().includes(q) ||
          item.patrimonio.toLowerCase().includes(q) ||
          item.lojaOrigem.toLowerCase().includes(q) ||
          (item.tecnico && item.tecnico.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [movements, equipments, startDate, endDate, selectedStore, selectedEquipment, selectedTech, searchQuery]);

  // 3. DADOS: RELATÓRIO DE RECORRÊNCIA
  const reportRecorrenciaData = useMemo(() => {
    // Find equipments with recurring problems or multiple orders
    const recurrenceList: Array<{
      equipment: Equipment;
      ocorrenciasCount: number;
      problemasFrequentes: string[];
      pecasRepetidas: string[];
      intervaloEntreOcorrencias: string;
      ordens: ServiceOrder[];
    }> = [];

    equipments.forEach((eq) => {
      const eqOrders = orders.filter(
        (o) =>
          (o.equipamentoId === eq.id || o.identificacao === eq.nome || (o.patrimonio && o.patrimonio === eq.patrimonio)) &&
          matchesDateRange(o.dataEntrada)
      );

      if (eqOrders.length >= 2) {
        // Collect defects
        const defectsMap: Record<string, number> = {};
        eqOrders.forEach((o) => {
          if (o.defeitoRelatado) {
            const clean = o.defeitoRelatado.trim();
            defectsMap[clean] = (defectsMap[clean] || 0) + 1;
          }
        });

        // Collect parts replaced repeatedly
        const eqHardware = hardwareChanges.filter((h) => h.equipamentoId === eq.id);
        const partsMap: Record<string, number> = {};
        eqHardware.forEach((h) => {
          partsMap[h.componenteSubstituido] = (partsMap[h.componenteSubstituido] || 0) + 1;
        });
        const pecasRepetidas = Object.entries(partsMap)
          .filter(([_, count]) => count >= 2)
          .map(([peca, count]) => `${peca} (${count}x)`);

        // Interval
        const sortedDates = eqOrders.map((o) => o.dataEntrada).sort();
        const totalSpan = calculateDaysBetween(sortedDates[0], sortedDates[sortedDates.length - 1]);
        const avg = Math.round(totalSpan / (sortedDates.length - 1));

        recurrenceList.push({
          equipment: eq,
          ocorrenciasCount: eqOrders.length,
          problemasFrequentes: Object.entries(defectsMap).map(([p, c]) => `${p} (${c}x)`),
          pecasRepetidas,
          intervaloEntreOcorrencias: `${avg} dias`,
          ordens: eqOrders,
        });
      }
    });

    return recurrenceList.filter((item) => {
      if (selectedStore !== 'ALL' && item.equipment.lojaOrigem !== selectedStore) return false;
      if (selectedEquipment !== 'ALL' && item.equipment.id !== selectedEquipment) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.equipment.nome.toLowerCase().includes(q) ||
          item.equipment.patrimonio.toLowerCase().includes(q) ||
          item.equipment.lojaOrigem.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [equipments, orders, hardwareChanges, startDate, endDate, selectedStore, selectedEquipment, searchQuery]);

  // 4. DADOS: RELATÓRIO DE EQUIPAMENTOS (PARQUE & HARDWARE)
  const reportEquipamentosData = useMemo(() => {
    return equipments.filter((eq) => {
      if (selectedStore !== 'ALL' && eq.lojaOrigem !== selectedStore) return false;
      if (selectedStatus !== 'ALL' && eq.status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          eq.nome.toLowerCase().includes(q) ||
          eq.patrimonio.toLowerCase().includes(q) ||
          eq.numeroSerie.toLowerCase().includes(q) ||
          eq.marcaModelo.toLowerCase().includes(q) ||
          eq.lojaOrigem.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [equipments, selectedStore, selectedStatus, searchQuery]);

  // 5. DADOS: RELATÓRIO DE PEÇAS & ALTERAÇÕES
  const reportPecasData = useMemo(() => {
    return hardwareChanges.filter((hw) => {
      if (!matchesDateRange(hw.dataSubstituicao)) return false;
      if (selectedTech !== 'ALL' && hw.tecnicoResponsavel !== selectedTech) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          hw.equipamentoNome.toLowerCase().includes(q) ||
          hw.patrimonio.toLowerCase().includes(q) ||
          hw.componenteSubstituido.toLowerCase().includes(q) ||
          hw.componenteInstalado.toLowerCase().includes(q) ||
          hw.tecnicoResponsavel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hardwareChanges, startDate, endDate, selectedTech, searchQuery]);

  // Ranking de peças mais trocadas
  const pecasRanking = useMemo(() => {
    const map: Record<string, number> = {};
    hardwareChanges.forEach((h) => {
      const comp = h.componenteSubstituido.trim();
      map[comp] = (map[comp] || 0) + (h.quantidade || 1);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [hardwareChanges]);

  // EXPORT TO CSV / EXCEL (UTF-8 com BOM e formato brasileiro)
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `relatorio_ti_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'manutencao_maquina') {
      rows.push([
        'Equipamento',
        'Patrimônio',
        'Número de Série',
        'Loja',
        'Total de Manutenções',
        'Primeira Manutenção',
        'Última Manutenção',
        'Intervalo Médio',
        'Peças Substituídas',
        'Problemas Recorrentes',
      ]);
      reportMaintenanceData.forEach((item) => {
        rows.push([
          item.equipment.nome,
          item.equipment.patrimonio,
          item.equipment.numeroSerie,
          item.equipment.lojaOrigem,
          String(item.totalManutencoes),
          formatDateBR(item.primeiraManutencao),
          formatDateBR(item.ultimaManutencao),
          item.intervaloMedioDias,
          item.pecasSubstituidas.map((p) => `${p.componenteSubstituido} -> ${p.componenteInstalado}`).join(' | ') || 'Nenhuma',
          item.recurrentProblems.join(' | ') || 'Nenhum',
        ]);
      });
    } else if (activeReport === 'entrada_retirada') {
      rows.push([
        'Equipamento',
        'Patrimônio',
        'Loja Origem',
        'Data Entrada',
        'Data Retirada',
        'Dias no Escritório',
        'Destino',
        'Técnico',
        'Resultado',
      ]);
      reportEntradaRetiradaData.forEach((item) => {
        rows.push([
          item.nome,
          item.patrimonio,
          item.lojaOrigem,
          formatDateTimeBR(item.dataEntrada),
          item.dataRetirada ? formatDateTimeBR(item.dataRetirada) : 'Ainda no Escritório',
          `${item.permanenciaDias} dias`,
          item.destino,
          item.tecnico || '-',
          item.resultado,
        ]);
      });
    } else if (activeReport === 'recorrencia') {
      rows.push([
        'Equipamento',
        'Patrimônio',
        'Loja',
        'Qtd Ocorrências',
        'Problemas Frequentes',
        'Peças Repetidas',
        'Intervalo Médio',
      ]);
      reportRecorrenciaData.forEach((item) => {
        rows.push([
          item.equipment.nome,
          item.equipment.patrimonio,
          item.equipment.lojaOrigem,
          String(item.ocorrenciasCount),
          item.problemasFrequentes.join(' | '),
          item.pecasRepetidas.join(' | ') || 'Nenhuma',
          item.intervaloEntreOcorrencias,
        ]);
      });
    } else if (activeReport === 'equipamentos') {
      rows.push([
        'Nome',
        'Patrimônio',
        'Número de Série',
        'Tipo',
        'Marca/Modelo',
        'Loja Origem',
        'Localização Atual',
        'Status Atual',
        'Processador',
        'RAM (GB)',
        'Armazenamento',
        'Tipo Armazenamento',
        'Sistema Operacional',
        'Data Cadastro',
      ]);
      reportEquipamentosData.forEach((eq) => {
        rows.push([
          eq.nome,
          eq.patrimonio,
          eq.numeroSerie,
          eq.tipo,
          eq.marcaModelo,
          eq.lojaOrigem,
          eq.localizacaoAtual,
          EQUIPMENT_STATUS_LABELS[eq.status]?.label || eq.status,
          eq.processador,
          String(eq.memoriaRamGb),
          `${eq.armazenamentoValor} ${eq.armazenamentoUnidade}`,
          eq.tipoArmazenamento,
          eq.sistemaOperacional,
          formatDateBR(eq.dataPrimeiroCadastro),
        ]);
      });
    } else if (activeReport === 'pecas') {
      rows.push([
        'Equipamento',
        'Patrimônio',
        'Componente Trocado',
        'Peça Antiga',
        'Peça Nova Instalada',
        'Qtd',
        'Upgrade/Alteração',
        'Data Substituição',
        'Técnico Responsável',
        'Motivo',
        'Resultado',
      ]);
      reportPecasData.forEach((h) => {
        rows.push([
          h.equipamentoNome,
          h.patrimonio,
          h.componenteSubstituido,
          h.descricaoPecaAntiga,
          `${h.componenteInstalado} (${h.marcaModeloNovo})`,
          String(h.quantidade),
          h.especificacaoAnterior && h.especificacaoNova ? `${h.especificacaoAnterior} -> ${h.especificacaoNova}` : '-',
          formatDateBR(h.dataSubstituicao),
          h.tecnicoResponsavel,
          h.motivoTroca,
          h.resultado,
        ]);
      });
    }

    // Convert to CSV with semicolon delimiter and UTF-8 BOM
    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((field) => `"${(field || '').toString().replace(/"/g, '""')}"`)
            .join(';')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStore('ALL');
    setSelectedEquipment('ALL');
    setSelectedTech('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span>Relatórios Operacionais de TI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de manutenção, permanência no escritório, recorrência de defeitos e controle patrimonial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer"
            title="Exportar dados para Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Exportar Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Imprimir ou Salvar PDF"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (5 Reports) */}
      <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto print:hidden text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveReport('manutencao_maquina');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeReport === 'manutencao_maquina'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>1. Manutenção por Máquina</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveReport('entrada_retirada');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeReport === 'entrada_retirada'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Entrada e Retirada</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveReport('recorrencia');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeReport === 'recorrencia'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>3. Recorrência de Problemas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveReport('equipamentos');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeReport === 'equipamentos'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>4. Parque de Equipamentos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveReport('pecas');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeReport === 'pecas'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>5. Peças & Alterações</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 print:hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filtros do Relatório
          </span>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Período Início */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Período De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Período Fim */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Período Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Loja */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Loja / Setor</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">Todas as Lojas</option>
              {storesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Técnico */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Técnico Responsável</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">Todos os Técnicos</option>
              {techList.map((tc) => (
                <option key={tc} value={tc}>
                  {tc}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Operacional</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">Todos os Status</option>
              <option value="EM_USO">Em Uso</option>
              <option value="AGUARDANDO_MANUTENCAO">Aguardando Manutenção</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="DISPONIVEL_RETIRADA">Disponível para Retirada</option>
              <option value="RETIRADO">Retirado</option>
              <option value="DESATIVADO">Desativado</option>
            </select>
          </div>

          {/* Busca textual */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pesquisa Rápida</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Máquina, Tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT HEADER - Visible ONLY when printing */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Checklist TI - Relatório Operacional</h1>
            <p className="text-xs text-slate-600">
              Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-slate-800">
              {activeReport === 'manutencao_maquina' && 'Relatório de Manutenção por Máquina'}
              {activeReport === 'entrada_retirada' && 'Relatório de Entrada e Retirada no Escritório'}
              {activeReport === 'recorrencia' && 'Relatório de Recorrência de Problemas'}
              {activeReport === 'equipamentos' && 'Relatório de Parque de Equipamentos'}
              {activeReport === 'pecas' && 'Relatório de Peças & Alterações de Hardware'}
            </span>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT 1: MANUTENÇÃO POR MÁQUINA */}
      {activeReport === 'manutencao_maquina' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Equipamentos Analisados</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{reportMaintenanceData.length}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-blue-600 block">Total de OS Realizadas</span>
              <span className="text-xl font-black text-blue-800 block mt-0.5">
                {reportMaintenanceData.reduce((acc, curr) => acc + curr.totalManutencoes, 0)}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 block">Peças Trocadas</span>
              <span className="text-xl font-black text-emerald-800 block mt-0.5">
                {reportMaintenanceData.reduce((acc, curr) => acc + curr.pecasSubstituidas.length, 0)}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 block">Máquinas com Recorrência</span>
              <span className="text-xl font-black text-amber-800 block mt-0.5">
                {reportMaintenanceData.filter((i) => i.recurrentProblems.length > 0).length}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-3">Patrimônio</th>
                    <th className="py-3 px-3">Loja</th>
                    <th className="py-3 px-3 text-center">Total Manutenções</th>
                    <th className="py-3 px-3">Primeira Manut.</th>
                    <th className="py-3 px-3">Última Manut.</th>
                    <th className="py-3 px-3">Intervalo Médio</th>
                    <th className="py-3 px-3">Peças Substituídas</th>
                    <th className="py-3 px-3">Problemas Recorrentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportMaintenanceData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    reportMaintenanceData.map((item) => (
                      <tr key={item.equipment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.equipment.nome}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.equipment.patrimonio}</td>
                        <td className="py-3 px-3">{item.equipment.lojaOrigem}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                            {item.totalManutencoes}
                          </span>
                        </td>
                        <td className="py-3 px-3">{formatDateBR(item.primeiraManutencao)}</td>
                        <td className="py-3 px-3">{formatDateBR(item.ultimaManutencao)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-600">{item.intervaloMedioDias}</td>
                        <td className="py-3 px-3">
                          {item.pecasSubstituidas.length === 0 ? (
                            <span className="text-slate-400">Nenhuma</span>
                          ) : (
                            <div className="space-y-0.5">
                              {item.pecasSubstituidas.slice(0, 2).map((p) => (
                                <span key={p.id} className="block text-[11px] font-semibold text-emerald-700">
                                  • {p.componenteSubstituido} ({p.componenteInstalado})
                                </span>
                              ))}
                              {item.pecasSubstituidas.length > 2 && (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  +{item.pecasSubstituidas.length - 2} outras
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {item.recurrentProblems.length === 0 ? (
                            <span className="text-slate-400">Nenhum</span>
                          ) : (
                            item.recurrentProblems.map((prob, idx) => (
                              <span key={idx} className="block text-[11px] font-bold text-red-600">
                                ⚠ {prob}
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 2: ENTRADA E RETIRADA */}
      {activeReport === 'entrada_retirada' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Movimentações Registradas</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{reportEntradaRetiradaData.length}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 block">Ainda no Escritório</span>
              <span className="text-xl font-black text-amber-800 block mt-0.5">
                {reportEntradaRetiradaData.filter((i) => i.isAindaNoEscritorio).length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 block">Retiradas Concluídas</span>
              <span className="text-xl font-black text-emerald-800 block mt-0.5">
                {reportEntradaRetiradaData.filter((i) => !i.isAindaNoEscritorio).length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-blue-600 block">Média de Permanência</span>
              <span className="text-xl font-black text-blue-800 block mt-0.5">
                {reportEntradaRetiradaData.length > 0
                  ? `${Math.round(
                      reportEntradaRetiradaData.reduce((acc, curr) => acc + curr.permanenciaDias, 0) /
                        reportEntradaRetiradaData.length
                    )} dias`
                  : '-'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-3">Patrimônio</th>
                    <th className="py-3 px-3">Loja de Origem</th>
                    <th className="py-3 px-3">Chegada ao Escritório</th>
                    <th className="py-3 px-3">Retirada da TI</th>
                    <th className="py-3 px-3 text-center">Permanência</th>
                    <th className="py-3 px-3">Destino do Equipamento</th>
                    <th className="py-3 px-3">Técnico</th>
                    <th className="py-3 px-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportEntradaRetiradaData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhum registro de movimentação encontrado.
                      </td>
                    </tr>
                  ) : (
                    reportEntradaRetiradaData.map((item) => (
                      <tr key={item.mov.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.nome}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.patrimonio}</td>
                        <td className="py-3 px-3">{item.lojaOrigem}</td>
                        <td className="py-3 px-3">{formatDateTimeBR(item.dataEntrada)}</td>
                        <td className="py-3 px-3">
                          {item.dataRetirada ? (
                            formatDateTimeBR(item.dataRetirada)
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              No Escritório
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {item.permanenciaDias} {item.permanenciaDias === 1 ? 'dia' : 'dias'}
                        </td>
                        <td className="py-3 px-3">{item.destino}</td>
                        <td className="py-3 px-3">{item.tecnico || '-'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.resultado === 'CONCLUIDO_SUCESSO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.resultado === 'CONCLUIDO_SUCESSO' ? 'Concluído' : item.resultado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 3: RECORRÊNCIA */}
      {activeReport === 'recorrencia' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Equipamentos que deram entrada mais de uma vez no escritório para reparo ou que precisaram de trocas recorrentes de peças.
              </span>
            </div>
            <span className="font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg text-xs shrink-0">
              {reportRecorrenciaData.length} máquinas reincidentes
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-3">Patrimônio</th>
                    <th className="py-3 px-3">Loja</th>
                    <th className="py-3 px-3 text-center">Qtd Ocorrências</th>
                    <th className="py-3 px-3">Problemas Mais Frequentes</th>
                    <th className="py-3 px-3">Peças Substituídas Repetidas</th>
                    <th className="py-3 px-3">Intervalo Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportRecorrenciaData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhum equipamento reincidente com 2 ou mais manutenções no período.
                      </td>
                    </tr>
                  ) : (
                    reportRecorrenciaData.map((item) => (
                      <tr key={item.equipment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.equipment.nome}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.equipment.patrimonio}</td>
                        <td className="py-3 px-3">{item.equipment.lojaOrigem}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-black">
                            {item.ocorrenciasCount}x
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {item.problemasFrequentes.map((prob, i) => (
                              <span key={i} className="block text-slate-800 font-semibold">
                                • {prob}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {item.pecasRepetidas.length === 0 ? (
                            <span className="text-slate-400">Nenhuma</span>
                          ) : (
                            item.pecasRepetidas.map((peca, i) => (
                              <span key={i} className="block text-red-600 font-bold">
                                ⚠ {peca}
                              </span>
                            ))
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">{item.intervaloEntreOcorrencias}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 4: EQUIPAMENTOS (PARQUE & HARDWARE) */}
      {activeReport === 'equipamentos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Cadastrado</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{reportEquipamentosData.length}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 block">Em Uso Loja</span>
              <span className="text-xl font-black text-emerald-800 block mt-0.5">
                {reportEquipamentosData.filter((e) => e.status === 'EM_USO').length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 block">Em Manutenção</span>
              <span className="text-xl font-black text-amber-800 block mt-0.5">
                {reportEquipamentosData.filter((e) => e.status === 'EM_MANUTENCAO' || e.status === 'AGUARDANDO_MANUTENCAO').length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-blue-600 block">Disponível Retirada</span>
              <span className="text-xl font-black text-blue-800 block mt-0.5">
                {reportEquipamentosData.filter((e) => e.status === 'DISPONIVEL_RETIRADA').length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-3">Patrimônio</th>
                    <th className="py-3 px-3">Número de Série</th>
                    <th className="py-3 px-3">Loja Origem</th>
                    <th className="py-3 px-3">Configuração de Hardware</th>
                    <th className="py-3 px-3">Sistema Operacional</th>
                    <th className="py-3 px-3">Status Atual</th>
                    <th className="py-3 px-3">Data Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportEquipamentosData.map((eq) => {
                    const statusConfig = EQUIPMENT_STATUS_LABELS[eq.status];
                    return (
                      <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {eq.nome} <span className="text-[10px] text-slate-400 font-normal">({eq.marcaModelo})</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{eq.patrimonio}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{eq.numeroSerie}</td>
                        <td className="py-3 px-3">{eq.lojaOrigem}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{eq.processador}</span>
                          <span className="text-[11px] text-slate-500 block">
                            {eq.memoriaRamGb} GB RAM • {eq.armazenamentoValor} {eq.armazenamentoUnidade} ({eq.tipoArmazenamento.replace('_', ' ')})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{eq.sistemaOperacional}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.badgeBg} ${statusConfig.textBadge}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-3">{formatDateBR(eq.dataPrimeiroCadastro)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 5: PEÇAS & ALTERAÇÕES */}
      {activeReport === 'pecas' && (
        <div className="space-y-4">
          {/* Ranking Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Ranking de Componentes Mais Substituídos
            </h4>
            <div className="flex flex-wrap gap-2">
              {pecasRanking.map(([peca, count], idx) => (
                <div
                  key={peca}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{peca}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white font-extrabold text-[10px]">
                    {count} un
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-3">Componente</th>
                    <th className="py-3 px-3">Peça Antiga Removida</th>
                    <th className="py-3 px-3">Peça Nova Instalada</th>
                    <th className="py-3 px-3 text-center">Qtd</th>
                    <th className="py-3 px-3">Histórico de Upgrade</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Técnico</th>
                    <th className="py-3 px-3">Motivo da Troca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportPecasData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhum registro de substituição de peças no período.
                      </td>
                    </tr>
                  ) : (
                    reportPecasData.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{h.equipamentoNome}</span>
                          <span className="font-mono text-[10px] text-slate-500 block">{h.patrimonio}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-700">{h.componenteSubstituido}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {h.descricaoPecaAntiga}
                          {h.serialPecaAntiga && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              SN: {h.serialPecaAntiga}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-800">
                          {h.componenteInstalado}
                          <span className="block text-[10px] text-slate-500">
                            {h.marcaModeloNovo} {h.serialPecaNova ? `• SN: ${h.serialPecaNova}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{h.quantidade}</td>
                        <td className="py-3 px-3">
                          {h.especificacaoAnterior && h.especificacaoNova ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {h.especificacaoAnterior} ➔ {h.especificacaoNova}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">{formatDateBR(h.dataSubstituicao)}</td>
                        <td className="py-3 px-3">{h.tecnicoResponsavel}</td>
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">{h.motivoTroca}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT SIGNATURE BLOCK */}
      <div className="hidden print:block pt-16">
        <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
          <div className="border-t border-slate-400 pt-2">
            <span className="font-bold block">Assinatura do Técnico Responsável</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Suporte de TI / Bancada</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <span className="font-bold block">Assinatura da Coordenação / Gestor de TI</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Gestão de Infraestrutura & Lojas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
