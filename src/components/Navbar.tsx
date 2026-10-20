import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import {
  Smartphone,
  Send,
  Banknote,
  ShoppingBag,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
  Clock,
  Radio,
  Building2,
  Menu,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

export type ActiveTab =
  | 'shift'
  | 'transfer'
  | 'tarik_tunai'
  | 'aksesoris'
  | 'inventory'
  | 'finance'
  | 'kasbon'
  | 'reports'
  | 'owner_dashboard'
  | 'permissions';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSettings }) => {
  const {
    settings,
    accounts,
    kasbonList,
    activeShift,
    isOwnerUnlocked,
    lockOwner,
    requestOwnerPin,
    viewMode,
    switchViewMode,
    hasPermission,
  } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Balances
  const cashAcc = accounts.find((a) => a.type === 'cash');
  const serverAccs = accounts.filter((a) => a.type === 'server_pulsa');
  const totalServerBalance = serverAccs.reduce((sum, a) => sum + a.balance, 0);
  const mainBankAcc = accounts.find((a) => a.type === 'bank');
  const unpaidKasbonCount = kasbonList.filter((k) => !k.isPaid).length;

  // Build navItems dynamically depending on viewMode (Owner vs Staff)
  const isOwner = viewMode === 'owner' && isOwnerUnlocked;

  const navItems = isOwner
    ? [
        {
          id: 'owner_dashboard' as ActiveTab,
          label: '👑 Dashboard Owner',
          icon: Radio,
          color: 'text-amber-400',
        },
        {
          id: 'shift' as ActiveTab,
          label: 'Shift & 4 Server',
          icon: Clock,
          color: 'text-amber-400',
          badge: activeShift ? 'Aktif' : 'Buka',
          badgeColor: activeShift ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300',
        },
        { id: 'transfer' as ActiveTab, label: 'Transfer Uang', icon: Send, color: 'text-indigo-400' },
        { id: 'tarik_tunai' as ActiveTab, label: 'Tarik Tunai', icon: Banknote, color: 'text-emerald-400' },
        { id: 'aksesoris' as ActiveTab, label: 'Aksesoris HP', icon: ShoppingBag, color: 'text-purple-400' },
        { id: 'inventory' as ActiveTab, label: 'Gudang & Stok', icon: Building2, color: 'text-purple-400' },
        { id: 'finance' as ActiveTab, label: 'Buku Kas & Bank', icon: Wallet, color: 'text-teal-400' },
        {
          id: 'kasbon' as ActiveTab,
          label: 'Catatan Kasbon',
          icon: BookOpen,
          color: 'text-amber-400',
          badge: unpaidKasbonCount > 0 ? unpaidKasbonCount : undefined,
        },
        { id: 'reports' as ActiveTab, label: 'Laporan Laba Rugi', icon: BarChart3, color: 'text-rose-400' },
      ]
    : [
        // Mode Kasir (Staf): Show items filtered by staffPermissions
        ...(hasPermission('canAccessShift')
          ? [
              {
                id: 'shift' as ActiveTab,
                label: 'Shift & 4 Server',
                icon: Clock,
                color: 'text-amber-400',
                badge: activeShift ? 'Aktif' : 'Buka',
                badgeColor: activeShift ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300',
              },
            ]
          : []),
        ...(hasPermission('canAccessTransfer')
          ? [{ id: 'transfer' as ActiveTab, label: 'Transfer Uang', icon: Send, color: 'text-indigo-400' }]
          : []),
        ...(hasPermission('canAccessTarikTunai')
          ? [{ id: 'tarik_tunai' as ActiveTab, label: 'Tarik Tunai', icon: Banknote, color: 'text-emerald-400' }]
          : []),
        ...(hasPermission('canAccessPosAksesoris')
          ? [{ id: 'aksesoris' as ActiveTab, label: 'Kasir Aksesoris', icon: ShoppingBag, color: 'text-purple-400' }]
          : []),
        ...(hasPermission('canAccessInventory')
          ? [{ id: 'inventory' as ActiveTab, label: 'Gudang Stok', icon: Building2, color: 'text-purple-400' }]
          : []),
        ...(hasPermission('canAccessKasbon')
          ? [
              {
                id: 'kasbon' as ActiveTab,
                label: 'Catatan Kasbon',
                icon: BookOpen,
                color: 'text-amber-400',
                badge: unpaidKasbonCount > 0 ? unpaidKasbonCount : undefined,
              },
            ]
          : []),
        ...(hasPermission('canAccessFinance')
          ? [{ id: 'finance' as ActiveTab, label: 'Buku Kas', icon: Wallet, color: 'text-teal-400' }]
          : []),
        ...(hasPermission('canAccessReports')
          ? [{ id: 'reports' as ActiveTab, label: 'Laporan Laba', icon: BarChart3, color: 'text-rose-400' }]
          : []),
      ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Bar: Brand, Live Saldo Balances, Clock, Settings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/30 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-base sm:text-lg tracking-tight truncate flex items-center gap-2">
                {settings.storeName}
              </h1>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Quick Balance Ticker (Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs">
            {cashAcc && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">Kas Laci:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(cashAcc.balance)}</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-400">Total 4 Server:</span>
              <span className="font-mono font-bold text-blue-400">{formatRupiah(totalServerBalance)}</span>
            </div>
            {mainBankAcc && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span className="text-slate-400">{mainBankAcc.name.split(' ')[0]}:</span>
                <span className="font-mono font-bold text-sky-400">{formatRupiah(mainBankAcc.balance)}</span>
              </div>
            )}
          </div>

          {/* Time & Settings Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active Cashier Badge in Staff Mode */}
            {!isOwner && activeShift && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-400">Kasir:</span>
                <span className="font-semibold text-white truncate max-w-[120px]">{activeShift.cashierName.split(' ')[0]}</span>
              </div>
            )}

            {/* Owner vs Staff Mode Switcher Button */}
            <button
              type="button"
              onClick={() => {
                if (isOwner) {
                  switchViewMode('staff');
                  setActiveTab('shift');
                } else {
                  switchViewMode('owner');
                  setActiveTab('owner_dashboard');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border shadow-md ${
                isOwner
                  ? 'bg-gradient-to-r from-amber-950/80 to-yellow-950/80 hover:from-amber-900 hover:to-yellow-900 text-amber-300 border-amber-600/70 shadow-amber-950/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={
                isOwner
                  ? 'Mode Pemilik Aktif. Klik untuk mengunci kembali ke Mode Kasir.'
                  : 'Mode Kasir Aktif. Klik untuk membuka Mode Pemilik dengan PIN.'
              }
            >
              {isOwner ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">👑 Mode Owner</span>
                  <span className="sm:hidden text-[10px]">Owner</span>
                  <span className="text-[10px] text-amber-400/80 font-normal hidden lg:inline">| Kunci</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Masuk Mode Owner 👑</span>
                  <span className="sm:hidden text-[10px]">Owner PIN</span>
                </>
              )}
            </button>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime}</span>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 relative"
              title="Pengaturan Toko & Keamanan PIN"
            >
              <Settings className="w-5 h-5" />
              {!isOwnerUnlocked && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Balances Bar on Tablet / Mobile */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-800/60 text-[11px] no-scrollbar">
          {cashAcc && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Kas:</span>
              <span className="font-mono font-bold text-emerald-400">{formatRupiah(cashAcc.balance)}</span>
            </div>
          )}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-400">4 Server:</span>
            <span className="font-mono font-bold text-blue-400">{formatRupiah(totalServerBalance)}</span>
          </div>
          {mainBankAcc && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span className="text-slate-400">Bank:</span>
              <span className="font-mono font-bold text-sky-400">{formatRupiah(mainBankAcc.balance)}</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 py-1.5 overflow-x-auto border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'aksesoris' && activeTab === 'inventory');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'aksesoris' && activeTab === 'inventory');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {item.badge} belum lunas
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
