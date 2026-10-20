import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, generateInvoiceNo, generateSN } from '../../utils/formatters';
import { PaymentMethod, AccountBalance } from '../../types';
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
} from 'lucide-react';

export const PosTransfer: React.FC = () => {
  const { settings, accounts, addTransaction } = useApp();

  // Ambil data akun Bank dan E-Wallet dari Buku Kas (murni Bank & E-Wallet saja, tanpa server)
  const bankAccounts = accounts.filter(
    (a) => a.type === 'bank' || a.type === 'ewallet'
  );

  const [sourceAccountId, setSourceAccountId] = useState<string>(() => {
    const firstBank = accounts.find((a) => a.type === 'bank' || a.type === 'ewallet');
    return firstBank?.id || '';
  });

  const selectedAcc = bankAccounts.find((a) => a.id === sourceAccountId) || bankAccounts[0];

  const [nominal, setNominal] = useState<number | ''>('');
  const [adminFee, setAdminFee] = useState<number>(settings.defaultTransferAdminFee || 5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const numNominal = typeof nominal === 'number' ? nominal : 0;
  const totalAmount = numNominal + adminFee;
  const profit = adminFee;
  const change = typeof cashGiven === 'number' ? Math.max(0, cashGiven - totalAmount) : 0;

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numNominal || numNominal <= 0) return;

    const invoiceNo = generateInvoiceNo('TRF');
    const rrn = generateSN('transfer_uang');

    addTransaction({
      invoiceNo,
      type: 'transfer_uang',
      title: `Transfer Uang via ${selectedAcc?.name || 'Bank'}`,
      targetNumber: '-',
      targetName: undefined,
      providerBank: selectedAcc?.name || 'Bank',
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

  return (
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

        {/* Bank & E-Wallet Selector (Isi data murni Bank & E-Wallet dari Buku Kas) */}
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

        {/* Nominal & Biaya Admin (Proses Cepat Kasir) */}
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
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  💵 Uang Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-2 rounded-xl font-medium border text-center transition ${
                    paymentMethod === 'qris'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  📱 QRIS Konter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('kasbon')}
                  className={`p-2 rounded-xl font-medium border text-center transition ${
                    paymentMethod === 'kasbon'
                      ? 'bg-amber-600 text-white border-amber-500 font-bold'
                      : 'bg-slate-950 text-amber-400/80 border-slate-800'
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
              <span className="font-bold text-emerald-400 text-sm">{formatRupiah(profit)}</span>
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
  );
};
