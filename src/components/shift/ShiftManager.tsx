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
  ArrowRightLeft,
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
  QrCode,
  Send,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

export const ShiftManager: React.FC = () => {
  const {
    shifts,
    activeShift,
    transactions,
    openShift,
    updateActiveShiftServer,
    addShiftTopUp,
    addShiftExpense,
    closeShift,
    deleteShift,
    setActiveReceipt,
    setActiveShiftReceipt,
    settings,
    hasPermission,
    requestOwnerPin,
    isOwnerUnlocked,
    accounts,
    transferBetweenAccounts,
    addShiftCashDrawerTopUp,
  } = useApp();

  // 1. Ambil seluruh akun server pulsa secara dinamis dari Buku Kas & Bank
  const serverAccounts = useMemo(() => {
    const list = accounts.filter((a) => a.type === 'server_pulsa');
    if (list.length > 0) return list;
    return [
      { id: 'acc-server-1', name: settings.serverNames?.[0] || 'Server 1: Digipos (Telkomsel)', type: 'server_pulsa' as const, balance: 0, color: '#E11D48' },
      { id: 'acc-server-2', name: settings.serverNames?.[1] || 'Server 2: SiDompul (XL & Axis)', type: 'server_pulsa' as const, balance: 0, color: '#2563EB' },
      { id: 'acc-server-3', name: settings.serverNames?.[2] || 'Server 3: Mobo (Indosat)', type: 'server_pulsa' as const, balance: 0, color: '#EAB308' },
      { id: 'acc-server-4', name: settings.serverNames?.[3] || 'Server 4: Multi PPOB (PLN & Lainnya)', type: 'server_pulsa' as const, balance: 0, color: '#06B6D4' },
    ];
  }, [accounts, settings.serverNames]);

  // Dynamic palette warna server card
  const getServerColorStyle = (idx: number) => {
    const palette = [
      { border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-950/20', focus: 'focus:border-rose-500' },
      { border: 'border-blue-500/40', text: 'text-blue-400', bg: 'bg-blue-950/20', focus: 'focus:border-blue-500' },
      { border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-950/20', focus: 'focus:border-amber-500' },
      { border: 'border-cyan-500/40', text: 'text-cyan-400', bg: 'bg-cyan-950/20', focus: 'focus:border-cyan-500' },
      { border: 'border-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-950/20', focus: 'focus:border-purple-500' },
      { border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-950/20', focus: 'focus:border-emerald-500' },
      { border: 'border-orange-500/40', text: 'text-orange-400', bg: 'bg-orange-950/20', focus: 'focus:border-orange-500' },
    ];
    return palette[idx % palette.length];
  };

  const getCashDrawerBalance = (): number => {
    const cashAcc = accounts.find((a) => a.type === 'cash' || a.id === 'acc-cash');
    return cashAcc?.balance ?? 0;
  };

  // Buka Shift Form State (Auto-synced with Buku Kas & Bank)
  const [showBukaShiftModal, setShowBukaShiftModal] = useState(false);
  const [bukaCashierName, setBukaCashierName] = useState(settings.ownerName || 'Nikko (Kasir Shift)');
  const [bukaCashDrawer, setBukaCashDrawer] = useState<number | ''>(() => getCashDrawerBalance());
  const [bukaServers, setBukaServers] = useState<{ id: string; name: string; balance: number | '' }[]>(() =>
    serverAccounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      balance: acc.balance,
    }))
  );
  const [hasManuallyEditedBuka, setHasManuallyEditedBuka] = useState(false);

  // Sync state from Buku Kas & Bank into Buka Shift form
  const syncBukaShiftFromBukuKas = () => {
    setBukaServers(
      serverAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        balance: acc.balance,
      }))
    );
    setBukaCashDrawer(getCashDrawerBalance());
    setHasManuallyEditedBuka(false);
    setSimToast(`✅ Saldo Awal ${serverAccounts.length} Server Pulsa & Kas Laci berhasil disinkronkan dari Buku Kas!`);
    setTimeout(() => setSimToast(null), 3000);
  };

  // Auto-sync from Buku Kas & Bank when accounts change and no active shift is running
  useEffect(() => {
    if (!activeShift && !hasManuallyEditedBuka && serverAccounts.length > 0) {
      setBukaServers(
        serverAccounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          balance: acc.balance,
        }))
      );
      setBukaCashDrawer(getCashDrawerBalance());
    }
  }, [serverAccounts, activeShift, hasManuallyEditedBuka]);

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
  const [expenseSourceAccountId, setExpenseSourceAccountId] = useState<string>('acc-cash');
  const [shiftToDelete, setShiftToDelete] = useState<ShiftRecord | null>(null);

  // Tambah Kas Laci Kasir (Penambahan Modal dari Owner)
  const [showCashTopUpModal, setShowCashTopUpModal] = useState(false);
  const [cashTopUpAmount, setCashTopUpAmount] = useState<number | ''>('');
  const [cashTopUpSourceId, setCashTopUpSourceId] = useState<string>('owner_direct');
  const [cashTopUpNote, setCashTopUpNote] = useState('Tambahan modal kas laci dari Owner');

  // Pindah / Mutasi Saldo Modal State (Sama seperti di Buku Kas dan Bank)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromId, setTransferFromId] = useState<string>('acc-cash');
  const [transferToId, setTransferToId] = useState<string>('acc-server-1');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferNotes, setTransferNotes] = useState('Pindah saldo / Top Up Server Shift');
  const [autoReflectToShift, setAutoReflectToShift] = useState(true);

  // Tutup Shift Form State (Dinamis untuk seluruh Server)
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  // Total Saldo Modal Server (Default sinkron dari Saldo Awal + Top Up)
  const [modalTotalSaldos, setModalTotalSaldos] = useState<(number | '')[]>([]);

  // Saldo Akhir Server (Sisa Saldo di HP Chip, sinkron Buku Kas)
  const [finalBalances, setFinalBalances] = useState<(number | '')[]>([]);

  // Penjualan Pulsa Server (Omset diterima kasir)
  const [serverGrossSales, setServerGrossSales] = useState<(number | '')[]>([]);

  // Uang Fisik Kasir di Laci (Cash Opname)
  const [actualCashDrawer, setActualCashDrawer] = useState<number | ''>('');
  const [closeNotes, setCloseNotes] = useState('');

  // Sinkronkan Saldo Akhir Server langsung dari data riil Buku Kas & Bank
  const syncFinalBalancesFromBukuKas = () => {
    if (!activeShift) return;
    const newFinals = activeShift.servers.map((srv, idx) => {
      const matched = accounts.find((a) => a.id === srv.serverId || a.name === srv.serverName) || serverAccounts[idx];
      return matched ? matched.balance : 0;
    });
    setFinalBalances(newFinals);
    setSimToast(`✅ Saldo Akhir ${activeShift.servers.length} Server Pulsa berhasil disinkronkan dengan saldo Buku Kas & Bank!`);
    setTimeout(() => setSimToast(null), 3500);
  };

  // Pre-fill Close Shift when modal opens (Menjaga data yang sudah diinput kasir & sinkron buku kas)
  const handleOpenCloseModal = () => {
    if (!activeShift) return;

    setModalTotalSaldos((prev) =>
      activeShift.servers.map((srv, idx) => {
        const liveTotal = srv.initialBalance + (srv.topUpAmount || 0);
        return prev[idx] !== undefined && prev[idx] !== '' && Number(prev[idx]) > 0
          ? prev[idx]
          : liveTotal;
      })
    );

    setFinalBalances((prev) =>
      activeShift.servers.map((srv, idx) => {
        const matched = accounts.find((a) => a.id === srv.serverId || a.name === srv.serverName) || serverAccounts[idx];
        const liveBal = matched ? matched.balance : (srv.finalBalance || 0);
        return prev[idx] !== undefined && prev[idx] !== '' && Number(prev[idx]) > 0
          ? prev[idx]
          : liveBal;
      })
    );

    setServerGrossSales((prev) =>
      activeShift.servers.map((srv, idx) => {
        return prev[idx] !== undefined && prev[idx] !== '' && Number(prev[idx]) > 0
          ? prev[idx]
          : (srv.grossSales || 0);
      })
    );

    // Hitung estimasi kas sistem saat ini
    const totalSalesCurrent = activeShift.servers.reduce((sum, srv, idx) => {
      const s = typeof serverGrossSales[idx] === 'number' ? Number(serverGrossSales[idx]) : (srv.grossSales || 0);
      return sum + s;
    }, 0);

    const totalExpCurrent = activeShift.expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashDrawerExpCurrent = activeShift.expenses
      .filter((e) => !e.sourceAccountId || e.sourceAccountId === 'acc-cash' || e.sourceAccountName?.toLowerCase().includes('laci'))
      .reduce((sum, e) => sum + e.amount, 0);

    const estExpectedCash =
      activeShift.initialCashDrawer +
      (activeShift.additionalCashDrawer || 0) +
      totalSalesCurrent +
      activeShift.accessorySales +
      activeShift.transferAdminProfit -
      cashDrawerExpCurrent;

    if (actualCashDrawer === '') {
      setActualCashDrawer(estExpectedCash > 0 ? estExpectedCash : getCashDrawerBalance());
    }
    setCloseNotes('');
    setShowCloseShiftModal(true);
  };

  // Sync state server saat active shift pertama kali dibuka/dimuat
  useEffect(() => {
    if (activeShift) {
      setModalTotalSaldos(
        activeShift.servers.map((srv) => srv.initialBalance + (srv.topUpAmount || 0))
      );
      setFinalBalances(
        activeShift.servers.map((srv, idx) => {
          const matched = accounts.find((a) => a.id === srv.serverId || a.name === srv.serverName) || serverAccounts[idx];
          return matched ? matched.balance : (srv.finalBalance || 0);
        })
      );
      setServerGrossSales(
        activeShift.servers.map((srv) => srv.grossSales || 0)
      );
      if (activeShift.servers.length > 0 && selectedTopUpServerId === 'server-1') {
        setSelectedTopUpServerId(activeShift.servers[0].serverId);
      }
    }
  }, [activeShift?.id]);

  // Tab dan Filter untuk Riwayat Rekap Shift & Aktifitas Transaksi Kasir
  const [historyTab, setHistoryTab] = useState<'all' | 'shifts' | 'transfer' | 'tarik' | 'aksesoris'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

  // Helper untuk mendapatkan transaksi yang terjadi selama periode shift tertentu
  const getTransactionsForShift = (shift: ShiftRecord) => {
    const sStart = new Date(shift.startTime).getTime();
    const sEnd = shift.endTime ? new Date(shift.endTime).getTime() : Date.now();
    return transactions.filter((t) => {
      const tTime = new Date(t.timestamp).getTime();
      return tTime >= sStart && tTime <= sEnd;
    });
  };

  // Gabungkan seluruh aktifitas kasir: Shift Buka/Tutup, Transfer Uang, Tarik Tunai, dan Aksesoris HP
  const combinedActivities = useMemo(() => {
    interface ShiftActivityItem {
      id: string;
      timestamp: string;
      type: 'shift_open' | 'shift_close' | 'transfer_uang' | 'tarik_tunai' | 'aksesoris';
      title: string;
      subtitle: string;
      cashierName?: string;
      shiftNumber?: number;
      amount: number;
      profit: number;
      details?: string;
      rawShift?: ShiftRecord;
      rawTransaction?: (typeof transactions)[0];
    }

    const list: ShiftActivityItem[] = [];

    // 1. Shift Records (Buka & Tutup)
    shifts.forEach((s) => {
      if (s.endTime) {
        list.push({
          id: `shift-close-${s.id}`,
          timestamp: s.endTime,
          type: 'shift_close',
          title: `Tutup Shift #${s.shiftNumber}`,
          subtitle: `Kasir: ${s.cashierName} • Selisih Kas: ${(s.cashDifference || 0) === 0 ? 'PAS' : (s.cashDifference || 0) > 0 ? `+${formatRupiah(s.cashDifference || 0)}` : formatRupiah(s.cashDifference || 0)}`,
          cashierName: s.cashierName,
          shiftNumber: s.shiftNumber,
          amount: s.totalPulseSales + s.accessorySales,
          profit: s.netProfit,
          details: `Server Pulsa: +${formatRupiah(s.totalPulseProfit)} | Aksesoris: +${formatRupiah(s.accessoryProfit)} | Admin: +${formatRupiah(s.transferAdminProfit + s.tarikTunaiAdminProfit)}`,
          rawShift: s,
        });
      }
      list.push({
        id: `shift-open-${s.id}`,
        timestamp: s.startTime,
        type: 'shift_open',
        title: `Buka Shift #${s.shiftNumber}`,
        subtitle: `Kasir: ${s.cashierName} • Modal Kas: ${formatRupiah(s.initialCashDrawer)}`,
        cashierName: s.cashierName,
        shiftNumber: s.shiftNumber,
        amount: s.initialCashDrawer,
        profit: 0,
        details: `Saldo Awal Server: ${formatRupiah(s.servers.reduce((sum, srv) => sum + srv.initialBalance, 0))}`,
        rawShift: s,
      });
    });

    // 2. Transaksi Operasional Kasir (Transfer, Tarik Tunai, Aksesoris)
    transactions.forEach((t) => {
      if (t.type === 'transfer_uang') {
        list.push({
          id: `trx-${t.id}`,
          timestamp: t.timestamp,
          type: 'transfer_uang',
          title: `Transfer Uang (${t.providerBank || 'Bank'})`,
          subtitle: `${t.targetName || 'Pelanggan'} • Rek: ${t.targetNumber || '-'}`,
          amount: t.nominal,
          profit: t.profit,
          details: `Admin: +${formatRupiah(t.adminFee)} | Bayar: ${t.paymentMethod.toUpperCase()}`,
          rawTransaction: t,
        });
      } else if (t.type === 'tarik_tunai') {
        list.push({
          id: `trx-${t.id}`,
          timestamp: t.timestamp,
          type: 'tarik_tunai',
          title: `Tarik Tunai (${t.providerBank || 'E-Wallet'})`,
          subtitle: `${t.targetName || 'Pelanggan'} • ${t.targetNumber || '-'}`,
          amount: t.nominal,
          profit: t.profit,
          details:
            t.feePaymentMethod === 'tunai' || !t.feePaymentMethod
              ? `Fee Admin: +${formatRupiah(t.adminFee)} (Tunai Laci) | Keluar Laci: ${formatRupiah(t.nominal)} (Net: -${formatRupiah(t.nominal - t.adminFee)})`
              : t.feePaymentMethod === 'potong_tunai'
              ? `Fee Admin: +${formatRupiah(t.adminFee)} (Potong Tunai) | Keluar Laci: ${formatRupiah(Math.max(0, t.nominal - t.adminFee))}`
              : `Fee Admin: +${formatRupiah(t.adminFee)} (Ditransfer) | Keluar Laci: ${formatRupiah(t.nominal)}`,
          rawTransaction: t,
        });
      } else if (t.type === 'aksesoris') {
        const itemNames = t.items?.map((it) => `${it.name} (${it.quantity}x)`).join(', ') || t.title;
        list.push({
          id: `trx-${t.id}`,
          timestamp: t.timestamp,
          type: 'aksesoris',
          title: `Penjualan Aksesoris HP`,
          subtitle: itemNames,
          amount: t.totalAmount,
          profit: t.profit,
          details: `Bayar: ${t.paymentMethod.toUpperCase()} • Omset: ${formatRupiah(t.totalAmount)}`,
          rawTransaction: t,
        });
      }
    });

    // Urutkan dari yang terbaru (newest first)
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [shifts, transactions]);

  // Filter gabungan berdasarkan Tab dan Pencarian
  const filteredActivities = useMemo(() => {
    return combinedActivities.filter((act) => {
      if (historyTab === 'shifts' && act.type !== 'shift_close' && act.type !== 'shift_open') return false;
      if (historyTab === 'transfer' && act.type !== 'transfer_uang') return false;
      if (historyTab === 'tarik' && act.type !== 'tarik_tunai') return false;
      if (historyTab === 'aksesoris' && act.type !== 'aksesoris') return false;

      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchSub = act.subtitle.toLowerCase().includes(q);
        const matchDetails = act.details?.toLowerCase().includes(q) || false;
        const matchCashier = act.cashierName?.toLowerCase().includes(q) || false;
        return matchTitle || matchSub || matchDetails || matchCashier;
      }
      return true;
    });
  }, [combinedActivities, historyTab, historySearch]);

  const totalBukaServers = useMemo(() => {
    return bukaServers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
  }, [bukaServers]);

  // Calculations for Tutup Shift strictly based on user's formula:
  // Laba Bersih = (Penjualan + Saldo Akhir) - Total Saldo Modal
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
    const cashDrawerExp = activeShift.expenses
      .filter((e) => !e.sourceAccountId || e.sourceAccountId === 'acc-cash' || e.sourceAccountName?.toLowerCase().includes('laci'))
      .reduce((sum, e) => sum + e.amount, 0);

    const overallNetProfit =
      totalPulseProfit +
      activeShift.accessoryProfit +
      activeShift.transferAdminProfit +
      activeShift.tarikTunaiAdminProfit -
      totalExp;

    const tarikTunaiCashOut = activeShift.tarikTunaiCashOut || 0;
    const tarikTunaiFeeCashIn = activeShift.tarikTunaiFeeCashIn || 0;
    const netTarikTunaiCashChange = tarikTunaiFeeCashIn - tarikTunaiCashOut;

    const expectedCashDrawer =
      activeShift.initialCashDrawer +
      (activeShift.additionalCashDrawer || 0) +
      totalSales +
      activeShift.accessorySales +
      activeShift.transferAdminProfit +
      netTarikTunaiCashChange -
      cashDrawerExp;

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
      serverInitialBalances: bukaServers.map((s) => Number(s.balance) || 0),
      serverNames: bukaServers.map((s) => s.name),
      serverIds: bukaServers.map((s) => s.id),
    });
    setShowBukaShiftModal(false);
    setSimToast(`✅ Kasir POS berhasil dibuka dengan ${bukaServers.length} Server Pulsa & Kas Laci!`);
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
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return;
    addShiftExpense(amt, expenseNote || 'Pengeluaran operasional', expenseSourceAccountId);
    const chosenAcc = accounts.find((a) => a.id === expenseSourceAccountId);
    const sourceName = chosenAcc ? chosenAcc.name : 'Kas Laci Konter';
    setSimToast(`✅ Pengeluaran ${formatRupiah(amt)} berhasil disimpan & dipotong dari ${sourceName}. Data tersinkron ke Buku Kas & Bank.`);
    setTimeout(() => setSimToast(null), 4000);
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseNote('');
    setExpenseSourceAccountId('acc-cash');
  };

  // Handle Submit Tambah Modal Kas Laci dari Owner
  const handleSubmitCashTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(cashTopUpAmount);
    if (!amt || amt <= 0) return;

    addShiftCashDrawerTopUp(
      amt,
      cashTopUpSourceId !== 'owner_direct' ? cashTopUpSourceId : undefined,
      cashTopUpNote || 'Tambahan modal uang kas laci dari Owner'
    );

    setShowCashTopUpModal(false);
    setCashTopUpAmount('');
    setCashTopUpNote('');
    setSimToast(
      `✅ Berhasil menambahkan modal ${formatRupiah(amt)} ke Kas Laci Konter! Data otomatis tersinkron ke Buku Kas & Bank.`
    );
    setTimeout(() => setSimToast(null), 4000);
  };

  // Handle Open Transfer / Mutasi Saldo Modal
  const handleOpenTransferModal = (defaultFrom?: string, defaultTo?: string) => {
    const from = defaultFrom || accounts[0]?.id || 'acc-cash';
    setTransferFromId(from);

    if (defaultTo && defaultTo !== from) {
      setTransferToId(defaultTo);
    } else {
      const other = accounts.find((a) => a.id !== from)?.id || accounts[1]?.id || '';
      setTransferToId(other);
    }
    setTransferAmount('');
    setTransferNotes('Pindah saldo kasir / top up server');
    setShowTransferModal(true);
  };

  // Handle Execute Transfer / Mutasi Saldo
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0 || transferFromId === transferToId) return;

    const fromAcc = accounts.find((a) => a.id === transferFromId);
    const toAcc = accounts.find((a) => a.id === transferToId);

    // Jalankan transfer antar akun di buku kas
    transferBetweenAccounts(transferFromId, transferToId, amt, transferNotes);

    // Catatan: Sinkronisasi penambahan modal server berjalan diurus otomatis oleh transferBetweenAccounts di AppContext.

    setShowTransferModal(false);
    setSimToast(
      `✅ Pindah Saldo ${formatRupiah(amt)} dari ${fromAcc?.name || 'Sumber'} ke ${toAcc?.name || 'Tujuan'} berhasil!`
    );
    setTimeout(() => setSimToast(null), 3500);
  };

  // Handle Submit Tutup Shift
  const handleSubmitTutupShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const totalSaldos = activeShift.servers.map((srv, idx) =>
      modalTotalSaldos[idx] !== undefined && modalTotalSaldos[idx] !== ''
        ? Number(modalTotalSaldos[idx])
        : srv.initialBalance + (srv.topUpAmount || 0)
    );

    const finalBals = activeShift.servers.map((srv, idx) =>
      finalBalances[idx] !== undefined && finalBalances[idx] !== ''
        ? Number(finalBalances[idx])
        : 0
    );

    const sales = activeShift.servers.map((srv, idx) =>
      serverGrossSales[idx] !== undefined && serverGrossSales[idx] !== ''
        ? Number(serverGrossSales[idx])
        : 0
    );

    closeShift({
      serverTotalBalances: totalSaldos,
      serverFinalBalances: finalBals,
      serverGrossSales: sales,
      actualFinalCashDrawer: typeof actualCashDrawer === 'number' ? actualCashDrawer : 0,
      notes: closeNotes,
    });

    setShowCloseShiftModal(false);
    setSimToast('✅ Kasir POS berhasil ditutup! Saldo seluruh Server Pulsa & Kas Laci pada Buku Kas & Bank telah tersinkronisasi otomatis.');
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
                onClick={() => handleOpenTransferModal('acc-cash', 'acc-server-1')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600 hover:to-indigo-600 text-blue-200 hover:text-white border border-blue-500/50 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Pindah / Mutasi Saldo antar Kas Laci, Rekening Bank, dan 4 Server Pulsa"
              >
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <span>Pindah / Mutasi Saldo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MinusCircle className="w-4 h-4 text-rose-400" />
                Catat Pengeluaran
              </button>
            </div>
          </div>

          {/* TAMPILAN SALDO KAS LACI KONTER DENGAN AKSI TAMBAH KAS LACI TERPADU */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border-2 border-emerald-500/50 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-white font-extrabold text-base sm:text-lg flex items-center gap-2">
                      Saldo Kas Laci Konter (Uang Tunai)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Tersinkron Buku Kas & Bank
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uang tunai fisik kasir di konter — Akun: <span className="text-emerald-400 font-mono font-medium">Kas Laci Konter (acc-cash)</span>
                  </p>
                </div>
              </div>

              {/* Tombol Aksi Tambah Kas Laci (Owner) menyatu di dalam tampilan Saldo Kas Laci */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCashTopUpAmount('');
                    setCashTopUpSourceId('owner_direct');
                    setCashTopUpNote('Tambahan modal uang kas laci dari Owner');
                    setShowCashTopUpModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
                  title="Tambah modal uang kas laci yang diberikan Owner"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>+ Tambah Kas Laci (Owner)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenTransferModal('acc-cash', undefined)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Pindah / Mutasi Saldo Kas Laci ke Bank atau Server"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Mutasi Kas</span>
                </button>
              </div>
            </div>

            {/* Saldo Grid Kas Laci */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Highlight Saldo Kas Laci Terkini */}
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/60 shadow-inner space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    Saldo Kas Laci Riil:
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/60">
                    Live Buku Kas
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
                  {formatRupiah(getCashDrawerBalance())}
                </div>
                <span className="text-[10px] text-emerald-200/70 block">
                  Uang tunai fisik yang ada di laci saat ini
                </span>
              </div>

              {/* Modal Awal Shift */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Modal Awal Kas Laci:
                </span>
                <div className="text-lg font-bold font-mono text-white">
                  {formatRupiah(activeShift.initialCashDrawer)}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Saldo laci saat buka shift
                </span>
              </div>

              {/* Tambahan Modal Owner */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Tambahan Kas Owner:
                  </span>
                  {activeShift.additionalCashDrawer ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                      Ada Tambahan
                    </span>
                  ) : null}
                </div>
                <div className="text-lg font-bold font-mono text-teal-300">
                  +{formatRupiah(activeShift.additionalCashDrawer || 0)}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {activeShift.additionalCashDrawer ? 'Uang diserahkan owner selama shift' : 'Belum ada uang tambahan'}
                </span>
              </div>

              {/* Total Modal Kasir Berjalan */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Total Modal Kasir Berjalan:
                </span>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {formatRupiah(activeShift.initialCashDrawer + (activeShift.additionalCashDrawer || 0))}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Modal Awal + Tambahan Owner
                </span>
              </div>
            </div>
          </div>

          {/* 4 Servers Status Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-400" />
                Saldo Server Pulsa & Kuota PPOB ({activeShift.servers.length} Server):
              </h3>
              <span className="text-[11px] text-slate-400">
                Nilai riil modal berjalan saat ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeShift.servers.map((srv, idx) => {
                const colorStyle = getServerColorStyle(idx);
                return (
                  <div
                    key={srv.serverId}
                    className={`p-4 rounded-2xl border ${colorStyle.border} ${colorStyle.bg} space-y-2.5 flex flex-col justify-between`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase truncate ${colorStyle.text}`}>{srv.serverName}</span>
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
                          <span className="text-[10px] text-blue-400 block font-mono">
                            (Awal: {formatRupiah(srv.initialBalance)} + Top Up: +{formatRupiah(srv.topUpAmount)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-emerald-400 font-semibold text-[11px]">Siap Transaksi</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenTransferModal(undefined, srv.serverId.startsWith('acc-') ? srv.serverId : `acc-${srv.serverId}`)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-[10px] text-cyan-300 hover:text-white font-semibold flex items-center gap-1 transition"
                        title={`Pindah saldo / Top up modal ke ${srv.serverName}`}
                      >
                        <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                        <span>Mutasi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Shift Snapshot Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Modal Kas Laci:</span>
              <div className="text-base font-bold font-mono text-white">
                {formatRupiah(activeShift.initialCashDrawer + (activeShift.additionalCashDrawer || 0))}
              </div>
              {activeShift.additionalCashDrawer ? (
                <span className="text-[10px] text-emerald-400 block font-mono">
                  (Awal: {formatRupiah(activeShift.initialCashDrawer)} + Owner: +{formatRupiah(activeShift.additionalCashDrawer)})
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 block font-mono">
                  Modal Awal Kasir
                </span>
              )}
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

          {/* PANEL LIVE REKAP & HITUNG LABA 4 SERVER PULSA (TERHUBUNG LANGSUNG DENGAN TUTUP SHIFT & BUKU KAS) */}
          <div className="p-5 rounded-3xl bg-slate-950/95 border border-emerald-500/40 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    Live Rekap & Hitung Laba Server Pulsa ({activeShift.servers.length} Server)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Otomatis Terhubung ke Tutup Shift
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Input atau sinkronkan data server pulsa di sini sekali saja. Angka langsung terhubung ke Tutup Shift & Buku Kas tanpa perlu input ulang!
                  </p>
                </div>
              </div>

              {/* Action & Formula Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={syncFinalBalancesFromBukuKas}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Ambil Saldo Akhir seluruh Server Pulsa langsung dari Buku Kas & Bank"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  🔄 Sinkronkan Saldo Akhir dari Buku Kas
                </button>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600/60 text-xs font-mono text-emerald-300">
                  <span className="font-bold text-amber-300">RUMUS:</span>
                  <span>(Penjualan + Saldo Akhir) - Total Saldo Modal = Laba Bersih</span>
                </div>
              </div>
            </div>

            {/* Dynamic Servers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {activeShift.servers.map((srv, idx) => {
                const totalModal = typeof modalTotalSaldos[idx] === 'number'
                  ? Number(modalTotalSaldos[idx])
                  : (srv.initialBalance + (srv.topUpAmount || 0));
                const finalBal = typeof finalBalances[idx] === 'number' ? Number(finalBalances[idx]) : 0;
                const sales = typeof serverGrossSales[idx] === 'number' ? Number(serverGrossSales[idx]) : 0;
                const usage = Math.max(0, totalModal - finalBal);
                const profit = (sales + finalBal) - totalModal;
                const matchedAcc = accounts.find((a) => a.id === srv.serverId || a.name === srv.serverName) || serverAccounts[idx];
                const liveKasBal = matchedAcc ? matchedAcc.balance : 0;

                return (
                  <div
                    key={srv.serverId}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3 transition"
                  >
                    {/* Header: Server Name & Brand */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white truncate max-w-[130px]" title={srv.serverName}>
                          {srv.serverName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-blue-400 border border-slate-800">
                          Server {idx + 1}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Buku Kas Terkini:</span>
                        <span className="font-mono text-blue-300 font-semibold">{formatRupiah(liveKasBal)}</span>
                      </div>
                    </div>

                    {/* Inputs for this server */}
                    <div className="space-y-2">
                      {/* Input 1: Total Saldo Modal */}
                      <div>
                        <div className="flex justify-between text-[10px] text-blue-300 mb-0.5 font-medium">
                          <span>1. Total Modal (Rp):</span>
                          <span className="text-slate-500 text-[9px]">Awal+TopUp</span>
                        </div>
                        <input
                          type="number"
                          placeholder="0"
                          value={modalTotalSaldos[idx] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setModalTotalSaldos((prev) => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          className="w-full bg-slate-950 border border-blue-900/50 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Input 2: Saldo Akhir */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5 font-medium">
                          <span>2. Saldo Akhir (Rp):</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFinalBalances((prev) => {
                                const copy = [...prev];
                                copy[idx] = liveKasBal;
                                return copy;
                              });
                            }}
                            className="text-[9px] text-blue-400 hover:underline"
                            title="Salin dari saldo buku kas"
                          >
                            Salin Kas
                          </button>
                        </div>
                        <input
                          type="number"
                          placeholder="0"
                          value={finalBalances[idx] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setFinalBalances((prev) => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Input 3: Penjualan Pulsa */}
                      <div>
                        <div className="flex justify-between text-[10px] text-emerald-300 mb-0.5 font-medium">
                          <span>3. Penjualan (Rp):</span>
                          <span className="text-slate-500 text-[9px]">Omset Diterima</span>
                        </div>
                        <input
                          type="number"
                          placeholder="0"
                          value={serverGrossSales[idx] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setServerGrossSales((prev) => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          className="w-full bg-slate-950 border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Server Profit Calculation Box */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Pemakaian:</span>
                        <span className="font-mono text-amber-300 font-semibold">{formatRupiah(usage)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400 font-medium text-[10px]">Laba Bersih:</span>
                        <span className={`font-mono font-extrabold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {profit >= 0 ? `+${formatRupiah(profit)}` : `-${formatRupiah(Math.abs(profit))}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Summary Bar & Direct Close Shift Trigger */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Total Perolehan Laba Server Pulsa (Live):</div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
                    +{formatRupiah(computedShiftRecap?.totalPulseProfit || 0)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleOpenCloseModal}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tutup Shift
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
                  Masukkan saldo awal laci kasir dan saldo server pulsa saat memulai tugas shift.
                </p>
              </div>
            </div>
          </div>

          {/* Sync Information Banner */}
          <div className="p-3 bg-blue-950/40 rounded-2xl border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Saldo awal otomatis tersinkron dengan <strong>Saldo Server Pulsa & Kuota PPOB</strong> di Buku Kas & Bank. Anda tetap dapat mengetik/mengubah nilai secara manual.
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

            {/* Input Saldo Awal Server Pulsa Dinamis */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-400" />
                  Input Saldo Awal Server Pulsa & Kuota PPOB ({bukaServers.length} Server):
                </h3>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Tersinkron Buku Kas (Bisa Diedit)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bukaServers.map((srv, idx) => {
                  const colorStyle = getServerColorStyle(idx);
                  const matchedAcc = accounts.find((a) => a.id === srv.id) || serverAccounts[idx];
                  const liveBal = matchedAcc ? matchedAcc.balance : 0;
                  return (
                    <div key={srv.id || idx} className={`p-4 bg-slate-950 rounded-2xl border ${colorStyle.border} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${colorStyle.text} truncate block`} title={srv.name}>
                          {srv.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          Server {idx + 1}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Saldo Awal (Rp):</span>
                        <span className={`${colorStyle.text} font-mono font-semibold`}>Kas: {formatRupiah(liveBal)}</span>
                      </div>
                      <input
                        type="number"
                        value={srv.balance}
                        onChange={(e) => {
                          setHasManuallyEditedBuka(true);
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setBukaServers((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], balance: val };
                            return next;
                          });
                        }}
                        className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none ${colorStyle.focus}`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Modal Summary */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">Total Modal Server Pulsa: </span>
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

      {/* 2. RIWAYAT REKAP SHIFT & AKTIFITAS TRANSAKSI KASIR (SHIFT, TRANSFER, TARIK TUNAI, AKSESORIS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden space-y-4">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Riwayat Rekap Shift & Aktifitas Transaksi Kasir
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mencatat seluruh rekap shift serta riwayat transaksi Transfer Uang, Tarik Tunai, dan Penjualan Aksesoris HP.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi, kasir, pelanggan..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Filter Tabs Navigation */}
        <div className="px-4 sm:px-5 flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setHistoryTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              historyTab === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Semua Aktifitas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {combinedActivities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryTab('shifts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              historyTab === 'shifts'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Rekap Tutup Shift</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {shifts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryTab('transfer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              historyTab === 'transfer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-indigo-300" />
            <span>Transfer Uang</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {transactions.filter((t) => t.type === 'transfer_uang').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryTab('tarik')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              historyTab === 'tarik'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tarik Tunai</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {transactions.filter((t) => t.type === 'tarik_tunai').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryTab('aksesoris')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              historyTab === 'aksesoris'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-300" />
            <span>Aksesoris HP</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {transactions.filter((t) => t.type === 'aksesoris').length}
            </span>
          </button>
        </div>

        {/* VIEW 1: REKAP BUKU SHIFT TAB (DENGAN RINCIAN TRANSAKSI PER SHIFT) */}
        {historyTab === 'shifts' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Shift / Kasir</th>
                  <th className="py-3 px-4 font-semibold">Waktu Buka / Tutup</th>
                  <th className="py-3 px-4 font-semibold text-right">Penjualan 4 Server</th>
                  <th className="py-3 px-4 font-semibold text-right">Laba Pulsa</th>
                  <th className="py-3 px-4 font-semibold text-right">Laba Lain (Trf/Tarik/Acc)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Laba Bersih</th>
                  <th className="py-3 px-4 font-semibold text-center">Status Uang Kasir</th>
                  <th className="py-3 px-4 font-semibold text-center">Rincian Transaksi</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Belum ada catatan shift tersimpan.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => {
                    const isOpen = s.status === 'open';
                    const isExpanded = expandedShiftId === s.id;
                    const shiftTrx = getTransactionsForShift(s);
                    const trfTrx = shiftTrx.filter((t) => t.type === 'transfer_uang');
                    const tarikTrx = shiftTrx.filter((t) => t.type === 'tarik_tunai');
                    const accTrx = shiftTrx.filter((t) => t.type === 'aksesoris');
                    const otherProfit =
                      (s.transferAdminProfit || 0) +
                      (s.tarikTunaiAdminProfit || 0) +
                      (s.accessoryProfit || 0);

                    return (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-slate-850/50 transition">
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
                          <td className="py-3 px-4 text-right font-mono font-semibold text-teal-400">
                            +{formatRupiah(otherProfit)}
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
                            <button
                              type="button"
                              onClick={() => setExpandedShiftId(isExpanded ? null : s.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 mx-auto transition ${
                                isExpanded
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                              }`}
                              title="Tampilkan rincian transaksi transfer, tarik tunai, dan aksesoris pada shift ini"
                            >
                              <span>{shiftTrx.length} Trx</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
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

                        {/* ACCORDION RINCIAN TRANSAKSI SHIFT */}
                        {isExpanded && (
                          <tr className="bg-slate-950/70 border-b border-blue-900/40">
                            <td colSpan={9} className="p-4 sm:p-5">
                              <div className="space-y-4 max-w-6xl mx-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span className="font-extrabold text-white text-xs">
                                      Rincian Transaksi yang Terjadi pada Shift #{s.shiftNumber} ({s.cashierName})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                      Transfer: {trfTrx.length} trx (+{formatRupiah(s.transferAdminProfit || 0)})
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                      Tarik Tunai: {tarikTrx.length} trx (+{formatRupiah(s.tarikTunaiAdminProfit || 0)})
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                      Aksesoris: {accTrx.length} trx (+{formatRupiah(s.accessoryProfit || 0)})
                                    </span>
                                  </div>
                                </div>

                                {shiftTrx.length === 0 ? (
                                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-900/60 rounded-xl">
                                    Tidak ada transaksi transfer, tarik tunai, atau penjualan aksesoris yang tercatat pada rentang shift ini.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <tr>
                                          <th className="py-2.5 px-3">Waktu</th>
                                          <th className="py-2.5 px-3">Layanan</th>
                                          <th className="py-2.5 px-3">Pelanggan / Target</th>
                                          <th className="py-2.5 px-3 text-right">Nominal / Omset</th>
                                          <th className="py-2.5 px-3 text-right">Biaya Admin / Laba</th>
                                          <th className="py-2.5 px-3 text-center">Metode</th>
                                          <th className="py-2.5 px-3 text-center">Struk</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800">
                                        {shiftTrx.map((trx) => (
                                          <tr key={trx.id} className="hover:bg-slate-800/40">
                                            <td className="py-2 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                                              {new Date(trx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                            </td>
                                            <td className="py-2 px-3">
                                              {trx.type === 'transfer_uang' ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                                                  Transfer Uang
                                                </span>
                                              ) : trx.type === 'tarik_tunai' ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                  Tarik Tunai
                                                </span>
                                              ) : trx.type === 'aksesoris' ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                                  Aksesoris HP
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                                  {trx.type}
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-slate-200">
                                              <div className="font-semibold text-white">{trx.targetName || trx.title}</div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                {trx.targetNumber ? `${trx.providerBank || ''} ${trx.targetNumber}` : trx.notes || '-'}
                                              </div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                                              {formatRupiah(trx.nominal || trx.totalAmount)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                              +{formatRupiah(trx.profit || trx.adminFee || 0)}
                                            </td>
                                            <td className="py-2 px-3 text-center uppercase font-mono text-[10px] text-slate-400">
                                              {trx.paymentMethod}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                              <button
                                                type="button"
                                                onClick={() => setActiveReceipt(trx)}
                                                className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                                                title="Lihat Struk Transaksi"
                                              >
                                                <Eye className="w-3 h-3" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW 2: COMBINED ACTIVITIES FEED (ALL / TRANSFER / TARIK / AKSESORIS) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Waktu & Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Jenis Aktifitas</th>
                  <th className="py-3 px-4 font-semibold">Rincian / Pelanggan / Akun</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal / Omset</th>
                  <th className="py-3 px-4 font-semibold text-right">Laba / Komisi</th>
                  <th className="py-3 px-4 font-semibold">Keterangan Tambahan</th>
                  <th className="py-3 px-4 font-semibold text-center">Struk / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      Tidak ada aktifitas transaksi yang sesuai dengan filter atau kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const isShift = act.type === 'shift_close' || act.type === 'shift_open';

                    return (
                      <tr key={act.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {formatDateIndo(act.timestamp)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(act.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {act.type === 'shift_close' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <CheckCircle2 className="w-3 h-3 text-amber-400" />
                              Tutup Shift
                            </span>
                          ) : act.type === 'shift_open' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              <Clock className="w-3 h-3 text-blue-400" />
                              Buka Shift
                            </span>
                          ) : act.type === 'transfer_uang' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              <Send className="w-3 h-3 text-indigo-400" />
                              Transfer Uang
                            </span>
                          ) : act.type === 'tarik_tunai' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <Banknote className="w-3 h-3 text-emerald-400" />
                              Tarik Tunai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              <ShoppingBag className="w-3 h-3 text-purple-400" />
                              Aksesoris HP
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-xs">{act.title}</div>
                          <div className="text-[11px] text-slate-400">{act.subtitle}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                          {formatRupiah(act.amount)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400">
                          {act.profit > 0 ? `+${formatRupiah(act.profit)}` : act.profit < 0 ? `-${formatRupiah(Math.abs(act.profit))}` : 'Rp 0'}
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {act.details || '-'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isShift && act.rawShift ? (
                            <button
                              type="button"
                              onClick={() => setActiveShiftReceipt(act.rawShift!)}
                              className="p-1.5 rounded-lg bg-amber-900/50 hover:bg-amber-600 text-amber-300 hover:text-white transition"
                              title="Lihat Rekap Shift & Struk"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : act.rawTransaction ? (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(act.rawTransaction!)}
                              className="p-1.5 rounded-lg bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-white transition"
                              title="Lihat Struk Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
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

              {/* Saldo Server Inputs Dinamis */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold uppercase block text-xs">
                    Saldo Awal Server Pulsa & Kuota PPOB ({bukaServers.length} Server):
                  </span>
                  <button
                    type="button"
                    onClick={syncBukaShiftFromBukuKas}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sinkron Buku Kas
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bukaServers.map((srv, idx) => {
                    const colorStyle = getServerColorStyle(idx);
                    const matchedAcc = accounts.find((a) => a.id === srv.id) || serverAccounts[idx];
                    const liveBal = matchedAcc ? matchedAcc.balance : 0;
                    return (
                      <div key={srv.id || idx} className={`p-3 bg-slate-950 rounded-xl border ${colorStyle.border} space-y-1`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold ${colorStyle.text} truncate block`} title={srv.name}>
                            {srv.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Kas: {formatRupiah(liveBal)}</span>
                        </div>
                        <input
                          type="number"
                          value={srv.balance}
                          onChange={(e) => {
                            setHasManuallyEditedBuka(true);
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setBukaServers((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], balance: val };
                              return next;
                            });
                          }}
                          placeholder={`Saldo Awal Server ${idx + 1}`}
                          className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none ${colorStyle.focus}`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Modal Server Pulsa:</span>
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

      {/* MODAL TUTUP SHIFT: HANYA CASH OPNAME & KETERANGAN (DATA 4 SERVER LANGSUNG DARI LIVE REKAP) */}
      {showCloseShiftModal && activeShift && computedShiftRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Tutup Shift #{activeShift.shiftNumber} & Cash Opname
                  </h3>
                  <p className="text-[11px] text-slate-400">Kasir: {activeShift.cashierName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTutupShift} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Ringkasan Server Pulsa (Sudah Terisi Otomatis dari Form Live Rekap) */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-200 text-xs">
                      Rekap Server Pulsa ({activeShift.servers.length} Server)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                    ✓ Otomatis tersinkron dari layar shift
                  </span>
                </div>

                {/* Servers Mini Cards Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {computedShiftRecap.serverStats.map((srv, idx) => (
                    <div
                      key={srv.serverId}
                      className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-white truncate">
                        <span className="truncate" title={srv.serverName}>{srv.serverName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Saldo Akhir:</span>
                        <span className="font-mono font-semibold text-blue-300">
                          {formatRupiah(srv.finalBal)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Penjualan:</span>
                        <span className="font-mono font-semibold text-white">
                          {formatRupiah(srv.sales)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                        <span>Laba:</span>
                        <span className={`font-mono font-bold ${srv.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {srv.profit >= 0 ? '+' : ''}{formatRupiah(srv.profit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Laba Bersih Shift */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Laba Bersih Shift Ini:</span>
                    <span className="text-lg font-extrabold font-mono text-emerald-400">
                      +{formatRupiah(computedShiftRecap.overallNetProfit)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 sm:text-right">
                    <span>Laba Server: <strong className="text-emerald-300">+{formatRupiah(computedShiftRecap.totalPulseProfit)}</strong></span>
                    {activeShift.accessoryProfit > 0 && <span className="ml-2">| Aksesoris: <strong className="text-emerald-300">+{formatRupiah(activeShift.accessoryProfit)}</strong></span>}
                    {(activeShift.transferAdminProfit + activeShift.tarikTunaiAdminProfit) > 0 && (
                      <span className="ml-2">| Admin: <strong className="text-emerald-300">+{formatRupiah(activeShift.transferAdminProfit + activeShift.tarikTunaiAdminProfit)}</strong></span>
                    )}
                    {computedShiftRecap.totalExp > 0 && (
                      <span className="ml-2">| Beban: <strong className="text-rose-400">-{formatRupiah(computedShiftRecap.totalExp)}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rekonsiliasi Kas Laci Kasir (Cash Opname) */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    Rekonsiliasi Kas Laci Kasir (Cash Opname)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActualCashDrawer(computedShiftRecap.expectedCashDrawer)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition self-start sm:self-auto"
                  >
                    ⚡ Set Uang Pas ({formatRupiah(computedShiftRecap.expectedCashDrawer)})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Uang Kas Yang Seharusnya Ada di Laci:
                    </span>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-lg font-bold font-mono text-white">
                      {formatRupiah(computedShiftRecap.expectedCashDrawer)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      (Kas Awal {activeShift.additionalCashDrawer ? `+ Tambahan Owner ${formatRupiah(activeShift.additionalCashDrawer)} ` : ''}+ Jual Pulsa + Aksesoris + Admin Transfer {(activeShift.tarikTunaiCashOut || 0) > 0 ? `- Tarik Tunai (${formatRupiah(activeShift.tarikTunaiCashOut || 0)}) + Fee Tunai (${formatRupiah(activeShift.tarikTunaiFeeCashIn || 0)}) ` : ''}- Beban Laci)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      Hitungan Uang Fisik Nyata di Laci Kasir (Rp):
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={actualCashDrawer}
                      onChange={(e) => setActualCashDrawer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl px-3 py-2.5 text-lg font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      autoFocus
                    />
                    <div className="mt-1.5 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Selisih Kasir:</span>
                      <strong
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          computedShiftRecap.cashDiff === 0
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : computedShiftRecap.cashDiff > 0
                            ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}
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

              {/* Notes / Keterangan */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Keterangan / Catatan Shift (Opsional):</label>
                <input
                  type="text"
                  placeholder="Keterangan penutupan shift (misal: uang fisik laci pas, semua transaksi lancar)..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Buku Kas Sync Notification Badge */}
              <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-2xl flex items-center gap-2.5 text-slate-300">
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px]">
                  Saat mengklik <strong>"Selesai Tutup Shift"</strong>, nominal <strong className="text-white">Uang Kas Laci ({formatRupiah(typeof actualCashDrawer === 'number' ? actualCashDrawer : 0)})</strong> dan <strong className="text-emerald-400">Saldo Akhir seluruh Server Pulsa</strong> akan otomatis tersinkron ke Buku Kas & Bank.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Selesai Tutup Shift & Sinkronkan Buku Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MODAL KAS LACI DARI OWNER (SINKRON DENGAN BUKU KAS & BANK) */}
      {showCashTopUpModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    Tambah Kas Laci Kasir
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      Modal dari Owner
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Suntik modal uang fisik laci kasir & sinkron otomatis ke Buku Kas & Bank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashTopUpModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCashTopUp} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Asal Sumber Dana */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Sumber Dana Kas Tambahan:</label>
                <select
                  value={cashTopUpSourceId}
                  onChange={(e) => setCashTopUpSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="owner_direct">
                    💵 Suntikan Modal Tunai Langsung dari Owner (Fresh Cash Fisik)
                  </option>
                  {accounts
                    .filter((a) => a.type === 'bank' || a.type === 'ewallet')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        🏦 Tarik Tunai dari {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {cashTopUpSourceId === 'owner_direct'
                    ? 'Uang tunai fisik diserahkan langsung oleh Owner ke laci kasir (Modal Kas Bertambah).'
                    : 'Uang ditarik/ditransfer dari rekening toko untuk mengisi uang tunai di laci kasir.'}
                </span>
              </div>

              {/* Nominal Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold block">
                    Nominal Uang Tambahan (Rp):
                  </label>
                  {cashTopUpAmount !== '' && Number(cashTopUpAmount) > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{formatRupiah(Number(cashTopUpAmount))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={cashTopUpAmount}
                    onChange={(e) => setCashTopUpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono font-extrabold text-base focus:outline-none focus:border-emerald-500"
                    required
                    min={1}
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100000, 200000, 500000, 1000000, 2000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashTopUpAmount(nominal)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] transition"
                    >
                      +{formatRupiah(nominal)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pratinjau Saldo Kas Laci Sebelum vs Sesudah */}
              {(() => {
                const currentCashInBukuKas = getCashDrawerBalance();
                const numAmt = Number(cashTopUpAmount) || 0;
                const newCashInBukuKas = currentCashInBukuKas + numAmt;
                const currentShiftCash = activeShift.initialCashDrawer + (activeShift.additionalCashDrawer || 0);
                const newShiftCash = currentShiftCash + numAmt;

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-900/50 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Pratinjau Sinkronisasi Otomatis:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Kas Laci Konter di Buku Kas:</span>
                        <div className="font-mono font-bold text-slate-300 mt-0.5">
                          {formatRupiah(currentCashInBukuKas)}
                        </div>
                        <div className="font-mono font-extrabold text-emerald-400 text-xs mt-1">
                          👉 {formatRupiah(newCashInBukuKas)}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Modal Laci di Shift Kasir:</span>
                        <div className="font-mono font-bold text-slate-300 mt-0.5">
                          {formatRupiah(currentShiftCash)}
                        </div>
                        <div className="font-mono font-extrabold text-emerald-400 text-xs mt-1">
                          👉 {formatRupiah(newShiftCash)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Catatan / Keterangan */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan / Keperluan:</label>
                <input
                  type="text"
                  value={cashTopUpNote}
                  onChange={(e) => setCashTopUpNote(e.target.value)}
                  placeholder="Contoh: Tambahan modal laci untuk kembalian & transaksi tarik tunai dari Bos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCashTopUpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!cashTopUpAmount || Number(cashTopUpAmount) <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Tambah Kas Laci</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Catat Pengeluaran Shift</h3>
                  <p className="text-[11px] text-slate-400">Pilih sumber dana pemotongan kas atau bank</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              {/* Pilihan Sumber Dana */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 font-semibold block">Pilih Sumber Dana (Asal Uang):</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    Saldo: {formatRupiah(accounts.find((a) => a.id === expenseSourceAccountId)?.balance ?? getCashDrawerBalance())}
                  </span>
                </div>
                <select
                  value={expenseSourceAccountId}
                  onChange={(e) => setExpenseSourceAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                >
                  <optgroup label="💵 Uang Kas Fisik Konter">
                    {accounts
                      .filter((a) => a.id === 'acc-cash' || a.type === 'cash')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          💵 {acc.name} (Saldo: {formatRupiah(acc.balance)})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏦 Rekening Bank & E-Wallet (Buku Kas)">
                    {accounts
                      .filter((a) => a.type === 'bank' || a.type === 'ewallet')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.type === 'bank' ? '🏦' : '📱'} {acc.name} (Saldo: {formatRupiah(acc.balance)})
                        </option>
                      ))}
                  </optgroup>
                </select>

                {/* Info Sinkronisasi Sumber Dana */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">ℹ️</span>
                  <span>
                    {(() => {
                      const selectedAcc = accounts.find((a) => a.id === expenseSourceAccountId);
                      const isCash = !selectedAcc || selectedAcc.id === 'acc-cash' || selectedAcc.type === 'cash';
                      if (isCash) {
                        return 'Uang diambil dari Kas Laci Kasir. Saldo Kas Laci di Buku Kas & Uang Kas Yang Seharusnya Ada di Laci akan otomatis berkurang.';
                      }
                      return `Uang diambil dari ${selectedAcc.name}. Saldo rekening di Buku Kas & Bank akan otomatis dipotong, sedangkan uang fisik di laci kasir tetap utuh.`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Nominal Pengeluaran */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 block font-semibold">Nominal Pengeluaran (Rp):</label>
                  {expenseAmount !== '' && Number(expenseAmount) > 0 && (
                    <span className="text-xs font-mono font-bold text-rose-400">
                      -{formatRupiah(Number(expenseAmount))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 font-bold font-mono text-rose-400 focus:outline-none focus:border-rose-500 text-sm"
                    required
                    min={1}
                  />
                </div>

                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[10000, 20000, 50000, 100000, 200000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setExpenseAmount(nominal)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-[10px] transition"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keterangan Pengeluaran */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Keterangan / Keperluan:</label>
                <input
                  type="text"
                  placeholder="Keterangan pengeluaran (misal: Air galon mineral, ATK, operasional)..."
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500 text-xs"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!expenseAmount || Number(expenseAmount) <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
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

      {/* MODAL PINDAH / MUTASI SALDO (SAMA SEPERTI DI BUKU KAS DAN BANK) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    Pindah / Mutasi Saldo
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                      Kasir POS
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mutasi instan antar Rekening Bank, Kas Laci Kasir, dan Server Pulsa & Kuota PPOB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Sumber & Tujuan Side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dari Akun (Sumber) */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block">Dari Akun (Sumber):</label>
                    <span className="text-[10px] text-rose-400 font-bold">Saldo Berkurang</span>
                  </div>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatRupiah(a.balance)})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const fromAcc = accounts.find((a) => a.id === transferFromId);
                    const currentBal = fromAcc?.balance || 0;
                    const numAmt = Number(transferAmount) || 0;
                    const remainingBal = currentBal - numAmt;
                    return (
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Sisa Saldo:</span>
                        <span className={`font-mono font-bold ${remainingBal < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {formatRupiah(remainingBal)}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Ke Akun (Tujuan) */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block">Ke Akun (Tujuan):</label>
                    <span className="text-[10px] text-emerald-400 font-bold">Saldo Bertambah</span>
                  </div>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatRupiah(a.balance)})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const toAcc = accounts.find((a) => a.id === transferToId);
                    const currentBal = toAcc?.balance || 0;
                    const numAmt = Number(transferAmount) || 0;
                    const newBal = currentBal + numAmt;
                    return (
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Saldo Akhir:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatRupiah(newBal)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Peringatan jika akun sama */}
              {transferFromId === transferToId && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Akun sumber dan tujuan mutasi tidak boleh sama. Silakan pilih akun tujuan yang berbeda.</span>
                </div>
              )}

              {/* Input Nominal Transfer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold block">
                    Jumlah Saldo Ditransfer (Rp):
                  </label>
                  {transferAmount !== '' && Number(transferAmount) > 0 && (
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {formatRupiah(Number(transferAmount))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono font-extrabold text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[50000, 100000, 200000, 500000, 1000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setTransferAmount(nominal)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] transition"
                    >
                      +{formatRupiah(nominal)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const fromAcc = accounts.find((a) => a.id === transferFromId);
                      if (fromAcc && fromAcc.balance > 0) {
                        setTransferAmount(fromAcc.balance);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-600/60 text-blue-300 hover:text-white font-semibold text-[11px] transition"
                  >
                    Semua Saldo Sumber
                  </button>
                </div>
              </div>

              {/* Opsi Sinkronisasi Otomatis Top Up Shift */}
              {activeShift && (
                <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-900/40 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoReflectShiftCheckbox"
                    checked={autoReflectToShift}
                    onChange={(e) => setAutoReflectToShift(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoReflectShiftCheckbox" className="text-[11px] text-blue-200 cursor-pointer select-none">
                    <strong>Sinkronkan ke Shift Berjalan:</strong> Jika akun tujuan adalah Server Pulsa PPOB, otomatis catat nominal ini sebagai <em>Top Up Modal Server</em> pada shift kasir saat ini.
                  </label>
                </div>
              )}

              {/* Catatan Mutasi */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan Mutasi / Keterangan:</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Isi saldo server dari laci kasir / setoran uang kasir ke BRI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!transferAmount || Number(transferAmount) <= 0 || transferFromId === transferToId}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 transition active:scale-98"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Proses Pindah Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
