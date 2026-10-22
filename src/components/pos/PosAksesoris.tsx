import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem, CartAccessoryItem, PaymentMethod } from '../../types';
import { formatRupiah, generateInvoiceNo } from '../../utils/formatters';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PosAksesorisProps {
  onGoToInventory?: () => void;
}

export const PosAksesoris: React.FC<PosAksesorisProps> = ({ onGoToInventory }) => {
  const { settings, accessories, addTransaction, isOwnerUnlocked, hasPermission } = useApp();
  const showProfit = isOwnerUnlocked || hasPermission('canViewCostPrice');
  const minStockLimit = settings.defaultMinStockAlert ?? 5;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartAccessoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);

  const categories = ['Semua', 'Kabel & Adaptor', 'Casing & Pelindung', 'Audio & TWS', 'Kartu Perdana & Voucher', 'Lainnya'];

  const filteredItems = useMemo(() => {
    return accessories.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [accessories, selectedCategory, searchTerm]);

  // Cart operations
  const addToCart = (item: AccessoryItem) => {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // Cannot exceed physical stock
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      } else {
        return [...prev, { item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > c.item.stock) return c; // Limit to stock
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter(Boolean) as CartAccessoryItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashGiven('');
    setDiscount(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, c) => sum + c.item.priceSell * c.quantity, 0);
  const totalCost = cart.reduce((sum, c) => sum + c.item.priceCost * c.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const totalProfit = Math.max(0, totalAmount - totalCost);
  const totalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const change = typeof cashGiven === 'number' ? Math.max(0, cashGiven - totalAmount) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const invoiceNo = generateInvoiceNo('ACC');
    const itemsData = cart.map((c) => ({
      name: c.item.name,
      quantity: c.quantity,
      priceSell: c.item.priceSell,
      priceCost: c.item.priceCost,
    }));

    addTransaction({
      invoiceNo,
      type: 'aksesoris',
      title: `Penjualan Aksesoris (${totalItemsCount} item)`,
      targetNumber: customerPhone || undefined,
      targetName: customerName ? customerName.toUpperCase() : undefined,
      nominal: subtotal,
      adminFee: 0,
      priceCost: totalCost,
      totalAmount,
      profit: totalProfit,
      paymentMethod,
      amountPaid: typeof cashGiven === 'number' ? cashGiven : totalAmount,
      changeAmount: change,
      serialNumber: invoiceNo,
      status: 'sukses',
      items: itemsData,
    });

    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Search, Categories & Accessories Catalog */}
      <div className="lg:col-span-8 space-y-5">
        {/* Top Control Bar: Search & Manage Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aksesoris HP (kabel, charger, tempered glass, casing, audio)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {onGoToInventory && (
            <button
              type="button"
              onClick={onGoToInventory}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <Package className="w-4 h-4 text-blue-400" />
              Kelola Stok & Tambah Barang
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const inCart = cart.find((c) => c.item.id === item.id);
            const isOutOfStock = item.stock <= 0;
            const threshold = typeof item.minStock === 'number' && item.minStock > 0 ? item.minStock : minStockLimit;
            const isLowStock = item.stock > 0 && item.stock <= threshold;

            return (
              <div
                key={item.id}
                onClick={() => !isOutOfStock && addToCart(item)}
                className={`relative p-3.5 rounded-2xl border transition-colors duration-150 flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : inCart
                    ? 'bg-blue-950/50 border-blue-500/80 ring-1 ring-blue-500 cursor-pointer shadow-lg shadow-blue-950/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer'
                }`}
              >
                <div>
                  {/* Category and SKU */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span className="font-mono">{item.sku}</span>
                    {isOutOfStock ? (
                      <span className="text-red-400 font-semibold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/50">
                        Habis
                      </span>
                    ) : isLowStock ? (
                      <span className="text-amber-400 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Sisa {item.stock}
                      </span>
                    ) : (
                      <span className="text-emerald-400">Stok: {item.stock}</span>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="font-semibold text-white text-xs leading-snug line-clamp-2 mb-2">
                    {item.name}
                  </h4>
                </div>

                {/* Price and Cart Indicator */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">{formatRupiah(item.priceSell)}</span>
                    <span className="text-[10px] text-slate-500">Modal: {formatRupiah(item.priceCost)}</span>
                  </div>

                  {inCart ? (
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow">
                      {inCart.quantity}x
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Tidak ada produk aksesoris yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tambahkan stok baru.</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Shopping Cart & Checkout */}
      <div className="lg:col-span-4">
        <div className="sticky top-20 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-base">Keranjang Kasir</h3>
              {cart.length > 0 && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono">
                  {totalItemsCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Kosongkan
              </button>
            )}
          </div>

          {cart.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cart Items List */}
              <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div
                    key={c.item.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{c.item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatRupiah(c.item.priceSell)} x {c.quantity} ={' '}
                        <strong className="text-white font-mono">{formatRupiah(c.item.priceSell * c.quantity)}</strong>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(c.item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-white">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(c.item.id, 1)}
                        disabled={c.quantity >= c.item.stock}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nama Pembeli:</label>
                  <input
                    type="text"
                    placeholder="Nama..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">No WA (Kirim Struk):</label>
                  <input
                    type="tel"
                    placeholder="08xx..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Diskon Kasir */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Potongan Diskon (Rp):</span>
                <input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'tunai'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    💵 Tunai
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
                    📱 QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer_bank')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'transfer_bank'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    🏦 Transfer
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
                    <span className="text-slate-400">Uang Tunai:</span>
                    <button
                      type="button"
                      onClick={() => setCashGiven(totalAmount)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Uang Pas
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Jumlah uang diserahkan..."
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-between items-center p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Kembalian:</span>
                    <span className={`font-bold font-mono text-sm ${change > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatRupiah(change)}
                    </span>
                  </div>
                </div>
              )}

              {/* Calculation Summary */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}
                {showProfit && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Estimasi Laba:</span>
                    <span className="font-bold">{formatRupiah(totalProfit)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Total Bayar:</span>
                  <span className="text-lg font-mono text-blue-400">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                Bayar & Cetak Struk ({formatRupiah(totalAmount)})
              </button>
            </form>
          ) : (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Keranjang Kasir Masih Kosong</p>
                <p className="text-xs text-slate-500 mt-1">
                  Klik item aksesoris di sebelah kiri untuk memasukkannya ke nota kasir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
