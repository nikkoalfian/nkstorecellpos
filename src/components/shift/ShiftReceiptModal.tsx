import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftRecord } from '../../types';
import { formatRupiah, formatDateIndo, cleanPhoneNumber } from '../../utils/formatters';
import {
  Printer,
  Share2,
  Copy,
  Check,
  X,
  CheckCircle2,
  Calendar,
  User,
  Server,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const ShiftReceiptModal: React.FC = () => {
  const { activeShiftReceipt, setActiveShiftReceipt, settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState(settings.phone || '');

  if (!activeShiftReceipt) return null;

  const shift = activeShiftReceipt;

  const handlePrint = () => {
    window.print();
  };

  const buildShiftWhatsAppText = (s: ShiftRecord): string => {
    const line = '--------------------------------';
    const serverDetails = s.servers
      .map(
        (srv) => `📱 *${srv.serverName}*
   Total Saldo Modal : ${formatRupiah(srv.totalBalance || (srv.initialBalance + srv.topUpAmount))}
   Saldo Akhir Shift : ${formatRupiah(srv.finalBalance)}
   Pemakaian Saldo   : ${formatRupiah(srv.usage)}
   Penjualan Omset   : ${formatRupiah(srv.grossSales)}
   👉 Laba Bersih    : *+${formatRupiah(srv.profit)}*
   _Rumus: (${formatRupiah(srv.grossSales)} + ${formatRupiah(srv.finalBalance)}) - ${formatRupiah(srv.totalBalance || (srv.initialBalance + srv.topUpAmount))} = +${formatRupiah(srv.profit)}_`
      )
      .join('\n\n');

    const expensesList =
      s.expenses.length > 0
        ? s.expenses.map((e) => `• ${e.note}: -${formatRupiah(e.amount)}`).join('\n')
        : '• Tidak ada pengeluaran';

    const diffText =
      (s.cashDifference || 0) === 0
        ? '✅ Uang Kas Pas (Cocok)'
        : (s.cashDifference || 0) > 0
        ? `🟢 Lebih: +${formatRupiah(s.cashDifference || 0)}`
        : `🔴 Minus / Kurang: ${formatRupiah(s.cashDifference || 0)}`;

    return `📊 *REKAP TUTUP SHIFT KASIR*
*${settings.storeName.toUpperCase()}*
${line}
Shift: #${s.shiftNumber} | Kasir: *${s.cashierName}*
Buka : ${formatDateIndo(s.startTime)}
Tutup: ${s.endTime ? formatDateIndo(s.endTime) : '-'}
${line}
*REKAP 4 SERVER PULSA & KUOTA:*
${serverDetails}

Total Jual Pulsa : ${formatRupiah(s.totalPulseSales)}
Total Pakai Saldo: ${formatRupiah(s.totalPulseUsage)}
*Laba Pulsa & PPOB: +${formatRupiah(s.totalPulseProfit)}*
${line}
*PENDAPATAN LAIN SHIFT INI:*
• Laba Aksesoris HP: +${formatRupiah(s.accessoryProfit)}
• Laba Admin Transfer: +${formatRupiah(s.transferAdminProfit)}
• Laba Admin Tarik Tunai: +${formatRupiah(s.tarikTunaiAdminProfit)}

*PENGELUARAN SHIFT:*
${expensesList}
Total Pengeluaran: -${formatRupiah(s.totalExpenses)}
${line}
💰 *TOTAL LABA BERSIH SHIFT: ${formatRupiah(s.netProfit)}* 💰
${line}
*KONTROL UANG LACI KASIR:*
• Modal Kas Awal : ${formatRupiah(s.initialCashDrawer)}
• Kas Seharusnya : ${formatRupiah(s.expectedCashDrawer || 0)}
• Kas Nyata Fisik: ${formatRupiah(s.finalCashDrawer || 0)}
• Status Selisih : *${diffText}*
${line}
${s.notes ? `Catatan: ${s.notes}\n${line}` : ''}
_Laporan rekap resmi ${settings.storeName}_`;
  };

  const handleCopy = () => {
    const text = buildShiftWhatsAppText(shift);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = buildShiftWhatsAppText(shift);
    const clean = cleanPhoneNumber(targetPhone);
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              Laporan Rekap Tutup Shift #{shift.shiftNumber}
            </h3>
          </div>
          <button
            onClick={() => setActiveShiftReceipt(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Top */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg shadow-blue-900/30"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Struk
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-lg shadow-emerald-900/30"
          >
            <Share2 className="w-4 h-4" />
            Kirim ke WA Pemilik
          </button>
          <button
            onClick={handleCopy}
            title="Salin Teks Rekap"
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* WhatsApp Target Phone Input if needed */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">Kirim WA ke Nomor:</span>
          <input
            type="tel"
            value={targetPhone}
            onChange={(e) => setTargetPhone(e.target.value)}
            placeholder="08xx..."
            className="w-48 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div className="p-5 flex justify-center bg-slate-950/60 max-h-[60vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className="receipt-paper w-full max-w-[360px] p-5 rounded-sm shadow-md text-slate-900 text-xs leading-relaxed border-t-4 border-blue-600 font-mono"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="flex justify-center mb-1.5">
                <img
                  src={settings.logoUrl || '/logo_nk.jpg'}
                  alt={settings.storeName}
                  className="w-12 h-12 object-contain rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/logo_nk_960b32b2.jpg';
                  }}
                />
              </div>
              <h2 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                {settings.storeName}
              </h2>
              <div className="text-[11px] text-slate-700 font-bold uppercase mt-1">
                LAPORAN REKAP TUTUP SHIFT #{shift.shiftNumber}
              </div>
              <p className="text-[10px] text-slate-600">Kasir: {shift.cashierName}</p>
            </div>

            {/* Time and Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu Buka:</span>
                <span>{formatDateIndo(shift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu Tutup:</span>
                <span>{shift.endTime ? formatDateIndo(shift.endTime) : '-'}</span>
              </div>
            </div>

            {/* 4 Servers Details Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-2">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider border-b border-dotted border-slate-300 pb-1">
                RINCIAN 4 SERVER PULSA & KUOTA:
              </div>

              {shift.servers.map((srv, idx) => (
                <div key={srv.serverId} className="space-y-0.5 bg-slate-50 p-1.5 rounded">
                  <div className="font-bold text-slate-900 text-[11px]">
                    {idx + 1}. {srv.serverName}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Total Saldo Modal:</span>
                    <span className="font-mono font-semibold">
                      {formatRupiah(srv.totalBalance || (srv.initialBalance + srv.topUpAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Saldo Akhir Shift:</span>
                    <span className="font-mono">{formatRupiah(srv.finalBalance)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Pemakaian Saldo:</span>
                    <span className="font-mono">{formatRupiah(srv.usage)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Total Penjualan:</span>
                    <span className="font-mono font-semibold">{formatRupiah(srv.grossSales)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-emerald-800 pt-0.5 border-t border-dotted border-slate-300">
                    <span>Laba Bersih Server:</span>
                    <span className="font-mono">+{formatRupiah(srv.profit)}</span>
                  </div>
                </div>
              ))}

              <div className="pt-1 text-[11px] font-bold flex justify-between">
                <span>Total Laba 4 Server:</span>
                <span className="text-emerald-800">{formatRupiah(shift.totalPulseProfit)}</span>
              </div>
            </div>

            {/* Other Services Profits */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                LAYANAN LAIN SELAMA SHIFT:
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Laba Penjualan Aksesoris:</span>
                <span>+{formatRupiah(shift.accessoryProfit)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Laba Admin Transfer Uang:</span>
                <span>+{formatRupiah(shift.transferAdminProfit)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Laba Admin Tarik Tunai:</span>
                <span>+{formatRupiah(shift.tarikTunaiAdminProfit)}</span>
              </div>
              {shift.totalExpenses > 0 && (
                <div className="flex justify-between text-red-700 font-semibold pt-1 border-t border-dotted border-slate-200">
                  <span>Pengeluaran Kasir (Biaya):</span>
                  <span>-{formatRupiah(shift.totalExpenses)}</span>
                </div>
              )}
            </div>

            {/* Total Profit Shift */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] bg-slate-100 p-2 rounded my-1 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">
                TOTAL KEUNTUNGAN BERSIH SHIFT INI:
              </span>
              <div className="text-base font-extrabold text-emerald-800 font-mono my-0.5">
                {formatRupiah(shift.netProfit)}
              </div>
              <span className="text-[9px] text-slate-500 italic block">
                (Laba Pulsa + Aksesoris + Admin Bank - Pengeluaran)
              </span>
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                REKONSILIASI KAS LACI KASIR:
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Modal Kas Awal:</span>
                <span>{formatRupiah(shift.initialCashDrawer)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kas Yang Seharusnya:</span>
                <span>{formatRupiah(shift.expectedCashDrawer || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Uang Fisik Kasir Aktual:</span>
                <span>{formatRupiah(shift.finalCashDrawer || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-[11px] pt-1 border-t border-dotted border-slate-300">
                <span>Status Selisih Kas:</span>
                <span
                  className={
                    (shift.cashDifference || 0) === 0
                      ? 'text-emerald-700'
                      : (shift.cashDifference || 0) > 0
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }
                >
                  {(shift.cashDifference || 0) === 0
                    ? 'PAS / COCOK'
                    : (shift.cashDifference || 0) > 0
                    ? `LEBIH (+${formatRupiah(shift.cashDifference || 0)})`
                    : `MINUS (${formatRupiah(shift.cashDifference || 0)})`}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-0.5">
              <p>Rekap tercatat secara otomatis oleh sistem.</p>
              <p className="text-[9px] italic">MitraCell POS - Sistem Kasir Shift Konter Pulsa</p>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>
            Laba Bersih Shift: <strong className="text-emerald-400">{formatRupiah(shift.netProfit)}</strong>
          </span>
          <button
            onClick={() => setActiveShiftReceipt(null)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
          >
            Tutup Rekap
          </button>
        </div>
      </div>
    </div>
  );
};
