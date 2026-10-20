import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffPermissions } from '../../types';
import { DEFAULT_STAFF_PERMISSIONS } from '../../data/initialData';
import {
  ShieldCheck,
  RotateCcw,
  Clock,
  Send,
  Banknote,
  ShoppingBag,
  BookOpen,
  Package,
  Wallet,
  BarChart3,
  Trash2,
  Settings,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

export const StaffPermissionsManager: React.FC = () => {
  const { settings, updateStaffPermissions, resetStaffPermissions } = useApp();
  const currentPerms = settings.staffPermissions || DEFAULT_STAFF_PERMISSIONS;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    const newValue = !currentPerms[key];
    updateStaffPermissions({ [key]: newValue });
    showToast(`Hak akses berhasil diperbarui`);
  };

  const applyPreset = (presetType: 'standard' | 'trusted' | 'all') => {
    if (presetType === 'standard') {
      updateStaffPermissions(DEFAULT_STAFF_PERMISSIONS);
      showToast('Preset Standar Kasir Aman diterapkan');
    } else if (presetType === 'trusted') {
      updateStaffPermissions({
        canAccessShift: true,
        canAccessTransfer: true,
        canAccessTarikTunai: true,
        canAccessPosAksesoris: true,
        canAccessKasbon: true,
        canAccessInventory: true, // Trusted can manage stock
        canAccessFinance: false,
        canAccessReports: false,
        canDeleteTransactions: false,
        canDeleteShifts: false,
        canEditSettings: false,
        canViewCostPrice: true,
      });
      showToast('Preset Kasir Terpercaya diterapkan');
    } else if (presetType === 'all') {
      updateStaffPermissions({
        canAccessShift: true,
        canAccessTransfer: true,
        canAccessTarikTunai: true,
        canAccessPosAksesoris: true,
        canAccessKasbon: true,
        canAccessInventory: true,
        canAccessFinance: true,
        canAccessReports: true,
        canDeleteTransactions: true,
        canDeleteShifts: true,
        canEditSettings: true,
        canViewCostPrice: true,
      });
      showToast('Semua hak akses telah diizinkan untuk staf');
    }
  };

  const permissionItems: {
    key: keyof StaffPermissions;
    title: string;
    description: string;
    icon: React.ElementType;
    category: 'transaksi' | 'rahasia' | 'otoritas';
    riskLevel?: 'aman' | 'sedang' | 'kritis';
  }[] = [
    // 1. Transaksi Kasir
    {
      key: 'canAccessShift',
      title: 'Buka & Rekap Shift 4 Server',
      description: 'Staf kasir dapat membuka shift, input saldo awal 4 server, dan tutup rekap shift harian.',
      icon: Clock,
      category: 'transaksi',
      riskLevel: 'aman',
    },
    {
      key: 'canAccessTransfer',
      title: 'Layanan Transfer Uang (Agen)',
      description: 'Kasir dapat melayani transfer uang antar bank dan e-wallet serta cetak bukti transfer.',
      icon: Send,
      category: 'transaksi',
      riskLevel: 'aman',
    },
    {
      key: 'canAccessTarikTunai',
      title: 'Layanan Tarik Tunai',
      description: 'Kasir dapat melayani penarikan uang tunai nasabah dari bank/e-wallet.',
      icon: Banknote,
      category: 'transaksi',
      riskLevel: 'aman',
    },
    {
      key: 'canAccessPosAksesoris',
      title: 'Kasir POS Penjualan Aksesoris',
      description: 'Kasir dapat melayani nota penjualan aksesoris HP (kabel, casing, kartu perdana).',
      icon: ShoppingBag,
      category: 'transaksi',
      riskLevel: 'aman',
    },
    {
      key: 'canAccessKasbon',
      title: 'Pencatatan Kasbon Pelanggan',
      description: 'Kasir dapat melihat hutang kasbon dan menandai pelunasan kasbon pelanggan.',
      icon: BookOpen,
      category: 'transaksi',
      riskLevel: 'sedang',
    },

    // 2. Data & Keuangan Rahasia
    {
      key: 'canAccessReports',
      title: 'Laporan Laba Rugi & Omset Toko',
      description: 'Melihat seluruh keuntungan bersih toko, ringkasan per hari/minggu/bulan.',
      icon: BarChart3,
      category: 'rahasia',
      riskLevel: 'kritis',
    },
    {
      key: 'canAccessFinance',
      title: 'Buku Kas & Saldo Rekening Bank',
      description: 'Melihat saldo riil rekening bank, mutasi keluar/masuk, dan penarikan modal.',
      icon: Wallet,
      category: 'rahasia',
      riskLevel: 'kritis',
    },
    {
      key: 'canAccessInventory',
      title: 'Gudang Stok & Pembelian Kulakan',
      description: 'Menambah item baru, update stok gudang, dan melihat harga modal kulakan.',
      icon: Package,
      category: 'rahasia',
      riskLevel: 'sedang',
    },

    // 3. Otoritas Khusus
    {
      key: 'canViewCostPrice',
      title: 'Tampilkan Estimasi Laba di Kasir',
      description: 'Menampilkan kalkulasi estimasi laba bersih di layar kasir POS saat melayani pembeli.',
      icon: Eye,
      category: 'otoritas',
      riskLevel: 'sedang',
    },
    {
      key: 'canDeleteTransactions',
      title: 'Otoritas Hapus Transaksi',
      description: 'Izinkan staf kasir menghapus transaksi yang sudah tersimpan di riwayat toko.',
      icon: Trash2,
      category: 'otoritas',
      riskLevel: 'kritis',
    },
    {
      key: 'canDeleteShifts',
      title: 'Otoritas Hapus Riwayat Shift',
      description: 'Izinkan staf kasir menghapus catatan riwayat shift kerja.',
      icon: Trash2,
      category: 'otoritas',
      riskLevel: 'kritis',
    },
    {
      key: 'canEditSettings',
      title: 'Ubah Pengaturan Toko & Printer',
      description: 'Izinkan staf mengubah nama toko, alamat, footer struk, dan nama 4 server.',
      icon: Settings,
      category: 'otoritas',
      riskLevel: 'kritis',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              Pengaturan Hak Akses Staf / Kasir
            </h2>
            <p className="text-xs text-slate-300">
              Tentukan menu apa saja yang boleh dan tidak boleh dibuka saat aplikasi berada di <strong className="text-amber-400">Mode Kasir</strong>.
            </p>
          </div>
        </div>

        {/* Preset Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Izinkan hanya transaksi harian, batasi data rahasia"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Standar Kasir Aman
          </button>
          <button
            type="button"
            onClick={() => applyPreset('trusted')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Izinkan transaksi harian + manajemen stok gudang"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Kasir Terpercaya
          </button>
          <button
            type="button"
            onClick={() => applyPreset('all')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Buka seluruh hak akses"
          >
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
            Buka Semua
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Group 1: Transaksi Kasir Harian */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Transaksi & Operasional Kasir Harian
          </h3>
          <span className="text-[11px] text-slate-400">
            Menu dasar yang biasa dikerjakan staf di meja konter
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissionItems
            .filter((p) => p.category === 'transaksi')
            .map((item) => {
              const isAllowed = !!currentPerms[item.key];
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  onClick={() => togglePermission(item.key)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    isAllowed
                      ? 'bg-slate-900/90 border-blue-600/40 hover:border-blue-500 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAllowed ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="shrink-0 pt-0.5">
                    <button
                      type="button"
                      aria-label={item.title}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAllowed ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAllowed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Group 2: Data & Keuangan Rahasia Toko */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Data Finansial & Laba Bersih Toko (Sensitif)
          </h3>
          <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> Rekomendasi: Khusus Pemilik
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {permissionItems
            .filter((p) => p.category === 'rahasia')
            .map((item) => {
              const isAllowed = !!currentPerms[item.key];
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  onClick={() => togglePermission(item.key)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                    isAllowed
                      ? 'bg-rose-950/30 border-rose-600/50 hover:border-rose-500 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAllowed ? 'bg-rose-600/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isAllowed
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {isAllowed ? 'Diizinkan Staf' : 'Terkunci (Hanya Owner)'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        aria-label={item.title}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAllowed ? 'bg-rose-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isAllowed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      {/* Group 3: Otoritas & Keamanan Khusus */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Otoritas Hapus & Konfigurasi Toko
          </h3>
          <span className="text-[11px] text-slate-400">
            Mencegah staf menghapus rekaman transaksi atau mengubah setting
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissionItems
            .filter((p) => p.category === 'otoritas')
            .map((item) => {
              const isAllowed = !!currentPerms[item.key];
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  onClick={() => togglePermission(item.key)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    isAllowed
                      ? 'bg-amber-950/30 border-amber-600/50 hover:border-amber-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAllowed ? 'bg-amber-600/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <button
                      type="button"
                      aria-label={item.title}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAllowed ? 'bg-amber-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAllowed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
