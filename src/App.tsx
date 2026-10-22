import React, { useState } from 'react';
import { ShoppingBag, Package, ShieldCheck, Crown, Lock, LogOut } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { StaffPermissions } from './types';
import { PosTransfer } from './components/pos/PosTransfer';
import { PosTarikTunai } from './components/pos/PosTarikTunai';
import { PosAksesoris } from './components/pos/PosAksesoris';
import { InventoryManager } from './components/inventory/InventoryManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { KasbonManager } from './components/kasbon/KasbonManager';
import { ReportsView } from './components/reports/ReportsView';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShiftManager } from './components/shift/ShiftManager';
import { ShiftReceiptModal } from './components/shift/ShiftReceiptModal';
import { PinModal } from './components/auth/PinModal';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { StaffPermissionsManager } from './components/owner/StaffPermissionsManager';
import { RestrictedAccessView } from './components/common/RestrictedAccessView';
import { LoginPage } from './components/auth/LoginPage';

const MainContent: React.FC = () => {
  const {
    settings,
    requestOwnerPin,
    viewMode,
    isOwnerUnlocked,
    hasPermission,
    switchViewMode,
    logout,
    currentUser,
  } = useApp();

  const isOwner = viewMode === 'owner' && isOwnerUnlocked;

  // Helper to determine first permitted tab for staff
  const getFirstAllowedStaffTab = (): ActiveTab => {
    if (hasPermission('canAccessShift')) return 'shift';
    if (hasPermission('canAccessPosAksesoris')) return 'aksesoris';
    if (hasPermission('canAccessTransfer')) return 'transfer';
    if (hasPermission('canAccessTarikTunai')) return 'tarik_tunai';
    if (hasPermission('canAccessKasbon')) return 'kasbon';
    if (hasPermission('canAccessInventory')) return 'inventory';
    if (hasPermission('canAccessFinance')) return 'finance';
    if (hasPermission('canAccessReports')) return 'reports';
    return 'shift';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (isOwner) return 'owner_dashboard';
    return getFirstAllowedStaffTab();
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Synchronize activeTab whenever viewMode or permissions change
  React.useEffect(() => {
    if (isOwner) {
      // If owner just logged in or switched to owner mode and has not selected a specific tab
      if (activeTab === 'shift' && !sessionStorage.getItem('nk_user_navigated')) {
        setActiveTab('owner_dashboard');
      }
    } else {
      // In staff mode, if current tab is owner-only, redirect to allowed tab
      if (activeTab === 'owner_dashboard' || activeTab === 'permissions') {
        setActiveTab(getFirstAllowedStaffTab());
      } else {
        const tabToPerm: Partial<Record<ActiveTab, keyof StaffPermissions>> = {
          shift: 'canAccessShift',
          transfer: 'canAccessTransfer',
          tarik_tunai: 'canAccessTarikTunai',
          aksesoris: 'canAccessPosAksesoris',
          inventory: 'canAccessInventory',
          finance: 'canAccessFinance',
          kasbon: 'canAccessKasbon',
          reports: 'canAccessReports',
        };
        const permKey = tabToPerm[activeTab];
        if (permKey && !hasPermission(permKey)) {
          setActiveTab(getFirstAllowedStaffTab());
        }
      }
    }
  }, [isOwner, viewMode, settings.staffPermissions]);

  const handleSelectTab = (tab: ActiveTab) => {
    sessionStorage.setItem('nk_user_navigated', 'true');
    setActiveTab(tab);
  };

  const handleOpenSettings = () => {
    if (isOwner) {
      setIsSettingsOpen(true);
    } else {
      requestOwnerPin(
        'Buka Pengaturan Toko & Keamanan',
        () => {
          setIsSettingsOpen(true);
        },
        'Masukkan PIN Pemilik untuk mengubah konfigurasi toko, printer, dan PIN'
      );
    }
  };

  const handleGoToInventory = () => {
    if (isOwner || hasPermission('canAccessInventory')) {
      handleSelectTab('inventory');
    } else {
      requestOwnerPin(
        'Buka Manajemen Stok & Gudang',
        () => {
          handleSelectTab('inventory');
        },
        'Menu gudang dibatasi untuk staf. Masukkan PIN Pemilik untuk membuka.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenSettings={handleOpenSettings}
      />

      {/* Mode Indicator Bar for quick context */}
      <div className={`border-b text-xs py-2 px-4 sm:px-8 transition-colors ${
        isOwner
          ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-800/50 text-amber-300'
          : 'bg-slate-900/90 border-slate-800/80 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 text-xs sm:text-sm">👑 Halaman Pemilik (Mode Owner - {settings.ownerName})</span>
                <span className="text-slate-400 hidden lg:inline text-xs">— Akses penuh seluruh keuangan & hak akses staf</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-200 text-xs sm:text-sm">Halaman Kasir / Staf ({currentUser?.name || 'Kasir'})</span>
                <span className="text-slate-500 hidden md:inline text-xs">— Tampilan menu diatur oleh Pemilik Toko</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectTab('permissions')}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 border border-amber-600/60 text-amber-200 font-semibold flex items-center gap-1.5 transition text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atur Hak Akses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchViewMode('staff');
                    setActiveTab(getFirstAllowedStaffTab());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1 transition text-xs"
                  title="Simulasi / Uji tampilan kasir persis seperti yang dilihat kasir"
                >
                  <Lock className="w-3 h-3 text-blue-400" />
                  <span>Uji Tampilan Kasir</span>
                </button>
              </>
            ) : (
              <>
                {currentUser?.role === 'owner' ? (
                  <button
                    type="button"
                    onClick={() => {
                      switchViewMode('owner');
                      setActiveTab('owner_dashboard');
                    }}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition text-xs shadow-md shadow-amber-950"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Kembali ke Dashboard Owner</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      switchViewMode('owner');
                      setActiveTab('owner_dashboard');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition text-xs"
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Masuk Mode Owner</span>
                  </button>
                )}
              </>
            )}

            <span className="text-slate-700">|</span>

            <button
              type="button"
              onClick={logout}
              className="text-rose-400 hover:text-rose-300 hover:underline font-semibold flex items-center gap-1 text-xs cursor-pointer active:scale-95"
              title="Kunci & Keluar Aplikasi ke Halaman Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header for Accessories / Inventory Switcher */}
      {(activeTab === 'aksesoris' || activeTab === 'inventory') && (
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('aksesoris')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'aksesoris'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Kasir Aksesoris (POS)
              </button>
              <button
                type="button"
                onClick={handleGoToInventory}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'inventory'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Manajemen Stok & Kulakan
                {!isOwner && !hasPermission('canAccessInventory') && (
                  <Lock className="w-3 h-3 text-amber-400" />
                )}
              </button>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">
              {activeTab === 'aksesoris' ? 'Mode Kasir Penjualan' : 'Mode Manajemen Gudang & Stok'}
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Owner Dashboard */}
        {activeTab === 'owner_dashboard' && (
          isOwner ? (
            <OwnerDashboard onNavigateTab={handleSelectTab} onOpenSettings={handleOpenSettings} />
          ) : (
            <RestrictedAccessView
              featureName="Dashboard & Kontrol Pemilik"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
              onUnlockSuccess={() => {
                switchViewMode('owner');
                handleSelectTab('owner_dashboard');
              }}
            />
          )
        )}

        {/* Staff Permissions Management */}
        {activeTab === 'permissions' && (
          isOwner ? (
            <StaffPermissionsManager />
          ) : (
            <RestrictedAccessView
              featureName="Pengaturan Hak Akses Staf"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Shift Management */}
        {activeTab === 'shift' && (
          hasPermission('canAccessShift') ? (
            <ShiftManager />
          ) : (
            <RestrictedAccessView
              featureName="Shift & 4 Server"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Transfer Uang */}
        {activeTab === 'transfer' && (
          hasPermission('canAccessTransfer') ? (
            <PosTransfer />
          ) : (
            <RestrictedAccessView
              featureName="Transfer Uang"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Tarik Tunai */}
        {activeTab === 'tarik_tunai' && (
          hasPermission('canAccessTarikTunai') ? (
            <PosTarikTunai />
          ) : (
            <RestrictedAccessView
              featureName="Tarik Tunai"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Pos Aksesoris */}
        {activeTab === 'aksesoris' && (
          hasPermission('canAccessPosAksesoris') ? (
            <PosAksesoris onGoToInventory={handleGoToInventory} />
          ) : (
            <RestrictedAccessView
              featureName="Kasir Aksesoris"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Inventory Management */}
        {activeTab === 'inventory' && (
          hasPermission('canAccessInventory') ? (
            <InventoryManager />
          ) : (
            <RestrictedAccessView
              featureName="Gudang Stok & Kulakan"
              description="Akses gudang dan harga modal dibatasi untuk staf. Masukkan PIN Pemilik untuk membuka."
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Finance Manager */}
        {activeTab === 'finance' && (
          hasPermission('canAccessFinance') ? (
            <FinanceManager />
          ) : (
            <RestrictedAccessView
              featureName="Buku Kas & Saldo Rekening"
              description="Informasi mutasi saldo rekening dan penarikan modal toko bersifat rahasia pemilik."
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Kasbon Manager */}
        {activeTab === 'kasbon' && (
          hasPermission('canAccessKasbon') ? (
            <KasbonManager />
          ) : (
            <RestrictedAccessView
              featureName="Catatan Kasbon Pelanggan"
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}

        {/* Reports View */}
        {activeTab === 'reports' && (
          hasPermission('canAccessReports') ? (
            <ReportsView />
          ) : (
            <RestrictedAccessView
              featureName="Laporan Laba Rugi Toko"
              description="Laporan keuntungan toko bersifat rahasia pemilik. Masukkan PIN Pemilik untuk melihat laporan."
              onGoBack={() => handleSelectTab(getFirstAllowedStaffTab())}
            />
          )
        )}
      </main>

      {/* Global Modals */}
      <ReceiptModal />
      <ShiftReceiptModal />
      <PinModal />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainContent />;
};

export default function App() {
  return (
    <AppProvider>
      <RootApp />
    </AppProvider>
  );
}
