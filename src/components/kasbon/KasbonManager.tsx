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
  Upload,
  Sparkles,
  Calendar,
  User,
  ArrowRight,
  Wallet,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const KasbonManager: React.FC = () => {
  const { kasbonList, addKasbon, settleKasbon, deleteKasbon, transactions, accounts, settings } = useApp();

  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Helper for DD/MM/YYYY formatting
  const formatDateToDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  const getInitialDueDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form State matching Reference Image
  const [amount, setAmount] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState<string>(getInitialDueDate());
  const [description, setDescription] = useState('');
  const [takeFromCashDrawer, setTakeFromCashDrawer] = useState(false);
  const [showPhoneField, setShowPhoneField] = useState(false);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Modals for Lunaskan & Delete (Fixing issues where window.confirm is blocked in iframe)
  const [itemToSettle, setItemToSettle] = useState<KasbonRecord | null>(null);
  const [settleAccountId, setSettleAccountId] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'bank'>('cash');
  const [itemToDelete, setItemToDelete] = useState<KasbonRecord | null>(null);

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
    setDescription('');
    setDueDate(getInitialDueDate());
    setTakeFromCashDrawer(false);
    setShowPhoneField(false);
    setSyncFeedback(null);
    setShowNameSuggestions(false);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Silakan isi nama pelanggan!', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Silakan masukkan nominal kasbon yang valid!', 'error');
      return;
    }

    addKasbon({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      amount: Number(amount),
      description: description.trim() || 'Kasbon pulsa/barang',
      dueDate: dueDate || undefined,
      takeFromCashDrawer,
    });

    setIsAddModalOpen(false);
    showToast(
      `Catatan kasbon ${customerName} sebesar ${formatRupiah(Number(amount))} berhasil disimpan!`,
      'success'
    );
  };

  // Target receiving accounts strictly for Kasbon Settlement: ONLY Kas Laci and Rekening Bank & Dompet Digital
  const cashAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.type === 'cash');
  }, [accounts]);

  const bankAndEwalletAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.type === 'bank' || acc.type === 'ewallet');
  }, [accounts]);

  const handleOpenSettleModal = (item: KasbonRecord) => {
    setItemToSettle(item);
    setSettleMethod('cash');
    const defaultCash = cashAccounts[0]?.id || accounts.find((a) => a.type === 'cash')?.id || '';
    setSettleAccountId(defaultCash);
  };

  // Lunaskan Confirmation Execution
  const handleConfirmSettle = () => {
    if (!itemToSettle) return;
    const defaultCash = cashAccounts[0]?.id || accounts.find((a) => a.type === 'cash')?.id || '';
    let targetAccId = defaultCash;
    if (settleMethod === 'cash') {
      targetAccId = defaultCash;
    } else {
      targetAccId = settleAccountId || bankAndEwalletAccounts[0]?.id || defaultCash;
    }

    settleKasbon(itemToSettle.id, targetAccId);

    const chosenAcc = accounts.find((a) => a.id === targetAccId);
    const isCashDrawer = chosenAcc?.type === 'cash';

    showToast(
      `Kasbon ${itemToSettle.customerName} (${formatRupiah(itemToSettle.amount)}) LUNAS! Uang pembayaran ${
        isCashDrawer ? 'langsung masuk menambah Kas Laci' : `masuk ke ${chosenAcc?.name || 'rekening'}`
      }.`,
      'success'
    );
    setItemToSettle(null);
  };

  // Delete Confirmation Execution
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    deleteKasbon(itemToDelete.id);
    showToast(`Catatan kasbon ${itemToDelete.customerName} berhasil dihapus.`, 'info');
    setItemToDelete(null);
  };

  const handleSendReminderWA = (record: KasbonRecord) => {
    if (!record.customerPhone) {
      showToast('Nomor WhatsApp pelanggan belum terdaftar pada catatan ini.', 'error');
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
          if (formattedTel) {
            setCustomerPhone(formattedTel);
            setShowPhoneField(true);
          }

          setShowNameSuggestions(false);
          setSyncFeedback(`Kontak "${pickedName}" berhasil disinkronkan!`);
          setTimeout(() => setSyncFeedback(null), 3500);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        setIsContactModalOpen(true);
        return;
      }
    } else {
      setIsContactModalOpen(true);
    }
  };

  const handleSelectContactFromList = (contact: { name: string; phone: string }) => {
    setCustomerName(contact.name);
    if (contact.phone) {
      setCustomerPhone(contact.phone);
      setShowPhoneField(true);
    }
    setIsContactModalOpen(false);
    setShowNameSuggestions(false);
    setSyncFeedback(`Kontak "${contact.name}" terpilih!`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // vCard .vcf File Import Helper
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
        showToast(`Berhasil mengimpor ${parsed.length} kontak dari file perangkat!`, 'success');
      } else {
        showToast('File kontak tidak berisi format vCard yang valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-fadeIn bg-slate-900/95 text-white border-slate-700">
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="flex-1 leading-snug">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            className="w-full py-2.5 px-4 rounded-xl bg-[#00a86b] hover:bg-[#009b63] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Catat Kasbon Pelanggan
          </button>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Form kasbon instan dengan opsi Ambil dari Cashdrawer
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
            placeholder="Cari nama pelanggan, nomor WA, keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      {formatDateToDDMMYYYY(item.dueDate)} ({formatDateIndo(item.dueDate)})
                      {!item.isPaid &&
                        new Date(item.dueDate + 'T23:59:59') < new Date() &&
                        ' (Lewat)'}
                    </span>
                  </div>
                )}
                {item.takeFromCashDrawer && (
                  <div className="text-[10px] text-cyan-300 flex items-center gap-1 pt-1 border-t border-slate-800/60">
                    <Wallet className="w-3 h-3 text-cyan-400" />
                    <span>Diambil dari Cashdrawer</span>
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
                    {item.customerPhone ? (
                      <button
                        type="button"
                        onClick={() => handleSendReminderWA(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Kirim pesan penagihan otomatis ke WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Tagih WA
                      </button>
                    ) : null}

                    {/* Lunaskan button opens in-app settlement modal with Kas Laci as default */}
                    <button
                      type="button"
                      onClick={() => handleOpenSettleModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#00a86b] hover:bg-[#009b63] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Lunaskan
                    </button>
                  </>
                ) : null}

                {/* FIXED: Delete button opens in-app delete confirmation modal reliably */}
                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition"
                  title="Hapus Catatan Kasbon"
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

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH CATATAN KASBON (MATCHING USER REFERENCE IMAGE EXACTLY)       */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[380px] bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800 text-white relative animate-fadeIn max-h-[96vh] flex flex-col justify-between">
            {/* Top Header */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00a86b]" />
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Tambah Catatan Kasbon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-2.5 text-xs">
              {/* FIELD 1: NOMINAL (Large centered card matching reference, dark theme) */}
              <div>
                <label className="text-slate-400 font-semibold text-xs mb-1 block">
                  Nominal
                </label>
                <div className="bg-slate-950 rounded-2xl border border-slate-800/90 py-2.5 px-3 text-center shadow-inner focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition relative">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 select-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={amount !== '' ? Number(amount).toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setAmount(raw ? Number(raw) : '');
                      }}
                      className="w-40 sm:w-48 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 focus:outline-none bg-transparent placeholder-emerald-400/50 tracking-tight"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick nominal buttons - compact row */}
                <div className="flex gap-1 mt-1.5 justify-center flex-wrap">
                  {[10000, 20000, 50000, 100000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-800 transition"
                    >
                      +{val >= 1000 ? `${val / 1000}rb` : val}
                    </button>
                  ))}
                  {amount !== '' && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="px-2 py-0.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[10px] font-semibold border border-rose-800/60 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* FIELD 2: PELANGGAN* (Pill input with teal user icon, dark theme) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold text-xs">
                    Pelanggan*
                  </label>
                  <button
                    type="button"
                    onClick={handlePickDeviceContact}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" /> Buku HP
                  </button>
                </div>

                <div className="bg-slate-950 rounded-full border border-slate-800 py-1.5 sm:py-2 px-3 flex items-center gap-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition relative">
                  {/* Green user circle icon */}
                  <div className="w-6 h-6 rounded-full bg-[#00a86b] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white fill-white" />
                  </div>

                  <input
                    type="text"
                    placeholder="Pilih Pelanggan"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowNameSuggestions(true);
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 font-medium text-xs sm:text-sm focus:outline-none"
                    required
                  />

                  {customerName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setCustomerPhone('');
                        setShowNameSuggestions(false);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="p-1 rounded-full text-slate-400 hover:text-emerald-400"
                    title="Pilih dari daftar kontak toko"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auto-suggest dropdown when typing or clicking Pelanggan */}
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Pelanggan Tersimpan
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNameSuggestions(false)}
                        className="text-slate-400 hover:text-white font-medium"
                      >
                        Tutup
                      </button>
                    </div>
                    {nameSuggestions.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCustomerName(c.name);
                          if (c.phone) {
                            setCustomerPhone(c.phone);
                            setShowPhoneField(true);
                          }
                          setShowNameSuggestions(false);
                        }}
                        className="px-3 py-1.5 hover:bg-slate-800 border-b border-slate-800 last:border-0 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-[10px] border border-emerald-800">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white text-xs block group-hover:text-emerald-300">
                              {c.name}
                            </span>
                            {c.phone && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          Pilih
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional WhatsApp Number inline */}
                <div className="mt-1 px-1">
                  {!showPhoneField && !customerPhone ? (
                    <button
                      type="button"
                      onClick={() => setShowPhoneField(true)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Phone className="w-2.5 h-2.5 text-slate-500" />
                      <span>+ Tambah No. WhatsApp (opsional untuk tagih)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-1 bg-slate-950 rounded-xl px-2.5 py-1 border border-slate-800">
                      <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                      <input
                        type="tel"
                        placeholder="No. WA (misal: 081234567890)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                        className="flex-1 bg-transparent text-[11px] text-white placeholder:text-slate-500 font-mono focus:outline-none"
                      />
                      {customerPhone && (
                        <button
                          type="button"
                          onClick={() => setCustomerPhone('')}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* FIELD 3: JATUH TEMPO (Pill input with calendar icon & DD/MM/YYYY, dark theme) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold text-xs">
                    Jatuh Tempo
                  </label>
                  <div className="flex gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(0)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(3)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                    >
                      +3 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(7)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                    >
                      +1 Mgg
                    </button>
                  </div>
                </div>

                <div className="relative bg-slate-950 rounded-full border border-slate-800 py-1.5 sm:py-2 px-3 flex items-center gap-2.5 shadow-sm hover:border-slate-700 cursor-pointer">
                  {/* Calendar Icon */}
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2]" />
                  <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                    {formatDateToDDMMYYYY(dueDate) || 'Pilih Tanggal'}
                  </span>

                  {/* Native Date Picker overlay - tapping anywhere opens picker */}
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                </div>
              </div>

              {/* FIELD 4: KETERANGAN (Compact textarea with placeholder 'Tulis keterangan') */}
              <div>
                <label className="text-slate-400 font-semibold text-xs mb-1 block">
                  Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Tulis keterangan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 rounded-xl border border-slate-800 p-2 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition resize-none shadow-inner"
                />
              </div>

              {/* FIELD 5: CHECKBOX 'Ambil dari Cashdrawer' */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
                  <input
                    type="checkbox"
                    id="takeFromDrawer"
                    checked={takeFromCashDrawer}
                    onChange={(e) => setTakeFromCashDrawer(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#00a86b] accent-[#00a86b] focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Ambil dari Cashdrawer
                  </span>
                </label>
              </div>

              {/* FIELD 6: ACTION BUTTON 'SIMPAN' (Full width green pill button, compact) */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={!customerName.trim() || !amount}
                  className="w-full py-2.5 sm:py-3 rounded-full bg-[#00a86b] hover:bg-[#009b63] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-emerald-950/60 disabled:opacity-40 disabled:pointer-events-none transition duration-150 cursor-pointer"
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI PELUNASAN KASBON (LUNASKAN)                              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI PELUNASAN KASBON (LUNASKAN - COMPACT & RAPI TANPA SCROLL) */}
      {/* ========================================================================= */}
      {itemToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#00a86b] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">Pelunasan Kasbon</h3>
                  <p className="text-[11px] text-slate-400">Tandai kasbon lunas & uang otomatis masuk kas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToSettle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compact Customer & Amount Bar */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
                  Pelanggan
                </span>
                <div className="font-bold text-sm text-white truncate">{itemToSettle.customerName}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {itemToSettle.description}
                  {itemToSettle.customerPhone && (
                    <span className="font-mono text-slate-500 ml-1.5">• {itemToSettle.customerPhone}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
                  Total Tagihan
                </span>
                <div className="text-lg font-black font-mono text-emerald-400">
                  {formatRupiah(itemToSettle.amount)}
                </div>
              </div>
            </div>

            {/* Segmented Payment Method Selector: Tunai (Kas Laci) vs Transfer */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Pilih Kas Masuk Uang Pembayaran:
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSettleMethod('cash');
                    const cashAcc = cashAccounts[0] || accounts.find((a) => a.type === 'cash');
                    if (cashAcc) setSettleAccountId(cashAcc.id);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    settleMethod === 'cash'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Tunai (Kas Laci)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettleMethod('bank');
                    const firstBank = bankAndEwalletAccounts[0];
                    if (firstBank) setSettleAccountId(firstBank.id);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    settleMethod === 'bank'
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Transfer / E-Wallet</span>
                </button>
              </div>

              {/* Dynamic Compact Details */}
              {settleMethod === 'cash' ? (
                <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {cashAccounts[0]?.name || 'Uang Kas Laci Toko'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Saldo saat ini: <strong className="text-slate-200">{formatRupiah(cashAccounts[0]?.balance || 0)}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold shrink-0">
                    + Menambah Kas Laci
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-blue-950/25 border border-blue-800/40 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                    <span>Pilih Rekening Penerima:</span>
                    <span className="text-blue-300 font-mono">{bankAndEwalletAccounts.length} Rekening Terdaftar</span>
                  </div>
                  <select
                    value={settleAccountId}
                    onChange={(e) => setSettleAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    {bankAndEwalletAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — Saldo: {formatRupiah(acc.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Inline Compact Sync Notice */}
            <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                Uang <strong className="font-mono text-emerald-200 font-bold">{formatRupiah(itemToSettle.amount)}</strong> otomatis masuk menambah{' '}
                <strong className="text-white">
                  {settleMethod === 'cash'
                    ? 'Kas Laci'
                    : accounts.find((a) => a.id === settleAccountId)?.name || 'rekening'}
                </strong>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setItemToSettle(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#009b63] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Lunaskan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS CATATAN KASBON (DELETE)                            */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Catatan Kasbon?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-xs font-semibold text-white">{itemToDelete.customerName}</div>
              <div className="text-sm font-bold font-mono text-amber-400">
                {formatRupiah(itemToDelete.amount)}
              </div>
              <div className="text-xs text-slate-400">{itemToDelete.description}</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan kasbon ini dari daftar? Riwayat hutang pelanggan akan dihapus secara permanen.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUKU KONTAK PELANGGAN (SYNC DARI HP / VCF / DAFTAR)                  */}
      {/* ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00a86b]/20 text-[#00a86b] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pilih Kontak Pelanggan</h3>
                  <p className="text-[11px] text-slate-400">Sinkronkan nama dan nomor WhatsApp pelanggan</p>
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
                className="w-full py-3 px-4 rounded-2xl bg-[#00a86b] hover:bg-[#009b63] text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-950/60 transition group active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Smartphone className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Buka Buku Telepon HP / Tablet</span>
                    <span className="text-[10px] text-emerald-100 font-normal">
                      Pilih langsung dari kontak tersimpan di perangkat
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                  Buka
                </span>
              </button>

              {/* Upload File Kontak .VCF jika ingin impor dari HP */}
              <div className="flex items-center justify-between p-3 bg-slate-950/90 rounded-2xl border border-dashed border-slate-800">
                <div>
                  <span className="font-bold text-white block">Impor File Kontak (.VCF / vCard):</span>
                  <span className="text-[10px] text-slate-500">Ekspor kontak dari HP lalu pilih filenya</span>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a86b]"
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
                        className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-xs">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-xs group-hover:text-emerald-300 transition">
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 font-semibold text-[11px] group-hover:bg-[#00a86b] group-hover:text-white transition"
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
