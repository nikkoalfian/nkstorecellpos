import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountBalance } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Wallet,
  ArrowRightLeft,
  PlusCircle,
  MinusCircle,
  Building2,
  Server,
  Banknote,
  QrCode,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  Check,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CreditCard,
  Crown,
} from 'lucide-react';

const PRESET_COLORS = [
  '#0284C7', // Sky Blue (BRI)
  '#1D4ED8', // Deep Blue (BCA)
  '#D97706', // Amber (Mandiri)
  '#059669', // Emerald (BNI)
  '#0D9488', // Teal (BSI)
  '#EA580C', // Orange (SeaBank/Shopee)
  '#06B6D4', // Cyan (DANA)
  '#10B981', // Green (GoPay)
  '#8B5CF6', // Purple (OVO)
  '#E11D48', // Red (Digipos/CIMB)
  '#EAB308', // Yellow (Jago/Mobo)
  '#475569', // Slate
];

const BANK_PRESETS = [
  { name: 'Bank BRI (BRILink)', color: '#0284C7', desc: 'Rekening utama agen BRILink transfer & tarik tunai' },
  { name: 'Bank BCA Operasional', color: '#1D4ED8', desc: 'Rekening transfer bank swasta & tarik tunai kasir' },
  { name: 'Bank Mandiri Agen', color: '#D97706', desc: 'Rekening operasional Bank Mandiri' },
  { name: 'Bank BNI Konter', color: '#059669', desc: 'Rekening transaksi agen BNI' },
  { name: 'Bank Syariah Indonesia (BSI)', color: '#0D9488', desc: 'Rekening BSI syariah transfer pelanggan' },
  { name: 'SeaBank Indonesia', color: '#EA580C', desc: 'Rekening SeaBank transfer instan gratis biaya' },
  { name: 'Bank Jago Bisnis', color: '#EAB308', desc: 'Rekening Bank Jago konter' },
];

const EWALLET_PRESETS = [
  { name: 'DANA Bisnis & QRIS Kasir', color: '#06B6D4', desc: 'Penerimaan QRIS toko & saldo DANA agen' },
  { name: 'GoPay Merchant / Kasir', color: '#10B981', desc: 'Akun GoPay merchant & top up pelanggan' },
  { name: 'OVO Cash Merchant', color: '#8B5CF6', desc: 'Saldo OVO konter untuk top up & transfer' },
  { name: 'ShopeePay Merchant', color: '#EA580C', desc: 'Akun ShopeePay & QRIS merchant' },
  { name: 'LinkAja Konter', color: '#E11D48', desc: 'Saldo LinkAja BUMN konter' },
];

export const FinanceManager: React.FC = () => {
  const {
    accounts,
    updateAccountBalance,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    adjustCashMutation,
    viewMode,
    isOwnerUnlocked,
    requestOwnerPin,
  } = useApp();

  const [activeModal, setActiveModal] = useState<
    'transfer' | 'income_expense' | 'edit_balance' | 'add_account' | 'edit_account' | null
  >(null);
  const [selectedAcc, setSelectedAcc] = useState<AccountBalance | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'bank_ewallet' | 'server' | 'cash'>('all');

  // Transfer Form State
  const [transferFromId, setTransferFromId] = useState<string>(accounts[0]?.id || '');
  const [transferToId, setTransferToId] = useState<string>(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferNotes, setTransferNotes] = useState('');

  // Income / Expense Form State
  const [opType, setOpType] = useState<'masuk' | 'keluar'>('keluar');
  const [opAccountId, setOpAccountId] = useState<string>(accounts[0]?.id || '');
  const [opAmount, setOpAmount] = useState<number | ''>('');
  const [opCategory, setOpCategory] = useState<
    'Operasional' | 'Setor Kas' | 'Tarik Modal' | 'Top Up Server' | 'Koreksi Saldo' | 'Lainnya'
  >('Operasional');
  const [opNotes, setOpNotes] = useState('');

  // Direct Balance Edit Form
  const [newBalanceInput, setNewBalanceInput] = useState<number>(0);

  // Add / Edit Account Form State
  const [accForm, setAccForm] = useState<{
    id?: string;
    name: string;
    type: 'bank' | 'ewallet' | 'cash' | 'server_pulsa';
    accountNumber: string;
    balance: number;
    description: string;
    color: string;
  }>({
    name: '',
    type: 'bank',
    accountNumber: '',
    balance: 0,
    description: '',
    color: '#0284C7',
  });

  const totalLiquidAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountIcon = (type: AccountBalance['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'server_pulsa':
        return <Server className="w-5 h-5" />;
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'ewallet':
        return <QrCode className="w-5 h-5" />;
    }
  };

  const bankEwalletAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'ewallet');
  const serverAccounts = accounts.filter((a) => a.type === 'server_pulsa');
  const cashAccounts = accounts.filter((a) => a.type === 'cash');

  const filteredAccounts = accounts.filter((acc) => {
    if (filterType === 'all') return true;
    if (filterType === 'bank_ewallet') return acc.type === 'bank' || acc.type === 'ewallet';
    if (filterType === 'server') return acc.type === 'server_pulsa';
    if (filterType === 'cash') return acc.type === 'cash';
    return true;
  });

  const handleOpenTransfer = () => {
    setTransferFromId(accounts[0]?.id || '');
    setTransferToId(accounts[1]?.id || '');
    setTransferAmount('');
    setTransferNotes('Pindah saldo / Setoran kas');
    setActiveModal('transfer');
  };

  const handleOpenOp = (type: 'masuk' | 'keluar') => {
    setOpType(type);
    setOpAccountId(accounts[0]?.id || '');
    setOpAmount('');
    setOpCategory(type === 'keluar' ? 'Operasional' : 'Lainnya');
    setOpNotes(type === 'keluar' ? 'Biaya operasional toko' : 'Pendapatan non-transaksi');
    setActiveModal('income_expense');
  };

  const handleOpenEditBalance = (acc: AccountBalance) => {
    setSelectedAcc(acc);
    setNewBalanceInput(acc.balance);
    setActiveModal('edit_balance');
  };

  const handleOpenAddAccount = () => {
    const openAdd = () => {
      setAccForm({
        name: '',
        type: 'bank',
        accountNumber: '',
        balance: 0,
        description: '',
        color: '#0284C7',
      });
      setActiveModal('add_account');
    };

    // If not in owner mode and owner unlocked, prompt PIN for security
    if (viewMode !== 'owner' && !isOwnerUnlocked) {
      requestOwnerPin('Tambah Akun & Dompet Konter', openAdd, 'Masukkan PIN Pemilik untuk menambah akun bank atau dompet baru');
    } else {
      openAdd();
    }
  };

  const handleOpenEditAccount = (acc: AccountBalance) => {
    const openEdit = () => {
      setSelectedAcc(acc);
      setAccForm({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        accountNumber: acc.accountNumber || '',
        balance: acc.balance,
        description: acc.description || '',
        color: acc.color,
      });
      setActiveModal('edit_account');
    };

    if (viewMode !== 'owner' && !isOwnerUnlocked) {
      requestOwnerPin('Edit Detail Akun & Dompet', openEdit, 'Masukkan PIN Pemilik untuk mengubah detail akun');
    } else {
      openEdit();
    }
  };

  const [accountToDelete, setAccountToDelete] = useState<AccountBalance | null>(null);

  const handleDeleteAccount = (acc: AccountBalance) => {
    console.log('[FinanceManager] handleDeleteAccount invoked for account:', acc.id, acc.name);
    if (acc.id === 'acc-cash') {
      console.warn('[FinanceManager] Cannot delete primary cash drawer account: acc-cash');
      return;
    }

    const doDelete = () => {
      console.log('[FinanceManager] Setting accountToDelete state for:', acc.id, acc.name);
      setAccountToDelete(acc);
    };

    if (viewMode !== 'owner' && !isOwnerUnlocked) {
      console.log('[FinanceManager] Requesting owner PIN before opening delete dialog for account:', acc.name);
      requestOwnerPin('Hapus Akun Bank / Dompet', doDelete, 'Masukkan PIN Pemilik untuk menghapus akun');
    } else {
      doDelete();
    }
  };

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accForm.name.trim()) return;

    const newAccData: Omit<AccountBalance, 'id'> = {
      name: accForm.name.trim(),
      type: accForm.type,
      balance: Number(accForm.balance) || 0,
      color: accForm.color,
    };
    if (accForm.accountNumber.trim()) {
      newAccData.accountNumber = accForm.accountNumber.trim();
    }
    if (accForm.description.trim()) {
      newAccData.description = accForm.description.trim();
    }

    addAccount(newAccData);
    setActiveModal(null);
  };

  const handleSaveUpdatedAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc || !accForm.name.trim()) return;

    const updatedData: Partial<AccountBalance> = {
      name: accForm.name.trim(),
      type: accForm.type,
      color: accForm.color,
    };
    if (accForm.accountNumber.trim()) {
      updatedData.accountNumber = accForm.accountNumber.trim();
    }
    if (accForm.description.trim()) {
      updatedData.description = accForm.description.trim();
    }

    updateAccount(selectedAcc.id, updatedData);
    setActiveModal(null);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0 || transferFromId === transferToId) return;

    transferBetweenAccounts(transferFromId, transferToId, amt, transferNotes);
    setActiveModal(null);
  };

  const handleExecuteOp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(opAmount);
    if (!amt || amt <= 0) return;

    adjustCashMutation({
      type: opType,
      fromAccountId: opType === 'keluar' ? opAccountId : undefined,
      toAccountId: opType === 'masuk' ? opAccountId : undefined,
      amount: amt,
      category: opCategory,
      notes: opNotes,
    });
    setActiveModal(null);
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) return;
    updateAccountBalance(selectedAcc.id, newBalanceInput);
    setActiveModal(null);
  };

  const renderAccountCard = (acc: AccountBalance) => (
    <div
      key={acc.id}
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition space-y-4 shadow-lg group relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ backgroundColor: acc.color }}
      />

      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
              style={{ backgroundColor: acc.color }}
            >
              {getAccountIcon(acc.type)}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                {acc.name}
              </h4>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                {acc.type === 'cash'
                  ? 'Uang Tunai Fisik'
                  : acc.type === 'server_pulsa'
                  ? 'Server Pulsa / PPOB'
                  : acc.type === 'bank'
                  ? 'Rekening Bank'
                  : 'Dompet Digital / QRIS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditAccount(acc)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Ubah Nama & Detail Akun"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {acc.id !== 'acc-cash' && (
              <button
                type="button"
                onClick={() => {
                  console.log('[FinanceManager] Trash icon clicked for account:', acc.id, acc.name);
                  handleDeleteAccount(acc);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                title="Hapus Akun Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {acc.accountNumber && (
          <div className="text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 mb-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">No. Rek / Akun:</span>
            <strong className="text-slate-100 font-bold">{acc.accountNumber}</strong>
          </div>
        )}

        {acc.description && (
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{acc.description}</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Saldo Saat Ini:</span>
          <div className="text-xl font-black font-mono text-white tracking-tight">
            {formatRupiah(acc.balance)}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditBalance(acc)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            title="Sesuaikan Saldo Manual"
          >
            Edit Saldo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Aset Saldo Kas & Rekening */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold block">
              Total Modal Likuid Konter (Kas & Saldo)
            </span>
            {viewMode === 'owner' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> Mode Owner
              </span>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
            {formatRupiah(totalLiquidAssets)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total akumulasi uang kasir di laci fisik, saldo {accounts.filter(a => a.type === 'bank').length} bank, {accounts.filter(a => a.type === 'ewallet').length} dompet digital, dan 4 server pulsa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddAccount}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="w-4 h-4" />
            + Tambah Akun Bank / Dompet
          </button>
          <button
            type="button"
            onClick={handleOpenTransfer}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Pindah / Mutasi Saldo
          </button>
          <button
            type="button"
            onClick={() => handleOpenOp('keluar')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 border border-slate-700 hover:border-rose-700 font-semibold text-xs flex items-center gap-2 transition"
          >
            <MinusCircle className="w-4 h-4 text-rose-400" />
            Catat Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleOpenOp('masuk')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-900/50 text-emerald-300 border border-slate-700 hover:border-emerald-700 font-semibold text-xs flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Catat Kas Masuk
          </button>
        </div>
      </div>

      {/* Accounts List Grid Header & Filter */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Rincian Akun & Dompet Konter ({accounts.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Kategori terpisah: Rekening Bank & E-Wallet, Saldo 4 Server Pulsa, dan Kas Fisik Laci.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('bank_ewallet')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'bank_ewallet' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bank & E-Wallet ({bankEwalletAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('server')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'server' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Server Pulsa ({serverAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('cash')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'cash' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kas Laci ({cashAccounts.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              + Tambah Akun
            </button>
          </div>
        </div>

        {/* KATEGORI 1: REKENING BANK & DOMPET DIGITAL (Hanya ini yang muncul di menu Transfer Uang) */}
        {(filterType === 'all' || filterType === 'bank_ewallet') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Rekening Bank & Dompet Digital ({bankEwalletAccounts.length})
                </h4>
                <span className="text-[10px] text-sky-400/90 font-medium bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded-md">
                  Sumber Dana Menu Transfer Uang & Tarik Tunai
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddAccount}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Bank / E-Wallet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankEwalletAccounts.map(renderAccountCard)}
            </div>
          </div>
        )}

        {/* KATEGORI 2: SALDO SERVER PULSA & KUOTA PPOB */}
        {(filterType === 'all' || filterType === 'server') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Saldo 4 Server Pulsa & Kuota PPOB ({serverAccounts.length})
                </h4>
                <span className="text-[10px] text-purple-400/90 font-medium bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-md">
                  Chip Operator: Digipos, SiDompul, Mobo, Multi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serverAccounts.map(renderAccountCard)}
            </div>
          </div>
        )}

        {/* KATEGORI 3: KAS LACI KONTER (UANG FISIK) */}
        {(filterType === 'all' || filterType === 'cash') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Kas Laci Konter ({cashAccounts.length})
                </h4>
                <span className="text-[10px] text-emerald-400/90 font-medium bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                  Uang Fisik Kasir Konter
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cashAccounts.map(renderAccountCard)}
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Akun Baru */}
      {activeModal === 'add_account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Tambah Akun & Dompet Konter</h3>
                  <p className="text-[11px] text-slate-400">Tambahkan rekening bank atau e-wallet untuk operasional toko</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Tipe Akun */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Jenis Akun / Dompet:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccForm({ ...accForm, type: 'bank', color: '#0284C7' })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      accForm.type === 'bank'
                        ? 'bg-blue-950/80 border-blue-500 text-blue-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Rekening Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccForm({ ...accForm, type: 'ewallet', color: '#06B6D4' })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      accForm.type === 'ewallet'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Dompet / QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccForm({ ...accForm, type: 'cash', color: '#10B981' })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      accForm.type === 'cash'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Kas Fisik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccForm({ ...accForm, type: 'server_pulsa', color: '#E11D48' })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      accForm.type === 'server_pulsa'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Server className="w-4 h-4 text-rose-400" />
                    <span>Server Pulsa</span>
                  </button>
                </div>
              </div>

              {/* Template Cepat / Preset */}
              {accForm.type === 'bank' && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilihan Cepat Bank Populer:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BANK_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          setAccForm({
                            ...accForm,
                            name: p.name,
                            color: p.color,
                            description: p.desc,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200 font-medium transition"
                      >
                        {p.name.split(' ')[1] || p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {accForm.type === 'ewallet' && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilihan Cepat E-Wallet:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EWALLET_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          setAccForm({
                            ...accForm,
                            name: p.name,
                            color: p.color,
                            description: p.desc,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200 font-medium transition"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nama Akun */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nama Akun / Nama Bank / Nama Dompet:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bank Mandiri Agen, DANA Bisnis QRIS, Kas Cadangan"
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* No Rekening / No HP */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nomor Rekening / No. HP Akun / ID:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 137-00-19283-11 atau 0812-9876-5432"
                  value={accForm.accountNumber}
                  onChange={(e) => setAccForm({ ...accForm, accountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Saldo Awal */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Saldo Awal (Rp):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={accForm.balance || ''}
                  onChange={(e) => setAccForm({ ...accForm, balance: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Saldo yang sudah ada di rekening/dompet ini saat pertama kali didaftarkan.
                </span>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan / Deskripsi (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Rekening khusus transfer antar bank kasir"
                  value={accForm.description}
                  onChange={(e) => setAccForm({ ...accForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Pilihan Warna Badge */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Warna Tampilan Akun:</label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAccForm({ ...accForm, color: col })}
                      className={`w-7 h-7 rounded-xl transition flex items-center justify-center border-2 ${
                        accForm.color === col ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {accForm.color === col && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  <Check className="w-4 h-4" /> Simpan Akun Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Detail Akun */}
      {activeModal === 'edit_account' && selectedAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: accForm.color }}
                >
                  {getAccountIcon(accForm.type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Detail Akun & Dompet</h3>
                  <p className="text-[11px] text-slate-400">Perbarui nama, nomor rekening, atau identitas akun</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedAccount} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Jenis Akun */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Jenis Akun:</label>
                <select
                  value={accForm.type}
                  onChange={(e) => setAccForm({ ...accForm, type: e.target.value as AccountBalance['type'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="bank">Rekening Bank</option>
                  <option value="ewallet">Dompet Digital / QRIS</option>
                  <option value="cash">Kas Fisik</option>
                  <option value="server_pulsa">Server Pulsa / PPOB</option>
                </select>
              </div>

              {/* Nama Akun */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nama Akun / Bank:</label>
                <input
                  type="text"
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* No Rekening / No HP */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nomor Rekening / No. HP / ID:</label>
                <input
                  type="text"
                  value={accForm.accountNumber}
                  onChange={(e) => setAccForm({ ...accForm, accountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan / Deskripsi:</label>
                <input
                  type="text"
                  value={accForm.description}
                  onChange={(e) => setAccForm({ ...accForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Pilihan Warna Badge */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Warna Tampilan Akun:</label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAccForm({ ...accForm, color: col })}
                      className={`w-7 h-7 rounded-xl transition flex items-center justify-center border-2 ${
                        accForm.color === col ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {accForm.color === col && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mutasi / Transfer Saldo */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                Pindah / Mutasi Saldo
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Dari Akun (Sumber):</label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Ke Akun (Tujuan):</label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Jumlah Saldo Ditransfer (Rp):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Catatan Mutasi:</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Setoran uang tunai kasir ke rekening BRI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Proses Pindah Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran / Pemasukan Operasional */}
      {activeModal === 'income_expense' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {opType === 'keluar' ? (
                  <>
                    <MinusCircle className="w-4 h-4 text-rose-400" />
                    Catat Biaya / Pengeluaran Toko
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    Catat Uang Masuk / Tambah Modal
                  </>
                )}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteOp} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  {opType === 'keluar' ? 'Sumber Dana (Uang Berkurang Dari):' : 'Masuk Ke Akun / Saldo:'}
                </label>
                <select
                  value={opAccountId}
                  onChange={(e) => setOpAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={opAmount}
                  onChange={(e) => setOpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Kategori:</label>
                <select
                  value={opCategory}
                  onChange={(e) => setOpCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Operasional">Operasional Konter</option>
                  <option value="Setor Kas">Setor Kas ke Bank</option>
                  <option value="Tarik Modal">Tarik Modal / Prive</option>
                  <option value="Top Up Server">Top Up Saldo Server</option>
                  <option value="Koreksi Saldo">Koreksi Saldo</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Keterangan / Keperluan:</label>
                <input
                  type="text"
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  placeholder="Contoh: Beli bensin motor konter, beli kertas thermal, dll."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 ${
                    opType === 'keluar'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" /> Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Saldo Manual (Opname Saldo) */}
      {activeModal === 'edit_balance' && selectedAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                Penyesuaian Saldo Riil
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="p-5 space-y-4 text-xs">
              <div>
                <div className="text-slate-400 mb-1">Akun:</div>
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedAcc.color }}></span>
                  {selectedAcc.name}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Set Saldo Baru Real (Rp):</label>
                <input
                  type="number"
                  value={newBalanceInput}
                  onChange={(e) => setNewBalanceInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold font-mono text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gunakan ini saat melakukan opname kas fisik atau penyesuaian mutasi mutlak di rekening / server.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Update Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun Keuangan (In-App Reliable Dialog) */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Akun Keuangan?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Nama Akun:</span>
                <span className="font-bold text-white">{accountToDelete.name}</span>
              </div>
              {accountToDelete.accountNumber && (
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>No. Rekening / ID:</span>
                  <span className="font-mono text-slate-300">{accountToDelete.accountNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-850">
                <span className="text-slate-400">Saldo Tercatat:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(accountToDelete.balance)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun ini dari daftar buku kas & bank konter?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('[FinanceManager] Confirming deletion for account:', accountToDelete.id, accountToDelete.name);
                  deleteAccount(accountToDelete.id);
                  setAccountToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
