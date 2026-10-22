import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Crown,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Delete,
  Clock,
  AlertCircle,
  UserCheck,
  KeyRound,
  Check,
  X,
  AtSign,
  User,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { settings, loginAsOwner, loginAsStaff, updateSettings, updateOwnerPin, staffAccounts, isCloudSynced } = useApp();

  const [activeTab, setActiveTab] = useState<'owner' | 'staff'>('owner');

  // Owner state
  const [ownerPin, setOwnerPin] = useState('');
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [rememberOwner, setRememberOwner] = useState(true);

  // Change / Create New Owner PIN Modal State
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [changePinSuccess, setChangePinSuccess] = useState<string | null>(null);

  // Staff state (Username & PIN)
  const [staffUsername, setStaffUsername] = useState('kasir1');
  const [staffPin, setStaffPin] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [rememberStaff, setRememberStaff] = useState(true);

  const staffPinInputRef = useRef<HTMLInputElement>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const targetOwnerPin = (settings.ownerPin || '1234').trim();
  const ownerPinLength = targetOwnerPin.length >= 4 ? targetOwnerPin.length : 4;

  // Active cashier accounts registered by owner
  const activeStaffList = (staffAccounts || []).filter((acc) => acc.isActive);

  // Auto-select first active staff account if current username is empty
  useEffect(() => {
    if (activeStaffList.length > 0 && !staffUsername) {
      setStaffUsername(activeStaffList[0].username);
    }
  }, [activeStaffList, staffUsername]);

  // Handle owner PIN keypad input
  const handleOwnerDigit = (digit: string) => {
    if (ownerPin.length < ownerPinLength) {
      const next = ownerPin + digit;
      setOwnerPin(next);
      setOwnerError(null);

      // Auto submit when target length reached
      if (next.length === ownerPinLength) {
        submitOwnerLogin(next);
      }
    }
  };

  const handleOwnerDelete = () => {
    setOwnerPin((prev) => prev.slice(0, -1));
    setOwnerError(null);
  };

  const handleOwnerClear = () => {
    setOwnerPin('');
    setOwnerError(null);
  };

  const submitOwnerLogin = (pinToSubmit?: string) => {
    const pin = pinToSubmit ?? ownerPin;
    if (!pin) {
      setOwnerError('Silakan masukkan PIN Pemilik.');
      return;
    }
    const res = loginAsOwner(pin, rememberOwner);
    if (!res.success) {
      setOwnerError(res.error || 'PIN Pemilik tidak tepat!');
      setOwnerPin('');
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

    const res = loginAsStaff(cleanUser, staffPin, rememberStaff);
    if (!res.success) {
      setStaffError(res.error || 'Username atau PIN Kasir salah!');
      setStaffPin('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);
    setChangePinSuccess(null);

    // Verify old PIN
    if (oldPin.trim() !== targetOwnerPin) {
      setChangePinError('PIN aktif saat ini salah. Masukkan PIN yang sedang digunakan.');
      return;
    }

    // Verify new PIN format
    const cleanNew = newPin.trim();
    if (cleanNew.length < 4 || cleanNew.length > 6) {
      setChangePinError('PIN Baru harus berupa 4 sampai 6 digit angka.');
      return;
    }

    if (cleanNew !== confirmPin.trim()) {
      setChangePinError('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    // Save updated PIN to App state and localStorage
    updateOwnerPin(cleanNew);
    updateSettings({
      ownerPin: cleanNew,
    });

    setChangePinSuccess('PIN Pemilik berhasil diperbarui! Silakan gunakan PIN baru Anda.');
    setOwnerPin('');

    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setChangePinSuccess(null);
    }, 1300);
  };

  // Keyboard navigation on Owner Tab
  useEffect(() => {
    if (activeTab !== 'owner') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside modal input
      if (isChangePinOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleOwnerDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleOwnerDelete();
      } else if (e.key === 'Enter') {
        submitOwnerLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, ownerPin, rememberOwner, ownerPinLength, isChangePinOpen]);

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-3 sm:p-4 relative overflow-hidden font-sans select-none sm:select-auto">
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
          {/* Brand & Logo Header */}
          <div className="text-center space-y-2.5">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center p-1 group hover:scale-105 transition-transform">
              <img
                src={settings.logoUrl || '/logo_nk.jpg'}
                alt={settings.storeName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/logo_nk_960b32b2.jpg';
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

          {/* ================= TAB 1: OWNER LOGIN ================= */}
          {activeTab === 'owner' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/60 p-2.5 px-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Akun Pemilik:</span>
                <span className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {settings.ownerName || 'Nikko Alfian'}
                </span>
              </div>

              {/* PIN Display */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN Pemilik ({ownerPinLength} Digit)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOwnerPin(!showOwnerPin)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showOwnerPin ? (
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

                {/* Display dots / values */}
                <div className="flex justify-center items-center gap-2.5 py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  {Array.from({ length: ownerPinLength }).map((_, index) => {
                    const hasVal = index < ownerPin.length;
                    return (
                      <div
                        key={index}
                        className={`w-9 sm:w-10 h-11 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold font-mono transition-all ${
                          hasVal
                            ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-300 shadow-sm shadow-amber-950'
                            : 'bg-slate-900 border border-slate-800 text-slate-600'
                        }`}
                      >
                        {hasVal ? (showOwnerPin ? ownerPin[index] : '•') : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {ownerError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ownerError}</span>
                </div>
              )}

              {/* Virtual Keypad for Mobile / Tablet */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleOwnerDigit(digit)}
                    className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-600 active:text-white text-white font-bold text-base sm:text-lg font-mono transition shadow-sm cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleOwnerClear}
                  className="h-11 sm:h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-xs transition cursor-pointer"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => handleOwnerDigit('0')}
                  className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-600 active:text-white text-white font-bold text-base sm:text-lg font-mono transition shadow-sm cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleOwnerDelete}
                  className="h-11 sm:h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition cursor-pointer"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

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
                  <span>Buat / Ganti PIN Owner</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => submitOwnerLogin()}
                disabled={ownerPin.length === 0}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Dashboard Owner</span>
              </button>
            </div>
          )}

          {/* ================= TAB 2: STAFF LOGIN (USERNAME & PIN) ================= */}
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
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value.toLowerCase().trim())}
                    placeholder="Contoh: kasir1"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Quick Account Chips (Tap to auto-fill username & focus PIN) */}
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
                              // focus PIN input
                              setTimeout(() => {
                                staffPinInputRef.current?.focus();
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

              {/* Field 2: PIN Kasir */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span>PIN Kasir:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStaffPin(!showStaffPin)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showStaffPin ? (
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={staffPinInputRef}
                    type={showStaffPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan PIN login kasir"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 font-mono text-white tracking-widest text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  PIN ditentukan dan dapat diatur oleh Pemilik di menu Pengaturan Hak Akses.
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
              🔐 Data tersimpan aman di perangkat ini. Akun login kasir dikelola penuh oleh Pemilik.
            </p>
          </div>
        </div>

        {/* ================= MODAL BUAT / GANTI PIN PEMILIK ================= */}
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
                  <h3 className="text-base font-bold text-white">Buat / Ganti PIN Rahasia Pemilik</h3>
                  <p className="text-xs text-slate-400">Atur PIN keamanan toko sebelum deploy ke GitHub & Vercel</p>
                </div>
              </div>

              {changePinSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block font-bold text-sm">PIN Berhasil Diperbarui!</strong>
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
                      PIN Pemilik Saat Ini:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Masukkan PIN keamanan aktif"
                      maxLength={6}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Masukkan PIN yang sedang aktif untuk verifikasi pemilik.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold">
                        PIN Baru Pemilik (4 - 6 Digit):
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
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ketik 4-6 angka PIN baru Anda"
                      maxLength={6}
                      minLength={4}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Konfirmasi PIN Baru:
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ketik ulang PIN Baru"
                      maxLength={6}
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
                      Simpan PIN Baru
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
