import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem, CartAccessoryItem, PaymentMethod } from '../../types';
import { formatRupiah, generateInvoiceNo } from '../../utils/formatters';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Package,
  ClipboardCheck,
} from 'lucide-react';
import { StockOpnameModal } from '../inventory/StockOpnameModal';

const CATEGORIES = [
  'Semua',
  'Kabel & Adaptor',
  'Casing & Pelindung',
  'Audio & TWS',
  'Kartu Perdana & Voucher',
  'Lainnya',
] as const;

interface PosAksesorisProps {
  onGoToInventory?: () => void;
}

interface AccessoryCardProps {
  item: AccessoryItem;
  quantityInCart: number;
  onAddToCart: (item: AccessoryItem) => void;
  onDeleteProduct?: (item: AccessoryItem) => void;
  showProfit: boolean;
}

// Dedicated memoized card to ensure zero unnecessary re-renders or layout jumps
const AccessoryCard: React.FC<AccessoryCardProps> = React.memo(({
  item,
  quantityInCart,
  onAddToCart,
  onDeleteProduct,
  showProfit,
}) => {
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= item.minStock;
  const inCart = quantityInCart > 0;

  return (
    <div
      onClick={() => !isOutOfStock && onAddToCart(item)}
      className={`relative p-3.5 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-150 flex flex-col justify-between select-none min-h-[148px] ${
        isOutOfStock
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
          : inCart
          ? 'bg-blue-950/50 border-blue-500/80 ring-1 ring-blue-500 cursor-pointer shadow-lg shadow-blue-950/30'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer'
      }`}
    >
      <div>
        {/* Category and SKU with strict fixed height and optional delete icon */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 h-5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono truncate max-w-[80px]">{item.sku}</span>
            {onDeleteProduct && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[PosAksesoris] Delete product icon clicked for:', item.id, item.name);
                  onDeleteProduct(item);
                }}
                className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                title="Hapus Produk dari Database"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          {isOutOfStock ? (
            <span className="text-red-400 font-semibold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/50 shrink-0">
              Habis
            </span>
          ) : isLowStock ? (
            <span className="text-amber-400 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50 flex items-center gap-0.5 shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" /> Sisa {item.stock}
            </span>
          ) : (
            <span className="text-emerald-400 shrink-0 font-medium">Stok: {item.stock}</span>
          )}
        </div>

        {/* Name with strict fixed 2-line height to prevent card resize shifts */}
        <h4 className="font-semibold text-white text-xs leading-snug line-clamp-2 h-9 mb-2">
          {item.name}
        </h4>
      </div>

      {/* Price and Cart Indicator with strict fixed height */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between h-10">
        <div className="min-w-0 pr-1">
          <span className="text-sm font-bold text-white block leading-tight truncate">{formatRupiah(item.priceSell)}</span>
          {showProfit && (
            <span className="text-[10px] text-slate-500 block truncate">Modal: {formatRupiah(item.priceCost)}</span>
          )}
        </div>

        {inCart ? (
          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow shrink-0">
            {quantityInCart}x
          </span>
        ) : (
          <button
            type="button"
            disabled={isOutOfStock}
            className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

AccessoryCard.displayName = 'AccessoryCard';

export const PosAksesoris: React.FC<PosAksesorisProps> = ({ onGoToInventory }) => {
  const { accessories, addTransaction, isOwnerUnlocked, hasPermission, requestOwnerPin, deleteAccessory } = useApp();
  const showProfit = isOwnerUnlocked || hasPermission('canViewCostPrice');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartAccessoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);
  const [isStockOpnameOpen, setIsStockOpnameOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<AccessoryItem | null>(null);

  const handleOpenStockOpname = () => {
    if (isOwnerUnlocked || hasPermission('canAccessStockOpname') || hasPermission('canAccessInventory')) {
      setIsStockOpnameOpen(true);
    } else {
      requestOwnerPin(
        'Buka Stock Opname Aksesoris',
        () => setIsStockOpnameOpen(true),
        'Audit fisik stok dibatasi untuk staf. Masukkan PIN Pemilik untuk membuka.'
      );
    }
  };

  const handleDeleteProduct = useCallback((item: AccessoryItem) => {
    console.log('[PosAksesoris] handleDeleteProduct initiated for product:', item.id, item.name);
    const doDelete = () => {
      console.log('[PosAksesoris] Opening delete modal for product:', item.id, item.name);
      setAccessoryToDelete(item);
    };

    if (!isOwnerUnlocked && !hasPermission('canAccessInventory')) {
      console.log('[PosAksesoris] Requesting owner PIN to delete product:', item.name);
      requestOwnerPin(
        'Hapus Produk Aksesoris',
        doDelete,
        'Menghapus produk dari database memerlukan izin pemilik. Masukkan PIN untuk konfirmasi.'
      );
    } else {
      doDelete();
    }
  }, [isOwnerUnlocked, hasPermission, requestOwnerPin]);

  // Stable memoized filter & sort for product catalog
  const filteredItems = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const result = accessories.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        !cleanSearch ||
        item.name.toLowerCase().includes(cleanSearch) ||
        item.sku.toLowerCase().includes(cleanSearch);
      return matchCat && matchSearch;
    });

    return [...result].sort((a, b) => {
      return (
        (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }) ||
        (a.name || '').localeCompare(b.name || '')
      );
    });
  }, [accessories, selectedCategory, searchTerm]);

  // Fast O(1) quantity map for item cards
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((c) => map.set(c.item.id, c.quantity));
    return map;
  }, [cart]);

  // Stable cart operations
  const addToCart = useCallback((item: AccessoryItem) => {
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
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) {
              console.log('[PosAksesoris] Quantity reached 0 for item:', itemId, '- removing from cart');
              return null;
            }
            if (newQty > c.item.stock) return c; // Limit to physical stock
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter(Boolean) as CartAccessoryItem[]
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    console.log('[PosAksesoris] removeFromCart event firing for itemId:', itemId);
    setCart((prev) => {
      const next = prev.filter((c) => c.item.id !== itemId);
      console.log('[PosAksesoris] Item removed from cart state. Remaining items in cart:', next.length);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    console.log('[PosAksesoris] clearCart event firing. Emptying entire cart.');
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashGiven('');
    setDiscount(0);
  }, []);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.item.priceSell * c.quantity, 0), [cart]);
  const totalCost = useMemo(() => cart.reduce((sum, c) => sum + c.item.priceCost * c.quantity, 0), [cart]);
  const totalAmount = Math.max(0, subtotal - discount);
  const totalProfit = Math.max(0, totalAmount - totalCost);
  const totalItemsCount = useMemo(() => cart.reduce((sum, c) => sum + c.quantity, 0), [cart]);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Search, Categories & Accessories Catalog */}
      <div className="lg:col-span-8 space-y-4">
        {/* Top Control Bar: Search & Manage Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari aksesoris HP (kabel, charger, tempered glass, casing, audio)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenStockOpname}
              className="px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-purple-700/60 transition cursor-pointer shadow-sm active:scale-95"
              title="Audit fisik stok dan sesuaikan dengan stok sistem"
            >
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
              <span>Stock Opname</span>
            </button>

            {onGoToInventory && (
              <button
                type="button"
                onClick={onGoToInventory}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition shrink-0 cursor-pointer"
              >
                <Package className="w-4 h-4 text-blue-400" />
                <span>Gudang & Stok</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
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
          {filteredItems.map((item) => (
            <AccessoryCard
              key={item.id}
              item={item}
              quantityInCart={cartQtyMap.get(item.id) || 0}
              onAddToCart={addToCart}
              onDeleteProduct={handleDeleteProduct}
              showProfit={showProfit}
            />
          ))}
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
      <div className="lg:col-span-4 self-start">
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
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[PosAksesoris] "Kosongkan" cart button clicked by user');
                  clearCart();
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition active:scale-95"
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('[PosAksesoris] Delete item from cart clicked for:', c.item.id, c.item.name);
                          removeFromCart(c.item.id);
                        }}
                        className="w-6 h-6 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 flex items-center justify-center transition ml-1 cursor-pointer active:scale-95"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-3 h-3" />
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
                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
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
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'qris'
                        ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    📱 QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer_bank')}
                    className={`p-2 rounded-xl font-medium border text-center transition ${
                      paymentMethod === 'transfer_bank'
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
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
                        : 'bg-slate-950 text-amber-400/80 border-slate-800 hover:bg-slate-800'
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
                      className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Uang Pas
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Jumlah uang diserahkan..."
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
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
                  <span className="font-mono">{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatRupiah(discount)}</span>
                  </div>
                )}
                {showProfit && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Estimasi Laba:</span>
                    <span className="font-bold font-mono">{formatRupiah(totalProfit)}</span>
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
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Bayar & Cetak Struk</span>
                <span className="font-mono">({formatRupiah(totalAmount)})</span>
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

      {/* Stock Opname Modal */}
      <StockOpnameModal
        isOpen={isStockOpnameOpen}
        onClose={() => setIsStockOpnameOpen(false)}
      />

      {/* Modal Konfirmasi Hapus Produk dari Database */}
      {accessoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Produk Aksesoris?</h3>
                <p className="text-xs text-slate-400">Akan dihapus langsung dari database</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="text-xs font-semibold text-white">{accessoryToDelete.name}</div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Kategori:</span>
                <span className="text-slate-300">{accessoryToDelete.category}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Stok:</span>
                <span className="font-mono font-bold text-white">{accessoryToDelete.stock} unit</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-850">
                <span>Harga Jual:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(accessoryToDelete.priceSell)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus produk ini dari database Firebase dan katalog toko?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAccessoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('[PosAksesoris] Confirmed delete accessory from database & state:', accessoryToDelete.id, accessoryToDelete.name);
                  deleteAccessory(accessoryToDelete.id);
                  removeFromCart(accessoryToDelete.id);
                  setAccessoryToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
