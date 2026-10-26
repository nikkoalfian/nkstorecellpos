import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffPermissions, StaffAccount } from '../../types';
import { DEFAULT_STAFF_PERMISSIONS, DEFAULT_STAFF_ACCOUNTS } from '../../data/initialData';
import {
  ShieldCheck,
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
  ClipboardCheck,
  Lock,
  Unlock,
  Sparkles,
  KeyRound,
  Check,
  AlertCircle,
  UserPlus,
  Users,
  Copy,
  Edit2,
  X,
  AtSign,
  UserCheck,
  UserX,
} from 'lucide-react';

export const StaffPermissionsManager: React.FC = () => {
  const {
    settings,
    updateStaffPermissions,
    switchViewMode,
    staffAccounts,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
  } = useApp();

  const currentPerms = settings.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
  const accountsList = staffAccounts && staffAccounts.length > 0 ? staffAccounts : DEFAULT_STAFF_ACCOUNTS;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Visible PIN map per account id { [id: string]: boolean }
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Modal State for Add Account
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPin, setAddPin] = useState('');
  const [addRoleTitle, setAddRoleTitle] = useState('Kasir Konter');
  const [addError, setAddError] = useState<string | null>(null);

  // Modal State for Edit Account
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (account: StaffAccount) => {
    const text = `*Kredensial Login Kasir NK STORE*\nNama: ${account.name}\nUsername: ${account.username}\nPIN: ${account.pin || '(Tanpa PIN)'}\nStatus: ${account.isActive ? 'Aktif' : 'Nonaktif'}`;
    navigator.clipboard.writeText(text);
    showToast(`Data login @${account.username} berhasil disalin!`);
  };

  const handleOpenAddModal = () => {
    setAddName('');
    setAddUsername(`kasir${accountsList.length + 1}`);
    setAddPin('0000');
    setAddRoleTitle('Kasir Konter');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const cleanName = addName.trim();
    const cleanUser = addUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = addPin.trim().replace(/\D/g, '');

    if (!cleanName) {
      setAddError('Nama kasir wajib diisi.');
      return;
    }

    if (!cleanUser) {
      setAddError('Username login wajib diisi.');
      return;
    }

    // Check duplicate username
    const exists = accountsList.some(
      (a) => a.username.toLowerCase() === cleanUser
    );
    if (exists) {
      setAddError(`Username "${cleanUser}" sudah digunakan oleh kasir lain.`);
      return;
    }

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setAddError('PIN Kasir harus berupa 4 sampai 6 digit angka.');
      return;
    }

    addStaffAccount({
      name: cleanName,
      username: cleanUser,
      pin: cleanPin,
      roleTitle: addRoleTitle.trim() || 'Kasir Konter',
      isActive: true,
    });

    setIsAddModalOpen(false);
    showToast(`Akun kasir baru "@${cleanUser}" (${cleanName}) berhasil dibuat!`);
  };

  const handleOpenEditModal = (account: StaffAccount) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditUsername(account.username);
    setEditPin(account.pin);
    setEditRoleTitle(account.roleTitle || 'Kasir Konter');
    setEditIsActive(account.isActive);
    setEditError(null);
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditError(null);

    const cleanName = editName.trim();
    const cleanUser = editUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = editPin.trim().replace(/\D/g, '');

    if (!cleanName) {
      setEditError('Nama kasir wajib diisi.');
      return;
    }

    if (!cleanUser) {
      setEditError('Username login wajib diisi.');
      return;
    }

    // Check duplicate username among other accounts
    const exists = accountsList.some(
      (a) => a.id !== editingAccount.id && a.username.toLowerCase() === cleanUser
    );
    if (exists) {
      setEditError(`Username "${cleanUser}" sudah digunakan akun lain.`);
      return;
    }

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setEditError('PIN Kasir harus berupa 4 sampai 6 digit angka.');
      return;
    }

    updateStaffAccount(editingAccount.id, {
      name: cleanName,
      username: cleanUser,
      pin: cleanPin,
      roleTitle: editRoleTitle.trim() || 'Kasir Konter',
      isActive: editIsActive,
    });

    setEditingAccount(null);
    showToast(`Akun kasir @${cleanUser} berhasil diperbarui!`);
  };

  const handleDeleteAccount = (id: string, username: string) => {
    if (accountsList.length <= 1) {
      alert('Minimal harus tersisa 1 akun kasir dalam sistem.');
      return;
    }
    deleteStaffAccount(id);
    setDeletingId(null);
    showToast(`Akun kasir @${username} berhasil dihapus.`);
  };

  const toggleAccountActive = (account: StaffAccount) => {
    updateStaffAccount(account.id, { isActive: !account.isActive });
    showToast(
      account.isActive
        ? `Akun @${account.username} dinonaktifkan.`
        : `Akun @${account.username} berhasil diaktifkan kembali.`
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
        canAccessInventory: true,
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
        canAccessStockOpname: true,
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
      title: 'Buka & Rekap Kasir POS',
      description: 'Staf kasir dapat membuka shift, kelola saldo kas laci & server pulsa PPOB, serta tutup rekap shift kasir.',
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
    {
      key: 'canAccessStockOpname',
      title: 'Akses Audit Fisik Stock Opname',
      description: 'Izinkan staf melakukan sesi stock opname dan menyesuaikan stok fisik riil aksesoris.',
      icon: ClipboardCheck,
      category: 'otoritas',
      riskLevel: 'sedang',
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
              Pengaturan Hak Akses & Akun Staf / Kasir
            </h2>
            <p className="text-xs text-slate-300">
              Buat akun login kasir (Username & PIN) serta atur batasan akses menu saat staf berada di <strong className="text-amber-400">Mode Kasir</strong>.
            </p>
          </div>
        </div>

        {/* Quick Test Cashier View */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => switchViewMode('staff')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-950 cursor-pointer"
            title="Lihat persis bagaimana tampilan kasir setelah pengaturan hak akses ini"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Uji Tampilan Kasir Sekarang</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= KARTU 1: MANAJEMEN AKUN LOGIN KASIR (USERNAME & PIN) ================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Daftar Akun Login Kasir / Staf
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {accountsList.length} Akun Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Staf kasir akan login menggunakan <strong className="text-white">Username</strong> dan <strong className="text-white">PIN</strong> yang Anda buat di bawah ini.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-950 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Buat Akun Kasir Baru</span>
          </button>
        </div>

        {/* List of Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accountsList.map((account) => {
            const isPinVisible = !!visiblePins[account.id];
            return (
              <div
                key={account.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                  account.isActive
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/50 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  {/* Header: Name, Active Status Toggle */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {account.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {account.roleTitle || 'Kasir Konter'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAccountActive(account)}
                      title={account.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                        account.isActive
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                      }`}
                    >
                      {account.isActive ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 text-rose-400" />
                          <span>Nonaktif</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Credentials Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] font-sans">Username:</span>
                      <span className="font-bold text-blue-400">@{account.username}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] font-sans">PIN Login:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300 tracking-wider">
                          {isPinVisible ? account.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(account.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN Kasir'}
                        >
                          {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-900 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(account)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
                    title="Salin kredensial untuk dikirim ke kasir"
                  >
                    <Copy className="w-3 h-3 text-blue-400" />
                    <span>Salin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(account)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-amber-400" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(account.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Hapus akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete Confirmation Inline */}
                {deletingId === account.id && (
                  <div className="p-2 rounded-xl bg-rose-950/90 border border-rose-800 text-[11px] text-rose-300 space-y-2 animate-fade-in">
                    <p className="font-semibold">Hapus akun login @{account.username}?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(account.id, account.username)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= KARTU 2: ATURAN HAK AKSES MENU & OTORITAS ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Aturan Hak Akses Halaman & Otoritas</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih menu yang diizinkan untuk kasir, atau gunakan preset cepat di sebelah kanan.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('standard')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Izinkan hanya transaksi harian, batasi data rahasia"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Standar Kasir Aman</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('trusted')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Izinkan transaksi harian + manajemen stok gudang"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kasir Terpercaya</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Buka seluruh hak akses"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Semua</span>
            </button>
          </div>
        </div>

        {/* Group 1: Transaksi Harian */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Menu Operasional & Transaksi Kasir
            </h4>
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
                        ? 'bg-blue-950/30 border-blue-600/50 hover:border-blue-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
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
                          <h5 className="text-xs font-bold text-white">{item.title}</h5>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isAllowed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                            }`}
                          >
                            {isAllowed ? 'Diizinkan' : 'Terkunci'}
                          </span>
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

        {/* Group 2: Data Rahasia Toko */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Laporan Keuangan & Data Sensitif Toko
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissionItems
              .filter((p) => p.category === 'rahasia')
              .map((item) => {
                const isAllowed = !!currentPerms[item.key];
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                      isAllowed
                        ? 'bg-rose-950/30 border-rose-600/50 hover:border-rose-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAllowed ? 'bg-rose-600/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{item.title}</h5>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isAllowed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                            }`}
                          >
                            {isAllowed ? 'Diizinkan' : 'Terkunci (Hanya Owner)'}
                          </span>
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
                );
              })}
          </div>
        </div>

        {/* Group 3: Otoritas Khusus */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Otoritas Hapus & Konfigurasi Toko
            </h4>
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
                          <h5 className="text-xs font-bold text-white">{item.title}</h5>
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

      {/* ================= MODAL TAMBAH AKUN KASIR BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-left">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Buat Data Login Kasir Baru</h3>
                <p className="text-xs text-slate-400">Kasir akan menggunakan username & PIN ini untuk login</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewAccount} className="space-y-3.5 text-xs">
              {addError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Nama Kasir / Staf:</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Contoh: Kasir 3 - Budi"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Username Login:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Contoh: kasir3"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Huruf kecil tanpa spasi. Digunakan kasir saat masuk ke aplikasi.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">PIN Login (4-6 Angka):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 0000"
                    maxLength={6}
                    minLength={4}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-white tracking-widest focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Jabatan / Shift:</label>
                  <input
                    type="text"
                    value={addRoleTitle}
                    onChange={(e) => setAddRoleTitle(e.target.value)}
                    placeholder="Cth: Shift Pagi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-md shadow-blue-950 cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT AKUN KASIR ================= */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-left">
            <button
              type="button"
              onClick={() => setEditingAccount(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Akun Login Kasir</h3>
                <p className="text-xs text-slate-400">Perbarui data login atau PIN kasir @{editingAccount.username}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditAccount} className="space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Nama Kasir / Staf:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Username Login:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">PIN Login (4-6 Angka):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    minLength={4}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Jabatan / Shift:</label>
                  <input
                    type="text"
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status Aktif Switch */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Status Akun Aktif</span>
                  <span className="text-[10px] text-slate-400">
                    Kasir hanya dapat login jika akun berstatus aktif.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-950 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
