import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, X, Delete, AlertCircle } from 'lucide-react';

export const PinModal: React.FC = () => {
  const { pinModal, closePinModal, unlockOwner, verifyOwnerPin, settings } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Target PIN and dynamic length configured by owner (supports 4 to 6 digits)
  const targetPin = (settings.ownerPin || '1234').trim();
  const targetLength = targetPin.length >= 4 ? targetPin.length : 4;

  useEffect(() => {
    if (pinModal.isOpen) {
      setPinInput('');
      setErrorMsg(null);
    }
  }, [pinModal.isOpen]);

  const verifyAndSubmit = (pinToVerify: string) => {
    if (verifyOwnerPin(pinToVerify)) {
      unlockOwner(pinToVerify);
      if (pinModal.onSuccess) {
        pinModal.onSuccess();
      }
      closePinModal();
    } else {
      setErrorMsg(`PIN Pemilik salah! Masukkan ${targetLength} digit PIN yang benar.`);
      setTimeout(() => {
        setPinInput('');
      }, 700);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pinInput.length < targetLength) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg(null);

      // Auto verify when exact target length reached
      if (next.length === targetLength) {
        verifyAndSubmit(next);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  // Physical keyboard support for desktop / laptop
  useEffect(() => {
    if (!pinModal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        closePinModal();
      } else if (e.key === 'Enter') {
        if (pinInput.length === targetLength) {
          verifyAndSubmit(pinInput);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinModal.isOpen, pinInput, targetLength]);

  if (!pinModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-center space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={closePinModal}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shield Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title & Desc */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-white text-lg tracking-tight">
            {pinModal.title || 'Verifikasi PIN Pemilik'}
          </h3>
          <p className="text-xs text-slate-400 px-2">
            {pinModal.description || `Masukkan ${targetLength} digit PIN Owner untuk mengakses fitur ini`}
          </p>
        </div>

        {/* Dynamic PIN Dots Display matching targetLength (4, 5, or 6 dots) */}
        <div className="flex justify-center items-center gap-2.5 py-2 flex-wrap">
          {Array.from({ length: targetLength }).map((_, idx) => {
            const isFilled = pinInput.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 scale-125 shadow-md shadow-amber-500/50'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Virtual Numpad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-95 transition shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-400 font-semibold text-xs transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-95 transition shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <span>Format PIN Keamanan: <strong className="text-amber-400 font-mono font-bold">{targetLength} Digit</strong></span>
        </div>
      </div>
    </div>
  );
};
