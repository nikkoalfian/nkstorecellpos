import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatRupiah,
  formatDateIndo,
  generateInvoiceNo,
  generateSN,
  buildReceiptWhatsAppText,
  openWhatsAppReceipt,
} from '../../utils/formatters';
import { PaymentMethod, AccountBalance, Transaction } from '../../types';
import {
  Send,
  Building2,
  QrCode,
  Banknote,
  Server,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Calculator,
  History,
  Search,
  Filter,
  Printer,
  MessageCircle,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  User,
  Phone,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const PosTransfer: React.FC = () => {
  const { settings, accounts, transactions, addTransaction, deleteTransaction, setActiveReceipt } = useApp();

  // Ambil data akun Bank dan E-Wallet dari Buku Kas (murni Bank & E-Wallet saja, tanpa server)
  const bankAccounts = accounts.filter(
    (a) => a.type === 'bank' || a.type === 'ewallet'
  );

  const [sourceAccountId, setSourceAccountId] = useState<string>(() => {
    const firstBank = accounts.find((a) => a.type === 'bank' || a.type === 'ewallet');
    return firstBank?.id || '';
  });

  const selectedAcc = bankAccounts.find((a) => a.id === sourceAccountId) || bankAccounts[0];

  // Form State
  const [targetBank, setTargetBank] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [targetName, setTargetName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [adminFee, setAdminFee] = useState<number>(settings.defaultTransferAdminFee || 5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Riwayat State (Filter, Search, Pagination, Modals)
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSourceAcc, setFilterSourceAcc] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [deleteModalTrx, setDeleteModalTrx] = useState<Transaction | null>(null);
  const [waModalTrx, setWaModalTrx] = useState<Transaction | null>(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');

  const numNominal = typeof nominal === 'number' ? nominal : 0;
  const totalAmount = numNominal + adminFee;
  const profit = adminFee;
  const change = typeof cashGiven === 'number' ? Math.max(0, cashGiven - totalAmount) : 0;

  const popularBanks = ['BCA', 'BRI', 'Mandiri', 'BNI', 'DANA', 'GoPay', 'OVO', 'ShopeePay'];

  const getAccountIcon = (type: AccountBalance['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'server_pulsa':
        return <Server className="w-4 h-4" />;
      case 'bank':
        return <Building2 className="w-4 h-4" />;
      case 'ewallet':
        return <QrCode className="w-4 h-4" />;
    }
  };

  const handleQuickNominal = (amt: number) => {
    setNominal(amt);
    setCashGiven(amt + adminFee);
  };

  const handleReset = () => {
    setNominal('');
    setCashGiven('');
    setNotes('');
    setTargetBank('');
    setTargetNumber('');
    setTargetName('');
    setCustomerPhone('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numNominal || numNominal <= 0) return;

    const invoiceNo = generateInvoiceNo('TRF');
    const rrn = generateSN('transfer_uang');

    const destBankLabel = targetBank.trim() || selectedAcc?.name || 'Bank';
    const cleanTargetName = targetName.trim() ? targetName.trim().toUpperCase() : undefined;
    const cleanTargetNumber = targetNumber.trim() || customerPhone.trim() || '-';

    const transactionTitle = cleanTargetName
      ? `Transfer ke ${cleanTargetName} (${destBankLabel})`
      : `Transfer Uang via ${selectedAcc?.name || 'Bank'}`;

    addTransaction({
      invoiceNo,
      type: 'transfer_uang',
      title: transactionTitle,
      targetNumber: cleanTargetNumber,
      targetName: cleanTargetName,
      providerBank: destBankLabel,
      nominal: numNominal,
      adminFee,
      priceCost: numNominal,
      totalAmount,
      profit,
      paymentMethod,
      amountPaid: typeof cashGiven === 'number' ? cashGiven : totalAmount,
      changeAmount: change,
      sourceAccountId: selectedAcc?.id || sourceAccountId,
      serialNumber: rrn,
      status: 'sukses',
      notes: notes || undefined,
    });

    handleReset();
  };

  // Filtered Transfer Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions
      .filter((t) => t.type === 'transfer_uang')
      .filter((t) => {
        const time = new Date(t.timestamp).getTime();
        if (dateFilter === 'today') return time >= todayStart;
        if (dateFilter === 'yesterday') return time >= yesterdayStart && time < todayStart;
        if (dateFilter === 'week') return time >= weekStart;
        if (dateFilter === 'month') return time >= monthStart;
        return true;
      })
      .filter((t) => {
        if (filterSourceAcc === 'all') return true;
        return t.sourceAccountId === filterSourceAcc;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.invoiceNo.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          (t.targetNumber && t.targetNumber.toLowerCase().includes(q)) ||
          (t.targetName && t.targetName.toLowerCase().includes(q)) ||
          (t.providerBank && t.providerBank.toLowerCase().includes(q)) ||
          (t.serialNumber && t.serialNumber.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, dateFilter, filterSourceAcc, searchQuery]);

  // Aggregate Metrics for Filtered List
  const metrics = useMemo(() => {
    let totalNominal = 0;
    let totalAdminProfit = 0;
    let totalPaid = 0;

    filteredTransactions.forEach((t) => {
      totalNominal += t.nominal || 0;
      totalAdminProfit += t.profit || 0;
      totalPaid += t.totalAmount || 0;
    });

    return {
      count: filteredTransactions.length,
      totalNominal,
      totalAdminProfit,
      totalPaid,
    };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleOpenWaModal = (trx: Transaction) => {
    setWaModalTrx(trx);
    const phone =
      trx.targetNumber && trx.targetNumber !== '-' && /^[0-9+]+$/.test(trx.targetNumber)
        ? trx.targetNumber
        : '';
    setWaPhoneInput(phone);
  };

  const handleSendWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waModalTrx) return;
    const phone = waPhoneInput.trim();
    if (!phone) return;
    const text = buildReceiptWhatsAppText(waModalTrx, settings);
    openWhatsAppReceipt(phone, text);
    setWaModalTrx(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalTrx) return;
    deleteTransaction(deleteModalTrx.id);
    setDeleteModalTrx(null);
  };

  return (
    <div className="space-y-8">
      {/* TOP: FORM & CHECKOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Bank Selection & Transfer Details Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Banner Agen Keuangan */}
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Layanan Transfer Uang Semua Bank & E-Wallet</h2>
                <p className="text-xs text-slate-400">
                  Pencatatan cepat kasir: pilih akun sumber saldo, masukkan nominal transfer & biaya admin konter.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
              Mode Cepat (Fast POS)
            </span>
          </div>

          {/* Bank & E-Wallet Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 block">
                Pilih Bank / Dompet Digital (Sumber Saldo Kasir):
              </label>
              <span className="text-xs text-slate-400">
                Saldo otomatis terhubung dengan Buku Kas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {bankAccounts.map((acc) => {
                const isSelected = selectedAcc?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSourceAccountId(acc.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white font-bold shadow-lg shadow-blue-900/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div className="truncate text-xs flex-1 min-w-0">
                      <div className="font-semibold truncate">{acc.name}</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                        {formatRupiah(acc.balance)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional: Rekening & Penerima Tujuan Transfer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Tujuan Transfer & Data Pelanggan <span className="text-xs font-normal text-slate-400">(Opsional)</span>
            </h3>

            {/* Quick Bank Presets */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Bank / E-Wallet Tujuan:</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {popularBanks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setTargetBank(b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      targetBank === b
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Atau ketik nama Bank/E-Wallet tujuan (contoh: BCA, Seabank, ShopeePay)..."
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">No. Rekening / No. HP Tujuan:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890 / 08123456789"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Nama Penerima / Pemilik Rekening:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: BUDI SANTOSO"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nominal & Biaya Admin */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              Nominal Transfer & Biaya Admin
            </h3>

            {/* Quick Nominal Buttons */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Pilih Nominal Cepat:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[50000, 100000, 200000, 500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickNominal(amt)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold border transition text-center ${
                      nominal === amt
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Nominal & Admin Fee Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Nominal Transfer (Rp):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={nominal}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setNominal(val);
                      if (typeof val === 'number') {
                        setCashGiven(val + adminFee);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-lg font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  Biaya Admin Konter (Laba Anda):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={adminFee}
                    onChange={(e) => {
                      const fee = Number(e.target.value) || 0;
                      setAdminFee(fee);
                      if (typeof nominal === 'number') {
                        setCashGiven(nominal + fee);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-base font-bold text-emerald-400 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  {[3000, 5000, 7000, 10000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => {
                        setAdminFee(fee);
                        if (typeof nominal === 'number') setCashGiven(nominal + fee);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        adminFee === fee
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      Rp {fee / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catatan / Keterangan Transfer */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Catatan Transaksi (Opsional):</label>
              <input
                type="text"
                placeholder="Catatan / keterangan tambahan (opsional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settlement & Checkout */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Kalkulasi Biaya
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Calculation Breakdown Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sumber Saldo Konter:</span>
                  <span className="font-semibold text-white truncate max-w-[170px]">
                    {selectedAcc?.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sisa Saldo di Buku Kas:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatRupiah(selectedAcc?.balance || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Nominal Transfer:</span>
                  <span className="font-mono text-white font-bold">{formatRupiah(numNominal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Biaya Admin Konter:</span>
                  <span className="font-mono text-emerald-400 font-bold">+{formatRupiah(adminFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Total Bayar Pelanggan:</span>
                  <span className="text-base font-mono text-blue-400">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Warning if balance is insufficient */}
              {numNominal > 0 && (selectedAcc?.balance || 0) < numNominal && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    Saldo di <strong>{selectedAcc?.name}</strong> ({formatRupiah(selectedAcc?.balance || 0)}) tidak mencukupi untuk transfer {formatRupiah(numNominal)}.
                  </span>
                </div>
              )}

              {/* Payment Method From Customer */}
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  Pelanggan Bayar ke Konter Dengan:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'tunai'
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'qris'
                        ? 'bg-cyan-600 text-white border-cyan-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    📱 QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('kasbon')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'kasbon'
                        ? 'bg-amber-600 text-white border-amber-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-amber-400/80 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    ⏳ Kasbon
                  </button>
                </div>
              </div>

              {/* If Tunai: Cash Given & Change */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Uang Tunai Diterima:</span>
                    <button
                      type="button"
                      onClick={() => setCashGiven(totalAmount)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Uang Pas
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Rp</span>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Kembalian:</span>
                    <span className={`font-bold font-mono text-sm ${change > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatRupiah(change)}
                    </span>
                  </div>
                </div>
              )}

              {/* Profit Highlight */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-medium">Laba Konter Transaksi Ini:</span>
                <span className="font-bold text-emerald-400 text-sm">+{formatRupiah(profit)}</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!numNominal || numNominal <= 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                Proses Transfer & Cetak Struk
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RIWAYAT TRANSAKSI TRANSFER UANG */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Riwayat Transaksi Transfer Uang</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {filteredTransactions.length} Transaksi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar pengiriman uang kasir, cetak ulang struk nota, dan kirim bukti transfer via WhatsApp
              </p>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { key: 'today', label: 'Hari Ini' },
                { key: 'yesterday', label: 'Kemarin' },
                { key: 'week', label: '7 Hari' },
                { key: 'month', label: 'Bulan Ini' },
                { key: 'all', label: 'Semua' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setDateFilter(filter.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  dateFilter === filter.key
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Transaksi:</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-mono font-bold text-white">{metrics.count}</span>
              <span className="text-xs text-slate-400">kali</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Nominal Ditransfer:</span>
            <div className="text-lg font-mono font-bold text-blue-400 mt-1">
              {formatRupiah(metrics.totalNominal)}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Laba Admin Konter:</span>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
              +{formatRupiah(metrics.totalAdminProfit)}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Pembayaran Pelanggan:</span>
            <div className="text-lg font-mono font-bold text-white mt-1">
              {formatRupiah(metrics.totalPaid)}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Nota, Bank, Rekening, Nama Penerima, No Ref..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSourceAcc}
              onChange={(e) => {
                setFilterSourceAcc(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Akun Sumber Saldo</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
            <Send className="w-10 h-10 text-slate-600 mx-auto mb-2.5 opacity-60" />
            <h4 className="text-sm font-semibold text-slate-300">Belum Ada Riwayat Transaksi Transfer</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Transaksi transfer uang yang diproses kasir pada periode ini akan tersimpan otomatis dan tampil di tabel ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Nota & Waktu</th>
                  <th className="py-3 px-3.5">Sumber Saldo</th>
                  <th className="py-3 px-3.5">Tujuan & Penerima</th>
                  <th className="py-3 px-3.5 text-right">Nominal Transfer</th>
                  <th className="py-3 px-3.5 text-right">Admin Fee</th>
                  <th className="py-3 px-3.5 text-right">Total Bayar</th>
                  <th className="py-3 px-3.5 text-center">Metode</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {paginatedTransactions.map((trx) => {
                  const sourceAcc = accounts.find((a) => a.id === trx.sourceAccountId);
                  return (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                      {/* Nota & Waktu */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">{trx.invoiceNo}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateIndo(trx.timestamp)}
                        </div>
                      </td>

                      {/* Sumber Saldo */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: sourceAcc?.color || '#3b82f6' }}
                          />
                          <span className="font-medium text-slate-200 truncate max-w-[120px]">
                            {sourceAcc?.name || 'Bank'}
                          </span>
                        </div>
                      </td>

                      {/* Tujuan & Penerima */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {trx.targetName || trx.title.replace('Transfer Uang via ', '').replace('Transfer ke ', '')}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-blue-400 font-medium">{trx.providerBank}</span>
                          {trx.targetNumber && trx.targetNumber !== '-' && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{trx.targetNumber}</span>
                            </>
                          )}
                        </div>
                        {trx.serialNumber && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ref: {trx.serialNumber}
                          </div>
                        )}
                      </td>

                      {/* Nominal Transfer */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-white">
                        {formatRupiah(trx.nominal || 0)}
                      </td>

                      {/* Admin Fee (Profit) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold text-emerald-400">
                        +{formatRupiah(trx.adminFee || 0)}
                      </td>

                      {/* Total Bayar */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-blue-300">
                        {formatRupiah(trx.totalAmount)}
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            trx.paymentMethod === 'tunai'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : trx.paymentMethod === 'qris'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {trx.paymentMethod}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Struk */}
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(trx)}
                            title="Cetak / Lihat Struk"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleOpenWaModal(trx)}
                            title="Kirim Struk via WhatsApp"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => setDeleteModalTrx(trx)}
                            title="Hapus Transaksi"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Menampilkan {paginatedTransactions.length} dari {filteredTransactions.length} transaksi
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-300">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: KIRIM STRUK WHATSAPP */}
      {waModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Kirim Bukti Transfer WhatsApp</h4>
                  <p className="text-[11px] text-slate-400">{waModalTrx.invoiceNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalTrx(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendWa} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">
                  Nomor WhatsApp Pelanggan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={waPhoneInput}
                  onChange={(e) => setWaPhoneInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Nomor HP akan otomatis diformat dengan kode negara 62.
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Nominal Transfer:</span>
                  <strong className="text-white font-mono">{formatRupiah(waModalTrx.nominal || 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin:</span>
                  <strong className="text-emerald-400 font-mono">+{formatRupiah(waModalTrx.adminFee || 0)}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                  <span>Total Tagihan:</span>
                  <strong className="text-blue-400 font-mono">{formatRupiah(waModalTrx.totalAmount)}</strong>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWaModalTrx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Kirim ke WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS TRANSAKSI */}
      {deleteModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Hapus Transaksi Transfer?</h4>
                <p className="text-[11px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Nota:</span>
                <span className="font-mono font-bold text-white">{deleteModalTrx.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deskripsi:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]">{deleteModalTrx.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nominal Transfer:</span>
                <span className="font-mono font-bold text-white">{formatRupiah(deleteModalTrx.nominal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Laba Admin:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatRupiah(deleteModalTrx.profit || 0)}</span>
              </div>
            </div>

            <p className="text-xs text-rose-300/90 leading-relaxed">
              Transaksi akan dihapus dari riwayat transaksi. Pastikan transaksi ini memang batal atau terdapat kesalahan pencatatan.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalTrx(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
