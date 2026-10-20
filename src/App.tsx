import React, { useState } from 'react';
import { ShoppingBag, Package, ShieldCheck, Crown, Lock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
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

const MainContent: React.FC = () => {
  const {
    requestOwnerPin,
    viewMode,
    isOwnerUnlocked,
    hasPermission,
    switchViewMode,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('shift');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = viewMode === 'owner' && isOwnerUnlocked;

  const handleOpenSettings = () => {
    requestOwnerPin(
      'Buka Pengaturan Toko & Keamanan',
      () => {
        setIsSettingsOpen(true);
      },
      'Masukkan PIN Pemilik untuk mengubah konfigurasi toko, printer, dan PIN'
    );
  };

  const handleGoToInventory = () => {
    if (isOwner || hasPermission('canAccessInventory')) {
      setActiveTab('inventory');
    } else {
      requestOwnerPin(
        'Buka Manajemen Stok & Gudang',
        () => {
          setActiveTab('inventory');
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
        setActiveTab={setActiveTab}
        onOpenSettings={handleOpenSettings}
      />

      {/* Mode Indicator Bar for quick context */}
      <div className={`border-b text-xs py-1.5 px-4 sm:px-8 transition-colors ${
        isOwner
          ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-800/40 text-amber-300'
          : 'bg-slate-900/90 border-slate-800/80 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-amber-300">Halaman Pemilik Toko (Mode Owner)</span>
                <span className="text-slate-400 hidden sm:inline">— Akses penuh keuangan & hak akses</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-300">Halaman Kasir / Staf Konter</span>
                <span className="text-slate-500 hidden sm:inline">— Hak akses dibatasi oleh Pemilik</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  switchViewMode('staff');
                  setActiveTab('shift');
                }}
                className="hover:underline text-amber-400 font-semibold flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Kunci ke Mode Kasir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  switchViewMode('owner');
                  setActiveTab('owner_dashboard');
                }}
                className="text-blue-400 hover:text-blue-300 hover:underline font-semibold flex items-center gap-1"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                Masuk Mode Owner
              </button>
            )}
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
            <OwnerDashboard onNavigateTab={setActiveTab} onOpenSettings={handleOpenSettings} />
          ) : (
            <RestrictedAccessView
              featureName="Dashboard & Kontrol Pemilik"
              onGoBack={() => setActiveTab('shift')}
              onUnlockSuccess={() => {
                switchViewMode('owner');
                setActiveTab('owner_dashboard');
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('aksesoris')}
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('aksesoris')}
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('shift')}
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
              onGoBack={() => setActiveTab('shift')}
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

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
