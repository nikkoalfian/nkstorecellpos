import React from 'react';
import { Clock, KeyRound, ArrowRight, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ShiftRequiredGuardViewProps {
  featureName: string;
  onGoToShift: () => void;
  onUnlockSuccess?: () => void;
}

export const ShiftRequiredGuardView: React.FC<ShiftRequiredGuardViewProps> = ({
  featureName,
  onGoToShift,
  onUnlockSuccess,
}) => {
  const { requestOwnerPin, switchViewMode } = useApp();

  const handleOwnerOverride = () => {
    requestOwnerPin(
      `Bypass Shift untuk ${featureName}`,
      () => {
        if (onUnlockSuccess) {
          onUnlockSuccess();
        } else {
          switchViewMode('owner');
        }
      },
      `Masukkan PIN Pemilik jika ingin mengoperasikan transaksi tanpa membuka shift kasir.`
    );
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 text-center">
      <div className="p-8 bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-sm space-y-6">
        {/* Animated Warning Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/40">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-950 border border-amber-500/70 flex items-center justify-center text-amber-400 shadow">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Badge & Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-bold tracking-wide uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Shift Kasir Belum Dibuka
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Menu {featureName} Terkunci
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Menu <strong className="text-white">{featureName}</strong> tidak dapat dioperasikan karena kasir belum membuka shift kerja hari ini.
          </p>
        </div>

        {/* SOP Information Card */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>SOP & Aturan Kasir Konter:</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Untuk menjamin seluruh perputaran uang kas laci konter, biaya admin, serta saldo bank/server tercatat rapi dan selalu tersinkronisasi ke <strong>Buku Kas & Bank</strong>, kasir diwajibkan membuka shift sebelum melayani transaksi.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status Shift Saat Ini:</span>
            <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/50">
              Shift Nonaktif / Tutup
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoToShift}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-950/50 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Buka Shift Kasir Sekarang</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <button
            type="button"
            onClick={handleOwnerOverride}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Bypass pembatasan menggunakan PIN Pemilik Toko"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Bypass dengan PIN Pemilik</span>
          </button>
        </div>
      </div>
    </div>
  );
};
