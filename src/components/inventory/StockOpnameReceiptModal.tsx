import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StockOpnameRecord } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  Printer,
  X,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Package,
  Layers,
  FileText,
} from 'lucide-react';

interface StockOpnameReceiptModalProps {
  record: StockOpnameRecord;
  onClose: () => void;
}

export const StockOpnameReceiptModal: React.FC<StockOpnameReceiptModalProps> = ({
  record,
  onClose,
}) => {
  const { settings } = useApp();
  const [filterDifferenceOnly, setFilterDifferenceOnly] = React.useState(true);

  const displayedItems = filterDifferenceOnly
    ? record.items.filter((it) => it.difference !== 0)
    : record.items;

  const handlePrint = () => {
    window.print();
  };

  const hasDifference = record.totalDifferenceUnits !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Berita Acara Stock Opname</h3>
              <p className="text-xs text-slate-400 font-mono">{record.opnameNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Printable Receipt Paper Container */}
          <div
            id="printable-receipt"
            className="bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-mono text-xs border border-slate-200"
          >
            {/* Header Toko */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              <h2 className="text-base font-black tracking-tight uppercase text-black">{settings.storeName}</h2>
              <p className="text-[10px] text-slate-600 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Telp: {settings.phone}</p>
              <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold tracking-wider text-slate-800 border border-slate-300">
                BUKTI HASIL AUDIT STOCK OPNAME
              </div>
            </div>

            {/* Info Opname */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Berita Acara:</span>
                <span className="font-bold">{record.opnameNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu Audit:</span>
                <span>{formatDateIndo(record.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Petugas / Auditor:</span>
                <span className="font-bold">{record.auditorName}</span>
              </div>
              {record.notes && (
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-600">Catatan:</span>
                  <span className="italic">{record.notes}</span>
                </div>
              )}
            </div>

            {/* Summary Metrics */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Varian Barang:</span>
                <span className="font-bold">{record.totalItemsCounted} item</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Unit Stok Sistem:</span>
                <span>{record.totalSystemUnits} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Unit Stok Fisik:</span>
                <span className="font-bold">{record.totalPhysicalUnits} unit</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dotted border-slate-300 font-bold">
                <span>Total Selisih Fisik:</span>
                <span className={record.totalDifferenceUnits < 0 ? 'text-red-600' : record.totalDifferenceUnits > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                  {record.totalDifferenceUnits > 0 ? `+${record.totalDifferenceUnits}` : record.totalDifferenceUnits} unit
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Nilai Selisih Modal (Rp):</span>
                <span className={record.totalCostDifference < 0 ? 'text-red-600' : record.totalCostDifference > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                  {record.totalCostDifference > 0 ? `+${formatRupiah(record.totalCostDifference)}` : formatRupiah(record.totalCostDifference)}
                </span>
              </div>
            </div>

            {/* Daftar Item */}
            <div className="pt-2.5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase border-b border-slate-300 pb-1">
                <span>Item & SKU</span>
                <div className="flex gap-4">
                  <span>Sistem</span>
                  <span>Fisik</span>
                  <span>Selisih</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {displayedItems.length > 0 ? (
                  displayedItems.map((it, idx) => (
                    <div key={idx} className="border-b border-dotted border-slate-200 pb-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 leading-tight">{it.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {it.sku} &bull; {it.category}
                          </div>
                          {it.reason && (
                            <div className="text-[9px] text-amber-700 italic">
                              Ket: {it.reason}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 shrink-0 text-right">
                          <span className="w-10 text-slate-600">{it.systemStock}</span>
                          <span className="w-10 font-bold">{it.physicalStock}</span>
                          <span className={`w-12 font-bold ${it.difference < 0 ? 'text-red-600' : it.difference > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                            {it.difference > 0 ? `+${it.difference}` : it.difference}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-slate-500 italic">
                    Semua stok fisik cocok 100% dengan stok sistem (tidak ada selisih).
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 mt-4 border-t border-dashed border-slate-400 grid grid-cols-2 text-center text-[10px] text-slate-700">
              <div>
                <p>Petugas Pemeriksa</p>
                <div className="h-10"></div>
                <p className="font-bold underline">({record.auditorName})</p>
              </div>
              <div>
                <p>Pemilik / Pengelola Toko</p>
                <div className="h-10"></div>
                <p className="font-bold underline">({settings.ownerName})</p>
              </div>
            </div>

            <div className="text-center pt-3 mt-3 border-t border-dotted border-slate-300 text-[9px] text-slate-500">
              Stok sistem telah diperbarui secara otomatis sesuai dengan hasil hitungan fisik ini.
            </div>
          </div>

          {/* Toggle filter items */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tampilkan pada tampilan:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterDifferenceOnly(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterDifferenceOnly
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Hanya yang Selisih ({record.items.filter((it) => it.difference !== 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDifferenceOnly(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  !filterDifferenceOnly
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua Barang ({record.items.length})
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/40 transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Berita Acara / Struk
          </button>
        </div>
      </div>
    </div>
  );
};
