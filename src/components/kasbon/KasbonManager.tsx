import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KasbonRecord } from '../../types';
import { formatRupiah, formatDateIndo, cleanPhoneNumber } from '../../utils/formatters';
import {
  BookOpen,
  Plus,
  Search,
  MessageCircle,
  CheckCircle,
  Clock,
  Trash2,
  DollarSign,
  AlertCircle,
  X,
  Check,
  Smartphone,
  Phone,
  Users,
  UserCheck,
  Upload,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const KasbonManager: React.FC = () => {
  const { kasbonList, addKasbon, settleKasbon, deleteKasbon, transactions, accounts, settings } = useApp();

  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Quick date shortcut helper
  const setQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  // Contact Picker Modal & State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [importedVcfContacts, setImportedVcfContacts] = useState<{ name: string; phone: string }[]>([]);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Check if browser natively supports Contact Picker API (Chrome on Android Phone/Tablet)
  const isDeviceContactSupported = useMemo(() => {
    return (
      typeof navigator !== 'undefined' &&
      'contacts' in navigator &&
      typeof (navigator as any).contacts?.select === 'function'
    );
  }, []);

  // Stats
  const totalUnpaid = useMemo(() => {
    return kasbonList.filter((k) => !k.isPaid).reduce((sum, k) => sum + k.amount, 0);
  }, [kasbonList]);

  const totalPaid = useMemo(() => {
    return kasbonList.filter((k) => k.isPaid).reduce((sum, k) => sum + k.amount, 0);
  }, [kasbonList]);

  const unpaidCount = useMemo(() => kasbonList.filter((k) => !k.isPaid).length, [kasbonList]);

  const filteredList = useMemo(() => {
    return kasbonList.filter((item) => {
      const matchFilter =
        filter === 'all' ? true : filter === 'unpaid' ? !item.isPaid : item.isPaid;
      const matchSearch =
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerPhone.includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [kasbonList, filter, searchTerm]);

  // Extract unique contacts from previous store kasbon and transactions
  const storeCustomerContacts = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; count: number }>();

    // From Kasbon
    kasbonList.forEach((k) => {
      if (k.customerName) {
        const key = k.customerName.toLowerCase().trim();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.phone && k.customerPhone) existing.phone = k.customerPhone;
        } else {
          map.set(key, { name: k.customerName, phone: k.customerPhone || '', count: 1 });
        }
      }
    });

    // From Transactions
    transactions.forEach((t) => {
      if (t.targetName && t.targetNumber && t.targetNumber !== '-') {
        const key = t.targetName.toLowerCase().trim();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.phone) existing.phone = t.targetNumber;
        } else {
          map.set(key, { name: t.targetName, phone: t.targetNumber, count: 1 });
        }
      }
    });

    // Merge with any imported vCard contacts
    importedVcfContacts.forEach((c) => {
      const key = c.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { name: c.name, phone: c.phone, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [kasbonList, transactions, importedVcfContacts]);

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) return storeCustomerContacts;
    const q = contactSearchQuery.toLowerCase().trim();
    return storeCustomerContacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [storeCustomerContacts, contactSearchQuery]);

  // Quick suggestions based on what cashier types in customerName
  const nameSuggestions = useMemo(() => {
    if (!customerName.trim()) {
      return storeCustomerContacts.slice(0, 5);
    }
    const q = customerName.toLowerCase().trim();
    return storeCustomerContacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 6);
  }, [storeCustomerContacts, customerName]);

  const handleOpenAdd = () => {
    setCustomerName('');
    setCustomerPhone('');
    setAmount('');
    setDescription('Pulsa / Barang tempo');
    setDueDate('');
    setSyncFeedback(null);
    setShowNameSuggestions(false);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    addKasbon({
      customerName,
      customerPhone,
      amount: Number(amount),
      description: description || 'Kasbon pulsa/barang',
      dueDate: dueDate || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleSendReminderWA = (record: KasbonRecord) => {
    if (!record.customerPhone) {
      alert('Nomor WhatsApp pelanggan belum terdaftar pada catatan ini.');
      return;
    }

    const clean = cleanPhoneNumber(record.customerPhone);
    const dueDateText = record.dueDate ? `\n⏰ *Jatuh Tempo:* ${formatDateIndo(record.dueDate)}` : '';
    const text = `Halo Kak *${record.customerName}*, salam dari *${settings.storeName}*.

Sekadar mengingatkan catatan kasbon di konter kami:
📌 *Rincian:* ${record.description}
💰 *Total:* ${formatRupiah(record.amount)}
📅 *Tanggal Catat:* ${formatDateIndo(record.date)}${dueDateText}

Pembayaran bisa dilakukan secara tunai di konter atau transfer ya kak. Terima kasih banyak atas kerjasamanya! 🙏😊`;

    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Helper function to format raw phone numbers from contact picker
  const formatContactPhone = (rawTel: string): string => {
    let clean = rawTel.replace(/[^0-9+]/g, '');
    if (clean.startsWith('+62')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('62')) {
      clean = '0' + clean.slice(2);
    }
    return clean.replace(/[^0-9]/g, '');
  };

  // NATIVE CONTACT PICKER API (Supported on Chrome on Android Phone & Tablet)
  const handlePickDeviceContact = async () => {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function') {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const pickedName = Array.isArray(contact.name) ? contact.name[0] : (contact.name || '');
          const rawTel = Array.isArray(contact.tel) ? contact.tel[0] : (contact.tel || '');
          const formattedTel = formatContactPhone(rawTel);

          if (pickedName) setCustomerName(pickedName);
          if (formattedTel) setCustomerPhone(formattedTel);

          setShowNameSuggestions(false);
          setSyncFeedback(`Kontak "${pickedName}" (${formattedTel || 'tanpa nomor'}) berhasil disinkronkan dari HP/Tablet!`);
          setTimeout(() => setSyncFeedback(null), 4000);
          return;
        }
      } catch (err: any) {
        // User aborted / cancelled dialog on device
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Native contact picker unavailable or restricted, opening modal:', err);
        setIsContactModalOpen(true);
        return;
      }
    } else {
      // Browser does not support native Contact Picker API, open contact selector dialog
      setIsContactModalOpen(true);
    }
  };

  const handleSelectContactFromList = (contact: { name: string; phone: string }) => {
    setCustomerName(contact.name);
    setCustomerPhone(contact.phone);
    setIsContactModalOpen(false);
    setShowNameSuggestions(false);
    setSyncFeedback(`Kontak "${contact.name}" (${contact.phone || 'tanpa nomor'}) berhasil disinkronkan!`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // vCard .vcf File Import Helper (for devices that want to sync all phone contacts via export)
  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed: { name: string; phone: string }[] = [];
      const cards = text.split(/END:VCARD/i);

      for (const card of cards) {
        const fnMatch = card.match(/FN:(.+)/i);
        const telMatch = card.match(/TEL[^:]*:(.+)/i);
        if (fnMatch && fnMatch[1]) {
          const name = fnMatch[1].trim();
          let phone = telMatch && telMatch[1] ? telMatch[1].trim() : '';
          phone = formatContactPhone(phone);
          if (name) {
            parsed.push({ name, phone });
          }
        }
      }

      if (parsed.length > 0) {
        setImportedVcfContacts((prev) => [...prev, ...parsed]);
        alert(`Berhasil mengimpor ${parsed.length} kontak dari file perangkat Anda!`);
      } else {
        alert('File kontak tidak berisi format vCard yang valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/50">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Kasbon Belum Lunas</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
            {formatRupiah(totalUnpaid)}
          </div>
          <p className="text-xs text-amber-200/70 mt-1">
            Dari {unpaidCount} catatan kasbon yang belum dibayar pelanggan
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Kasbon Sudah Lunas</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {formatRupiah(totalPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Piutang yang telah berhasil ditagih</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 mb-1">Tambah Catatan Hutang Baru</div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition"
          >
            <Plus className="w-4 h-4" /> Catat Kasbon Pelanggan
          </button>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Sinkron kontak otomatis dari HP / Tablet
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'unpaid'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Belum Lunas ({unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'paid'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sudah Lunas
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor WA, catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Kasbon List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
              item.isPaid
                ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                : 'bg-slate-900 border-amber-900/40 hover:border-amber-700/60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    {item.customerName}
                    {item.isPaid ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Lunas
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Belum Bayar
                      </span>
                    )}
                  </h4>
                  {item.customerPhone && (
                    <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{item.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1 mb-2">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Rincian Hutang:
                </span>
                <p className="text-xs text-slate-200">{item.description}</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                  <span>Tanggal Catat:</span>
                  <span>{formatDateIndo(item.date)}</span>
                </div>
                {item.dueDate && (
                  <div className="text-[10px] flex justify-between items-center pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-amber-400" /> Jatuh Tempo:
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        !item.isPaid && new Date(item.dueDate + 'T23:59:59') < new Date()
                          ? 'text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60 font-bold'
                          : 'text-amber-300'
                      }`}
                    >
                      {formatDateIndo(item.dueDate)}
                      {!item.isPaid &&
                        new Date(item.dueDate + 'T23:59:59') < new Date() &&
                        ' (Lewat)'}
                    </span>
                  </div>
                )}
                {item.isPaid && item.paidDate && (
                  <div className="text-[10px] text-emerald-400 flex justify-between pt-1 border-t border-slate-800/60">
                    <span>Dilunasi:</span>
                    <span>{formatDateIndo(item.paidDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nominal Kasbon:</span>
                <div
                  className={`text-lg font-black font-mono ${
                    item.isPaid ? 'text-slate-400 line-through' : 'text-amber-400'
                  }`}
                >
                  {formatRupiah(item.amount)}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!item.isPaid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendReminderWA(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Kirim pesan penagihan otomatis ke WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Tagih WA
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Tandai kasbon ${item.customerName} sebesar ${formatRupiah(
                              item.amount
                            )} sebagai LUNAS? Uang kasir akan disesuaikan.`
                          )
                        ) {
                          settleKasbon(item.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Lunaskan
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus catatan kasbon ${item.customerName}?`)) {
                      deleteKasbon(item.id);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition"
                  title="Hapus Catatan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredList.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">Tidak ada data catatan kasbon</p>
          <p className="text-xs text-slate-500 mt-1">Semua catatan telah lunas atau filter pencarian kosong.</p>
        </div>
      )}

      {/* Modal Add Kasbon */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Catat Kasbon Pelanggan Baru</h3>
                  <p className="text-[11px] text-slate-400">Catat hutang pulsa, kuota, atau aksesoris</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              {/* TOMBOL UTAMA: SINKRONISASI KONTAK DARI HP / TABLET */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-cyan-950/80 border border-blue-800/60 shadow-lg shadow-blue-950/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs">Sinkron Kontak HP / Tablet</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isDeviceContactSupported
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {isDeviceContactSupported ? '🟢 Perangkat Siap' : '📱 Buku Kontak'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Isi Nama & WhatsApp otomatis dari buku telepon ponsel atau riwayat pelanggan toko
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handlePickDeviceContact}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-950/60 transition active:scale-95"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-200" />
                    <span>Pilih Kontak dari Device HP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/80 flex items-center gap-1.5 transition"
                    title="Buka daftar kontak tersimpan"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Daftar</span>
                  </button>
                </div>
              </div>

              {/* Feedback toast saat kontak berhasil diambil */}
              {syncFeedback && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 rounded-xl text-[11px] flex items-center gap-2 shadow-lg animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{syncFeedback}</span>
                </div>
              )}

              {/* Nama Pelanggan Field dengan Autocomplete Suggestions */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Nama Pelanggan:</label>
                  <button
                    type="button"
                    onClick={handlePickDeviceContact}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Smartphone className="w-3 h-3" /> Sinkron Kontak HP
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nama pelanggan / penghutang..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowNameSuggestions(true);
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                    required
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setShowNameSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Floating Suggestions Dropdown */}
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Saran Kontak Pelanggan Toko
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNameSuggestions(false)}
                        className="hover:text-white font-medium"
                      >
                        Tutup
                      </button>
                    </div>
                    {nameSuggestions.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCustomerName(c.name);
                          if (c.phone) setCustomerPhone(c.phone);
                          setShowNameSuggestions(false);
                          setSyncFeedback(`Kontak "${c.name}" terpilih!`);
                          setTimeout(() => setSyncFeedback(null), 3000);
                        }}
                        className="px-3.5 py-2 hover:bg-slate-800/90 border-b border-slate-800/60 last:border-0 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center text-[10px]">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs group-hover:text-cyan-300 block">
                              {c.name}
                            </span>
                            {c.phone && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-lg font-semibold group-hover:bg-cyan-600 group-hover:text-white transition">
                          Pilih
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* No. WhatsApp Pelanggan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    No. WhatsApp Pelanggan (Untuk Tagih):
                  </label>
                  <button
                    type="button"
                    onClick={handlePickDeviceContact}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Phone className="w-3 h-3" /> Ambil dari HP
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={() => setCustomerPhone('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {customerPhone && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-lg">
                    <MessageCircle className="w-3 h-3 shrink-0" />
                    <span className="font-mono truncate">
                      Format WA: +{cleanPhoneNumber(customerPhone)} (Siap kirim tagihan)
                    </span>
                  </div>
                )}
              </div>

              {/* Jumlah Kasbon */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Jumlah Kasbon (Rp):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-amber-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Jatuh Tempo (Pilih Tanggal) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Jatuh Tempo Pembayaran:</span>
                  </label>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                    >
                      ✕ Hapus Tanggal
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                />

                {/* Quick Date Buttons */}
                <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                  <span className="text-[10px] text-slate-500 mr-0.5">Pintas:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(0)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                      dueDate === new Date().toISOString().split('T')[0]
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(1)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
                  >
                    Besok (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(3)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
                  >
                    3 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(7)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
                  >
                    1 Minggu
                  </button>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Keterangan / Catatan Barang:</label>
                <input
                  type="text"
                  placeholder="Contoh: Pulsa Telkomsel 25k, Kuota, Aksesoris..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!customerName || !amount}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-blue-950/40 transition active:scale-95"
                >
                  <Check className="w-4 h-4" /> Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pemilih Kontak Pelanggan (Dialog Bantuan Sinkron Kontak) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pilih Kontak Pelanggan</h3>
                  <p className="text-[11px] text-slate-400">Sinkronkan nama dan nomor WhatsApp dari perangkat</p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Tombol Utama Buka Kontak Bawaan HP */}
              <button
                type="button"
                onClick={handlePickDeviceContact}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-950/60 transition group active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Smartphone className="w-4 h-4 text-cyan-200" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Buka Buku Telepon HP / Tablet</span>
                    <span className="text-[10px] text-cyan-100 font-normal">
                      Pilih langsung dari kontak tersimpan di perangkat
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                  Buka
                </span>
              </button>

              {/* Info Tips Sinkronisasi Kontak */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dukungan Kontak Perangkat</span>
                </div>
                <p className="text-slate-400">
                  Pada smartphone dan tablet Android (Chrome), sistem akan langsung menampilkan dialog buku telepon HP untuk memilih kontak pelanggan secara instan.
                </p>
              </div>

              {/* Upload File Kontak .VCF jika ingin impor dari HP */}
              <div className="flex items-center justify-between p-3 bg-slate-950/90 rounded-2xl border border-dashed border-slate-800">
                <div>
                  <span className="font-bold text-white block">Impor File Kontak (.VCF / vCard):</span>
                  <span className="text-[10px] text-slate-500">Ekspor kontak dari HP lalu pilih filenya</span>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File</span>
                  <input
                    type="file"
                    accept=".vcf"
                    onChange={handleVcfFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama atau nomor kontak pelanggan toko..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* List Kontak */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-[11px] text-slate-400 font-medium">
                  <span>Kontak Pelanggan Toko ({filteredContacts.length}):</span>
                  <span>Klik untuk memilih</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectContactFromList(contact)}
                        className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-xs group-hover:text-cyan-300 transition">
                              {contact.name}
                            </h5>
                            {contact.phone && (
                              <span className="text-[11px] font-mono text-slate-400 block">
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 font-semibold text-[11px] group-hover:bg-cyan-600 group-hover:text-white transition"
                        >
                          Pilih
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Tidak ada kontak yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
