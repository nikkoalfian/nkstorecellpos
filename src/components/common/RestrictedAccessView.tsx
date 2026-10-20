import React from 'react';
import { ShieldAlert, KeyRound, ArrowLeft, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RestrictedAccessViewProps {
  featureName: string;
  description?: string;
  onGoBack?: () => void;
  onUnlockSuccess?: () => void;
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({
  featureName,
  description = 'Menu ini dibatasi untuk staf/kasir dan hanya dapat diakses oleh Pemilik (Owner) toko.',
  onGoBack,
  onUnlockSuccess,
}) => {
  const { requestOwnerPin, switchViewMode } = useApp();

  const handleUnlock = () => {
    requestOwnerPin(
      `Buka Akses ${featureName}`,
      () => {
        if (onUnlockSuccess) {
          onUnlockSuccess();
        } else {
          switchViewMode('owner');
        }
      },
      `Masukkan PIN Pemilik untuk membuka menu ${featureName}`
    );
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="p-8 bg-slate-900/90 border border-amber-900/40 rounded-3xl shadow-2xl backdrop-blur-sm space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Akses Dibatasi oleh Pemilik
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Fitur {featureName} Terkunci
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">💡 Informasi Hak Akses:</p>
          <p>
            Pemilik toko dapat mengatur atau membuka izin fitur ini untuk staf/kasir kapan saja di menu <strong className="text-amber-400">Mode Owner &gt; Hak Akses Staf</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Menu Kasir
            </button>
          )}

          <button
            type="button"
            onClick={handleUnlock}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Buka Akses dengan PIN Pemilik
          </button>
        </div>
      </div>
    </div>
  );
};
