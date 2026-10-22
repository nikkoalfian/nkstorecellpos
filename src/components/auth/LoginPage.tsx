import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Crown,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Clock,
  AlertCircle,
  UserCheck,
  KeyRound,
  Check,
  X,
  AtSign,
  User,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { settings, loginAsOwner, loginAsStaff, updateSettings, updateOwnerPin, staffAccounts, isCloudSynced } = useApp();

  const [activeTab, setActiveTab] = useState<'owner' | 'staff'>('owner');

  // Owner state
  const [ownerUsername, setOwnerUsername] = useState(settings.ownerName || 'owner');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [rememberOwner, setRememberOwner] = useState(true);

  // Change / Create New Owner PIN & Password Modal State
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [changePinSuccess, setChangePinSuccess] = useState<string | null>(null);

  // Staff state (Username & Password/PIN)
  const [staffUsername, setStaffUsername] = useState('kasir1');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [rememberStaff, setRememberStaff] = useState(true);

  const staffPasswordInputRef = useRef<HTMLInputElement>(null);
  const ownerPasswordInputRef = useRef<HTMLInputElement>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const targetOwnerPin = (settings.ownerPin || '1234').trim();

  // Active cashier accounts registered by owner
  const activeStaffList = (staffAccounts || []).filter((acc) => acc.isActive);

  // Auto-select first active staff account if current username is empty
  useEffect(() => {
    if (activeStaffList.length > 0 && !staffUsername) {
      setStaffUsername(activeStaffList[0].username);
    }
  }, [activeStaffList, staffUsername]);

  // Keep owner username synced with store owner name if default
  useEffect(() => {
    if (settings.ownerName && (!ownerUsername || ownerUsername === 'owner')) {
      setOwnerUsername(settings.ownerName);
    }
  }, [settings.ownerName]);

  const submitOwnerLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOwnerError(null);

    const pwd = ownerPassword.trim();
    if (!pwd) {
      setOwnerError('Silakan masukkan Password / PIN Pemilik.');
      return;
    }

    const res = loginAsOwner(pwd, rememberOwner);
    if (!res.success) {
      setOwnerError(res.error || 'Password / PIN Pemilik tidak tepat!');
      setOwnerPassword('');
      ownerPasswordInputRef.current?.focus();
    }
  };

  const submitStaffLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStaffError(null);

    const cleanUser = staffUsername.trim();
    if (!cleanUser) {
      setStaffError('Silakan masukkan username kasir.');
      return;
    }

    const res = loginAsStaff(cleanUser, staffPassword, rememberStaff);
    if (!res.success) {
      setStaffError(res.error || 'Username atau Password / PIN Kasir salah!');
      setStaffPassword('');
      staffPasswordInputRef.current?.focus();
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);
    setChangePinSuccess(null);

    // Verify old PIN
    if (oldPin.trim() !== targetOwnerPin) {
      setChangePinError('Password/PIN aktif saat ini salah. Masukkan PIN yang sedang digunakan.');
      return;
    }

    // Verify new PIN format
    const cleanNew = newPin.trim();
    if (cleanNew.length < 4 || cleanNew.length > 12) {
      setChangePinError('Password/PIN Baru minimal 4 karakter (angka/huruf).');
      return;
    }

    if (cleanNew !== confirmPin.trim()) {
      setChangePinError('Konfirmasi Password/PIN baru tidak sesuai.');
      return;
    }

    // Save updated PIN to App state and localStorage
    updateOwnerPin(cleanNew);
    updateSettings({
      ownerPin: cleanNew,
    });

    setChangePinSuccess('Password/PIN Pemilik berhasil diperbarui! Silakan gunakan untuk login.');
    setOwnerPassword(cleanNew);

    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setChangePinSuccess(null);
    }, 1300);
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(currentTime);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-3 sm:p-4 relative overflow-hidden font-sans">
      {/* Background Ambience / Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 z-10 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
          <span className="text-slate-300 font-medium font-mono text-[11px]">
            {isCloudSynced ? 'Database Cloud Terhubung & Sinkron' : 'Sistem Kasir & Cloud Aktif'}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{formattedDate} • {formattedTime}</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md my-auto z-10">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5">
          {/* Brand & Logo Header - Round Badge Logo */}
          <div className="text-center space-y-2.5">
            <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-950 border-2 border-amber-500/30 shadow-2xl overflow-hidden flex items-center justify-center p-1 group hover:scale-105 transition-transform">
              <img
                src={settings.logoUrl || '/assets/aistudio/logo_nk_store_804aa741.png'}
                alt={settings.storeName}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/logo_nk_store_804aa741.png';
                }}
              />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                {settings.storeName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {settings.tagline || 'Solution Payment Digital - Pulsa & Keuangan'}
              </p>
            </div>
          </div>

          {/* Simple Segment Switcher: Owner vs Kasir */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('owner');
                setOwnerError(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'owner'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Owner / Pemilik</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setStaffError(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              <span>Kasir / Staf</span>
            </button>
          </div>

          {/* ================= TAB 1: OWNER LOGIN (SIMPLE USERNAME & PASSWORD) ================= */}
          {activeTab === 'owner' && (
            <form onSubmit={submitOwnerLogin} className="space-y-4 animate-fade-in text-xs">
              {/* Field 1: Username Owner */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Username / Nama Pemilik:
                  </span>
                  <span className="font-mono text-[10px] text-amber-400/90 font-bold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    {settings.ownerName || 'Nikko Alfian'}
                  </span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-amber-400/70" />
                  </div>
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="Username Pemilik (contoh: owner / nama Anda)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Field 2: Password / PIN Owner */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password / PIN Pemilik:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showOwnerPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Lihat Password
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 text-amber-400/70" />
                  </div>
                  <input
                    ref={ownerPasswordInputRef}
                    type={showOwnerPassword ? 'text' : 'password'}
                    value={ownerPassword}
                    onChange={(e) => {
                      setOwnerPassword(e.target.value);
                      if (ownerError) setOwnerError(null);
                    }}
                    placeholder="Masukkan Password / PIN Owner"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 font-mono text-white tracking-widest text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Error Message */}
              {ownerError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ownerError}</span>
                </div>
              )}

              {/* Remember Me & Setup PIN Button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberOwner}
                    onChange={(e) => setRememberOwner(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Ingat sesi</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setChangePinError(null);
                    setChangePinSuccess(null);
                    setOldPin('');
                    setNewPin('');
                    setConfirmPin('');
                    setIsChangePinOpen(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Ganti Password / PIN Owner</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={ownerPassword.trim().length === 0}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Dashboard Owner</span>
              </button>
            </form>
          )}

          {/* ================= TAB 2: STAFF LOGIN (SIMPLE USERNAME & PASSWORD) ================= */}
          {activeTab === 'staff' && (
            <form onSubmit={submitStaffLogin} className="space-y-4 animate-fade-in text-xs">
              {/* Field 1: Username Kasir */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-blue-400" />
                    <span>Username Kasir:</span>
                  </label>
                  {activeStaffList.length > 0 && (
                    <span className="text-[10px] text-slate-500">
                      Pilih dari daftar di bawah
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-blue-400/70" />
                  </div>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => {
                      setStaffUsername(e.target.value.toLowerCase().trim());
                      if (staffError) setStaffError(null);
                    }}
                    placeholder="Contoh: kasir1"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Quick Account Chips (Tap to auto-fill username & focus Password) */}
                {activeStaffList.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Akun kasir aktif (klik untuk pilih cepat):
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {activeStaffList.map((account) => {
                        const isSelected = staffUsername.toLowerCase() === account.username.toLowerCase();
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => {
                              setStaffUsername(account.username);
                              setStaffError(null);
                              setTimeout(() => {
                                staffPasswordInputRef.current?.focus();
                              }, 50);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <span className="font-mono font-bold">@{account.username}</span>
                            <span className="text-[10px] opacity-75 font-normal">({account.name})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Password / PIN Kasir */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Password / PIN Kasir:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showStaffPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Lihat Password
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 text-blue-400/70" />
                  </div>
                  <input
                    ref={staffPasswordInputRef}
                    type={showStaffPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => {
                      setStaffPassword(e.target.value);
                      if (staffError) setStaffError(null);
                    }}
                    placeholder="Masukkan Password / PIN kasir"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 font-mono text-white tracking-widest text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Password/PIN kasir diatur oleh Pemilik di menu Hak Akses & Akun Staf.
                </span>
              </div>

              {/* Error Message */}
              {staffError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberStaff}
                    onChange={(e) => setRememberStaff(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Ingat sesi di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!staffUsername.trim()}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sebagai Kasir</span>
              </button>
            </form>
          )}

          {/* Security Footer Note */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              🔐 Sistem kasir terlindungi. Akun staf dikelola penuh oleh Pemilik toko.
            </p>
          </div>
        </div>

        {/* ================= MODAL BUAT / GANTI PASSWORD & PIN PEMILIK ================= */}
        {isChangePinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-4 text-left">
              <button
                type="button"
                onClick={() => setIsChangePinOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ganti Password / PIN Pemilik</h3>
                  <p className="text-xs text-slate-400">Atur kode keamanan rahasia akun Owner</p>
                </div>
              </div>

              {changePinSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block font-bold text-sm">Berhasil Diperbarui!</strong>
                    <span>{changePinSuccess}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePinSubmit} className="space-y-3.5 text-xs">
                  {changePinError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{changePinError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Password / PIN Pemilik Saat Ini:
                    </label>
                    <input
                      type="password"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      placeholder="Masukkan Password/PIN aktif"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Masukkan Password/PIN yang sedang aktif untuk verifikasi keamanan.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold">
                        Password / PIN Baru Pemilik:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        {showNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showNewPin ? 'Sembunyikan' : 'Lihat'}</span>
                      </button>
                    </div>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Ketik Password/PIN baru"
                      minLength={4}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Konfirmasi Password / PIN Baru:
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Ketik ulang Password/PIN Baru"
                      minLength={4}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsChangePinOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={newPin.length < 4 || newPin !== confirmPin}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold transition disabled:opacity-50 shadow-md shadow-amber-950 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-4xl text-center py-2 text-xs text-slate-500 z-10">
        <p>© {new Date().getFullYear()} {settings.storeName} • {settings.tagline}</p>
      </footer>
    </div>
  );
};
