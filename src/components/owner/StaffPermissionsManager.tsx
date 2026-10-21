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
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  KeyRound,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';

export const StaffPermissionsManager: React.FC = () => {
  const {
    settings,
    updateStaffPermissions,
    resetStaffPermissions,
    switchViewMode,
    updateStaffPin,
    updateSettings,
  } = useApp();
  const currentPerms = settings.staffPermissions || DEFAULT_STAFF_PERMISSIONS;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Staff PIN State
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newStaffPin, setNewStaffPin] = useState(settings.staffPin || '');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveStaffPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    const clean = newStaffPin.trim();
    if (clean && (clean.length < 4 || clean.length > 6)) {
      setPinError('PIN Staf harus berupa 4 - 6 digit angka (atau kosongkan untuk login tanpa PIN).');
      return;
    }
    updateStaffPin(clean);
    updateSettings({ staffPin: clean });
    setIsEditingPin(false);
    showToast(
      clean
        ? `PIN Staf / Kasir berhasil diubah menjadi: ${clean}`
        : 'PIN Staf dinonaktifkan (Kasir dapat login bebas tanpa PIN)'
    );
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

        {/* Preset Quick Buttons & Test Cashier View */}
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
          <button
            type="button"
            onClick={() => switchViewMode('staff')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-950"
            title="Lihat persis bagaimana tampilan kasir setelah pengaturan hak akses ini"
          >
            <Lock className="w-3.5 h-3.5" />
            Uji Tampilan Kasir Sekarang
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Kartu Khusus: Pengaturan PIN Staf / Kasir oleh Owner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">PIN Masuk Kasir / Staf</h3>
                {settings.staffPin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    PIN Wajib ({settings.staffPin.length} Digit)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Tanpa PIN (Login Bebas)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sebagai Pemilik (Owner), Anda dapat membuat, mengganti, atau menonaktifkan PIN yang digunakan kasir untuk login ke web app ini.
              </p>
            </div>
          </div>

          {!isEditingPin && (
            <button
              type="button"
              onClick={() => {
                setNewStaffPin(settings.staffPin || '');
                setIsEditingPin(true);
                setPinError(null);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md shadow-amber-950"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{settings.staffPin ? 'Ganti PIN Staf' : 'Buat PIN Staf Baru'}</span>
            </button>
          )}
        </div>

        {/* Display Current PIN or Edit Mode */}
        {isEditingPin ? (
          <form onSubmit={handleSaveStaffPin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in">
            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Ketik PIN Staf / Kasir Baru (4 - 6 Angka):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStaffPin(!showStaffPin)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showStaffPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showStaffPin ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  type={showStaffPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 0000 atau kosongkan untuk tanpa PIN"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-base focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Actions & Save */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setNewStaffPin('0000')}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition cursor-pointer"
                  title="Gunakan PIN default 0000"
                >
                  Set 0000
                </button>
                <button
                  type="button"
                  onClick={() => setNewStaffPin('')}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 text-xs border border-slate-800 transition cursor-pointer"
                  title="Hapus PIN agar kasir bisa login langsung tanpa PIN"
                >
                  Kosongkan (Tanpa PIN)
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-950 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan PIN Staf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPin(false);
                    setPinError(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 <em>Petunjuk Owner:</em> Jika Anda memasang PIN (misal: <strong>0000</strong>, <strong>8899</strong>, dsb.), kasir wajib memasukkan PIN ini untuk masuk. Jika Anda mengosongkan kolom ini, kasir dapat langsung login cukup dengan memilih nama kasir.
            </p>
          </form>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">PIN Kasir Saat Ini:</span>
              {settings.staffPin ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono font-bold text-amber-300 tracking-wider">
                    {showStaffPin ? settings.staffPin : '••••'.slice(0, settings.staffPin.length || 4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStaffPin(!showStaffPin)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title={showStaffPin ? 'Sembunyikan PIN' : 'Lihat PIN Kasir'}
                  >
                    {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tanpa PIN (Staf bebas login tanpa PIN)
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              Hanya akun <strong>Owner</strong> yang dapat mengubah atau melihat PIN ini di dalam akun Owner.
            </div>
          </div>
        )}
      </div>

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
