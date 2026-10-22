import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Boxes,
  DollarSign,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { accessories, addAccessory, updateAccessory, deleteAccessory, adjustAccessoryStock } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessoryItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<AccessoryItem['category']>('Kabel & Adaptor');
  const [formSku, setFormSku] = useState('');
  const [formStock, setFormStock] = useState<number>(10);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formPriceCost, setFormPriceCost] = useState<number>(10000);
  const [formPriceSell, setFormPriceSell] = useState<number>(20000);

  const categories = ['Semua', 'Kabel & Adaptor', 'Casing & Pelindung', 'Audio & TWS', 'Kartu Perdana & Voucher', 'Lainnya'];

  // Stats
  const totalUnits = useMemo(() => accessories.reduce((sum, a) => sum + a.stock, 0), [accessories]);
  const totalCostValue = useMemo(() => accessories.reduce((sum, a) => sum + a.stock * a.priceCost, 0), [accessories]);
  const totalSellValue = useMemo(() => accessories.reduce((sum, a) => sum + a.stock * a.priceSell, 0), [accessories]);
  const lowStockItems = useMemo(() => accessories.filter((a) => a.stock <= a.minStock), [accessories]);

  const filteredItems = useMemo(() => {
    return accessories.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLowStock = showLowStockOnly ? item.stock <= item.minStock : true;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [accessories, selectedCategory, searchTerm, showLowStockOnly]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Kabel & Adaptor');
    setFormSku('ACC-' + Math.floor(100 + Math.random() * 900));
    setFormStock(10);
    setFormMinStock(5);
    setFormPriceCost(10000);
    setFormPriceSell(20000);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AccessoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormSku(item.sku);
    setFormStock(item.stock);
    setFormMinStock(item.minStock);
    setFormPriceCost(item.priceCost);
    setFormPriceSell(item.priceSell);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingItem) {
      updateAccessory(editingItem.id, {
        name: formName,
        category: formCategory,
        sku: formSku,
        stock: formStock,
        minStock: formMinStock,
        priceCost: formPriceCost,
        priceSell: formPriceSell,
      });
    } else {
      addAccessory({
        name: formName,
        category: formCategory,
        sku: formSku || 'ACC-' + Date.now().toString().slice(-4),
        stock: formStock,
        minStock: formMinStock,
        priceCost: formPriceCost,
        priceSell: formPriceSell,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Produk Terdaftar</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{accessories.length} Jenis</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalUnits} total unit fisik</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Nilai Modal Aset Stok</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{formatRupiah(totalCostValue)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Uang tertanam dalam stok</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Potensi Nilai Jual</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{formatRupiah(totalSellValue)}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Potensi Laba: +{formatRupiah(totalSellValue - totalCostValue)}
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            showLowStockOnly
              ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Stok Menipis / Kritis
            </span>
            <span className="text-[10px] text-amber-400 underline">
              {showLowStockOnly ? 'Lihat Semua' : 'Filter'}
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{lowStockItems.length} Produk</div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu segera restock kulakan</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk / SKU aksesoris..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="hidden md:flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs transition border ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-500 font-medium'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Aksesoris Baru
        </button>
      </div>

      {/* Stock Items Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU / Kategori</th>
                <th className="py-3 px-4 font-semibold">Nama Produk</th>
                <th className="py-3 px-4 font-semibold">Stok Saat Ini</th>
                <th className="py-3 px-4 font-semibold text-right">Harga Modal</th>
                <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                <th className="py-3 px-4 font-semibold text-right">Margin / Laba</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isLow = item.stock <= item.minStock;
                const margin = item.priceSell - item.priceCost;

                return (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-400">{item.sku}</div>
                      <div className="text-[10px] text-slate-500">{item.category}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-xs">{item.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold font-mono text-sm ${
                            item.stock === 0
                              ? 'text-red-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.stock} unit
                        </span>
                        {isLow && (
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1 py-0.5 rounded">
                            Min: {item.minStock}
                          </span>
                        )}
                      </div>
                      {/* Quick stock adjustment buttons */}
                      <div className="flex gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => adjustAccessoryStock(item.id, 5)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          title="Tambah 5 stok"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustAccessoryStock(item.id, 10)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          title="Tambah 10 stok"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustAccessoryStock(item.id, -1)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 rounded text-[10px]"
                          title="Kurangi 1 stok"
                        >
                          -1
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatRupiah(item.priceCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatRupiah(item.priceSell)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                      +{formatRupiah(margin)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus ${item.name}?`)) {
                              deleteAccessory(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p>Tidak ada aksesoris yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Accessory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Produk Aksesoris' : 'Tambah Aksesoris Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Produk Aksesoris:</label>
                <input
                  type="text"
                  placeholder="Nama produk aksesoris (Kabel Data, Charger, Case, dll)..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Kategori:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AccessoryItem['category'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Kabel & Adaptor">Kabel & Adaptor</option>
                    <option value="Casing & Pelindung">Casing & Pelindung</option>
                    <option value="Audio & TWS">Audio & TWS</option>
                    <option value="Kartu Perdana & Voucher">Kartu Perdana & Voucher</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Kode SKU / Barcode:</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Jumlah Stok Fisik:</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Batas Minimum Stok (Alert):</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Harga Modal Kulakan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    value={formPriceCost}
                    onChange={(e) => setFormPriceCost(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Harga Jual Konter (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    value={formPriceSell}
                    onChange={(e) => setFormPriceSell(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Estimasi Margin Laba:</span>
                <span className="font-bold text-emerald-400">
                  {formatRupiah(formPriceSell - formPriceCost)} / item
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30"
                >
                  <Check className="w-4 h-4" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
