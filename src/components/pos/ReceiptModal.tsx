import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatRupiah,
  formatDateIndo,
  buildReceiptWhatsAppText,
  openWhatsAppReceipt,
} from '../../utils/formatters';
import {
  Printer,
  Share2,
  Copy,
  Check,
  X,
  Smartphone,
  CheckCircle2,
  Send,
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceipt, setActiveReceipt, settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [overridePhone, setOverridePhone] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  if (!activeReceipt) return null;

  const trx = activeReceipt;
  const targetPhone = overridePhone || trx.targetNumber || '';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = buildReceiptWhatsAppText(trx, settings);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!targetPhone) {
      setShowPhonePrompt(true);
      return;
    }
    const text = buildReceiptWhatsAppText(trx, settings);
    openWhatsAppReceipt(targetPhone, text);
  };

  const handleSendCustomPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overridePhone) return;
    const text = buildReceiptWhatsAppText(trx, settings);
    openWhatsAppReceipt(overridePhone, text);
    setShowPhonePrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={() => setActiveReceipt(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Top */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-900/30 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-900/30 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Kirim ke WA
          </button>
          <button
            onClick={handleCopyText}
            title="Salin Teks Nota"
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* WhatsApp Phone Prompt if targetNumber is empty */}
        {showPhonePrompt && (
          <form onSubmit={handleSendCustomPhone} className="p-3 bg-emerald-950/40 border-b border-emerald-800/50 flex gap-2">
            <input
              type="tel"
              placeholder="Nomor WhatsApp Pelanggan (08xx)"
              value={overridePhone}
              onChange={(e) => setOverridePhone(e.target.value)}
              className="flex-1 bg-slate-800 border border-emerald-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-emerald-500"
            >
              <Send className="w-3.5 h-3.5" /> Kirim
            </button>
          </form>
        )}

        {/* Thermal Receipt Preview Paper */}
        <div className="p-5 flex justify-center bg-slate-950/60 max-h-[60vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className="receipt-paper w-full max-w-[340px] p-5 rounded-sm shadow-md text-slate-900 text-xs leading-relaxed border-t-4 border-emerald-500 font-mono"
          >
            {/* Store Header */}
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
              <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-600">WA: {settings.phone}</p>
            </div>

            {/* Invoice Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Nota:</span>
                <span className="font-semibold text-slate-900">{trx.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu:</span>
                <span>{formatDateIndo(trx.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Metode:</span>
                <span className="font-semibold uppercase">{trx.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="text-emerald-700 font-bold uppercase">{trx.status}</span>
              </div>
            </div>

            {/* Transaction Specific Details */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
              <div className="font-bold text-slate-900">{trx.title}</div>

              {trx.targetNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {trx.type === 'token_pln' ? 'ID Meter:' : trx.type === 'transfer_uang' ? 'No. Rekening:' : 'Nomor HP:'}
                  </span>
                  <span className="font-semibold">{trx.targetNumber}</span>
                </div>
              )}

              {trx.targetName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama:</span>
                  <span className="font-semibold">{trx.targetName}</span>
                </div>
              )}

              {trx.providerBank && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Bank / E-Wallet:</span>
                  <span className="font-semibold">{trx.providerBank}</span>
                </div>
              )}

              {/* Items if aksesoris */}
              {trx.items && trx.items.length > 0 && (
                <div className="mt-1 pt-1 space-y-1">
                  {trx.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.name} x{it.quantity}</span>
                      <span>{formatRupiah(it.priceSell * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Token Listrik PLN Specific Highlight */}
              {trx.type === 'token_pln' && trx.serialNumber && (
                <div className="mt-2 p-2 bg-slate-100 border border-slate-300 rounded text-center">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Nomor Token PLN:</span>
                  <span className="font-bold text-sm tracking-wider text-slate-900 block my-1">
                    {trx.serialNumber}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">Masukkan 20 digit ke meteran</span>
                </div>
              )}

              {/* Serial Number / Ref if pulsa or bank */}
              {trx.type !== 'token_pln' && trx.serialNumber && (
                <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>SN / Ref:</span>
                  <span className="font-mono">{trx.serialNumber}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Nominal:</span>
                <span>{formatRupiah(trx.nominal)}</span>
              </div>
              {trx.adminFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Biaya Admin:</span>
                  <span>{formatRupiah(trx.adminFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-slate-300">
                <span>TOTAL:</span>
                <span className="text-sm">{formatRupiah(trx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                <span>Uang Bayar:</span>
                <span>{formatRupiah(trx.amountPaid || trx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Kembalian:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(trx.changeAmount || 0)}</span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <p>{settings.receiptFooterMessage}</p>
              <p className="text-[9px] text-slate-400 italic">Layanan Mitra Konter Pulsa & Keuangan Mandiri</p>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Keuntungan Transaksi: <strong className="text-emerald-400">{formatRupiah(trx.profit)}</strong></span>
          <button
            onClick={() => setActiveReceipt(null)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
          >
            Selesai / Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
