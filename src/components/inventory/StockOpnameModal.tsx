import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem, StockOpnameItem, StockOpnameRecord } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { StockOpnameReceiptModal } from './StockOpnameReceiptModal';
import {
  ClipboardCheck,
  Search,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  RotateCcw,
  Printer,
  History,
  X,
  ShieldCheck,
  Trash2,
  Calendar,
  User,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Semua',
  'Kabel & Adaptor',
  'Casing & Pelindung',
  'Audio & TWS',
  'Kartu Perdana & Voucher',
  'Lainnya',
] as const;

const REASON_PRESETS = [
  'Sesuai',
  'Rusak / Cacat Pabrik',
  'Hilang / Tidak Ditemukan',
  'Salah Input Penjualan Kasir',
  'Bonus Kulakan / Salah Kirim',
  'Sample / Display Konter',
  'Lainnya',
];

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ isOpen, onClose }) => {
  const {
    accessories,
    currentUser,
    settings,
    stockOpnameList,
    applyStockOpname,
    deleteStockOpnameRecord,
    isOwnerUnlocked,
    hasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');

  // Audit form state
  const [auditorName, setAuditorName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [filterDifferenceOnly, setFilterDifferenceOnly] = useState<'all' | 'diff' | 'match'>('all');

  // Counts map: { [accessoryId: string]: { physical: number; reason: string } }
  const [counts, setCounts] = useState<Record<string, { physical: number; reason: string }>>({});

  // Active receipt for previewing/printing
  const [viewingReceipt, setViewingReceipt] = useState<StockOpnameRecord | null>(null);

  // Confirmation dialog state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<StockOpnameRecord | null>(null);

  // Initialize auditor name and default counts when modal opens
  useEffect(() => {
    if (isOpen) {
      setAuditorName(currentUser?.name || settings.ownerName || 'Petugas Konter');
      setNotes('Stock Opname Rutin');

      // Initialize all items physical count = system count by default for seamless workflow
      const initialMap: Record<string, { physical: number; reason: string }> = {};
      accessories.forEach((item) => {
        initialMap[item.id] = { physical: item.stock, reason: '' };
      });
      setCounts(initialMap);
    }
  }, [isOpen, accessories, currentUser, settings.ownerName]);

  // Quick Action: Match all physical = system
  const handleMatchAllWithSystem = () => {
    const updated: Record<string, { physical: number; reason: string }> = {};
    accessories.forEach((item) => {
      updated[item.id] = { physical: item.stock, reason: '' };
    });
    setCounts(updated);
  };

  // Quick Action: Reset all physical = 0
  const handleResetAllToZero = () => {
    const updated: Record<string, { physical: number; reason: string }> = {};
    accessories.forEach((item) => {
      updated[item.id] = { physical: 0, reason: 'Belum Dihitung' };
    });
    setCounts(updated);
  };

  // Update physical count for single item
  const handleSetPhysical = (id: string, value: number) => {
    const val = Math.max(0, value);
    setCounts((prev) => {
      const current = prev[id] || { physical: 0, reason: '' };
      return {
        ...prev,
        [id]: { ...current, physical: val },
      };
    });
  };

  const handleDeltaPhysical = (id: string, delta: number) => {
    setCounts((prev) => {
      const current = prev[id] || { physical: 0, reason: '' };
      const nextVal = Math.max(0, current.physical + delta);
      return {
        ...prev,
        [id]: { ...current, physical: nextVal },
      };
    });
  };

  const handleSetReason = (id: string, reason: string) => {
    setCounts((prev) => {
      const current = prev[id] || { physical: 0, reason: '' };
      return {
        ...prev,
        [id]: { ...current, reason },
      };
    });
  };

  // Compile full opname items list
  const opnameItems: StockOpnameItem[] = useMemo(() => {
    return accessories.map((acc) => {
      const countData = counts[acc.id] || { physical: acc.stock, reason: '' };
      const physicalStock = countData.physical;
      const difference = physicalStock - acc.stock;
      const costDifference = difference * acc.priceCost;

      return {
        accessoryId: acc.id,
        sku: acc.sku,
        name: acc.name,
        category: acc.category,
        systemStock: acc.stock,
        physicalStock,
        difference,
        priceCost: acc.priceCost,
        priceSell: acc.priceSell,
        costDifference,
        reason: countData.reason,
      };
    });
  }, [accessories, counts]);

  // Filtered items for display
  const displayedItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return opnameItems.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term);

      let matchDiff = true;
      if (filterDifferenceOnly === 'diff') {
        matchDiff = item.difference !== 0;
      } else if (filterDifferenceOnly === 'match') {
        matchDiff = item.difference === 0;
      }

      return matchCat && matchSearch && matchDiff;
    });
  }, [opnameItems, selectedCategory, searchTerm, filterDifferenceOnly]);

  // Overall totals
  const totalItemsCounted = opnameItems.length;
  const itemsWithDifference = useMemo(() => opnameItems.filter((it) => it.difference !== 0), [opnameItems]);
  const totalDifferenceUnits = useMemo(() => opnameItems.reduce((sum, it) => sum + it.difference, 0), [opnameItems]);
  const totalCostDifference = useMemo(() => opnameItems.reduce((sum, it) => sum + it.costDifference, 0), [opnameItems]);
  const totalPhysicalUnits = useMemo(() => opnameItems.reduce((sum, it) => sum + it.physicalStock, 0), [opnameItems]);
  const totalSystemUnits = useMemo(() => opnameItems.reduce((sum, it) => sum + it.systemStock, 0), [opnameItems]);

  const handleApplyOpname = () => {
    const record = applyStockOpname({
      auditorName: auditorName.trim() || 'Petugas Konter',
      notes: notes.trim() || '',
      items: opnameItems,
    });

    setShowConfirmModal(false);
    setViewingReceipt(record);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-950/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Stock Opname Aksesoris HP</span>
                <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold px-2 py-0.5 rounded-full">
                  Audit Fisik
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pencocokan stok fisik riil di etalase/gudang dengan stok sistem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs switcher: Sesi Baru vs Riwayat */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Sesi Audit Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Audit ({stockOpnameList.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Sesi Audit Baru */}
        {activeTab === 'audit' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top Control Bar: Auditor, Catatan & Quick Match */}
            <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-400" />
                    Nama Petugas / Pemeriksa:
                  </label>
                  <input
                    type="text"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    placeholder="Nama pemeriksa..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    Catatan Sesi Opname:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Audit Rutin Mingguan, Etalase Depan..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMatchAllWithSystem}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Isi seluruh stok fisik sama dengan stok sistem sebagai titik awal"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fisik = Sistem</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllToZero}
                    className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-[11px] font-medium border border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Nolkan seluruh hitungan fisik"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nolkan</span>
                  </button>
                </div>
              </div>

              {/* Search, Categories & Discrepancy Filter */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-850">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari SKU atau nama barang..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                    {CATEGORIES.slice(0, 4).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer border ${
                          selectedCategory === cat
                            ? 'bg-purple-600 text-white border-purple-500 font-semibold shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Filter Status Selisih */}
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setFilterDifferenceOnly('all')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        filterDifferenceOnly === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Semua ({opnameItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDifferenceOnly('diff')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                        filterDifferenceOnly === 'diff'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-amber-400/90 hover:text-amber-300'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Selisih ({itemsWithDifference.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDifferenceOnly('match')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        filterDifferenceOnly === 'match'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cocok ({opnameItems.length - itemsWithDifference.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Counting Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold">SKU & Nama Produk</th>
                      <th className="py-3 px-3 text-center font-semibold">Stok Sistem</th>
                      <th className="py-3 px-3 text-center font-semibold">Stok Fisik Riil</th>
                      <th className="py-3 px-3 text-center font-semibold">Selisih</th>
                      <th className="py-3 px-3 text-right font-semibold">Nilai Modal (Rp)</th>
                      <th className="py-3 px-3 font-semibold">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {displayedItems.map((item) => {
                      const isMinus = item.difference < 0;
                      const isPlus = item.difference > 0;
                      const isMatch = item.difference === 0;

                      return (
                        <tr
                          key={item.accessoryId}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            !isMatch ? (isMinus ? 'bg-red-950/15' : 'bg-blue-950/15') : ''
                          }`}
                        >
                          {/* Nama & SKU */}
                          <td className="py-2.5 px-3.5 max-w-xs">
                            <div className="font-semibold text-white leading-snug line-clamp-2">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span className="text-purple-400">{item.sku}</span>
                              <span>&bull;</span>
                              <span>{item.category}</span>
                              <span>&bull;</span>
                              <span>Modal: {formatRupiah(item.priceCost)}</span>
                            </div>
                          </td>

                          {/* Stok Sistem */}
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold inline-block min-w-[36px]">
                              {item.systemStock}
                            </span>
                          </td>

                          {/* Stok Fisik Riil Input */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleDeltaPhysical(item.accessoryId, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min={0}
                                value={item.physicalStock}
                                onChange={(e) => handleSetPhysical(item.accessoryId, Number(e.target.value) || 0)}
                                className="w-12 text-center bg-slate-950 text-white font-mono font-bold text-xs py-1 rounded border border-slate-800 focus:outline-none focus:border-purple-500"
                              />

                              <button
                                type="button"
                                onClick={() => handleDeltaPhysical(item.accessoryId, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetPhysical(item.accessoryId, item.systemStock)}
                                title="Samakan fisik dengan stok sistem"
                                className="px-1.5 py-1 text-[10px] rounded bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white transition font-mono cursor-pointer ml-0.5"
                              >
                                =
                              </button>
                            </div>
                          </td>

                          {/* Selisih */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {isMatch ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px] inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> 0 (Pas)
                              </span>
                            ) : isMinus ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-950/90 text-rose-300 border border-rose-700/80 text-[11px] inline-flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                {item.difference} unit
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-950/90 text-blue-300 border border-blue-700/80 text-[11px]">
                                +{item.difference} unit
                              </span>
                            )}
                          </td>

                          {/* Nilai Selisih Modal (Rp) */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {isMatch ? (
                              <span className="text-slate-500">Rp 0</span>
                            ) : isMinus ? (
                              <span className="text-rose-400 font-bold">{formatRupiah(item.costDifference)}</span>
                            ) : (
                              <span className="text-blue-400 font-bold">+{formatRupiah(item.costDifference)}</span>
                            )}
                          </td>

                          {/* Keterangan / Alasan */}
                          <td className="py-2.5 px-3 max-w-[180px]">
                            <select
                              value={item.reason || ''}
                              onChange={(e) => handleSetReason(item.accessoryId, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                            >
                              <option value="">Pilih Keterangan...</option>
                              {REASON_PRESETS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}

                    {displayedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                          Tidak ada produk aksesoris yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Bar: Financial Impact Summary & Submit Button */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Dihitung:</span>
                  <span className="font-bold text-white text-sm">{totalItemsCounted} Varian</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Unit Fisik:</span>
                  <span className="font-bold text-white text-sm">{totalPhysicalUnits} Unit</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Selisih Unit:</span>
                  <span
                    className={`font-extrabold font-mono text-sm ${
                      totalDifferenceUnits < 0
                        ? 'text-rose-400'
                        : totalDifferenceUnits > 0
                        ? 'text-blue-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {totalDifferenceUnits > 0 ? `+${totalDifferenceUnits}` : totalDifferenceUnits} Unit
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Selisih Nilai Modal:</span>
                  <span
                    className={`font-extrabold font-mono text-base ${
                      totalCostDifference < 0
                        ? 'text-rose-400'
                        : totalCostDifference > 0
                        ? 'text-blue-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {totalCostDifference > 0 ? `+${formatRupiah(totalCostDifference)}` : formatRupiah(totalCostDifference)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Terapkan Penyesuaian Stok</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Riwayat Audit Stock Opname Sebelumnya */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">Riwayat Berita Acara Stock Opname</h3>
                <p className="text-xs text-slate-400">
                  Daftar seluruh sesi audit fisik stok yang telah diterapkan dan disinkronkan ke sistem
                </p>
              </div>
              <span className="text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800 px-2.5 py-1 rounded-lg">
                Total: {stockOpnameList.length} Sesi
              </span>
            </div>

            {stockOpnameList.length > 0 ? (
              <div className="space-y-3">
                {stockOpnameList.map((rec) => {
                  const hasDiscrepancy = rec.totalDifferenceUnits !== 0;

                  return (
                    <div
                      key={rec.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono text-xs font-bold shrink-0">
                            SO
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{rec.opnameNumber}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({formatDateIndo(rec.date)})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Pemeriksa: <strong className="text-slate-200">{rec.auditorName}</strong></span>
                              {rec.notes && <span>&bull; {rec.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(rec)}
                            className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 text-xs font-semibold flex items-center gap-1.5 border border-purple-700/60 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Lihat & Cetak Berita Acara</span>
                          </button>
                          {isOwnerUnlocked && (
                            <button
                              type="button"
                              onClick={() => setRecordToDelete(rec)}
                              className="w-8 h-8 rounded-xl bg-red-950/50 hover:bg-rose-900/80 text-rose-400 flex items-center justify-center transition cursor-pointer"
                              title="Hapus riwayat opname"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-900 font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[10px]">Varian Dihitung:</span>
                          <span className="font-bold text-white">{rec.totalItemsCounted} item</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[10px]">Unit Fisik:</span>
                          <span className="font-bold text-white">{rec.totalPhysicalUnits} unit</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[10px]">Selisih Fisik:</span>
                          <span
                            className={`font-bold ${
                              rec.totalDifferenceUnits < 0
                                ? 'text-rose-400'
                                : rec.totalDifferenceUnits > 0
                                ? 'text-blue-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {rec.totalDifferenceUnits > 0 ? `+${rec.totalDifferenceUnits}` : rec.totalDifferenceUnits} unit
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[10px]">Selisih Nilai Modal:</span>
                          <span
                            className={`font-bold ${
                              rec.totalCostDifference < 0
                                ? 'text-rose-400'
                                : rec.totalCostDifference > 0
                                ? 'text-blue-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {rec.totalCostDifference > 0 ? `+${formatRupiah(rec.totalCostDifference)}` : formatRupiah(rec.totalCostDifference)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400">
                <ClipboardCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium">Belum ada riwayat stock opname</p>
                <p className="text-xs text-slate-500 mt-1">
                  Lakukan sesi audit fisik pertama pada tab &quot;Sesi Audit Baru&quot; di atas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Konfirmasi Penerapan Stock Opname */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-purple-400">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Konfirmasi Hasil Stock Opname</h4>
                  <p className="text-xs text-slate-400">Periksa ringkasan sebelum menyimpan</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pemeriksa / Auditor:</span>
                  <span className="font-bold text-white">{auditorName || 'Petugas Konter'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Varian Diperiksa:</span>
                  <span className="font-bold text-white">{totalItemsCounted} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Barang yang Berubah/Selisih:</span>
                  <span className="font-bold text-amber-400">{itemsWithDifference.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Selisih Unit:</span>
                  <span className={`font-mono font-bold ${totalDifferenceUnits < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {totalDifferenceUnits > 0 ? `+${totalDifferenceUnits}` : totalDifferenceUnits} unit
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-850">
                  <span className="text-slate-400">Dampak Nilai Modal Toko:</span>
                  <span className={`font-mono font-bold ${totalCostDifference < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {totalCostDifference > 0 ? `+${formatRupiah(totalCostDifference)}` : formatRupiah(totalCostDifference)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Menekan tombol <strong>Simpan & Terapkan</strong> akan langsung menyesuaikan stok fisik riil seluruh aksesoris di kasir dan gudang sesuai hitungan ini serta mencatat Berita Acara Stock Opname.
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cek Ulang
                </button>
                <button
                  type="button"
                  onClick={handleApplyOpname}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-950/40 cursor-pointer"
                >
                  Simpan & Terapkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Berita Acara / Struk */}
        {viewingReceipt && (
          <StockOpnameReceiptModal
            record={viewingReceipt}
            onClose={() => setViewingReceipt(null)}
          />
        )}

        {/* Modal Konfirmasi Hapus Riwayat Opname */}
        {recordToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Hapus Riwayat Opname?</h3>
                  <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">No. Berita Acara:</span>
                  <span className="font-mono font-bold text-purple-300">{recordToDelete.opnameNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Petugas:</span>
                  <span className="text-white">{recordToDelete.auditorName}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Waktu:</span>
                  <span>{formatDateIndo(recordToDelete.date || recordToDelete.appliedAt)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan berita acara stock opname ini dari riwayat?
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteStockOpnameRecord(recordToDelete.id);
                    setRecordToDelete(null);
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
    </div>
  );
};
