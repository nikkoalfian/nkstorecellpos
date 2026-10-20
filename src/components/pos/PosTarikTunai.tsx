import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, generateInvoiceNo, generateSN } from '../../utils/formatters';
import {
  Banknote,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PosTarikTunai: React.FC = () => {
  const { settings, accounts, addTransaction } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [adminFee, setAdminFee] = useState<number>(settings.defaultTarikTunaiAdminFee || 5000);
  const [targetAccountId, setTargetAccountId] = useState<string>(
    accounts.find((a) => a.type === 'bank')?.id || accounts[0]?.id || ''
  );
  const [notes, setNotes] = useState('');

  const numNominal = typeof nominal === 'number' ? nominal : 0;
  const totalTransferredByCustomer = numNominal + adminFee;
  const cashGivenToCustomer = numNominal;
  const profit = adminFee;

  // Find cash drawer account
  const cashDrawer = accounts.find((a) => a.type === 'cash') || accounts[0];
  const selectedDepositAcc = accounts.find((a) => a.id === targetAccountId);

  // Check if cash drawer has enough cash
  const hasEnoughCash = cashDrawer ? cashDrawer.balance >= cashGivenToCustomer : true;

  const handleQuickNominal = (amt: number) => {
    setNominal(amt);
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

    addTransaction({
      invoiceNo,
      type: 'tarik_tunai',
      title: `Tarik Tunai Kasir (${selectedDepositAcc?.name || 'Bank'})`,
      targetNumber: customerPhone || undefined,
      targetName: customerName ? customerName.toUpperCase() : undefined,
      providerBank: selectedDepositAcc?.name || 'Bank Rekening',
      nominal: numNominal,
      adminFee,
      priceCost: numNominal,
      totalAmount: totalTransferredByCustomer,
      profit,
      paymentMethod: selectedDepositAcc?.type === 'ewallet' ? 'qris' : 'transfer_bank',
      amountPaid: totalTransferredByCustomer,
      changeAmount: 0,
      sourceAccountId: targetAccountId,
      serialNumber: rrn,
      status: 'sukses',
      notes: notes || `Pelanggan transfer ${formatRupiah(totalTransferredByCustomer)}, laci keluar ${formatRupiah(numNominal)}`,
    });

    handleReset();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Tarik Tunai Form */}
      <div className="lg:col-span-8 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-teal-900/30 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Layanan Tarik Tunai Kasir (Agen Tunai)</h2>
              <p className="text-xs text-slate-400">
                Pelanggan transfer saldo/scan QRIS ke konter, kasir serahkan uang fisik dari laci
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
            Kas Laci: {formatRupiah(cashDrawer?.balance || 0)}
          </span>
        </div>

        {/* Form Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            Rincian Penarikan Uang Tunai
          </h3>

          {/* Warning if cash drawer is low */}
          {!hasEnoughCash && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Perhatian: Uang di laci kasir ({formatRupiah(cashDrawer?.balance || 0)}) kurang dari jumlah penarikan ({formatRupiah(numNominal)}).
              </span>
            </div>
          )}

          {/* Quick Nominals */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Pilih Nominal Tarik Tunai Cepat:</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[50000, 100000, 200000, 300000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickNominal(amt)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold border transition text-center ${
                    nominal === amt
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
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
              <label className="text-xs text-slate-400 block mb-1 font-medium">
                Jumlah Uang Tunai Yang Ditarik (Rp):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
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
                  onChange={(e) => setAdminFee(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 mt-1.5">
                {[3000, 5000, 7000, 10000].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setAdminFee(fee)}
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

          {/* Pelanggan mentransfer ke Rekening / QRIS Konter mana */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Pelanggan Mentransfer Saldo ke Rekening / Akun Konter Mana:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accounts
                .filter((a) => a.type === 'bank' || a.type === 'ewallet')
                .map((acc) => {
                  const isSelected = targetAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setTargetAccountId(acc.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: acc.color }}
                        >
                          {acc.type === 'ewallet' ? <QrCode className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{acc.name}</div>
                          {acc.accountNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatRupiah(acc.balance)}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nama Pelanggan:</label>
              <input
                type="text"
                placeholder="Nama pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs uppercase text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">No. WhatsApp Pelanggan (Kirim Struk):</label>
              <input
                type="tel"
                placeholder="Nomor WhatsApp (08...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Catatan Tambahan:</label>
            <input
              type="text"
              placeholder="Catatan penarikan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Summary & Confirmation */}
      <div className="lg:col-span-4">
        <div className="sticky top-20 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Instruksi Kasir
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
            {/* Action Checklist */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  1. Minta Pelanggan Transfer:
                </span>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Total Yang Harus Ditransfer:</div>
                  <div className="text-xl font-mono font-extrabold text-blue-400 my-0.5">
                    {formatRupiah(totalTransferredByCustomer)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ke: <strong className="text-white">{selectedDepositAcc?.name}</strong>
                  </div>
                  {selectedDepositAcc?.accountNumber && (
                    <div className="text-[11px] text-emerald-400 font-mono font-bold mt-1 select-all">
                      {selectedDepositAcc.accountNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  2. Kasir Serahkan Uang Tunai:
                </span>
                <div className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/50 flex justify-between items-center">
                  <span className="text-emerald-300 font-medium">Uang Tunai Laci:</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {formatRupiah(cashGivenToCustomer)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>Keuntungan / Admin:</span>
                  <span className="text-emerald-400 font-bold">+{formatRupiah(profit)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sisa Saldo Kas Laci:</span>
                  <span>{formatRupiah((cashDrawer?.balance || 0) - cashGivenToCustomer)}</span>
                </div>
              </div>
            </div>

            {/* Profit Highlight */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium">Laba Bersih Konter:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatRupiah(profit)}</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!numNominal || numNominal <= 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              Selesai Tarik Tunai & Cetak Struk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
