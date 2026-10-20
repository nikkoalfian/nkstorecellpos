import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { detectOperator, OPERATORS } from '../../utils/operatorDetector';
import { formatRupiah, generateInvoiceNo, generateSN } from '../../utils/formatters';
import { PulsaProduct, Operator, PaymentMethod } from '../../types';
import {
  Smartphone,
  Zap,
  Wifi,
  Wallet,
  Check,
  Search,
  ArrowRight,
  Sparkles,
  RotateCcw,
  User,
  ShieldCheck,
} from 'lucide-react';

export const PosPulsa: React.FC = () => {
  const { pulsaProducts, addTransaction, accounts } = useApp();

  const [activeCategory, setActiveCategory] = useState<'pulsa' | 'paket_data' | 'token_pln' | 'ewallet'>('pulsa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PulsaProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [customSellingPrice, setCustomSellingPrice] = useState<number | null>(null);

  // Auto detect operator from phone number
  const detectedOp = useMemo(() => {
    if (activeCategory === 'token_pln') return null;
    return detectOperator(phoneNumber);
  }, [phoneNumber, activeCategory]);

  // Selected operator filter (defaults to detected operator, or can be clicked)
  const [manualOp, setManualOp] = useState<Operator | null>(null);
  const activeOperator = manualOp || detectedOp?.name || null;

  // Filter products based on category and operator
  const filteredProducts = useMemo(() => {
    let prods = pulsaProducts.filter((p) => p.category === activeCategory);

    if (activeCategory === 'token_pln') {
      return prods.sort((a, b) => a.nominal - b.nominal);
    }

    if (activeCategory === 'ewallet') {
      if (activeOperator && ['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].includes(activeOperator)) {
        return prods.filter((p) => p.operator === activeOperator).sort((a, b) => a.nominal - b.nominal);
      }
      return prods.sort((a, b) => a.nominal - b.nominal);
    }

    if (activeOperator) {
      prods = prods.filter((p) => p.operator === activeOperator);
    }

    return prods.sort((a, b) => a.nominal - b.nominal);
  }, [pulsaProducts, activeCategory, activeOperator]);

  const finalSellPrice = customSellingPrice !== null ? customSellingPrice : (selectedProduct?.priceSell || 0);
  const profit = selectedProduct ? finalSellPrice - selectedProduct.priceCost : 0;
  const change = typeof cashGiven === 'number' ? Math.max(0, cashGiven - finalSellPrice) : 0;

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    setManualOp(null); // Reset manual override on typing
  };

  const handleProductSelect = (prod: PulsaProduct) => {
    setSelectedProduct(prod);
    setCustomSellingPrice(prod.priceSell);
    setCashGiven(prod.priceSell); // Default cash given to exact price
  };

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleReset = () => {
    setPhoneNumber('');
    setSelectedProduct(null);
    setCustomerName('');
    setCashGiven('');
    setCustomSellingPrice(null);
    setManualOp(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!phoneNumber) return;

    const invoiceNo = generateInvoiceNo(
      activeCategory === 'pulsa' ? 'PLS' : activeCategory === 'paket_data' ? 'DAT' : activeCategory === 'token_pln' ? 'PLN' : 'EWL'
    );
    const sn = generateSN(activeCategory);

    addTransaction({
      invoiceNo,
      type: activeCategory === 'ewallet' ? 'topup_ewallet' : activeCategory,
      title: `${selectedProduct.label}`,
      targetNumber: phoneNumber,
      targetName: customerName || undefined,
      operator: selectedProduct.operator,
      nominal: selectedProduct.nominal,
      adminFee: 0,
      priceCost: selectedProduct.priceCost,
      totalAmount: finalSellPrice,
      profit: profit,
      paymentMethod,
      amountPaid: typeof cashGiven === 'number' ? cashGiven : finalSellPrice,
      changeAmount: change,
      sourceAccountId: selectedServerId || undefined,
      serialNumber: sn,
      status: 'sukses',
    });

    handleReset();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Input & Product Grid */}
      <div className="lg:col-span-8 space-y-6">
        {/* Category Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('pulsa');
              setSelectedProduct(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition ${
              activeCategory === 'pulsa'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Pulsa Reguler
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('paket_data');
              setSelectedProduct(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition ${
              activeCategory === 'paket_data'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-4 h-4" />
            Paket Data
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('token_pln');
              setSelectedProduct(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition ${
              activeCategory === 'token_pln'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Token PLN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('ewallet');
              setSelectedProduct(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition ${
              activeCategory === 'ewallet'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Top Up E-Wallet
          </button>
        </div>

        {/* Input Target Number Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              {activeCategory === 'token_pln' ? (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  Nomor Meter / ID Pelanggan PLN
                </>
              ) : activeCategory === 'ewallet' ? (
                <>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Nomor HP Akun E-Wallet
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  Nomor HP Pelanggan
                </>
              )}
            </label>

            {/* Operator Auto-Detect Badge */}
            {detectedOp && activeCategory !== 'token_pln' && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${detectedOp.badgeBg}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                Operator: {detectedOp.name}
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="tel"
              placeholder={
                activeCategory === 'token_pln'
                  ? 'Masukkan Nomor Meter / ID PLN (11-12 digit)'
                  : activeCategory === 'ewallet'
                  ? 'Masukkan Nomor HP Akun E-Wallet (08...)'
                  : 'Masukkan Nomor HP Tujuan (08...)'
              }
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-lg font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            {phoneNumber && (
              <button
                type="button"
                onClick={() => handlePhoneChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Operator Selection if not auto-detected or want to manually choose */}
          {activeCategory !== 'token_pln' && (
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Pilih Operator / Provider:</span>
              <div className="flex flex-wrap gap-2">
                {activeCategory === 'ewallet' ? (
                  ['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].map((ew) => (
                    <button
                      key={ew}
                      type="button"
                      onClick={() => setManualOp(ew as Operator)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        activeOperator === ew
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {ew}
                    </button>
                  ))
                ) : (
                  Object.keys(OPERATORS).map((opName) => {
                    const op = OPERATORS[opName];
                    const isSelected = activeOperator === op.name;
                    return (
                      <button
                        key={opName}
                        type="button"
                        onClick={() => setManualOp(op.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSelected
                            ? `${op.badgeBg} ring-2 ring-current`
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {op.name}
                      </button>
                    );
                  })
                )}
                {activeOperator && (
                  <button
                    type="button"
                    onClick={() => setManualOp(null)}
                    className="text-xs text-slate-500 hover:text-slate-300 underline px-2 py-1"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Pilihan Nominal & Paket</span>
              <span className="text-xs font-normal text-slate-400">({filteredProducts.length} produk tersedia)</span>
            </h3>
            {activeOperator && (
              <span className="text-xs text-blue-400">Menampilkan produk {activeOperator}</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id;
              const prodProfit = prod.priceSell - prod.priceCost;

              return (
                <div
                  key={prod.id}
                  onClick={() => handleProductSelect(prod)}
                  className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-900/30 -translate-y-0.5'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Top Badge: Operator & Category */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {prod.operator}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{formatRupiah(prodProfit)}
                    </span>
                  </div>

                  {/* Nominal / Label */}
                  <div className="my-1">
                    <div className="font-bold text-slate-100 text-base leading-tight">
                      {prod.nominal >= 1000 ? `${(prod.nominal / 1000).toLocaleString('id-ID')}k` : prod.nominal}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{prod.label}</div>
                    {prod.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{prod.description}</p>
                    )}
                  </div>

                  {/* Selling Price */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Harga Jual:</span>
                      <span className="text-sm font-bold text-white">{formatRupiah(prod.priceSell)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Modal: {formatRupiah(prod.priceCost)}
                    </span>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
              <Smartphone className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">Belum ada nominal untuk operator ini</p>
              <p className="text-xs text-slate-500 mt-1">Coba ketik nomor HP lainnya atau pilih operator secara manual di atas.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Checkout & Payment Summary */}
      <div className="lg:col-span-4">
        <div className="sticky top-20 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Ringkasan Kasir
            </h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {selectedProduct ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selected Card */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 uppercase">{selectedProduct.operator}</span>
                    <h4 className="font-bold text-white text-sm">{selectedProduct.label}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
                    {formatRupiah(selectedProduct.nominal)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Tujuan: <strong className="text-white font-mono">{phoneNumber || '-'}</strong>
                </div>
              </div>

              {/* Customer Name (Optional) */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Pelanggan (Opsional / Struk):</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nama pembeli..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Adjust Selling Price if needed */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Harga Jual Konter (Bisa Diedit):</span>
                  <span className="text-emerald-400 font-medium">Laba: {formatRupiah(profit)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={customSellingPrice ?? selectedProduct.priceSell}
                    onChange={(e) => setCustomSellingPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'tunai'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    💵 Tunai (Kasir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'qris'
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    📱 QRIS Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer_bank')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'transfer_bank'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    🏦 Transfer Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('kasbon')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'kasbon'
                        ? 'bg-amber-600 text-white border-amber-500 font-bold'
                        : 'bg-slate-950 text-amber-400/80 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    ⏳ Kasbon / Hutang
                  </button>
                </div>
              </div>

              {/* Cash given & Change (if tunai) */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Uang Diterima:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(finalSellPrice)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Uang Pas ({formatRupiah(finalSellPrice)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Quick Cash buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[10000, 20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-300 font-mono"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change info */}
                  <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Kembalian:</span>
                    <span className={`font-bold font-mono text-sm ${change > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatRupiah(change)}
                    </span>
                  </div>
                </div>
              )}

              {/* Source Account for server pulsa */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Potong Saldo Server:</label>
                <select
                  value={selectedServerId}
                  onChange={(e) => setSelectedServerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  {accounts
                    .filter((a) => a.type === 'server_pulsa' || a.type === 'bank')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Total & Submit Button */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400">Total Tagihan:</span>
                  <span className="text-xl font-extrabold text-white">{formatRupiah(finalSellPrice)}</span>
                </div>

                <button
                  type="submit"
                  disabled={!phoneNumber}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Proses Transaksi & Cetak Struk
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-10 space-y-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Pilih Produk Pulsa</p>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan nomor HP pelanggan lalu klik nominal pulsa yang diinginkan di samping.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
