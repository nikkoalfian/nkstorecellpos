import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreSettings, StaffPermissions } from '../../types';
import { DEFAULT_STAFF_PERMISSIONS } from '../../data/initialData';
import {
  Settings,
  X,
  Check,
  Download,
  Upload,
  Store,
  Phone,
  MapPin,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, exportDataJson, importDataJson } = useApp();

  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Sync form data with latest store settings whenever opened
  useEffect(() => {
    if (isOpen) {
      setForm({ ...settings });
      setShowPin(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ownerPin && (form.ownerPin.length < 4 || form.ownerPin.length > 6)) {
      alert('PIN Pemilik harus berupa 4 sampai 6 digit angka.');
      return;
    }
    updateSettings(form);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          setImportStatus('Data backup berhasil dipulihkan!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Gagal memulihkan data: Format file tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Pengaturan Konter & Struk</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Identitas Toko */}
          <div className="space-y-3">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-400" /> Profil Toko & Konter
            </h4>

            {/* Logo Toko */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
              <label className="text-slate-300 font-semibold block text-xs">
                Logo Konter / Toko Sendiri:
              </label>
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shrink-0 overflow-hidden border border-slate-700 shadow-md">
                  <img
                    src={form.logoUrl || '/logo_nk.jpg'}
                    alt="Logo Toko"
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/logo_nk_960b32b2.jpg';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{form.logoUrl ? 'Ganti Logo' : 'Unggah Logo Toko'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Ukuran gambar maksimal 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              if (base64) {
                                setForm({ ...form, logoUrl: base64 });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, logoUrl: undefined })}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs transition"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Pilih file gambar PNG, JPG, atau WEBP dari perangkat Anda. Logo akan langsung tampil di pojok kiri atas dan struk belanja.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nama Konter / Toko (Dicetak di Struk):</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Slogan / Tagline:</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Nama Pemilik / Kasir:</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nomor WhatsApp Toko:</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Alamat Toko (Dicetak di Struk):</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pengaturan 4 Server Pulsa & Kuota */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" /> Nama 4 Server Pulsa & Kuota Terpisah
            </h4>
            <p className="text-[11px] text-slate-500">
              Ubah label nama 4 server sesuai aplikasi/chip yang Anda gunakan (misal: Digipos, SiDompul, Mobo, dsb).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx}>
                  <label className="text-slate-400 block mb-1">Server {idx + 1}:</label>
                  <input
                    type="text"
                    value={form.serverNames?.[idx] || ''}
                    onChange={(e) => {
                      const newNames = [...(form.serverNames || ['', '', '', ''])] as [string, string, string, string];
                      newNames[idx] = e.target.value;
                      setForm({ ...form, serverNames: newNames });
                    }}
                    placeholder={`Nama Server ${idx + 1}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pengaturan Biaya Admin Default */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider">
              Biaya Admin Default Konter
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Default Admin Transfer Uang (Rp):</label>
                <input
                  type="number"
                  value={form.defaultTransferAdminFee}
                  onChange={(e) => setForm({ ...form, defaultTransferAdminFee: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Default Admin Tarik Tunai (Rp):</label>
                <input
                  type="number"
                  value={form.defaultTarikTunaiAdminFee}
                  onChange={(e) => setForm({ ...form, defaultTarikTunaiAdminFee: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Struk */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-400" /> Tampilan Struk Kasir
            </h4>

            <div>
              <label className="text-slate-400 block mb-1">Pesan Penutup Struk (Footer):</label>
              <textarea
                rows={2}
                value={form.receiptFooterMessage}
                onChange={(e) => setForm({ ...form, receiptFooterMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Lebar Kertas Printer Thermal:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, printerPaperWidth: '58mm' })}
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                    form.printerPaperWidth === '58mm'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  58mm (Standar Mini Konter)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, printerPaperWidth: '80mm' })}
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                    form.printerPaperWidth === '80mm'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  80mm (Printer Thermal Lebar)
                </button>
              </div>
            </div>
          </div>

          {/* Keamanan Akun & PIN Pemilik */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Keamanan Akun & PIN Pemilik (Owner)
            </h4>
            <p className="text-[11px] text-slate-400">
              Proteksi menu sensitif (Laporan Laba Toko, Hapus Shift, Edit Rekening Bank) agar staf kasir hanya bisa melakukan transaksi harian.
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Aktifkan Proteksi PIN Pemilik</span>
                  <span className="text-[10px] text-slate-400">Kunci fitur sensitif di Mode Kasir</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enablePinProtection !== false}
                    onChange={(e) => setForm({ ...form, enablePinProtection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs">
                    PIN Rahasia Pemilik (4 - 6 Digit):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Lihat PIN
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    minLength={4}
                    value={form.ownerPin || ''}
                    onChange={(e) => setForm({ ...form, ownerPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Masukkan 4 - 6 digit PIN (contoh: 123456)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-slate-400">
                    PIN tersimpan:{' '}
                    <strong className="text-amber-400 font-mono">
                      {form.ownerPin ? (showPin ? form.ownerPin : '•'.repeat(form.ownerPin.length)) : '1234'}
                    </strong>
                    <span className="text-slate-500 ml-1">
                      ({(form.ownerPin || '1234').length} Digit)
                    </span>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Kembalikan PIN pemilik ke PIN standar bawaan sistem?')) {
                          setForm({ ...form, ownerPin: '1234' });
                        }
                      }}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2.5 py-0.5 rounded transition"
                      title="Kembalikan ke PIN standar"
                    >
                      Reset Standar
                    </button>
                  </div>
                </div>
              </div>

              {/* PIN Staf / Kasir */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block text-xs">
                    PIN Staf / Kasir (Untuk Login Kasir):
                  </label>
                  {form.staffPin && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, staffPin: '' })}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition"
                    >
                      Hapus PIN (Login Tanpa PIN)
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={form.staffPin || ''}
                  onChange={(e) => setForm({ ...form, staffPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="Contoh: 0000 (Kosongkan jika staf boleh login tanpa PIN)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Jika diisi (4 - 6 angka), kasir wajib memasukkan PIN ini untuk login. Jika dikosongkan, staf/kasir bisa login langsung tanpa PIN.
                </span>
              </div>
            </div>

            {/* Atur Hak Akses Staf Kasir */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Hak Akses Staf / Kasir</span>
                </div>
                <span className="text-[10px] text-slate-400">Centang menu yang diizinkan untuk kasir</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {[
                  { key: 'canAccessShift' as keyof StaffPermissions, label: 'Shift & 4 Server' },
                  { key: 'canAccessTransfer' as keyof StaffPermissions, label: 'Transfer Uang' },
                  { key: 'canAccessTarikTunai' as keyof StaffPermissions, label: 'Tarik Tunai' },
                  { key: 'canAccessPosAksesoris' as keyof StaffPermissions, label: 'Kasir Aksesoris' },
                  { key: 'canAccessKasbon' as keyof StaffPermissions, label: 'Catatan Kasbon' },
                  { key: 'canAccessInventory' as keyof StaffPermissions, label: 'Gudang Stok & Kulakan' },
                  { key: 'canAccessFinance' as keyof StaffPermissions, label: 'Buku Kas & Bank' },
                  { key: 'canAccessReports' as keyof StaffPermissions, label: 'Laporan Laba Rugi' },
                  { key: 'canViewCostPrice' as keyof StaffPermissions, label: 'Lihat Laba di POS' },
                  { key: 'canDeleteTransactions' as keyof StaffPermissions, label: 'Hapus Transaksi' },
                ].map((item) => {
                  const currentPerms = form.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
                  const isChecked = !!currentPerms[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-indigo-950/40 border-indigo-700/50 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = {
                            ...currentPerms,
                            [item.key]: !isChecked,
                          };
                          setForm({ ...form, staffPermissions: updated });
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Backup & Restore Data */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider">
              Cadangan Data & Pemulihan (Backup & Restore)
            </h4>

            {importStatus && (
              <div className="p-3 bg-blue-950 border border-blue-800 rounded-xl text-blue-200">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={exportDataJson}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1.5 transition"
              >
                <Download className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Unduh Backup JSON</span>
                <span className="text-[10px] text-slate-400">Simpan ke HP/Laptop</span>
              </button>

              <label className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Pulihkan Dari File</span>
                <span className="text-[10px] text-slate-400">Upload JSON backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Save Action Button */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30"
            >
              <Check className="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
