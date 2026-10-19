import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ServiceOrder } from '../types/serviceOrder';
import { CheckCircle2, TrendingUp, Calendar, ArrowRight, Award, Clock } from 'lucide-react';

interface ServiceOrdersCompletedChartProps {
  orders: ServiceOrder[];
  onNavigateToOrders?: () => void;
}

type TimeWindow = 7 | 14 | 30;

export const ServiceOrdersCompletedChart: React.FC<ServiceOrdersCompletedChartProps> = ({
  orders,
  onNavigateToOrders,
}) => {
  const [timeWindowDays, setTimeWindowDays] = useState<TimeWindow>(7);

  // Filter completed orders and group by day
  const chartData = useMemo(() => {
    const completedOrders = orders.filter(
      (os: ServiceOrder) =>
        os.status === 'CONCLUIDA' || os.status === 'PRONTA' || os.status === 'EM_OPERACAO'
    );

    const now = new Date();
    const result: Array<{
      dateKey: string;
      displayDate: string;
      fullDateLabel: string;
      concluidas: number;
      orders: ServiceOrder[];
      isToday: boolean;
    }> = [];

    for (let i = timeWindowDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const isToday = i === 0;
      const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const displayDate = timeWindowDays === 30
        ? `${day}/${month}`
        : `${day}/${month} (${weekDay.charAt(0).toUpperCase() + weekDay.slice(1)})`;

      const fullDateLabel = d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const matching = completedOrders.filter((os) => {
        const orderDate =
          os.dataConclusao ||
          (os.dataHoraConclusao ? os.dataHoraConclusao.split('T')[0] : null) ||
          (os.updatedAt ? os.updatedAt.split('T')[0] : null) ||
          os.dataEntrada;
        return orderDate === dateKey;
      });

      result.push({
        dateKey,
        displayDate,
        fullDateLabel,
        concluidas: matching.length,
        orders: matching,
        isToday,
      });
    }

    return result;
  }, [orders, timeWindowDays]);

  // Statistics for the selected time window
  const stats = useMemo(() => {
    const total = chartData.reduce((acc, curr) => acc + curr.concluidas, 0);
    const mediaDiaria = (total / timeWindowDays).toFixed(1);
    const maxVal = Math.max(...chartData.map((d) => d.concluidas), 0);
    const peakDay = chartData.find((d) => d.concluidas === maxVal && maxVal > 0);

    return {
      total,
      mediaDiaria,
      maxVal,
      peakDay,
    };
  }, [chartData, timeWindowDays]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header and Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Ordens de Serviço Concluídas
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Acompanhamento diário de manutenções e atendimentos finalizados
              </p>
            </div>
          </div>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80">
          {(
            [
              { label: '7 Dias', value: 7 },
              { label: '14 Dias', value: 14 },
              { label: '30 Dias', value: 30 },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTimeWindowDays(item.value)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeWindowDays === item.value
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Total Concluídas */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total Concluídas
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            <span>{stats.total}</span>
            <span className="text-xs font-semibold text-emerald-600 font-sans">
              em {timeWindowDays} dias
            </span>
          </div>
        </div>

        {/* Média Diária */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            <span>Média Diária</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            <span>{stats.mediaDiaria}</span>
            <span className="text-xs font-normal text-slate-500 font-sans">OS / dia</span>
          </div>
        </div>

        {/* Dia Mais Produtivo */}
        <div className="col-span-2 sm:col-span-1 bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Dia Mais Produtivo</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
            {stats.peakDay ? (
              <span className="text-emerald-700 font-extrabold">
                {stats.peakDay.displayDate} ({stats.peakDay.concluidas} OS)
              </span>
            ) : (
              <span className="text-slate-400 font-normal text-xs">Sem registros no período</span>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              domain={[0, stats.maxVal > 4 ? 'auto' : 4]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as (typeof chartData)[0];
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs animate-in fade-in duration-150">
                    <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                      <span>{data.fullDateLabel}</span>
                      {data.isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono text-[9px] uppercase font-bold">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <span className="text-slate-400">OS Concluídas:</span>
                      <span className="font-black text-sm text-emerald-400 font-mono">
                        {data.concluidas}
                      </span>
                    </div>

                    {data.orders.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Atendimentos:
                        </div>
                        {data.orders.slice(0, 3).map((os) => (
                          <div
                            key={os.id}
                            className="text-[11px] text-slate-300 flex items-center justify-between gap-2"
                          >
                            <span className="font-mono text-amber-400 font-semibold shrink-0">
                              {os.numeroOs || os.id}
                            </span>
                            <span className="truncate text-slate-300">
                              {os.identificacao}
                            </span>
                          </div>
                        ))}
                        {data.orders.length > 3 && (
                          <div className="text-[10px] text-slate-400 italic">
                            + {data.orders.length - 3} outra(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="concluidas"
              name="OS Concluídas"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isToday
                      ? '#059669' // emerald-600 for today
                      : entry.concluidas > 0
                      ? '#10B981' // emerald-500 for days with completions
                      : '#CBD5E1' // slate-300 for 0
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer / Quick Navigation Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span>Dias com ordens concluídas</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block ml-2" />
          <span>Sem conclusões</span>
        </div>

        {onNavigateToOrders && (
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span>Ver todas as ordens de serviço</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
