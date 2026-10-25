import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  BarChart3,
  Calendar,
  ArrowRight,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Award,
  Activity,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

interface OwnerDailySalesChartProps {
  transactions: Transaction[];
  onNavigateReports?: () => void;
}

type MetricMode = 'sales' | 'profit' | 'combined';

interface DayData {
  dateKey: string;
  shortDay: string;
  dateNum: string;
  displayDate: string;
  fullDate: string;
  sales: number;
  profit: number;
  count: number;
  avgTicket: number;
}

interface ChartStats {
  totalSales: number;
  totalProfit: number;
  totalCount: number;
  avgDailySales: number;
  avgDailyProfit: number;
  overallMargin: string;
  peakSalesDay: DayData | null;
}

// Compact currency formatter for Y-Axis labels (e.g., Rp 500rb, Rp 1.5jt)
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

export const OwnerDailySalesChart: React.FC<OwnerDailySalesChartProps> = ({
  transactions,
  onNavigateReports,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('sales');
  const [showDemoIfEmpty, setShowDemoIfEmpty] = useState<boolean>(true);

  // Generate 7-day dates array: from 6 days ago up to today
  const sevenDaysList = useMemo(() => {
    const list: Date[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  // Compute daily aggregates and summary metrics
  const { chartData, isDemoData, stats } = useMemo<{
    chartData: DayData[];
    isDemoData: boolean;
    stats: ChartStats;
  }>(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    // Filter transactions within the last 7-day window
    const firstDay = sevenDaysList[0];
    const lastDay = new Date(sevenDaysList[sevenDaysList.length - 1]);
    lastDay.setHours(23, 59, 59, 999);

    const actual7DaysTx = transactions.filter((tx) => {
      if (tx.status === 'gagal') return false;
      const txDate = new Date(tx.timestamp);
      return txDate >= firstDay && txDate <= lastDay;
    });

    // Check if we should use demo sample data to show how it looks when real data is empty
    const hasRealData = actual7DaysTx.length > 0;
    const useDemo = !hasRealData && showDemoIfEmpty;

    // Demo data template if konter is brand new
    const demoDailyProfile = [
      { sales: 450000, profit: 58000, count: 14 },
      { sales: 620000, profit: 79000, count: 19 },
      { sales: 530000, profit: 64000, count: 16 },
      { sales: 840000, profit: 112000, count: 26 },
      { sales: 710000, profit: 88000, count: 22 },
      { sales: 1250000, profit: 165000, count: 38 },
      { sales: 980000, profit: 132000, count: 29 },
    ];

    const data: DayData[] = sevenDaysList.map((d, index) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      const shortDay = dayNames[d.getDay()];
      const fullDay = fullDayNames[d.getDay()];
      const dateNum = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      const displayDate = `${shortDay} ${d.getDate()}`;
      const fullDate = `${fullDay}, ${d.getDate()} ${monthNames[d.getMonth()]} ${yyyy}`;

      if (useDemo) {
        const demo = demoDailyProfile[index] || { sales: 500000, profit: 60000, count: 15 };
        return {
          dateKey: key,
          shortDay,
          dateNum,
          displayDate,
          fullDate,
          sales: demo.sales,
          profit: demo.profit,
          count: demo.count,
          avgTicket: Math.round(demo.sales / demo.count),
        };
      }

      // Group real transactions for this day
      const dayTx = actual7DaysTx.filter((tx) => {
        const tDate = new Date(tx.timestamp);
        const tKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
        return tKey === key;
      });

      let sales = 0;
      let profit = 0;
      dayTx.forEach((tx) => {
        sales += tx.totalAmount || 0;
        profit += tx.profit || 0;
      });

      return {
        dateKey: key,
        shortDay,
        dateNum,
        displayDate,
        fullDate,
        sales,
        profit,
        count: dayTx.length,
        avgTicket: dayTx.length > 0 ? Math.round(sales / dayTx.length) : 0,
      };
    });

    // Compute key 7-day stats
    let totalSales = 0;
    let totalProfit = 0;
    let totalCount = 0;
    let peakSalesDay: DayData | null = null;

    data.forEach((item) => {
      totalSales += item.sales;
      totalProfit += item.profit;
      totalCount += item.count;
      if (!peakSalesDay || item.sales > peakSalesDay.sales) {
        peakSalesDay = item;
      }
    });

    const avgDailySales = Math.round(totalSales / 7);
    const avgDailyProfit = Math.round(totalProfit / 7);
    const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';

    return {
      chartData: data,
      isDemoData: useDemo,
      stats: {
        totalSales,
        totalProfit,
        totalCount,
        avgDailySales,
        avgDailyProfit,
        overallMargin,
        peakSalesDay,
      },
    };
  }, [sevenDaysList, transactions, showDemoIfEmpty]);

  // Custom Dark Glassmorphism Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs backdrop-blur-md min-w-[210px] space-y-2 z-50">
          <div className="border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white text-sm block">{data.fullDate}</span>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>{data.count} Transaksi</span>
              <span className="text-slate-400">
                Rata-rata: {formatRupiah(data.avgTicket)}/trx
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Penjualan (Omset):
              </span>
              <span className="font-bold font-mono text-white">
                {formatRupiah(data.sales)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Laba Bersih:
              </span>
              <span className="font-bold font-mono text-emerald-300">
                {formatRupiah(data.profit)}
              </span>
            </div>

            {data.sales > 0 && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Margin Laba:</span>
                <span className="font-bold text-amber-300">
                  {((data.profit / data.sales) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const peakDay = stats.peakSalesDay;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Grafik Penjualan Harian (7 Hari Terakhir)
              </h3>
              {isDemoData && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Mode Simulasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau tren omset penjualan konter & estimasi laba bersih setiap hari
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMetricMode('sales')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'sales'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Omset
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('profit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'profit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Laba
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('combined')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'combined'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Semua
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Omset 7 Hari */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold uppercase tracking-wider">Total Omset (7 Hari)</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-white mt-1.5">
            {formatRupiah(stats.totalSales)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.totalCount} transaksi tercatat
          </span>
        </div>

        {/* Rata-Rata Penjualan Per Hari */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold uppercase tracking-wider">Rata-Rata / Hari</span>
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-sky-300 mt-1.5">
            {formatRupiah(stats.avgDailySales)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Omset harian konter
          </span>
        </div>

        {/* Total Laba Bersih 7 Hari */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-950/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold uppercase tracking-wider">Total Laba Bersih</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-1.5">
            {formatRupiah(stats.totalProfit)}
          </p>
          <span className="text-[10px] text-emerald-400/80 font-medium block mt-0.5">
            Margin konter: {stats.overallMargin}%
          </span>
        </div>

        {/* Puncak Hari Penjualan */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold uppercase tracking-wider">Puncak Penjualan</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-amber-300 mt-1.5 truncate">
            {peakDay && peakDay.sales > 0
              ? `${peakDay.shortDay} (${formatCompactRupiah(peakDay.sales)})`
              : '-'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {peakDay && peakDay.sales > 0 ? peakDay.fullDate : 'Belum ada data'}
          </span>
        </div>
      </div>

      {/* Main Recharts Graphic */}
      <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'combined' ? (
              <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ownerProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={formatCompactRupiah}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Penjualan (Omset)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ownerSalesGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Laba Bersih"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </ComposedChart>
            ) : metricMode === 'profit' ? (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerProfitSoloGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={formatCompactRupiah}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Laba Bersih"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ownerProfitSoloGrad)"
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerSalesSoloGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={formatCompactRupiah}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Penjualan (Omset)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ownerSalesSoloGrad)"
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer info & Navigation */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Grafik otomatis ter-update realtime saat kasir menyelesaikan penjualan di toko.
            </span>
            {isDemoData && (
              <button
                type="button"
                onClick={() => setShowDemoIfEmpty(!showDemoIfEmpty)}
                className="text-amber-400 hover:underline font-semibold ml-1 cursor-pointer"
              >
                {showDemoIfEmpty ? '(Sembunyikan demo)' : '(Tampilkan demo)'}
              </button>
            )}
          </div>

          {onNavigateReports && (
            <button
              type="button"
              onClick={onNavigateReports}
              className="text-blue-400 hover:text-blue-300 hover:underline font-bold flex items-center gap-1 cursor-pointer self-end sm:self-auto shrink-0"
            >
              <span>Laporan Laba Rugi Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
