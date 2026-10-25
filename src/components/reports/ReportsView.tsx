import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType } from '../../types';
import { formatRupiah, formatDateIndo, buildReceiptWhatsAppText, openWhatsAppReceipt } from '../../utils/formatters';
import { DailyProfitChart } from './DailyProfitChart';
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
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  X,
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
  const [trxToDelete, setTrxToDelete] = useState<Transaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'lengkap' | 'ringkasan' | 'transaksi'>('lengkap');
  const [exportDelimiter, setExportDelimiter] = useState<',' | ';'>(',');
  const [showExportToast, setShowExportToast] = useState(false);

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

  // Human readable label for current date filter
  const dateFilterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return 'Hari Ini (' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ')';
      case 'yesterday': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return 'Kemarin (' + y.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ')';
      }
      case 'week':
        return '7 Hari Terakhir';
      case 'month':
        return 'Bulan Ini (' + new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + ')';
      case 'all':
        return 'Semua Periode Transaksi';
      default:
        return dateFilter;
    }
  }, [dateFilter]);

  // Export to CSV with Profit & Loss Summary, Category Breakdown, and Transaction Details
  const handleExportCSV = (
    scope: 'lengkap' | 'ringkasan' | 'transaksi' = 'lengkap',
    delimiter: string = ','
  ) => {
    const sep = delimiter;
    const escape = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      if (typeof val === 'number') return String(val);
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];

    // Header & Toko Metadata
    if (scope !== 'transaksi') {
      lines.push([escape('=== LAPORAN RINGKASAN LABA RUGI TOKO ===')].join(sep));
      lines.push([escape('Nama Toko:'), escape(settings.storeName || 'NK STORE CELL')].join(sep));
      lines.push([escape('Nama Pemilik:'), escape(settings.ownerName || 'Pemilik Toko')].join(sep));
      lines.push([escape('Periode Laporan:'), escape(dateFilterLabel)].join(sep));
      lines.push([escape('Waktu Ekspor:'), escape(new Date().toLocaleString('id-ID'))].join(sep));
      lines.push([escape('Total Transaksi Terfilter:'), escape(`${filteredTransactions.length} transaksi`)].join(sep));
      lines.push('');

      // Section 1: Ringkasan Utama Laba Rugi
      lines.push([escape('=== 1. RINGKASAN UTAMA LABA RUGI (PROFIT & LOSS) ===')].join(sep));
      lines.push([escape('Indikator Keuangan'), escape('Nilai (Rp / Persen)'), escape('Keterangan')].join(sep));
      lines.push([escape('Total Omset Penjualan (Gross Sales)'), escape(metrics.revenue), escape('Total penerimaan kotor dari transaksi pelanggan')].join(sep));
      lines.push([escape('Total Modal Pokok (HPP / Cost)'), escape(metrics.cost), escape('Modal saldo server pulsa, transfer & stok barang aksesoris')].join(sep));
      lines.push([escape('Total Laba Bersih (Net Profit)'), escape(metrics.profit), escape('Keuntungan bersih murni toko')].join(sep));
      lines.push([escape('Persentase Margin Keuntungan'), escape(`${metrics.marginPercent.toFixed(2)}%`), escape('Rasio laba bersih terhadap omset')].join(sep));
      lines.push([escape('Rata-rata Penjualan per Transaksi'), escape(metrics.count > 0 ? Math.round(metrics.revenue / metrics.count) : 0), escape('Rata-rata nominal per nota transaksi')].join(sep));
      lines.push('');

      // Section 2: Rincian Performa per Kategori Layanan
      lines.push([escape('=== 2. RINCIAN PERFORMA PER KATEGORI LAYANAN ===')].join(sep));
      lines.push([
        escape('Kategori Layanan'),
        escape('Jumlah Transaksi'),
        escape('Total Omset (Rp)'),
        escape('Total Modal Pokok (Rp)'),
        escape('Total Laba Bersih (Rp)'),
        escape('Margin Laba (%)')
      ].join(sep));

      const categories: { key: TransactionType; label: string }[] = [
        { key: 'pulsa', label: 'Pulsa Seluler' },
        { key: 'paket_data', label: 'Paket Data Internet' },
        { key: 'token_pln', label: 'Token Listrik PLN' },
        { key: 'topup_ewallet', label: 'Top Up E-Wallet' },
        { key: 'transfer_uang', label: 'Jasa Transfer Uang' },
        { key: 'tarik_tunai', label: 'Jasa Tarik Tunai' },
        { key: 'aksesoris', label: 'Penjualan Aksesoris Konter' },
      ];

      categories.forEach((cat) => {
        const catTxs = filteredTransactions.filter((t) => t.type === cat.key);
        let s = 0;
        let c = 0;
        let p = 0;
        catTxs.forEach((t) => {
          s += t.totalAmount || 0;
          c += t.priceCost || 0;
          p += t.profit || 0;
        });
        const m = s > 0 ? ((p / s) * 100).toFixed(2) + '%' : '0.00%';
        lines.push([escape(cat.label), escape(catTxs.length), escape(s), escape(c), escape(p), escape(m)].join(sep));
      });
      lines.push('');

      // Section 3: Ringkasan Metode Pembayaran
      lines.push([escape('=== 3. RINGKASAN METODE PEMBAYARAN ===')].join(sep));
      lines.push([escape('Metode Pembayaran'), escape('Jumlah Transaksi'), escape('Total Nominal Diterima (Rp)')].join(sep));
      const paymentMethods: { key: string; label: string }[] = [
        { key: 'tunai', label: 'Tunai (Kas Laci)' },
        { key: 'transfer_bank', label: 'Transfer Bank' },
        { key: 'qris', label: 'QRIS' },
        { key: 'saldo_ewallet', label: 'Saldo E-Wallet' },
        { key: 'kasbon', label: 'Kasbon Pelanggan' },
      ];
      paymentMethods.forEach((pm) => {
        const pmTxs = filteredTransactions.filter((t) => t.paymentMethod === pm.key);
        const total = pmTxs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        lines.push([escape(pm.label), escape(pmTxs.length), escape(total)].join(sep));
      });
      lines.push('');
    }

    // Section 4: Detail Transaksi
    if (scope !== 'ringkasan') {
      lines.push([escape('=== 4. DAFTAR RINCIAN TRANSAKSI LENGKAP ===')].join(sep));
      const headers = [
        'No. Nota',
        'Waktu',
        'Jenis Layanan',
        'Judul / Deskripsi',
        'No. Tujuan / Rekening',
        'Nama Tujuan',
        'Bank / Operator',
        'Nominal Pokok',
        'Biaya Admin',
        'Total Bayar Pelanggan',
        'Harga Modal (HPP)',
        'Laba Bersih',
        'Metode Bayar',
        'Status',
        'No. Referensi / SN'
      ];
      lines.push(headers.map((h) => escape(h)).join(sep));

      filteredTransactions.forEach((t) => {
        lines.push([
          escape(t.invoiceNo),
          escape(new Date(t.timestamp).toLocaleString('id-ID')),
          escape(t.type),
          escape(t.title),
          escape(t.targetNumber || ''),
          escape(t.targetName || ''),
          escape(t.providerBank || t.operator || ''),
          escape(t.nominal || 0),
          escape(t.adminFee || 0),
          escape(t.totalAmount || 0),
          escape(t.priceCost || 0),
          escape(t.profit || 0),
          escape(t.paymentMethod),
          escape(t.status),
          escape(t.serialNumber || '')
        ].join(sep));
      });
    }

    // UTF-8 BOM so Excel automatically recognizes UTF-8 without garbled characters
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanDate = new Date().toISOString().slice(0, 10);
    const filenamePrefix =
      scope === 'ringkasan'
        ? 'Ringkasan_Laba_Rugi'
        : scope === 'transaksi'
        ? 'Detail_Transaksi'
        : 'Laporan_Ringkasan_Laba_Rugi_Lengkap';
    link.download = `${filenamePrefix}_${dateFilter}_${cleanDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show feedback toast notification
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3500);
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

        {/* Tombol Ekspor ke CSV */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleExportCSV('lengkap', ',')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            title="Unduh data ringkasan laba rugi ke file CSV untuk Excel & Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Ekspor ke CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Pilihan Format & Opsi Ekspor CSV Lanjutan"
          >
            <ChevronDown className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
          </button>
        </div>
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

      {/* Visualisasi Data Tren Laba Harian (Recharts) */}
      <DailyProfitChart transactions={transactions} />

      {/* Category Profit Breakdown Bar */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Sumber Keuntungan Konter (Laba Bersih Per Kategori)
          </h4>
          <button
            type="button"
            onClick={() => handleExportCSV('ringkasan', ',')}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 hover:underline cursor-pointer"
            title="Ekspor khusus ringkasan laba rugi ke CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Ringkasan</span>
          </button>
        </div>

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
                        onClick={() => setTrxToDelete(trx)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
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

      {/* Modal Konfirmasi Hapus Transaksi (In-App Reliable Dialog) */}
      {trxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Transaksi?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">No. Nota:</span>
                <span className="font-mono font-bold text-white">{trxToDelete.invoiceNo}</span>
              </div>
              <div className="text-xs font-semibold text-white">{trxToDelete.title}</div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-850">
                <span className="text-slate-400">Nominal:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(trxToDelete.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Waktu:</span>
                <span>{formatDateIndo(trxToDelete.timestamp)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus data transaksi ini dari laporan pembukuan toko?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTrxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(trxToDelete.id);
                  setTrxToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Opsi Ekspor CSV Lanjutan */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ekspor Laporan Laba Rugi ke CSV</h3>
                  <p className="text-[11px] text-slate-400">Siap dibuka di Excel, Google Sheets, & LibreOffice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Box Ringkasan */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Periode Terpilih:</span>
                <span className="font-bold text-blue-400">{dateFilterLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Omset:</span>
                  <span className="font-mono font-bold text-white">{formatRupiah(metrics.revenue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Laba Bersih:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(metrics.profit)}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/60">
                <span>Jumlah Transaksi:</span>
                <span className="font-semibold text-slate-200">{metrics.count} transaksi</span>
              </div>
            </div>

            {/* Pilihan Konten */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilihan Isi Konten CSV:
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'lengkap'}
                    onChange={() => setExportScope('lengkap')}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-white block">Ringkasan Laba Rugi & Transaksi (Lengkap)</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Berisi ringkasan omset, modal, laba bersih, kategori layanan, dan semua baris transaksi. (Rekomendasi)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'ringkasan'}
                    onChange={() => setExportScope('ringkasan')}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-white block">Hanya Ringkasan Laba Rugi</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Hanya tabel ringkasan keuangan, KPI laba, margin, dan komposisi kategori layanan.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'transaksi'}
                    onChange={() => setExportScope('transaksi')}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-white block">Hanya Daftar Detail Transaksi</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Hanya baris transaksi per nota untuk pivot table di Excel / Google Sheets.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Pilihan Pemisah Karakter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Format Delimiter:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setExportDelimiter(',')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    exportDelimiter === ','
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block">Koma ( , )</span>
                  <span className="text-[10px] text-slate-400 font-normal">Google Sheets / Excel Global</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportDelimiter(';')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    exportDelimiter === ';'
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block">Titik Koma ( ; )</span>
                  <span className="text-[10px] text-slate-400 font-normal">Excel Regional Indonesia</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportCSV(exportScope, exportDelimiter);
                  setIsExportModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Berhasil Ekspor CSV */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-white">File CSV Berhasil Diunduh!</span>
            <span className="text-emerald-300">Data ringkasan laba rugi siap dibuka di Excel / Google Sheets.</span>
          </div>
        </div>
      )}
    </div>
  );
};
