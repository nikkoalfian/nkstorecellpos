import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatRupiah,
  formatDateIndo,
  buildReceiptWhatsAppText,
  openWhatsAppReceipt,
} from '../../utils/formatters';
import { bluetoothPrinter, buildRawBTUrl } from '../../utils/bluetoothPrinter';
import {
  Printer,
  Share2,
  Copy,
  Check,
  X,
  Smartphone,
  CheckCircle2,
  Send,
  Bluetooth,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceipt, setActiveReceipt, settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [overridePhone, setOverridePhone] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [isPrintingBT, setIsPrintingBT] = useState(false);
  const [btStatus, setBtStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'info'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [showBtGuide, setShowBtGuide] = useState(false);

  if (!activeReceipt) return null;

  const trx = activeReceipt;
  const targetPhone = overridePhone || trx.targetNumber || '';

  const handlePrintSystem = () => {
    window.print();
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBT(true);
    setBtStatus({ type: 'info', message: 'Mencari & menghubungkan ke Printer Bluetooth...' });
    try {
      await bluetoothPrinter.printTransaction(trx, settings);
      setBtStatus({ type: 'success', message: 'Struk berhasil dicetak ke Printer Bluetooth!' });
      setTimeout(() => setBtStatus({ type: 'idle', message: '' }), 4000);
    } catch (err: any) {
      console.warn('Bluetooth print error:', err);
      const isAbort = err?.name === 'NotFoundError' || err?.message?.includes('User cancelled');
      if (isAbort) {
        setBtStatus({ type: 'idle', message: '' });
      } else {
        setBtStatus({
          type: 'error',
          message: err?.message || 'Gagal terhubung ke printer Bluetooth. Nyalakan printer atau gunakan opsi RawBT.',
        });
      }
    } finally {
      setIsPrintingBT(false);
    }
  };

  const handlePrintRawBT = () => {
    try {
      const url = buildRawBTUrl(trx, settings);
      window.location.href = url;
    } catch (e: any) {
      alert('Gagal menyiapkan format RawBT: ' + e?.message);
    }
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

        {/* Action Buttons Top - Thermal Bluetooth First */}
        <div className="p-3.5 bg-slate-800/50 border-b border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            {/* Direct Bluetooth Thermal Button */}
            <button
              onClick={handlePrintBluetooth}
              disabled={isPrintingBT}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-blue-900/30 active:scale-95"
            >
              {isPrintingBT ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-sky-200" />
                  <span>Cetak Bluetooth</span>
                </>
              )}
            </button>

            {/* Android RawBT Button */}
            <button
              onClick={handlePrintRawBT}
              title="Cetak via aplikasi RawBT Android"
              className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>RawBT</span>
            </button>

            {/* Standard Browser/System Print */}
            <button
              onClick={handlePrintSystem}
              title="Cetak via dialog printer sistem / PDF"
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* WA Share */}
            <button
              onClick={handleShareWhatsApp}
              title="Kirim Struk ke WhatsApp Pelanggan"
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              title="Salin Teks Nota"
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Help Guide Toggle */}
            <button
              onClick={() => setShowBtGuide(!showBtGuide)}
              title="Panduan Printer Bluetooth"
              className={`p-2.5 rounded-xl transition ${
                showBtGuide ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Bluetooth Status Notification */}
          {btStatus.message && (
            <div
              className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                btStatus.type === 'error'
                  ? 'bg-rose-950/60 border border-rose-800/80 text-rose-200'
                  : btStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200'
                  : 'bg-blue-950/60 border border-blue-800/80 text-blue-200'
              }`}
            >
              {btStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : btStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin mt-0.5" />
              )}
              <div className="flex-1 text-[11px] leading-snug">{btStatus.message}</div>
              <button
                onClick={() => setBtStatus({ type: 'idle', message: '' })}
                className="text-slate-400 hover:text-white ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Guide Drawer */}
          {showBtGuide && (
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                Panduan Menggunakan Printer Bluetooth Thermal:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10.5px]">
                <li>
                  <strong className="text-slate-200">Nyalakan Printer:</strong> Pastikan printer thermal Bluetooth dalam keadaan ON dan ada kertas (58mm / 80mm).
                </li>
                <li>
                  <strong className="text-slate-200">Tombol &quot;Cetak Bluetooth&quot;:</strong> Klik tombol biru, pilih nama printer Anda di daftar Bluetooth browser (misal: RPP02N, PT-210, MPT-II, Iware, Panda).
                </li>
                <li>
                  <strong className="text-slate-200">Pengguna HP Android:</strong> Bisa juga gunakan tombol &quot;RawBT&quot; jika Anda menginstall aplikasi RawBT Driver di HP untuk cetak instan tanpa dialog.
                </li>
                <li>
                  <strong className="text-slate-200">Browser / Laptop:</strong> Jika browser tidak mendukung Bluetooth langsung, gunakan icon Printer untuk cetak sistem.
                </li>
              </ol>
            </div>
          )}
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
