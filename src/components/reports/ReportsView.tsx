import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType } from '../../types';
import { formatRupiah, formatDateIndo, buildReceiptWhatsAppText, openWhatsAppReceipt } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  Trash2,
  Share2,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Send,
  Banknote,
  ShoppingBag,
  Zap,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    setActiveReceipt,
    settings,
    isOwnerUnlocked,
    requestOwnerPin,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions.filter((t) => {
      const time = new Date(t.timestamp).getTime();

      // Date check
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = time >= todayStart;
      } else if (dateFilter === 'yesterday') {
        matchDate = time >= yesterdayStart && time < todayStart;
      } else if (dateFilter === 'week') {
        matchDate = time >= weekStart;
      } else if (dateFilter === 'month') {
        matchDate = time >= monthStart;
      }

      // Type check
      const matchType = typeFilter === 'all' || t.type === typeFilter;

      // Search check
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        t.invoiceNo.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.targetNumber && t.targetNumber.includes(q)) ||
        (t.targetName && t.targetName.toLowerCase().includes(q)) ||
        (t.providerBank && t.providerBank.toLowerCase().includes(q));

      return matchDate && matchType && matchSearch;
    });
  }, [transactions, dateFilter, typeFilter, searchTerm]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let cost = 0;
    let transferCount = 0;
    let tarikCount = 0;
    let pulsaCount = 0;
    let accCount = 0;

    filteredTransactions.forEach((t) => {
      revenue += t.totalAmount;
      profit += t.profit;
      cost += t.priceCost;

      if (t.type === 'transfer_uang') transferCount++;
      else if (t.type === 'tarik_tunai') tarikCount++;
      else if (t.type === 'aksesoris') accCount++;
      else pulsaCount++;
    });

    const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      profit,
      cost,
      count: filteredTransactions.length,
      transferCount,
      tarikCount,
      pulsaCount,
      accCount,
      marginPercent,
    };
  }, [filteredTransactions]);

  // Profit breakdown by category
  const categoryProfits = useMemo(() => {
    const map: Record<string, number> = {
      pulsa: 0,
      paket_data: 0,
      token_pln: 0,
      topup_ewallet: 0,
      transfer_uang: 0,
      tarik_tunai: 0,
      aksesoris: 0,
    };

    filteredTransactions.forEach((t) => {
      if (map[t.type] !== undefined) {
        map[t.type] += t.profit;
      }
    });

    return map;
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No. Nota',
      'Waktu',
      'Jenis Layanan',
      'Judul',
      'No. Tujuan / Rekening',
      'Nama Tujuan',
      'Bank / Operator',
      'Nominal Pokok',
      'Biaya Admin',
      'Total Bayar',
      'Harga Modal',
      'Laba Bersih',
      'Metode Bayar',
      'Status',
      'No. Referensi / SN',
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.invoiceNo}"`,
      `"${new Date(t.timestamp).toLocaleString('id-ID')}"`,
      `"${t.type}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.targetNumber || ''}"`,
      `"${t.targetName || ''}"`,
      `"${t.providerBank || t.operator || ''}"`,
      t.nominal,
      t.adminFee,
      t.totalAmount,
      t.priceCost,
      t.profit,
      `"${t.paymentMethod}"`,
      `"${t.status}"`,
      `"${t.serialNumber || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Transaksi_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'pulsa':
      case 'paket_data':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center gap-1">
            <Smartphone className="w-2.5 h-2.5" /> Pulsa/Data
          </span>
        );
      case 'token_pln':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> PLN
          </span>
        );
      case 'transfer_uang':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center gap-1">
            <Send className="w-2.5 h-2.5" /> Transfer
          </span>
        );
      case 'tarik_tunai':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
            <Banknote className="w-2.5 h-2.5" /> Tarik Tunai
          </span>
        );
      case 'aksesoris':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center gap-1">
            <ShoppingBag className="w-2.5 h-2.5" /> Aksesoris
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Date Ranges */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Periode:</span>
          {(
            [
              ['today', 'Hari Ini'],
              ['yesterday', 'Kemarin'],
              ['week', '7 Hari'],
              ['month', 'Bulan Ini'],
              ['all', 'Semua'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDateFilter(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                dateFilter === key
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Ekspor CSV / Excel
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Omset Transaksi</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {formatRupiah(metrics.revenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{metrics.count} transaksi berhasil</div>
        </div>

        {/* Laba Bersih */}
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span className="font-semibold uppercase tracking-wider">Laba Bersih (Profit)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {formatRupiah(metrics.profit)}
          </div>
          <div className="text-[11px] text-emerald-300/70 mt-1">
            Margin: {metrics.marginPercent.toFixed(1)}% dari total omset
          </div>
        </div>

        {/* Total Modal Pokok */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Modal Pokok (HPP)</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-300">
            {formatRupiah(metrics.cost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Modal pulsa, transfer & aksesoris</div>
        </div>

        {/* Rincian Transaksi */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Komposisi Layanan</span>
            <Filter className="w-4 h-4 text-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Transfer:</span>
              <strong className="text-white font-mono">{metrics.transferCount} trx</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Tarik Tunai:</span>
              <strong className="text-white font-mono">{metrics.tarikCount} trx</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Pulsa/PLN:</span>
              <strong className="text-white font-mono">{metrics.pulsaCount} trx</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Aksesoris:</span>
              <strong className="text-white font-mono">{metrics.accCount} trx</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Category Profit Breakdown Bar */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Sumber Keuntungan Konter (Laba Bersih Per Kategori)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Pulsa & Paket Data</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatRupiah(categoryProfits.pulsa + categoryProfits.paket_data)}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Biaya Admin Transfer</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatRupiah(categoryProfits.transfer_uang)}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Biaya Admin Tarik Tunai</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatRupiah(categoryProfits.tarik_tunai)}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Laba Aksesoris HP</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatRupiah(categoryProfits.aksesoris)}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Token PLN & E-Wallet</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatRupiah(categoryProfits.token_pln + categoryProfits.topup_ewallet)}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
        {/* Table Search & Category Filter */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nota, nomor HP, nama rekening, atau bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {[
              ['all', 'Semua'],
              ['pulsa', 'Pulsa'],
              ['transfer_uang', 'Transfer'],
              ['tarik_tunai', 'Tarik Tunai'],
              ['aksesoris', 'Aksesoris'],
              ['token_pln', 'PLN'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTypeFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs transition border ${
                  typeFilter === k
                    ? 'bg-blue-600 text-white border-blue-500 font-medium'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Nota / Waktu</th>
                <th className="py-3 px-4 font-semibold">Layanan / Deskripsi</th>
                <th className="py-3 px-4 font-semibold">Tujuan / Nama</th>
                <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                <th className="py-3 px-4 font-semibold text-right">Total Bayar</th>
                <th className="py-3 px-4 font-semibold text-right">Laba Konter</th>
                <th className="py-3 px-4 font-semibold text-center">Struk & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-white">{trx.invoiceNo}</div>
                    <div className="text-[10px] text-slate-500">{formatDateIndo(trx.timestamp)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      {getTypeBadge(trx.type)}
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {trx.paymentMethod}
                      </span>
                    </div>
                    <div className="font-medium text-slate-200">{trx.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    {trx.targetNumber && (
                      <div className="font-mono text-slate-300 font-semibold">{trx.targetNumber}</div>
                    )}
                    {trx.targetName && (
                      <div className="text-[11px] text-slate-400 uppercase">{trx.targetName}</div>
                    )}
                    {trx.providerBank && !trx.targetName && (
                      <div className="text-[10px] text-slate-500">{trx.providerBank}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {formatRupiah(trx.nominal)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatRupiah(trx.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    +{formatRupiah(trx.profit)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(trx)}
                        className="p-1.5 rounded-lg bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-white transition"
                        title="Lihat & Cetak Struk"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {trx.targetNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            const text = buildReceiptWhatsAppText(trx, settings);
                            openWhatsAppReceipt(trx.targetNumber!, text);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-600 text-emerald-300 hover:text-white transition"
                          title="Kirim Struk via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus transaksi ${trx.invoiceNo}?`)) {
                            deleteTransaction(trx.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p>Tidak ada transaksi pada filter periode ini.</p>
          </div>
        )}
      </div>
    </div>
  );
};
