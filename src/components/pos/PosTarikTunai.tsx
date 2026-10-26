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
import { Transaction } from '../../types';
import {
  Banknote,
  QrCode,
  Building2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  AlertCircle,
  Copy,
  Check,
  History,
  Search,
  Filter,
  Printer,
  MessageCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  User,
  Wallet,
} from 'lucide-react';

export const PosTarikTunai: React.FC = () => {
  const { settings, accounts, transactions, addTransaction, deleteTransaction, setActiveReceipt, activeShift } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [adminFee, setAdminFee] = useState<number>(settings.defaultTarikTunaiAdminFee || 3000);
  // Pilihan perlakuan fee: 'tunai' (fee tunai terpisah) atau 'potong_tunai' (fee dipotong dari nominal transfer)
  const [feeMode, setFeeMode] = useState<'tunai' | 'potong_tunai'>('tunai');
  const [targetAccountId, setTargetAccountId] = useState<string>(() => {
    const bank = accounts.find((a) => a.type === 'bank' || a.type === 'ewallet');
    return bank?.id || accounts[0]?.id || '';
  });
  const [notes, setNotes] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Riwayat State
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState<'all' | 'tunai' | 'potong_tunai'>('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [deleteModalTrx, setDeleteModalTrx] = useState<Transaction | null>(null);
  const [waModalTrx, setWaModalTrx] = useState<Transaction | null>(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');

  const numNominal = typeof nominal === 'number' ? nominal : 0;
  const numAdminFee = typeof adminFee === 'number' ? adminFee : 0;
  const profit = numAdminFee;

  // Akun kas laci & akun bank tujuan transfer
  const cashDrawer = accounts.find((a) => a.type === 'cash' || a.id === 'acc-cash') || accounts[0];
  const selectedDepositAcc = accounts.find((a) => a.id === targetAccountId) || accounts.find((a) => a.type === 'bank') || accounts[0];
  const bankAndWallets = accounts.filter((a) => a.type === 'bank' || a.type === 'ewallet');

  // 1. Pelanggan transfer nominal penarikan ke rekening bank konter (misal: Rp 100.000)
  const totalTransferredByCustomer = numNominal;

  // 2. Kasir menyerahkan uang tunai dari kas laci ke pelanggan:
  // - Jika potong fee: serahkan Rp 97.000 (100.000 - 3.000)
  // - Jika fee tunai terpisah: serahkan Rp 100.000
  const cashGivenToCustomer = feeMode === 'potong_tunai'
    ? Math.max(0, numNominal - numAdminFee)
    : numNominal;

  // 3. Kasir menerima fee tunai masuk ke laci:
  // - Jika fee tunai: terima Rp 3.000 masuk laci
  // - Jika potong fee: Rp 0 (karena fee sudah langsung tersimpan di rekening bank konter)
  const cashFeeReceived = feeMode === 'tunai' ? numAdminFee : 0;

  // 4. Saldo kas laci saat ini & setelah transaksi:
  // Keduanya menghasilkan net kas laci keluar Rp 97.000 (1.000.000 -> 903.000)
  const currentCashDrawerBalance = cashDrawer?.balance || 0;
  const afterCashDrawerBalance = currentCashDrawerBalance - cashGivenToCustomer + cashFeeReceived;

  // Validasi kecukupan uang kas di laci
  const hasEnoughCash = currentCashDrawerBalance >= cashGivenToCustomer;

  const handleQuickNominal = (amt: number) => {
    setNominal(amt);
  };

  const handleCopyAccountNumber = () => {
    if (selectedDepositAcc?.accountNumber) {
      navigator.clipboard.writeText(selectedDepositAcc.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleReset = () => {
    setCustomerName('');
    setCustomerPhone('');
    setNominal('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numNominal || numNominal <= 0) return;

    const invoiceNo = generateInvoiceNo('TRK');
    const rrn = generateSN('tarik_tunai');

    const defaultNote =
      feeMode === 'potong_tunai'
        ? `Tarik tunai ${formatRupiah(numNominal)} via ${selectedDepositAcc?.name}: transfer ${formatRupiah(numNominal)}, laci keluar ${formatRupiah(cashGivenToCustomer)} (potong fee ${formatRupiah(numAdminFee)} di rekening bank)`
        : `Tarik tunai ${formatRupiah(numNominal)} via ${selectedDepositAcc?.name}: transfer ${formatRupiah(numNominal)}, laci keluar ${formatRupiah(numNominal)}, terima fee tunai ${formatRupiah(numAdminFee)}`;

    addTransaction({
      invoiceNo,
      type: 'tarik_tunai',
      title: `Tarik Tunai Kasir (${selectedDepositAcc?.name || 'Bank'})`,
      targetNumber: customerPhone || undefined,
      targetName: customerName ? customerName.toUpperCase() : undefined,
      providerBank: selectedDepositAcc?.name || 'Bank Rekening',
      nominal: numNominal,
      adminFee: numAdminFee,
      priceCost: numNominal,
      totalAmount: totalTransferredByCustomer,
      profit,
      paymentMethod: selectedDepositAcc?.type === 'ewallet' ? 'qris' : 'transfer_bank',
      feePaymentMethod: feeMode,
      amountPaid: totalTransferredByCustomer,
      changeAmount: 0,
      sourceAccountId: selectedDepositAcc?.id || targetAccountId,
      serialNumber: rrn,
      status: 'sukses',
      notes: notes || defaultNote,
    });

    handleReset();
  };

  // Filtered Tarik Tunai Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions
      .filter((t) => t.type === 'tarik_tunai')
      .filter((t) => {
        const time = new Date(t.timestamp).getTime();
        if (dateFilter === 'today') return time >= todayStart;
        if (dateFilter === 'yesterday') return time >= yesterdayStart && time < todayStart;
        if (dateFilter === 'week') return time >= weekStart;
        if (dateFilter === 'month') return time >= monthStart;
        return true;
      })
      .filter((t) => {
        if (feeFilter === 'all') return true;
        return (t.feePaymentMethod || 'tunai') === feeFilter;
      })
      .filter((t) => {
        if (bankFilter === 'all') return true;
        return t.sourceAccountId === bankFilter;
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
  }, [transactions, dateFilter, feeFilter, bankFilter, searchQuery]);

  // Aggregate Metrics for Tarik Tunai
  const metrics = useMemo(() => {
    let totalNominal = 0;
    let totalCashOut = 0;
    let totalProfit = 0;

    filteredTransactions.forEach((t) => {
      const nom = t.nominal || 0;
      const fee = t.adminFee || 0;
      totalNominal += nom;
      totalProfit += t.profit || fee;

      if (t.feePaymentMethod === 'potong_tunai') {
        totalCashOut += Math.max(0, nom - fee);
      } else {
        totalCashOut += nom;
      }
    });

    return {
      count: filteredTransactions.length,
      totalNominal,
      totalCashOut,
      totalProfit,
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
        {/* LEFT COLUMN: Tarik Tunai Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Banner Layanan Tarik Tunai */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">
                  Layanan Tarik Tunai Kasir
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pelanggan transfer nominal ke rekening konter, kasir serahkan uang fisik dari kas laci
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Kas Laci:</span>
                <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(currentCashDrawerBalance)}</strong>
              </div>
              {selectedDepositAcc && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] truncate max-w-[110px]">{selectedDepositAcc.name}:</span>
                  <strong className="text-blue-400 font-mono font-bold">{formatRupiah(selectedDepositAcc.balance)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Form Details */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Rincian Penarikan Uang Tunai
              </h3>
              {activeShift && (
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-semibold">
                  ✓ Shift Aktif: #{activeShift.shiftNumber} ({activeShift.cashierName})
                </span>
              )}
            </div>

            {/* Warning if cash drawer is low */}
            {!hasEnoughCash && numNominal > 0 && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Perhatian: Uang fisik di kas laci ({formatRupiah(currentCashDrawerBalance)}) kurang dari jumlah penarikan ({formatRupiah(cashGivenToCustomer)}).
                </span>
              </div>
            )}

            {/* Quick Nominals */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Pilih Nominal Tarik Tunai Cepat:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[50000, 100000, 200000, 300000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickNominal(amt)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition text-center ${
                      nominal === amt
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Nominal & Admin Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Jumlah Uang Tunai Yang Ditarik (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono font-bold">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">
                    Biaya Admin Konter (Fee):
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    +{formatRupiah(numAdminFee)} (Laba Konter)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono font-bold">Rp</span>
                  <input
                    type="number"
                    value={adminFee}
                    onChange={(e) => setAdminFee(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[2000, 3000, 5000, 7000, 10000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setAdminFee(fee)}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-mono font-semibold transition ${
                        adminFee === fee
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Rp {fee / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PERLAKUAN BIAYA ADMIN (FEE) - RAPI & SEDERHANA */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-300 block font-semibold">
                Perlakuan Biaya Admin (Fee):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeeMode('tunai')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    feeMode === 'tunai'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      💵 Fee Bayar Tunai Terpisah
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kasir serahkan {formatRupiah(numNominal || 100000)} & terima fee {formatRupiah(numAdminFee)} tunai
                    </div>
                  </div>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                    feeMode === 'tunai' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-700'
                  }`}>
                    {feeMode === 'tunai' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeMode('potong_tunai')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    feeMode === 'potong_tunai'
                      ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/40'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      ✂️ Potong Fee dari Nominal
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kasir serahkan {formatRupiah(Math.max(0, (numNominal || 100000) - numAdminFee))} bersih (fee masuk di rekening)
                    </div>
                  </div>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                    feeMode === 'potong_tunai' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-700'
                  }`}>
                    {feeMode === 'potong_tunai' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Pelanggan mentransfer ke Rekening / QRIS Konter mana */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-300 block font-semibold">
                Pelanggan Mentransfer Saldo ke Rekening / QRIS Konter Mana:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bankAndWallets.map((acc) => {
                  const isSelected = targetAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setTargetAccountId(acc.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
                          style={{ backgroundColor: acc.color }}
                        >
                          {acc.type === 'ewallet' ? <QrCode className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{acc.name}</div>
                          {acc.accountNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">Saldo Bank:</span>
                        <span className="text-xs font-bold font-mono text-white">{formatRupiah(acc.balance)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Nama Pelanggan (Opsional):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Nama pelanggan (misal: Budi / Siti)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs uppercase text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">No. WhatsApp Pelanggan (Kirim Struk):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    placeholder="Nomor WhatsApp (08...)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">Catatan Transaksi (Opsional):</label>
              <input
                type="text"
                placeholder="Catatan penarikan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Direct Cashier Action */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Instruksi Kasir
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Action Checklist */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5 text-xs">
                {/* Step 1: Minta Pelanggan Transfer */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                    1. Minta Pelanggan Transfer ke Bank:
                  </span>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-1">
                    <div className="text-[11px] text-slate-400">Total Nominal Ditransfer:</div>
                    <div className="text-2xl font-mono font-extrabold text-blue-400">
                      {formatRupiah(totalTransferredByCustomer)}
                    </div>
                    <div className="text-xs text-slate-300 pt-1">
                      ke: <strong className="text-white">{selectedDepositAcc?.name}</strong>
                    </div>
                    {selectedDepositAcc?.accountNumber && (
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <span className="text-xs text-emerald-400 font-mono font-bold">
                          {selectedDepositAcc.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAccountNumber}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Salin No Rekening"
                        >
                          {copiedAccount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 (Sesuai pilihan Fee: Tunai atau Potong Transfer) */}
                {feeMode === 'tunai' ? (
                  <>
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                        2. Terima Fee Admin Tunai:
                      </span>
                      <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-800/40 flex justify-between items-center">
                        <span className="text-amber-300 font-semibold">Uang Fee Tunai:</span>
                        <span className="text-base font-mono font-extrabold text-amber-300">
                          +{formatRupiah(numAdminFee)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        *Masukkan uang fee Rp {formatRupiah(numAdminFee)} langsung ke kas laci.
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                        3. Kasir Serahkan Uang Tunai:
                      </span>
                      <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/50 flex justify-between items-center">
                        <span className="text-emerald-300 font-semibold">Uang Fisik Kas Laci:</span>
                        <span className="text-xl font-mono font-extrabold text-white">
                          {formatRupiah(cashGivenToCustomer)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Jika Potong Fee dari Nominal Transfer (Kasir hanya serahkan uang bersih) */
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      2. Kasir Serahkan Uang Tunai Bersih:
                    </span>
                    <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/50 flex justify-between items-center">
                      <div>
                        <span className="text-emerald-300 font-semibold block">Uang Fisik Kas Laci:</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Dipotong Fee {formatRupiah(numAdminFee)})
                        </span>
                      </div>
                      <span className="text-xl font-mono font-extrabold text-white">
                        {formatRupiah(cashGivenToCustomer)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300 leading-snug">
                      ✓ Fee <strong>+{formatRupiah(numAdminFee)}</strong> langsung masuk di rekening {selectedDepositAcc?.name} & tercatat di laba bersih. Kas laci hanya berkurang <strong>{formatRupiah(cashGivenToCustomer)}</strong>.
                    </div>
                  </div>
                )}

                {/* Sisa Saldo Kas Laci */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>Keuntungan / Laba Fee:</span>
                    <span className="text-emerald-400 font-bold font-mono">+{formatRupiah(profit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sisa Saldo Kas Laci:</span>
                    <span className={`font-mono font-bold ${afterCashDrawerBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                      {formatRupiah(afterCashDrawerBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit Highlight */}
              <div className="p-3.5 bg-emerald-950/50 border border-emerald-600/50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">Laba Bersih Transaksi:</span>
                <span className="font-extrabold font-mono text-emerald-400 text-base">+{formatRupiah(profit)}</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!numNominal || numNominal <= 0}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <ShieldCheck className="w-5 h-5" />
                Selesai Tarik Tunai & Cetak Struk
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RIWAYAT TRANSAKSI TARIK TUNAI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Riwayat Transaksi Tarik Tunai</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {filteredTransactions.length} Penarikan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar transaksi penarikan uang kasir, rincian potongan fee kas laci, dan kirim bukti via WhatsApp
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
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
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
            <span className="text-[11px] font-medium text-slate-400 block">Total Penarikan:</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-mono font-bold text-white">{metrics.count}</span>
              <span className="text-xs text-slate-400">transaksi</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Nominal Penarikan:</span>
            <div className="text-lg font-mono font-bold text-blue-400 mt-1">
              {formatRupiah(metrics.totalNominal)}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Uang Kas Laci Keluar:</span>
            <div className="text-lg font-mono font-bold text-rose-400 mt-1">
              {formatRupiah(metrics.totalCashOut)}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">Total Laba Fee Konter:</span>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
              +{formatRupiah(metrics.totalProfit)}
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Nota, Nama Pelanggan, No WhatsApp, Bank, No Ref..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {/* Filter Mode Fee */}
            <select
              value={feeFilter}
              onChange={(e) => {
                setFeeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Tipe Fee</option>
              <option value="tunai">💵 Fee Tunai Terpisah</option>
              <option value="potong_tunai">✂️ Potong Fee dari Nominal</option>
            </select>

            {/* Filter Bank Rekening Tujuan */}
            <select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Rekening Konter</option>
              {bankAndWallets.map((acc) => (
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
            <Banknote className="w-10 h-10 text-slate-600 mx-auto mb-2.5 opacity-60" />
            <h4 className="text-sm font-semibold text-slate-300">Belum Ada Riwayat Tarik Tunai</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Transaksi penarikan tunai yang diproses kasir pada periode ini akan tersimpan otomatis dan tampil di tabel ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Nota & Waktu</th>
                  <th className="py-3 px-3.5">Pelanggan</th>
                  <th className="py-3 px-3.5">Rekening Konter</th>
                  <th className="py-3 px-3.5 text-right">Nominal Tarik</th>
                  <th className="py-3 px-3.5 text-right">Biaya Admin (Fee)</th>
                  <th className="py-3 px-3.5 text-center">Perlakuan Fee</th>
                  <th className="py-3 px-3.5 text-right">Kas Laci Keluar</th>
                  <th className="py-3 px-3.5 text-right">Laba Bersih</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {paginatedTransactions.map((trx) => {
                  const depositAcc = accounts.find((a) => a.id === trx.sourceAccountId);
                  const isPotongFee = trx.feePaymentMethod === 'potong_tunai';
                  const cashOut = isPotongFee
                    ? Math.max(0, (trx.nominal || 0) - (trx.adminFee || 0))
                    : trx.nominal || 0;

                  return (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                      {/* Nota & Waktu */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">{trx.invoiceNo}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateIndo(trx.timestamp)}
                        </div>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white truncate max-w-[150px]">
                          {trx.targetName || 'Pelanggan Umum'}
                        </div>
                        {trx.targetNumber && trx.targetNumber !== '-' && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{trx.targetNumber}</span>
                          </div>
                        )}
                        {trx.serialNumber && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ref: {trx.serialNumber}
                          </div>
                        )}
                      </td>

                      {/* Rekening Konter */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: depositAcc?.color || '#10b981' }}
                          />
                          <span className="font-medium text-slate-200 truncate max-w-[120px]">
                            {depositAcc?.name || trx.providerBank || 'Bank'}
                          </span>
                        </div>
                      </td>

                      {/* Nominal Tarik */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-white">
                        {formatRupiah(trx.nominal || 0)}
                      </td>

                      {/* Fee Admin */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold text-amber-400">
                        +{formatRupiah(trx.adminFee || 0)}
                      </td>

                      {/* Perlakuan Fee */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isPotongFee ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            ✂️ Potong Nominal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            💵 Fee Tunai
                          </span>
                        )}
                      </td>

                      {/* Kas Laci Keluar */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-200">
                        {formatRupiah(cashOut)}
                      </td>

                      {/* Laba Bersih */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-emerald-400">
                        +{formatRupiah(trx.profit || trx.adminFee || 0)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Struk */}
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(trx)}
                            title="Cetak / Lihat Struk"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
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
                  <h4 className="font-bold text-white text-sm">Kirim Bukti Tarik Tunai WhatsApp</h4>
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
                  Nomor HP akan otomatis diformat dengan tautan resmi wa.me.
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Nominal Penarikan:</span>
                  <strong className="text-white font-mono">{formatRupiah(waModalTrx.nominal || 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin Konter:</span>
                  <strong className="text-amber-400 font-mono">+{formatRupiah(waModalTrx.adminFee || 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Perlakuan Fee:</span>
                  <strong className="text-slate-200">
                    {waModalTrx.feePaymentMethod === 'potong_tunai' ? 'Potong dari Nominal' : 'Fee Tunai Terpisah'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                  <span>Total Ditransfer Pelanggan:</span>
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
                <h4 className="font-bold text-white text-sm">Hapus Transaksi Tarik Tunai?</h4>
                <p className="text-[11px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Nota:</span>
                <span className="font-mono font-bold text-white">{deleteModalTrx.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pelanggan:</span>
                <span className="font-medium text-slate-200">{deleteModalTrx.targetName || 'Pelanggan Umum'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nominal Tarik:</span>
                <span className="font-mono font-bold text-white">{formatRupiah(deleteModalTrx.nominal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee Admin:</span>
                <span className="font-mono font-bold text-amber-400">+{formatRupiah(deleteModalTrx.adminFee || 0)}</span>
              </div>
            </div>

            <p className="text-xs text-rose-300/90 leading-relaxed">
              Transaksi akan dihapus dari riwayat transaksi. Pastikan transaksi ini memang batal atau terdapat kesalahan pencatatan oleh kasir.
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
