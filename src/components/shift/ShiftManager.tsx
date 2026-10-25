import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftRecord, ServerShiftItem } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  Clock,
  User,
  Server,
  DollarSign,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Banknote,
  Eye,
  Trash2,
  Calendar,
  ShoppingBag,
  Sliders,
  Check,
  X,
  Calculator,
  RefreshCw,
} from 'lucide-react';

export const ShiftManager: React.FC = () => {
  const {
    shifts,
    activeShift,
    openShift,
    updateActiveShiftServer,
    addShiftTopUp,
    addShiftExpense,
    closeShift,
    deleteShift,
    setActiveShiftReceipt,
    settings,
    hasPermission,
    requestOwnerPin,
    isOwnerUnlocked,
    accounts,
  } = useApp();

  // Helper to fetch live account balance from Buku Kas & Bank
  const getServerAccountBalance = (serverIdx: number): number => {
    const specific = accounts.find((a) => a.id === `acc-server-${serverIdx + 1}`);
    if (specific) return specific.balance;
    const serverAccs = accounts.filter((a) => a.type === 'server_pulsa');
    return serverAccs[serverIdx]?.balance ?? 0;
  };

  const getCashDrawerBalance = (): number => {
    const cashAcc = accounts.find((a) => a.type === 'cash' || a.id === 'acc-cash');
    return cashAcc?.balance ?? 0;
  };

  // Buka Shift Form State (Auto-synced with Buku Kas & Bank)
  const [showBukaShiftModal, setShowBukaShiftModal] = useState(false);
  const [bukaCashierName, setBukaCashierName] = useState(settings.ownerName || 'Nikko (Kasir Shift)');
  const [bukaCashDrawer, setBukaCashDrawer] = useState<number | ''>(() => getCashDrawerBalance());
  const [bukaServer1, setBukaServer1] = useState<number | ''>(() => getServerAccountBalance(0));
  const [bukaServer2, setBukaServer2] = useState<number | ''>(() => getServerAccountBalance(1));
  const [bukaServer3, setBukaServer3] = useState<number | ''>(() => getServerAccountBalance(2));
  const [bukaServer4, setBukaServer4] = useState<number | ''>(() => getServerAccountBalance(3));
  const [hasManuallyEditedBuka, setHasManuallyEditedBuka] = useState(false);

  // Sync state from Buku Kas & Bank into Buka Shift form
  const syncBukaShiftFromBukuKas = () => {
    setBukaServer1(getServerAccountBalance(0));
    setBukaServer2(getServerAccountBalance(1));
    setBukaServer3(getServerAccountBalance(2));
    setBukaServer4(getServerAccountBalance(3));
    setBukaCashDrawer(getCashDrawerBalance());
    setHasManuallyEditedBuka(false);
    setSimToast('✅ Saldo Awal berhasil disinkronkan dengan data Saldo 4 Server Pulsa & Kuota PPOB dari Buku Kas!');
    setTimeout(() => setSimToast(null), 3000);
  };

  // Auto-sync from Buku Kas & Bank when accounts change and no active shift is running
  useEffect(() => {
    if (!activeShift && !hasManuallyEditedBuka && accounts.length > 0) {
      setBukaServer1(getServerAccountBalance(0));
      setBukaServer2(getServerAccountBalance(1));
      setBukaServer3(getServerAccountBalance(2));
      setBukaServer4(getServerAccountBalance(3));
      setBukaCashDrawer(getCashDrawerBalance());
    }
  }, [accounts, activeShift, hasManuallyEditedBuka]);

  const handleOpenBukaShiftModal = () => {
    syncBukaShiftFromBukuKas();
    setShowBukaShiftModal(true);
  };

  // Simulation Feedback Toast
  const [simToast, setSimToast] = useState<string | null>(null);

  // Top Up & Expense Modals
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedTopUpServerId, setSelectedTopUpServerId] = useState('server-1');
  const [topUpAmount, setTopUpAmount] = useState<number | ''>('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNote, setExpenseNote] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState<ShiftRecord | null>(null);

  // KALKULATOR REKAP SERVER
  const [simServerIdx, setSimServerIdx] = useState(0); // 0: Digipos, 1: SiDompul, 2: Mobo, 3: Multi
  const [simTotalSaldo, setSimTotalSaldo] = useState<number | ''>(282854);
  const [simSaldoAkhir, setSimSaldoAkhir] = useState<number | ''>(132748);
  const [simPenjualan, setSimPenjualan] = useState<number | ''>(186000);

  // Tutup Shift Form State
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  // Total Saldo Modal 4 Server
  const [modalTotalSaldos, setModalTotalSaldos] = useState<[number | '', number | '', number | '', number | '']>([
    282854,
    1000000,
    900000,
    1800000,
  ]);

  // Saldo Akhir 4 Server
  const [finalBalances, setFinalBalances] = useState<[number | '', number | '', number | '', number | '']>([
    132748,
    760000,
    720000,
    1450000,
  ]);

  // Penjualan 4 Server
  const [serverGrossSales, setServerGrossSales] = useState<[number | '', number | '', number | '', number | '']>([
    186000,
    270000,
    200000,
    395000,
  ]);

  // Uang Fisik Kasir di Laci (Cash Opname)
  const [actualCashDrawer, setActualCashDrawer] = useState<number | ''>('');
  const [closeNotes, setCloseNotes] = useState('');

  // Preset Saldo Awal Helper
  const handleApplyPreset = (type: 'buku_kas' | 'digipos' | 'standar' | 'besar' | 'kosong') => {
    if (type === 'buku_kas') {
      syncBukaShiftFromBukuKas();
      return;
    }
    setHasManuallyEditedBuka(true);
    if (type === 'digipos') {
      setBukaCashDrawer(500000);
      setBukaServer1(282854);
      setBukaServer2(1000000);
      setBukaServer3(800000);
      setBukaServer4(1800000);
    } else if (type === 'standar') {
      setBukaCashDrawer(1000000);
      setBukaServer1(2000000);
      setBukaServer2(1500000);
      setBukaServer3(1000000);
      setBukaServer4(2500000);
    } else if (type === 'besar') {
      setBukaCashDrawer(2500000);
      setBukaServer1(5000000);
      setBukaServer2(3500000);
      setBukaServer3(2000000);
      setBukaServer4(6000000);
    } else {
      setBukaCashDrawer('');
      setBukaServer1('');
      setBukaServer2('');
      setBukaServer3('');
      setBukaServer4('');
    }
  };

  const totalBukaServers =
    (Number(bukaServer1) || 0) +
    (Number(bukaServer2) || 0) +
    (Number(bukaServer3) || 0) +
    (Number(bukaServer4) || 0);

  // Perhitungan Rekap Saldo & Laba Server
  const simNumTotal = typeof simTotalSaldo === 'number' ? simTotalSaldo : 0;
  const simNumAkhir = typeof simSaldoAkhir === 'number' ? simSaldoAkhir : 0;
  const simNumSales = typeof simPenjualan === 'number' ? simPenjualan : 0;
  // RUMUS OPERASIONAL KONTER: (Penjualan + Saldo Akhir) - Total Saldo = Laba Bersih
  const simProfit = (simNumSales + simNumAkhir) - simNumTotal;
  const simUsage = Math.max(0, simNumTotal - simNumAkhir);

  // Pre-fill Close Shift when modal opens
  const handleOpenCloseModal = () => {
    if (!activeShift) return;

    // Ambil saldo berjalan dari shift aktif
    const s1Total = activeShift.servers[0]?.initialBalance + (activeShift.servers[0]?.topUpAmount || 0);
    const s2Total = activeShift.servers[1]?.initialBalance + (activeShift.servers[1]?.topUpAmount || 0);
    const s3Total = activeShift.servers[2]?.initialBalance + (activeShift.servers[2]?.topUpAmount || 0);
    const s4Total = activeShift.servers[3]?.initialBalance + (activeShift.servers[3]?.topUpAmount || 0);

    setModalTotalSaldos([s1Total, s2Total, s3Total, s4Total]);

    // Ambil saldo terkini dari Buku Kas & Bank sebagai nilai acuan awal
    const curS1 = getServerAccountBalance(0);
    const curS2 = getServerAccountBalance(1);
    const curS3 = getServerAccountBalance(2);
    const curS4 = getServerAccountBalance(3);

    setFinalBalances([
      curS1 > 0 ? curS1 : (s1Total > 150000 ? s1Total - 150000 : 132748),
      curS2 > 0 ? curS2 : (s2Total > 240000 ? s2Total - 240000 : 760000),
      curS3 > 0 ? curS3 : (s3Total > 180000 ? s3Total - 180000 : 720000),
      curS4 > 0 ? curS4 : (s4Total > 350000 ? s4Total - 350000 : 1450000),
    ]);

    setServerGrossSales([
      activeShift.servers[0]?.grossSales || 186000,
      activeShift.servers[1]?.grossSales || 270000,
      activeShift.servers[2]?.grossSales || 200000,
      activeShift.servers[3]?.grossSales || 395000,
    ]);

    const currentCash = getCashDrawerBalance();
    setActualCashDrawer(currentCash > 0 ? currentCash : activeShift.initialCashDrawer);
    setCloseNotes('');
    setShowCloseShiftModal(true);
  };





  // Calculations for Tutup Shift strictly based on user's formula:
  // Laba Bersih = (Penjualan + Saldo Akhir) - Total Saldo
  const computedShiftRecap = useMemo(() => {
    if (!activeShift) return null;

    let totalUsage = 0;
    let totalSales = 0;
    let totalPulseProfit = 0;

    const serverStats = activeShift.servers.map((srv, idx) => {
      // Total Saldo Modal (Saldo Awal + Top Up)
      const totalAvailable = typeof modalTotalSaldos[idx] === 'number'
        ? Number(modalTotalSaldos[idx])
        : (srv.initialBalance + (srv.topUpAmount || 0));

      const finalBal = typeof finalBalances[idx] === 'number' ? Number(finalBalances[idx]) : 0;
      const usage = Math.max(0, totalAvailable - finalBal);

      const sales = typeof serverGrossSales[idx] === 'number' ? Number(serverGrossSales[idx]) : 0;

      // RUMUS OPERASIONAL KONTER:
      // (Penjualan + Saldo Akhir) - Total Saldo = Laba Bersih
      const profit = (sales + finalBal) - totalAvailable;

      totalUsage += usage;
      totalSales += sales;
      totalPulseProfit += profit;

      return {
        ...srv,
        finalBal,
        totalAvailable,
        usage,
        sales,
        profit,
      };
    });

    const totalExp = activeShift.expenses.reduce((sum, e) => sum + e.amount, 0);
    const overallNetProfit =
      totalPulseProfit +
      activeShift.accessoryProfit +
      activeShift.transferAdminProfit +
      activeShift.tarikTunaiAdminProfit -
      totalExp;

    const expectedCashDrawer =
      activeShift.initialCashDrawer +
      totalSales +
      activeShift.accessorySales +
      activeShift.transferAdminProfit -
      totalExp;

    const actCash = typeof actualCashDrawer === 'number' ? actualCashDrawer : expectedCashDrawer;
    const cashDiff = actCash - expectedCashDrawer;

    return {
      serverStats,
      totalUsage,
      totalSales,
      totalPulseProfit,
      totalExp,
      overallNetProfit,
      expectedCashDrawer,
      actCash,
      cashDiff,
    };
  }, [activeShift, modalTotalSaldos, finalBalances, serverGrossSales, actualCashDrawer]);

  // Handle Buka Shift Submit
  const handleBukaShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openShift({
      cashierName: bukaCashierName || 'Kasir',
      initialCashDrawer: Number(bukaCashDrawer) || 0,
      serverInitialBalances: [
        Number(bukaServer1) || 0,
        Number(bukaServer2) || 0,
        Number(bukaServer3) || 0,
        Number(bukaServer4) || 0,
      ],
      serverNames: settings.serverNames,
    });
    setShowBukaShiftModal(false);
    setSimToast('✅ Shift Baru berhasil dibuka dengan Saldo Awal 4 Server pilihan Anda!');
    setTimeout(() => setSimToast(null), 3000);
  };

  // Handle Submit Top Up
  const handleSubmitTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || Number(topUpAmount) <= 0) return;
    addShiftTopUp(selectedTopUpServerId, Number(topUpAmount));
    setShowTopUpModal(false);
    setTopUpAmount('');
  };

  // Handle Submit Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    addShiftExpense(Number(expenseAmount), expenseNote || 'Pengeluaran operasional');
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseNote('');
  };

  // Handle Submit Tutup Shift
  const handleSubmitTutupShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const totalSaldos: [number, number, number, number] = [
      Number(modalTotalSaldos[0]) || activeShift.servers[0]?.initialBalance || 0,
      Number(modalTotalSaldos[1]) || activeShift.servers[1]?.initialBalance || 0,
      Number(modalTotalSaldos[2]) || activeShift.servers[2]?.initialBalance || 0,
      Number(modalTotalSaldos[3]) || activeShift.servers[3]?.initialBalance || 0,
    ];

    const finalBals: [number, number, number, number] = [
      Number(finalBalances[0]) || 0,
      Number(finalBalances[1]) || 0,
      Number(finalBalances[2]) || 0,
      Number(finalBalances[3]) || 0,
    ];

    const sales: [number, number, number, number] = [
      Number(serverGrossSales[0]) || 0,
      Number(serverGrossSales[1]) || 0,
      Number(serverGrossSales[2]) || 0,
      Number(serverGrossSales[3]) || 0,
    ];

    closeShift({
      serverTotalBalances: totalSaldos,
      serverFinalBalances: finalBals,
      serverGrossSales: sales,
      actualFinalCashDrawer: typeof actualCashDrawer === 'number' ? actualCashDrawer : 0,
      notes: closeNotes,
    });

    setShowCloseShiftModal(false);
    setSimToast('✅ Shift berhasil ditutup! Saldo 4 Server Pulsa & Kuota PPOB pada Buku Kas & Bank telah tersinkronisasi otomatis.');
    setTimeout(() => setSimToast(null), 4000);
  };

  const serverColors = [
    'border-red-500/40 text-red-400 bg-red-950/20',
    'border-blue-500/40 text-blue-400 bg-blue-950/20',
    'border-yellow-500/40 text-yellow-400 bg-yellow-950/20',
    'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {simToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-medium text-xs shadow-2xl shadow-emerald-950 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{simToast}</span>
        </div>
      )}

      {/* 1. ACTIVE SHIFT HERO OR BUKA SHIFT HERO */}
      {activeShift ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-800/40 shadow-2xl space-y-6">
          {/* Shift Banner & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Clock className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SHIFT AKTIF
                  </span>
                  <h2 className="text-white font-extrabold text-lg sm:text-xl">
                    Shift #{activeShift.shiftNumber} — {activeShift.cashierName}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mulai Buka: {formatDateIndo(activeShift.startTime)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenBukaShiftModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/50 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Buka shift baru dan input saldo awal"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                Buka Shift Baru
              </button>
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-800/50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Tambah Top Up Server
              </button>
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MinusCircle className="w-4 h-4 text-rose-400" />
                Catat Pengeluaran
              </button>
              <button
                type="button"
                onClick={handleOpenCloseModal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                TUTUP SHIFT & REKAP
              </button>
            </div>
          </div>

          {/* 4 Servers Status Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-400" />
                Saldo Awal 4 Server Pulsa & Kuota Terpisah:
              </h3>
              <span className="text-[11px] text-slate-400">
                Nilai riil modal berjalan saat ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeShift.servers.map((srv, idx) => (
                <div
                  key={srv.serverId}
                  className={`p-4 rounded-2xl border ${serverColors[idx]} space-y-2.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase truncate">{srv.serverName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      Server {idx + 1}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block">Total Saldo Modal:</span>
                    <div className="text-lg font-extrabold font-mono text-white">
                      {formatRupiah(srv.initialBalance + srv.topUpAmount)}
                    </div>
                    {srv.topUpAmount > 0 && (
                      <span className="text-[10px] text-blue-400 block">
                        (Awal: {formatRupiah(srv.initialBalance)} + Top Up: {formatRupiah(srv.topUpAmount)})
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-300">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-semibold">Siap Transaksi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Shift Snapshot Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Modal Awal Kas Laci:</span>
              <div className="text-base font-bold font-mono text-white">
                {formatRupiah(activeShift.initialCashDrawer)}
              </div>
            </div>

            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Laba Aksesoris Shift:</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                +{formatRupiah(activeShift.accessoryProfit)}
              </div>
            </div>

            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Laba Admin Transfer/Tarik:</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                +{formatRupiah(activeShift.transferAdminProfit + activeShift.tarikTunaiAdminProfit)}
              </div>
            </div>

            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Pengeluaran Kasir Shift:</span>
              <div className="text-base font-bold font-mono text-rose-400">
                -{formatRupiah(activeShift.totalExpenses)}
              </div>
            </div>
          </div>

          {/* KALKULATOR REKAP SALDO & LABA SERVER PULSA */}
          <div className="p-5 rounded-3xl bg-slate-950/95 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    Kalkulator Rekap Saldo & Laba Server Pulsa
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Rumus Shift Konter
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Kalkulasi instan perputaran saldo modal dan perolehan laba bersih per server secara otomatis.
                  </p>
                </div>
              </div>

              {/* Formula Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600/60 text-xs font-mono text-emerald-300">
                <span className="font-bold text-amber-300">RUMUS:</span>
                <span>(Penjualan + Saldo Akhir) - Total Saldo = Laba Bersih</span>
              </div>
            </div>

            {/* Server Selector Tab */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {activeShift.servers.map((srv, idx) => (
                <button
                  key={srv.serverId}
                  type="button"
                  onClick={() => {
                    setSimServerIdx(idx);
                    const srvTotal = srv.initialBalance + (srv.topUpAmount || 0);
                    setSimTotalSaldo(srvTotal);
                    if (typeof finalBalances[idx] === 'number') {
                      setSimSaldoAkhir(finalBalances[idx]);
                    }
                    if (typeof serverGrossSales[idx] === 'number') {
                      setSimPenjualan(serverGrossSales[idx]);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    simServerIdx === idx
                      ? 'bg-slate-850 border-emerald-500 shadow-md text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>Server {idx + 1}</span>
                    {simServerIdx === idx && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold truncate text-slate-200 mt-0.5">{srv.serverName}</div>
                </button>
              ))}
            </div>

            {/* 3 Interactive Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Input 1: Total Saldo */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-blue-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-300">
                    1. Total Saldo Modal (Rp):
                  </label>
                  <span className="text-[10px] text-slate-400">Awal + Topup</span>
                </div>
                <input
                  type="number"
                  value={simTotalSaldo}
                  onChange={(e) => setSimTotalSaldo(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-blue-800/60 rounded-xl px-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-blue-400"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  {formatRupiah(simNumTotal)}
                </span>
              </div>

              {/* Input 2: Saldo Akhir */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    2. Saldo Akhir Server (Rp):
                  </label>
                  <span className="text-[10px] text-slate-400">Sisa pulsa</span>
                </div>
                <input
                  type="number"
                  value={simSaldoAkhir}
                  onChange={(e) => setSimSaldoAkhir(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  {formatRupiah(simNumAkhir)}
                </span>
              </div>

              {/* Input 3: Total Penjualan */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-emerald-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300">
                    3. Total Penjualan Pulsa (Rp):
                  </label>
                  <span className="text-[10px] text-slate-400">Omset diterima</span>
                </div>
                <input
                  type="number"
                  value={simPenjualan}
                  onChange={(e) => setSimPenjualan(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-base font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-emerald-400/80 block font-mono">
                  {formatRupiah(simNumSales)}
                </span>
              </div>
            </div>

            {/* Real-Time Mathematical Result Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase text-emerald-300 block">
                    HASIL LABA BERSIH TERHITUNG OTOMATIS:
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Hasil kalkulasi rumus: (Penjualan + Saldo Akhir) - Total Saldo
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 flex items-center gap-1">
                  <span>+{formatRupiah(simProfit)}</span>
                </div>
              </div>

              {/* Step-by-step Math Breakdown */}
              <div className="p-3 bg-slate-950/90 rounded-xl border border-emerald-900/50 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Langkah Penjumlahan & Pengurangan:</span>
                  <div className="text-emerald-300 font-bold mt-0.5">
                    ({formatRupiah(simNumSales)} + {formatRupiah(simNumAkhir)}) - {formatRupiah(simNumTotal)}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    = {formatRupiah(simNumSales + simNumAkhir)} - {formatRupiah(simNumTotal)} = <strong className="text-emerald-400 font-extrabold">+{formatRupiah(simProfit)}</strong>
                  </div>
                </div>

                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Pemakaian Saldo Modal:</span>
                    <strong className="text-amber-300 font-bold">{formatRupiah(simUsage)}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300 mt-1">
                    <span>Margin dari Penjualan:</span>
                    <strong className="text-emerald-400 font-bold">
                      {simNumSales > 0 ? ((simProfit / simNumSales) * 100).toFixed(1) : '0'}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    updateActiveShiftServer(simServerIdx, { initialBalance: simNumTotal });
                    setSimToast(`Saldo Awal Server ${simServerIdx + 1} diperbarui menjadi ${formatRupiah(simNumTotal)}!`);
                    setTimeout(() => setSimToast(null), 3000);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Simpan Saldo Modal ({formatRupiah(simNumTotal)}) ke Shift Berjalan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalTotalSaldos((prev) => {
                      const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                      copy[simServerIdx] = simNumTotal;
                      return copy;
                    });
                    setFinalBalances((prev) => {
                      const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                      copy[simServerIdx] = simNumAkhir;
                      return copy;
                    });
                    setServerGrossSales((prev) => {
                      const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                      copy[simServerIdx] = simNumSales;
                      return copy;
                    });
                    setShowCloseShiftModal(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terapkan Angka Ini ke Tutup Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BUKA SHIFT BARU FORM (STANDALONE) */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-white font-extrabold text-xl">Buka Shift Baru Kasir</h2>
                <p className="text-xs text-slate-400">
                  Masukkan saldo awal laci kasir dan saldo 4 server pulsa saat memulai tugas shift.
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-slate-400 text-[11px] mr-1">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('buku_kas')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold hover:bg-emerald-900 flex items-center gap-1 shadow-sm"
                title="Ambil data saldo awal terkini dari Saldo 4 Server Pulsa & Kuota PPOB di Buku Kas & Bank"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ambil Saldo Buku Kas</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('digipos')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Standar 1 (Rp 282.854)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('standar')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Standar 2 (Rp 1 Juta)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('besar')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Konter Besar
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('kosong')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {/* Sync Information Banner */}
          <div className="p-3 bg-blue-950/40 rounded-2xl border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Saldo awal otomatis tersinkron dengan <strong>Saldo 4 Server Pulsa & Kuota PPOB</strong> di Buku Kas & Bank. Anda tetap dapat mengetik/mengubah nilai secara manual.
              </span>
            </div>
            <button
              type="button"
              onClick={syncBukaShiftFromBukuKas}
              className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 text-blue-200 hover:text-white font-semibold text-[11px] flex items-center gap-1 shrink-0 self-start sm:self-auto transition"
            >
              <RotateCcw className="w-3 h-3 text-cyan-300" />
              <span>Sinkron Ulang Buku Kas</span>
            </button>
          </div>

          <form onSubmit={handleBukaShiftSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nama Kasir yang Bertugas:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={bukaCashierName}
                    onChange={(e) => setBukaCashierName(e.target.value)}
                    placeholder="Nama kasir yang bertugas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Modal Awal Kas di Laci Kasir (Uang Kembalian):
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Buku Kas: {formatRupiah(getCashDrawerBalance())}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={bukaCashDrawer}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaCashDrawer(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Input Saldo Awal 4 Server */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-400" />
                  Input Saldo Awal 4 Server Pulsa (Tersinkron Buku Kas & Bank):
                </h3>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Bisa diedit manual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Server 1 */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-red-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 truncate block">
                      {settings.serverNames?.[0] || 'Server 1 (Digipos Telkomsel)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Saldo Awal (Rp):</span>
                    <span className="text-red-300/80 font-mono">Kas: {formatRupiah(getServerAccountBalance(0))}</span>
                  </div>
                  <input
                    type="number"
                    value={bukaServer1}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaServer1(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                {/* Server 2 */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-blue-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 truncate block">
                      {settings.serverNames?.[1] || 'Server 2 (SiDompul XL-Axis)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Saldo Awal (Rp):</span>
                    <span className="text-blue-300/80 font-mono">Kas: {formatRupiah(getServerAccountBalance(1))}</span>
                  </div>
                  <input
                    type="number"
                    value={bukaServer2}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaServer2(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Server 3 */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-yellow-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-400 truncate block">
                      {settings.serverNames?.[2] || 'Server 3 (Mobo Indosat)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Saldo Awal (Rp):</span>
                    <span className="text-yellow-300/80 font-mono">Kas: {formatRupiah(getServerAccountBalance(2))}</span>
                  </div>
                  <input
                    type="number"
                    value={bukaServer3}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaServer3(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                {/* Server 4 */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 truncate block">
                      {settings.serverNames?.[3] || 'Server 4 (Multi PPOB)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Saldo Awal (Rp):</span>
                    <span className="text-cyan-300/80 font-mono">Kas: {formatRupiah(getServerAccountBalance(3))}</span>
                  </div>
                  <input
                    type="number"
                    value={bukaServer4}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaServer4(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Total Modal Summary */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">Total Modal 4 Server: </span>
                <span className="font-mono font-bold text-blue-400">{formatRupiah(totalBukaServers)}</span>
                <span className="text-slate-500 ml-2">| Kas Laci: </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatRupiah(Number(bukaCashDrawer) || 0)}
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                Total Modal Awal Shift: <span className="font-mono text-emerald-400">{formatRupiah(totalBukaServers + (Number(bukaCashDrawer) || 0))}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Buka Shift Kasir Sekarang
            </button>
          </form>
        </div>
      )}

      {/* 2. RIWAYAT REKAP SHIFT SEBELUMNYA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">Riwayat Rekap Shift Kasir</h3>
          </div>
          <span className="text-xs text-slate-400">{shifts.length} shift tersimpan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Shift / Kasir</th>
                <th className="py-3 px-4 font-semibold">Waktu Buka / Tutup</th>
                <th className="py-3 px-4 font-semibold text-right">Penjualan 4 Server</th>
                <th className="py-3 px-4 font-semibold text-right">Laba Pulsa (4 Server)</th>
                <th className="py-3 px-4 font-semibold text-right">Total Laba Bersih Shift</th>
                <th className="py-3 px-4 font-semibold text-center">Status Uang Kasir</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {shifts.map((s) => {
                const isOpen = s.status === 'open';

                return (
                  <tr key={s.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Shift #{s.shiftNumber}</span>
                        {isOpen && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.cashierName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-300">{formatDateIndo(s.startTime)}</div>
                      <div className="text-[10px] text-slate-500">
                        {s.endTime ? `Tutup: ${formatDateIndo(s.endTime)}` : 'Sedang berjalan...'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatRupiah(s.totalPulseSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      +{formatRupiah(s.totalPulseProfit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400">
                      +{formatRupiah(s.netProfit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOpen ? (
                        <span className="text-[10px] text-slate-500 italic">Belum tutup</span>
                      ) : (s.cashDifference || 0) === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          PAS
                        </span>
                      ) : (s.cashDifference || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
                          +{formatRupiah(s.cashDifference || 0)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
                          {formatRupiah(s.cashDifference || 0)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveShiftReceipt(s)}
                          className="p-1.5 rounded-lg bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-white transition"
                          title="Lihat Rekap Struk & Kirim WA"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              const proceed = () => setShiftToDelete(s);
                              if (!isOwnerUnlocked && !hasPermission('canDeleteShifts')) {
                                requestOwnerPin(
                                  'Hapus Catatan Shift',
                                  proceed,
                                  'Menghapus riwayat shift dibatasi untuk kasir. Masukkan PIN Pemilik untuk konfirmasi.'
                                );
                              } else {
                                proceed();
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                            title="Hapus Rekap Shift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BUKA SHIFT BARU */}
      {showBukaShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Buka Shift Baru (Input Saldo Awal)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBukaShiftModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBukaShiftSubmit} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Buku Kas Live Auto-Sync Banner */}
              <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-300">
                  <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Form terisi otomatis dari <strong>Saldo 4 Server Pulsa & Kuota PPOB di Buku Kas</strong>. Anda tetap dapat mengedit nominal secara manual.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={syncBukaShiftFromBukuKas}
                  className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-200 text-xs font-semibold shrink-0 transition"
                >
                  Segarkan dari Buku Kas
                </button>
              </div>

              {/* Presets */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-400 font-medium">Pilihan Saldo Awal:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('buku_kas')}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-700 font-semibold hover:bg-blue-900 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                    Ambil Saldo Buku Kas (Otomatis)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('digipos')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold hover:bg-emerald-900"
                  >
                    Paket Standar 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('standar')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold"
                  >
                    Paket Standar 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('besar')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold"
                  >
                    Konter Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('kosong')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                  >
                    Input Manual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nama Kasir:</label>
                  <input
                    type="text"
                    value={bukaCashierName}
                    onChange={(e) => setBukaCashierName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Modal Awal Kas Laci (Rp):
                    </label>
                    <span className="text-[10px] text-slate-400">Kas: {formatRupiah(getCashDrawerBalance())}</span>
                  </div>
                  <input
                    type="number"
                    value={bukaCashDrawer}
                    onChange={(e) => {
                      setHasManuallyEditedBuka(true);
                      setBukaCashDrawer(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Saldo 4 Server Inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold uppercase block">
                    Saldo Awal 4 Server Pulsa (Bisa Diedit Manual):
                  </span>
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Sinkron Buku Kas
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-red-900/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-bold block">{settings.serverNames?.[0]}</span>
                      <span className="text-[10px] text-slate-400">Kas: {formatRupiah(getServerAccountBalance(0))}</span>
                    </div>
                    <input
                      type="number"
                      value={bukaServer1}
                      onChange={(e) => {
                        setHasManuallyEditedBuka(true);
                        setBukaServer1(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="Saldo Awal Server 1"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-blue-900/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-bold block">{settings.serverNames?.[1]}</span>
                      <span className="text-[10px] text-slate-400">Kas: {formatRupiah(getServerAccountBalance(1))}</span>
                    </div>
                    <input
                      type="number"
                      value={bukaServer2}
                      onChange={(e) => {
                        setHasManuallyEditedBuka(true);
                        setBukaServer2(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="Saldo Awal Server 2"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-yellow-900/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold block">{settings.serverNames?.[2]}</span>
                      <span className="text-[10px] text-slate-400">Kas: {formatRupiah(getServerAccountBalance(2))}</span>
                    </div>
                    <input
                      type="number"
                      value={bukaServer3}
                      onChange={(e) => {
                        setHasManuallyEditedBuka(true);
                        setBukaServer3(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="Saldo Awal Server 3"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-cyan-900/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-bold block">{settings.serverNames?.[3]}</span>
                      <span className="text-[10px] text-slate-400">Kas: {formatRupiah(getServerAccountBalance(3))}</span>
                    </div>
                    <input
                      type="number"
                      value={bukaServer4}
                      onChange={(e) => {
                        setHasManuallyEditedBuka(true);
                        setBukaServer4(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="Saldo Awal Server 4"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Modal 4 Server:</span>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {formatRupiah(totalBukaServers)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBukaShiftModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/30"
                >
                  Mulai Buka Shift Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TUTUP SHIFT & REKAP 4 SERVER (WITH USER EXACT FORMULA!) */}
      {showCloseShiftModal && activeShift && computedShiftRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Rekap Tutup Shift #{activeShift.shiftNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">Kasir: {activeShift.cashierName}</p>
                </div>
              </div>

              {/* Formula Badge Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-300 font-mono">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>(Penjualan + Saldo Akhir) - Total Saldo = Laba Bersih</span>
              </div>
            </div>

            <form onSubmit={handleSubmitTutupShift} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Formula Guidance Banner */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Masukkan Saldo Akhir dan Penjualan riil setiap server. Laba bersih per server dihitung otomatis dengan rumus: <strong className="text-emerald-400 font-mono">(Penjualan + Saldo Akhir) - Total Saldo</strong>.
                  </span>
                </div>
              </div>

              {/* Buku Kas Sync Notice Banner */}
              <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-2xl flex items-start gap-2.5 text-slate-300">
                <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-blue-300 block mb-0.5">
                    Sinkronisasi Otomatis ke Buku Kas & Bank:
                  </span>
                  Ketika Anda mengklik <strong className="text-white">"Selesai Tutup Shift"</strong>, nominal <strong className="text-emerald-400">Saldo Akhir</strong> dari ke-4 Server Pulsa & Kuota PPOB ini akan secara otomatis memperbarui saldo akun server di Buku Kas & Bank.
                </div>
              </div>

              {/* 4 Servers Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Rincian 4 Server Pulsa (Saldo Awal, Saldo Akhir, Penjualan & Laba):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {computedShiftRecap.serverStats.map((srv, idx) => (
                    <div
                      key={srv.serverId}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
                    >
                      {/* Server Title & Total Saldo Modal */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span className="font-bold text-white text-xs">{srv.serverName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                          Server {idx + 1}
                        </span>
                      </div>

                      {/* 3 Inputs: Total Saldo Modal, Saldo Akhir & Penjualan */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* 1. Total Saldo Modal */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 font-medium truncate" title="Total Saldo = Saldo Awal + Top Up">
                            1. Total Saldo (Rp):
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={modalTotalSaldos[idx]}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setModalTotalSaldos((prev) => {
                                const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            className="w-full bg-slate-900 border border-blue-900/50 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>

                        {/* 2. Saldo Akhir */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] text-slate-400 block font-medium truncate" title="Saldo Sisa saat tutup shift">
                              2. Saldo Akhir:
                            </label>
                            <span className="text-[9px] text-blue-400 font-mono">
                              Kas: {formatRupiah(getServerAccountBalance(idx))}
                            </span>
                          </div>
                          <input
                            type="number"
                            placeholder="0"
                            value={finalBalances[idx]}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setFinalBalances((prev) => {
                                const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>

                        {/* 3. Total Penjualan */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 font-medium truncate" title="Total uang penjualan diterima">
                            3. Penjualan (Rp):
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={serverGrossSales[idx]}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setServerGrossSales((prev) => {
                                const copy = [...prev] as [number | '', number | '', number | '', number | ''];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Automatic Results Box */}
                      <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Pemakaian Saldo Modal (Total - Akhir):</span>
                          <span className="font-mono font-semibold text-amber-300">
                            {formatRupiah(srv.usage)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                          <div>
                            <span className="text-emerald-400 font-bold block text-[11px]">Laba Bersih Otomatis:</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              ({formatRupiah(srv.sales)} + {formatRupiah(srv.finalBal)}) - {formatRupiah(srv.totalAvailable)}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold font-mono text-emerald-400">
                            +{formatRupiah(srv.profit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automatic Net Profit Summary Box */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-300 font-semibold uppercase">
                    Hasil Total Laba Bersih Shift Secara Otomatis:
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400">
                    +{formatRupiah(computedShiftRecap.overallNetProfit)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-900/60 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Laba 4 Server:</span>
                    <strong className="text-emerald-400">
                      +{formatRupiah(computedShiftRecap.totalPulseProfit)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Laba Aksesoris:</span>
                    <strong className="text-emerald-400">
                      +{formatRupiah(activeShift.accessoryProfit)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Laba Admin Bank:</span>
                    <strong className="text-emerald-400">
                      +{formatRupiah(activeShift.transferAdminProfit + activeShift.tarikTunaiAdminProfit)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pengeluaran:</span>
                    <strong className="text-rose-400">
                      -{formatRupiah(computedShiftRecap.totalExp)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cash Drawer Reconciliation */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  Rekonsiliasi Kas Laci Kasir (Cash Opname):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Uang Kas Yang Seharusnya Ada di Laci:
                    </span>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-base font-bold font-mono text-white">
                      {formatRupiah(computedShiftRecap.expectedCashDrawer)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      (Modal Awal + Jual Pulsa + Aksesoris + Admin Bank - Beban)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Hitungan Uang Fisik Nyata di Laci Kasir (Rp):
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={actualCashDrawer}
                      onChange={(e) => setActualCashDrawer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-base font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <div className="mt-1 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Selisih Kasir:</span>
                      <strong
                        className={
                          computedShiftRecap.cashDiff === 0
                            ? 'text-emerald-400'
                            : computedShiftRecap.cashDiff > 0
                            ? 'text-blue-400'
                            : 'text-rose-400'
                        }
                      >
                        {computedShiftRecap.cashDiff === 0
                          ? '✅ Uang Kas Pas'
                          : computedShiftRecap.cashDiff > 0
                          ? `🟢 Lebih: +${formatRupiah(computedShiftRecap.cashDiff)}`
                          : `🔴 Minus: ${formatRupiah(computedShiftRecap.cashDiff)}`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 block mb-1">Catatan Penutupan Shift (Opsional):</label>
                <input
                  type="text"
                  placeholder="Catatan penutupan shift (opsional)..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Selesai Tutup Shift & Cetak Struk Rekap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TOP UP SERVER DI TENGAH SHIFT */}
      {showTopUpModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">Tambah Top Up Saldo Server</h3>

            <form onSubmit={handleSubmitTopUp} className="space-y-4">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Pilih Server:</label>
                <select
                  value={selectedTopUpServerId}
                  onChange={(e) => setSelectedTopUpServerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {activeShift.servers.map((srv) => (
                    <option key={srv.serverId} value={srv.serverId}>
                      {srv.serverName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Jumlah Tambah Saldo (Rp):
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold font-mono text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Simpan Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPENSE KASIR */}
      {showExpenseModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">Catat Pengeluaran Shift</h3>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nominal Pengeluaran (Rp):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold font-mono text-rose-400 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Keterangan / Keperluan:</label>
                <input
                  type="text"
                  placeholder="Keterangan pengeluaran (misal: Air mineral, ATK, operasional)..."
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Catat Beban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Shift (In-App Reliable Dialog) */}
      {shiftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Data Shift?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Shift:</span>
                <span className="font-bold text-white">#{shiftToDelete.shiftNumber} ({shiftToDelete.cashierName})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Waktu Buka:</span>
                <span className="text-slate-300">{formatDateIndo(shiftToDelete.startTime)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-850">
                <span className="text-slate-400">Laba Bersih Shift:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(shiftToDelete.netProfit)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus arsip data shift kasir ini secara permanen?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShiftToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteShift(shiftToDelete.id);
                  setShiftToDelete(null);
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
    </div>
  );
};
