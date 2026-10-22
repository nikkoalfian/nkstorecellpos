import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import { StaffPermissionsManager } from './StaffPermissionsManager';
import {
  Crown,
  Lock,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Clock,
  Radio,
  Building2,
  Package,
  BarChart3,
  BookOpen,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { ActiveTab } from '../Navbar';

interface OwnerDashboardProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateTab, onOpenSettings }) => {
  const {
    settings,
    accounts,
    accessories,
    shifts,
    activeShift,
    transactions,
    kasbonList,
    switchViewMode,
    lockOwner,
  } = useApp();

  const [activeOwnerSection, setActiveOwnerSection] = useState<'permissions' | 'servers' | 'shifts'>('permissions');

  // Account calculations
  const cashAcc = accounts.find((a) => a.type === 'cash');
  const serverAccs = accounts.filter((a) => a.type === 'server_pulsa');
  const totalServerBalance = serverAccs.reduce((sum, a) => sum + a.balance, 0);
  const bankAccs = accounts.filter((a) => a.type === 'bank' || a.type === 'ewallet');
  const totalBankBalance = bankAccs.reduce((sum, a) => sum + a.balance, 0);

  // Overall Profits
  const totalShiftProfit = shifts.reduce((sum, s) => sum + (s.netProfit || 0), 0);
  const totalTransactionsProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalTransactionsSales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const unpaidKasbonTotal = kasbonList.filter((k) => !k.isPaid).reduce((sum, k) => sum + k.amount, 0);

  // Low Stock Items (reaching or below minStock threshold)
  const minStockLimit = settings.defaultMinStockAlert ?? 5;
  const lowStockItems = accessories.filter((a) => {
    const threshold = typeof a.minStock === 'number' && a.minStock > 0 ? a.minStock : minStockLimit;
    return a.stock <= threshold;
  });
  const lowStockCount = lowStockItems.length;

  return (
    <div className="space-y-6">
      {/* Top Banner Mode Pemilik */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/50 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  Halaman Khusus Pemilik
                </span>
                <span className="text-xs text-slate-400">Mode Owner Aktif</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Dashboard & Kontrol Pemilik Toko
              </h1>
              <p className="text-xs text-slate-300">
                Halo, <strong className="text-amber-300">{settings.ownerName}</strong>! Kelola keuangan konter, pantau kasir, dan atur hak akses staf di sini.
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
            <button
              type="button"
              onClick={() => onNavigateTab('permissions')}
              className="px-3.5 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-600/60 text-xs font-bold flex items-center gap-2 transition shadow-md shadow-amber-950/40"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Hak Akses & Akun Kasir
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              Pengaturan Toko
            </button>
            <button
              type="button"
              onClick={() => switchViewMode('staff')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
              title="Uji tampilan kasir persis seperti yang dilihat kasir"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              Uji Tampilan Kasir
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Notification Banner on Dashboard */}
      {lowStockCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/50 border border-rose-500/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white flex items-center gap-1 shadow-sm">
                  ⚠️ Peringatan Stok Menipis
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/60 font-mono">
                  {lowStockCount} Produk Perlu Kulakan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Terdapat <strong className="text-rose-300 font-bold font-mono">{lowStockCount}</strong> jenis produk yang stoknya telah mencapai batas minimal ({minStockLimit} pcs):{' '}
                <span className="text-slate-400 italic">
                  {lowStockItems.slice(0, 3).map((it) => `${it.name} (sisa ${it.stock})`).join(', ')}
                  {lowStockCount > 3 ? ` dan ${lowStockCount - 3} lainnya...` : '.'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-rose-950/50 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Buka Gudang & Kulakan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Laba Bersih */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Laba Bersih Shift</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-2">
            {formatRupiah(totalShiftProfit)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dari 4 Server + Fee Jasa</span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Laporan <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Uang Kas Laci Fisik */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Uang Kas Laci Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white mt-2">
            {formatRupiah(cashAcc?.balance || 0)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Modal & hasil transaksi tunai</span>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Buku Kas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Saldo 4 Server Terpisah */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Saldo 4 Server</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-purple-400 mt-2">
            {formatRupiah(totalServerBalance)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>4 Server Chip Konter</span>
            <button
              type="button"
              onClick={() => onNavigateTab('shift')}
              className="text-purple-400 hover:underline flex items-center gap-0.5"
            >
              Detail Server <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Saldo Rekening Bank / Agen */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Rekening Bank & Agen</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-sky-400 mt-2">
            {formatRupiah(totalBankBalance)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{bankAccs.length} Rekening & Dompet</span>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="text-sky-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              + Tambah / Kelola <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Kasir & Shift Aktif Saat Ini */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Status Kasir & Shift yang Sedang Berjalan
            </h3>
          </div>
          {activeShift ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Shift Aktif (#{activeShift.shiftNumber})
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              Tidak Ada Shift Terbuka
            </span>
          )}
        </div>

        {/* Bar Cepat PIN Staf / Kasir */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400">PIN Masuk Kasir / Staf:</span>
            <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
              {settings.staffPin ? `•••• (${settings.staffPin.length} Digit)` : 'Tanpa PIN (Bebas)'}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              — Dibuat & diatur oleh Owner
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('permissions')}
            className="text-amber-400 hover:text-amber-300 hover:underline font-bold flex items-center gap-1 text-xs cursor-pointer"
          >
            <span>Ubah PIN Staf di Hak Akses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeShift ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Kasir Bertugas:</span>
              <span className="text-sm font-bold text-white block">{activeShift.cashierName}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Mulai: {formatTanggal(activeShift.startTime)}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Kas Laci Awal:</span>
              <span className="text-sm font-bold font-mono text-white block">
                {formatRupiah(activeShift.initialCashDrawer)}
              </span>
              <span className="text-[10px] text-slate-500">Modal uang kecil di laci</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Penjualan Aksesoris Shift Ini:</span>
              <span className="text-sm font-bold font-mono text-purple-400 block">
                {formatRupiah(activeShift.accessorySales)}
              </span>
              <span className="text-[10px] text-emerald-400">
                Laba: +{formatRupiah(activeShift.accessoryProfit)}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Fee Jasa Transfer & Tarik:</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block">
                +{formatRupiah(activeShift.transferAdminProfit + activeShift.tarikTunaiAdminProfit)}
              </span>
              <span className="text-[10px] text-slate-500">Komisi murni konter</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            Saat ini kasir belum membuka shift baru. Kasir dapat membuka shift dengan memasukkan saldo awal 4 server di menu Shift.
          </div>
        )}
      </div>

      {/* Owner Navigation Tabs: Hak Akses vs 4 Server vs Pintasan */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveOwnerSection('permissions')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeOwnerSection === 'permissions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Hak Akses & Akun Kasir
          </button>
          <button
            type="button"
            onClick={() => setActiveOwnerSection('servers')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeOwnerSection === 'servers'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Kondisi Saldo 4 Server Terpisah
          </button>
          <button
            type="button"
            onClick={() => setActiveOwnerSection('shifts')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeOwnerSection === 'shifts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Semua Riwayat Shift Kasir ({shifts.length})
          </button>
        </div>

        {/* Section 1: Staff Permissions Manager */}
        {activeOwnerSection === 'permissions' && (
          <StaffPermissionsManager />
        )}

        {/* Section 2: 4 Server Detail Cards */}
        {activeOwnerSection === 'servers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {serverAccs.map((srv, idx) => {
                const srvName = settings.serverNames?.[idx] || srv.name;
                return (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: srv.color }}></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Server #{idx + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate" title={srvName}>
                        {srvName}
                      </h4>
                      <p className="text-[11px] text-slate-400">{srv.description}</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Saldo Realtime:</span>
                      <span className="text-base font-black font-mono text-emerald-400 block">
                        {formatRupiah(srv.balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Ingin ubah nama 4 server atau input saldo shift?</span>
                <p className="text-slate-400 text-[11px]">
                  Buka menu Shift & 4 Server untuk memantau perputaran saldo, cek laba, atau tutup shift.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('shift')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
              >
                Buka Menu Shift
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Riwayat Shift */}
        {activeOwnerSection === 'shifts' && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Daftar Rekap Shift yang Tersimpan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">No. Shift</th>
                    <th className="py-2.5 px-3">Nama Kasir</th>
                    <th className="py-2.5 px-3">Waktu Buka / Tutup</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Laba 4 Server</th>
                    <th className="py-2.5 px-3 text-right">Total Laba Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">#{s.shiftNumber}</td>
                      <td className="py-2.5 px-3">{s.cashierName}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatTanggal(s.startTime)}
                        {s.endTime && ` s/d ${formatTanggal(s.endTime).split(' ')[1]}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'open'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.status === 'open' ? 'Terbuka' : 'Selesai'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-400 font-semibold">
                        {formatRupiah(s.totalPulseProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-black">
                        {formatRupiah(s.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Owner Fast Shortcuts */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Pintasan Menu Utama Pemilik:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left transition group"
          >
            <BarChart3 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white block mt-2">Laporan Laba Rugi</span>
            <span className="text-[10px] text-slate-500">Omset & analisa laba</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('finance')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-left transition group"
          >
            <Wallet className="w-5 h-5 text-teal-400 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white block mt-2">Buku Kas & Bank</span>
            <span className="text-[10px] text-slate-500">Mutasi & rekening</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition group relative"
          >
            {lowStockCount > 0 && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 animate-pulse shadow-sm shadow-rose-950">
                <AlertCircle className="w-3 h-3" />
                {lowStockCount} Menipis
              </span>
            )}
            <Package className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white block mt-2">Gudang & Stok</span>
            <span className="text-[10px] text-slate-500">
              {lowStockCount > 0 ? `${lowStockCount} barang perlu kulakan` : 'Kulakan & modal barang'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('shift')}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition group"
          >
            <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white block mt-2">Shift 4 Server</span>
            <span className="text-[10px] text-slate-500">Buka tutup shift</span>
          </button>
        </div>
      </div>
    </div>
  );
};
