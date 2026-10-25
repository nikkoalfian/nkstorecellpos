import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface DailyProfitChartProps {
  transactions: Transaction[];
}

type TimeRange = '7d' | '14d' | '30d' | 'month';
type ChartType = 'area' | 'combo' | 'category';

interface DailyDataPoint {
  dateKey: string;
  shortLabel: string;
  dayName: string;
  fullDate: string;
  profit: number;
  revenue: number;
  cost: number;
  count: number;
  profitPulsa: number;
  profitTransfer: number;
  profitTarik: number;
  profitAcc: number;
  profitPlnEwallet: number;
  margin: number;
}

// Compact currency formatter for Y-Axis
const formatCompactRupiah = (val: number): string => {
  if (val === 0) return '0';
  if (Math.abs(val) >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted}jt`;
  }
  if (Math.abs(val) >= 1_000) {
    const formatted = (val / 1_000).toFixed(0);
    return `Rp ${formatted}rb`;
  }
  return `Rp ${val}`;
};

export const DailyProfitChart: React.FC<DailyProfitChartProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [showDemoIfEmpty, setShowDemoIfEmpty] = useState<boolean>(true);

  // Determine date boundaries based on timeRange
  const { dateList, rangeLabel } = useMemo(() => {
    const dates: Date[] = [];
    const now = new Date();
    // Midnight of today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let numDays = 7;
    let label = '7 Hari Terakhir';

    if (timeRange === '7d') {
      numDays = 7;
      label = '7 Hari Terakhir';
    } else if (timeRange === '14d') {
      numDays = 14;
      label = '14 Hari Terakhir';
    } else if (timeRange === '30d') {
      numDays = 30;
      label = '30 Hari Terakhir';
    } else if (timeRange === 'month') {
      // Days from the 1st of current month until today
      numDays = today.getDate();
      label = `Bulan Ini (${today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
    }

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
    }

    return { dateList: dates, rangeLabel: label };
  }, [timeRange]);

  // Generate continuous daily data series
  const { chartData, isUsingDemoData, stats } = useMemo<{
    chartData: DailyDataPoint[];
    isUsingDemoData: boolean;
    stats: {
      totalProfit: number;
      totalRevenue: number;
      totalTrx: number;
      avgDailyProfit: number;
      avgMargin: number;
      peakDay: DailyDataPoint | null;
    };
  }>(() => {
    // Map transactions into date string YYYY-MM-DD
    const txMap: Record<string, Transaction[]> = {};
    let realTxInRangeCount = 0;

    const minTime = dateList[0].getTime();
    const maxTime = dateList[dateList.length - 1].getTime() + 86400000;

    transactions.forEach((tx) => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= minTime && txTime < maxTime) {
        realTxInRangeCount++;
        const d = new Date(tx.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        if (!txMap[key]) txMap[key] = [];
        txMap[key].push(tx);
      }
    });

    const useDemo = realTxInRangeCount === 0 && showDemoIfEmpty;

    const data: DailyDataPoint[] = dateList.map((d, index) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const shortLabel = `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`;
      const fullDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (useDemo) {
        // High-fidelity realistic baseline demo curve for konter pulsa & transfer agen
        // Simulates realistic daily flow (varying weekday vs weekend)
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseFactor = isWeekend ? 1.4 : 1.0;
        const seed = (d.getDate() * 13 + index * 7) % 10;
        const randomFluct = 0.85 + seed * 0.04;

        const demoPulsa = Math.round(45000 * baseFactor * randomFluct);
        const demoTransfer = Math.round(65000 * baseFactor * (randomFluct + 0.1));
        const demoTarik = Math.round(50000 * baseFactor * randomFluct);
        const demoAcc = Math.round(35000 * baseFactor * (1.2 - randomFluct * 0.2));
        const demoPln = Math.round(25000 * baseFactor * randomFluct);

        const totalProfit = demoPulsa + demoTransfer + demoTarik + demoAcc + demoPln;
        const revenue = Math.round(totalProfit * 8.5 + 400000);
        const cost = revenue - totalProfit;
        const count = Math.round(18 * baseFactor * randomFluct);

        return {
          dateKey: key,
          shortLabel,
          dayName,
          fullDate,
          profit: totalProfit,
          revenue,
          cost,
          count,
          profitPulsa: demoPulsa,
          profitTransfer: demoTransfer,
          profitTarik: demoTarik,
          profitAcc: demoAcc,
          profitPlnEwallet: demoPln,
          margin: revenue > 0 ? (totalProfit / revenue) * 100 : 0,
        };
      }

      const dayTxs = txMap[key] || [];
      let profit = 0;
      let revenue = 0;
      let cost = 0;
      let profitPulsa = 0;
      let profitTransfer = 0;
      let profitTarik = 0;
      let profitAcc = 0;
      let profitPlnEwallet = 0;

      dayTxs.forEach((tx) => {
        profit += tx.profit || 0;
        revenue += tx.totalAmount || 0;
        cost += tx.priceCost || 0;

        if (tx.type === 'pulsa' || tx.type === 'paket_data') {
          profitPulsa += tx.profit || 0;
        } else if (tx.type === 'transfer_uang') {
          profitTransfer += tx.profit || 0;
        } else if (tx.type === 'tarik_tunai') {
          profitTarik += tx.profit || 0;
        } else if (tx.type === 'aksesoris') {
          profitAcc += tx.profit || 0;
        } else {
          profitPlnEwallet += tx.profit || 0;
        }
      });

      return {
        dateKey: key,
        shortLabel,
        dayName,
        fullDate,
        profit,
        revenue,
        cost,
        count: dayTxs.length,
        profitPulsa,
        profitTransfer,
        profitTarik,
        profitAcc,
        profitPlnEwallet,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      };
    });

    // Compute range statistics
    let totalProfit = 0;
    let totalRevenue = 0;
    let totalTrx = 0;
    let peakDay: DailyDataPoint | null = null;

    data.forEach((item) => {
      totalProfit += item.profit;
      totalRevenue += item.revenue;
      totalTrx += item.count;
      if (!peakDay || item.profit > peakDay.profit) {
        peakDay = item;
      }
    });

    const avgDailyProfit = data.length > 0 ? Math.round(totalProfit / data.length) : 0;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      chartData: data,
      isUsingDemoData: useDemo,
      stats: {
        totalProfit,
        totalRevenue,
        totalTrx,
        avgDailyProfit,
        avgMargin,
        peakDay,
      },
    };
  }, [dateList, transactions, showDemoIfEmpty]);

  // Custom interactive tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-xs backdrop-blur-md min-w-[240px] space-y-3 z-50">
          <div className="border-b border-slate-800 pb-2">
            <span className="font-bold text-white text-sm block">{data.fullDate}</span>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>{data.count} Transaksi</span>
              <span className="text-emerald-400 font-semibold font-mono">
                Margin: {data.margin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Laba Bersih:
              </span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                +{formatRupiah(data.profit)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300 px-1">
              <span className="text-slate-400">Total Omset:</span>
              <span className="font-mono font-medium text-white">{formatRupiah(data.revenue)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 px-1">
              <span className="text-slate-400">Modal Pokok (HPP):</span>
              <span className="font-mono text-slate-400">{formatRupiah(data.cost)}</span>
            </div>
          </div>

          {/* Breakdown Per Service */}
          <div className="border-t border-slate-800/80 pt-2 space-y-1 text-[11px]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Rincian Laba Kategori:
            </span>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Pulsa & Paket Data:
              </span>
              <span className="font-mono font-medium">{formatRupiah(data.profitPulsa)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                Admin Transfer:
              </span>
              <span className="font-mono font-medium">{formatRupiah(data.profitTransfer)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                Admin Tarik Tunai:
              </span>
              <span className="font-mono font-medium">{formatRupiah(data.profitTarik)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                Laba Aksesoris HP:
              </span>
              <span className="font-mono font-medium">{formatRupiah(data.profitAcc)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                PLN & E-Wallet:
              </span>
              <span className="font-mono font-medium">{formatRupiah(data.profitPlnEwallet)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Grafik Tren Laba Bersih Harian
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
                  Recharts Interaktif
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pantau dinamika keuntungan bersih dan performa finansial konter setiap hari secara visual.
              </p>
            </div>
          </div>

          {isUsingDemoData && (
            <div className="flex items-center gap-2 pt-1 text-xs text-amber-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Menampilkan <strong>simulasi tren harian konter</strong> karena belum ada riwayat transaksi pada rentang ini. Begitu kasir mencatat transaksi, grafik akan langsung beralih ke data riil.
              </span>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(
              [
                ['7d', '7 Hari'],
                ['14d', '14 Hari'],
                ['30d', '30 Hari'],
                ['month', 'Bulan Ini'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  timeRange === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart View Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                chartType === 'area'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grafik Area Laba Bersih"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laba Bersih</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('combo')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                chartType === 'combo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Perbandingan Omset vs Laba"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Omset vs Laba</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('category')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                chartType === 'category'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Breakdown Laba Per Kategori Layanan"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kategori</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Total Laba ({rangeLabel})
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
            +{formatRupiah(stats.totalProfit)}
          </div>
          <div className="text-[10px] text-slate-500">
            Rata-rata: <span className="font-mono text-slate-300 font-semibold">{formatRupiah(stats.avgDailyProfit)}</span>/hari
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Total Omset Penjualan
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white">
            {formatRupiah(stats.totalRevenue)}
          </div>
          <div className="text-[10px] text-emerald-400">
            Margin: <span className="font-mono font-bold">{stats.avgMargin.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Hari Laba Tertinggi
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400">
            {stats.peakDay ? `+${formatRupiah(stats.peakDay.profit)}` : 'Rp 0'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {stats.peakDay ? stats.peakDay.shortLabel : '-'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Volume Transaksi
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-400">
            {stats.totalTrx} Trx
          </div>
          <div className="text-[10px] text-slate-500">
            Rata-rata: <span className="font-mono text-slate-300 font-semibold">{(stats.totalTrx / Math.max(1, chartData.length)).toFixed(1)}</span> trx/hari
          </div>
        </div>
      </div>

      {/* Main Recharts Area Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="profit"
                name="Laba Bersih"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#profitGradient)"
                activeDot={{ r: 6, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : chartType === 'combo' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="comboProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
              />
              <Bar
                dataKey="revenue"
                name="Total Omset"
                fill="#3B82F6"
                opacity={0.6}
                radius={[6, 6, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Laba Bersih"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981' }}
                activeDot={{ r: 6, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
              />
              <Bar
                dataKey="profitPulsa"
                name="Pulsa & Data"
                stackId="profitStack"
                fill="#3B82F6"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="profitTransfer"
                name="Transfer Uang"
                stackId="profitStack"
                fill="#6366F1"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="profitTarik"
                name="Tarik Tunai"
                stackId="profitStack"
                fill="#14B8A6"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="profitAcc"
                name="Aksesoris HP"
                stackId="profitStack"
                fill="#A855F7"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="profitPlnEwallet"
                name="PLN & E-Wallet"
                stackId="profitStack"
                fill="#F59E0B"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Insight Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
            Laba Bersih (Net Profit)
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
            Omset Penjualan
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50" />
            Aksesoris HP
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-sm shadow-indigo-500/50" />
            Admin Bank Transfer & Tarik
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isUsingDemoData && (
            <button
              type="button"
              onClick={() => setShowDemoIfEmpty(!showDemoIfEmpty)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
            >
              {showDemoIfEmpty ? 'Tutup Simulasi' : 'Tampilkan Simulasi'}
            </button>
          )}
          <span className="text-[11px] text-slate-500">
            Arahkan kursor / ketuk grafik untuk rincian harian
          </span>
        </div>
      </div>
    </div>
  );
};
