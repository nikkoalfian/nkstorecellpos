import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Transaction,
  AccessoryItem,
  PulsaProduct,
  AccountBalance,
  StoreSettings,
  KasbonRecord,
  CashMutation,
  ShiftRecord,
  ServerShiftItem,
  ShiftExpense,
  StaffPermissions,
  AuthUser,
  StaffAccount,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_ACCOUNTS,
  INITIAL_PULSA_PRODUCTS,
  INITIAL_ACCESSORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_KASBON,
  INITIAL_SHIFTS,
  DEFAULT_STAFF_PERMISSIONS,
  DEFAULT_STAFF_ACCOUNTS,
} from '../data/initialData';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';

interface OpenShiftParams {
  cashierName: string;
  initialCashDrawer: number;
  serverInitialBalances: [number, number, number, number];
  serverNames?: [string, string, string, string];
}

interface CloseShiftParams {
  serverTotalBalances?: [number, number, number, number];
  serverFinalBalances: [number, number, number, number];
  serverGrossSales?: [number, number, number, number];
  serverProfits?: [number, number, number, number];
  actualFinalCashDrawer: number;
  notes?: string;
}

interface AppContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  accounts: AccountBalance[];
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  addAccount: (account: Omit<AccountBalance, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<AccountBalance>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, notes: string) => void;
  adjustCashMutation: (mutation: Omit<CashMutation, 'id' | 'timestamp'>) => void;

  accessories: AccessoryItem[];
  addAccessory: (item: Omit<AccessoryItem, 'id'>) => void;
  updateAccessory: (id: string, item: Partial<AccessoryItem>) => void;
  deleteAccessory: (id: string) => void;
  adjustAccessoryStock: (id: string, delta: number) => void;

  pulsaProducts: PulsaProduct[];
  updatePulsaProduct: (id: string, updates: Partial<PulsaProduct>) => void;
  addPulsaProduct: (prod: Omit<PulsaProduct, 'id'>) => void;

  transactions: Transaction[];
  addTransaction: (trx: Omit<Transaction, 'id' | 'timestamp'>) => Transaction;
  deleteTransaction: (id: string) => void;

  kasbonList: KasbonRecord[];
  addKasbon: (record: Omit<KasbonRecord, 'id' | 'date' | 'isPaid'>) => void;
  settleKasbon: (id: string, targetAccountId?: string) => void;
  deleteKasbon: (id: string) => void;

  // 4 Servers Shift Management
  shifts: ShiftRecord[];
  activeShift: ShiftRecord | null;
  openShift: (params: OpenShiftParams) => ShiftRecord;
  updateActiveShiftServer: (
    serverIndex: number,
    data: { initialBalance?: number; topUpAmount?: number; serverName?: string }
  ) => void;
  addShiftTopUp: (serverId: string, amount: number) => void;
  addShiftExpense: (amount: number, note: string) => void;
  closeShift: (params: CloseShiftParams) => ShiftRecord;
  deleteShift: (id: string) => void;

  // Active Receipts
  activeReceipt: Transaction | null;
  setActiveReceipt: (trx: Transaction | null) => void;
  activeShiftReceipt: ShiftRecord | null;
  setActiveShiftReceipt: (shift: ShiftRecord | null) => void;

  // PIN & Role Security & Mode Switcher
  isOwnerUnlocked: boolean;
  unlockOwner: (pin: string) => boolean;
  lockOwner: () => void;
  updateOwnerPin: (newPin: string) => void;
  updateStaffPin: (newPin: string) => void;
  verifyOwnerPin: (pin: string) => boolean;
  viewMode: 'staff' | 'owner';
  setViewMode: (mode: 'staff' | 'owner') => void;
  switchViewMode: (targetMode: 'staff' | 'owner') => void;
  hasPermission: (permissionKey: keyof StaffPermissions) => boolean;
  updateStaffPermissions: (perms: Partial<StaffPermissions>) => void;
  resetStaffPermissions: () => void;
  pinModal: {
    isOpen: boolean;
    title: string;
    description?: string;
    onSuccess?: () => void;
  };
  requestOwnerPin: (title: string, onSuccess: () => void, description?: string) => void;
  closePinModal: () => void;

  // Web App Authentication Gate & Session
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  loginAsOwner: (pin: string, remember?: boolean) => { success: boolean; error?: string };
  loginAsStaff: (username: string, pin: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;

  // Staff Login Accounts Management (Owner Controlled)
  staffAccounts: StaffAccount[];
  addStaffAccount: (accountData: Omit<StaffAccount, 'id' | 'createdAt'>) => void;
  updateStaffAccount: (id: string, updates: Partial<StaffAccount>) => void;
  deleteStaffAccount: (id: string) => void;

  // Cloud Realtime Sync
  isCloudSynced: boolean;

  // Backup & Reset
  exportDataJson: () => void;
  importDataJson: (jsonData: string) => boolean;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'nkstorecell_settings_v2',
  ACCOUNTS: 'nkstorecell_accounts_v2',
  ACCESSORIES: 'nkstorecell_accessories_v2',
  PULSA: 'nkstorecell_pulsa_v2',
  TRANSACTIONS: 'nkstorecell_transactions_v2',
  KASBON: 'nkstorecell_kasbon_v2',
  SHIFTS: 'nkstorecell_shifts_v2',
  AUTH_SESSION: 'nkstorecell_auth_session_v2',
};

// Clean legacy demo & test keys from all previous versions
if (typeof window !== 'undefined') {
  [
    'mitracell_settings_v2',
    'mitracell_accounts_v2',
    'mitracell_accessories_v2',
    'mitracell_pulsa_v2',
    'mitracell_transactions_v2',
    'mitracell_kasbon_v2',
    'mitracell_shifts_v2',
    'nkstorecell_settings_v1',
    'nkstorecell_accounts_v1',
    'nkstorecell_accessories_v1',
    'nkstorecell_pulsa_v1',
    'nkstorecell_transactions_v1',
    'nkstorecell_kasbon_v1',
    'nkstorecell_shifts_v1',
  ].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          logoUrl: parsed.logoUrl || INITIAL_SETTINGS.logoUrl || '/logo_nk.jpg',
          ownerPin: parsed.ownerPin || '1234',
          enablePinProtection: parsed.enablePinProtection !== undefined ? parsed.enablePinProtection : true,
          staffAccounts:
            parsed.staffAccounts && Array.isArray(parsed.staffAccounts) && parsed.staffAccounts.length > 0
              ? parsed.staffAccounts
              : DEFAULT_STAFF_ACCOUNTS,
          staffPermissions: {
            ...DEFAULT_STAFF_PERMISSIONS,
            ...(parsed.staffPermissions || {}),
          },
        };
      } catch {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });

  // 2. Accounts State
  const [accounts, setAccounts] = useState<AccountBalance[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // 3. Accessories State
  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCESSORIES);
    return saved ? JSON.parse(saved) : INITIAL_ACCESSORIES;
  });

  // 4. Pulsa Products State
  const [pulsaProducts, setPulsaProducts] = useState<PulsaProduct[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PULSA);
    return saved ? JSON.parse(saved) : INITIAL_PULSA_PRODUCTS;
  });

  // 5. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // 6. Kasbon State
  const [kasbonList, setKasbonList] = useState<KasbonRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KASBON);
    return saved ? JSON.parse(saved) : INITIAL_KASBON;
  });

  // 7. Shifts State (4 Server Shift Management)
  const [shifts, setShifts] = useState<ShiftRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  // Active open shift
  const activeShift = shifts.find((s) => s.status === 'open') || null;

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [activeShiftReceipt, setActiveShiftReceipt] = useState<ShiftRecord | null>(null);

  // 8. Role & Security State (Owner vs Staff View Mode)
  const [viewMode, setViewMode] = useState<'staff' | 'owner'>('staff');
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onSuccess?: () => void;
  }>({
    isOpen: false,
    title: 'Masukkan PIN Pemilik',
  });

  const getOwnerPin = () => settings.ownerPin || '1234';

  const verifyOwnerPin = (pin: string): boolean => {
    return pin.trim() === getOwnerPin();
  };

  const unlockOwner = (pin: string): boolean => {
    if (verifyOwnerPin(pin)) {
      setIsOwnerUnlocked(true);
      return true;
    }
    return false;
  };

  const lockOwner = () => {
    setIsOwnerUnlocked(false);
    setViewMode('staff');
  };

  // Web App Authentication Gate & Session
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (local) return JSON.parse(local);
      const sess = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (sess) return JSON.parse(sess);
    } catch (e) {
      console.error('Failed to parse auth session', e);
    }
    return null;
  });

  const isAuthenticated = !!currentUser;

  // Sync mode if already authenticated on initial load
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'owner') {
        setIsOwnerUnlocked(true);
        setViewMode('owner');
      } else {
        setIsOwnerUnlocked(false);
        setViewMode('staff');
      }
    }
  }, [currentUser]);

  const loginAsOwner = (pin: string, remember: boolean = true): { success: boolean; error?: string } => {
    const clean = pin.trim();
    if (clean === getOwnerPin()) {
      const user: AuthUser = {
        role: 'owner',
        name: settings.ownerName || 'Nikko Alfian (Owner)',
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      setIsOwnerUnlocked(true);
      setViewMode('owner');
      try {
        const serialized = JSON.stringify(user);
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, serialized);
        } else {
          sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, serialized);
        }
      } catch (err) {
        console.error('Storage error', err);
      }
      return { success: true };
    }
    return { success: false, error: 'PIN Pemilik tidak tepat! Silakan coba lagi.' };
  };

  // Staff Accounts & Login Validation
  const staffAccounts: StaffAccount[] = (settings.staffAccounts && settings.staffAccounts.length > 0)
    ? settings.staffAccounts
    : DEFAULT_STAFF_ACCOUNTS;

  const addStaffAccount = (accountData: Omit<StaffAccount, 'id' | 'createdAt'>) => {
    const newAccount: StaffAccount = {
      ...accountData,
      id: `staff-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const current = settings.staffAccounts && settings.staffAccounts.length > 0 ? settings.staffAccounts : DEFAULT_STAFF_ACCOUNTS;
    const updated = [...current, newAccount];
    setSettings((prev) => ({
      ...prev,
      staffAccounts: updated,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffAccounts: updated }, { merge: true }).catch((err) =>
      console.warn('Sync add staff account error:', err)
    );
  };

  const updateStaffAccount = (id: string, updates: Partial<StaffAccount>) => {
    const current = settings.staffAccounts && settings.staffAccounts.length > 0 ? settings.staffAccounts : DEFAULT_STAFF_ACCOUNTS;
    const updated = current.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc));
    setSettings((prev) => ({
      ...prev,
      staffAccounts: updated,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffAccounts: updated }, { merge: true }).catch((err) =>
      console.warn('Sync update staff account error:', err)
    );
  };

  const deleteStaffAccount = (id: string) => {
    const current = settings.staffAccounts && settings.staffAccounts.length > 0 ? settings.staffAccounts : DEFAULT_STAFF_ACCOUNTS;
    const updated = current.filter((acc) => acc.id !== id);
    setSettings((prev) => ({
      ...prev,
      staffAccounts: updated,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffAccounts: updated }, { merge: true }).catch((err) =>
      console.warn('Sync delete staff account error:', err)
    );
  };

  const loginAsStaff = (usernameInput: string, pinInput: string = '', remember: boolean = true): { success: boolean; error?: string } => {
    const cleanUser = usernameInput.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, error: 'Silakan masukkan username kasir.' };
    }

    const accounts = (settings.staffAccounts && settings.staffAccounts.length > 0)
      ? settings.staffAccounts
      : DEFAULT_STAFF_ACCOUNTS;

    // Search by username or name
    const account = accounts.find(
      (a) => (a.username.trim().toLowerCase() === cleanUser || a.name.trim().toLowerCase() === cleanUser) && a.isActive
    );

    if (!account) {
      return {
        success: false,
        error: `Akun kasir dengan username "${usernameInput}" tidak ditemukan atau sedang nonaktif. Hubungi Pemilik.`,
      };
    }

    const accountPin = (account.pin || '').trim();
    const inputPin = (pinInput || '').trim();

    // If account has a PIN, it must match account pin or master owner PIN
    if (accountPin && inputPin !== accountPin && inputPin !== getOwnerPin()) {
      return { success: false, error: 'PIN Staf/Kasir tidak tepat! Silakan coba lagi.' };
    }

    const user: AuthUser = {
      role: 'staff',
      name: account.name,
      username: account.username,
      loginAt: new Date().toISOString(),
    };

    setCurrentUser(user);
    setIsOwnerUnlocked(false);
    setViewMode('staff');

    try {
      const serialized = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, serialized);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, serialized);
      }
    } catch (err) {
      console.error('Storage error', err);
    }
    return { success: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch (err) {
      console.error('Storage error', err);
    }
    setCurrentUser(null);
    setIsOwnerUnlocked(false);
    setViewMode('staff');
  };

  const switchViewMode = (targetMode: 'staff' | 'owner') => {
    if (targetMode === 'owner') {
      // If user logged in as owner, allow instant switch without re-prompting PIN
      if (isOwnerUnlocked || currentUser?.role === 'owner') {
        setIsOwnerUnlocked(true);
        setViewMode('owner');
      } else {
        requestOwnerPin(
          'Masuk ke Halaman Mode Pemilik (Owner)',
          () => {
            setIsOwnerUnlocked(true);
            setViewMode('owner');
          },
          'Masukkan PIN Pemilik untuk membuka seluruh dashboard dan pengaturan toko'
        );
      }
    } else {
      setViewMode('staff');
      setIsOwnerUnlocked(false);
    }
  };

  const hasPermission = (permissionKey: keyof StaffPermissions): boolean => {
    // If owner mode is active and unlocked, grant full access
    if (viewMode === 'owner' && isOwnerUnlocked) return true;
    // If PIN protection is completely turned off by owner, grant access
    if (!settings.enablePinProtection) return true;
    // Otherwise check staff permissions
    const perms = settings.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
    return perms[permissionKey] ?? false;
  };

  const updateStaffPermissions = (perms: Partial<StaffPermissions>) => {
    const updated = {
      ...(settings.staffPermissions || DEFAULT_STAFF_PERMISSIONS),
      ...perms,
    };
    setSettings((prev) => ({
      ...prev,
      staffPermissions: updated,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffPermissions: updated }, { merge: true }).catch((err) =>
      console.warn('Sync update staff permissions error:', err)
    );
  };

  const resetStaffPermissions = () => {
    setSettings((prev) => ({
      ...prev,
      staffPermissions: DEFAULT_STAFF_PERMISSIONS,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffPermissions: DEFAULT_STAFF_PERMISSIONS }, { merge: true }).catch((err) =>
      console.warn('Sync reset staff permissions error:', err)
    );
  };

  const updateOwnerPin = (newPin: string) => {
    setSettings((prev) => ({
      ...prev,
      ownerPin: newPin,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { ownerPin: newPin }, { merge: true }).catch((err) =>
      console.warn('Sync update owner pin error:', err)
    );
  };

  const updateStaffPin = (newPin: string) => {
    setSettings((prev) => ({
      ...prev,
      staffPin: newPin,
    }));
    setDoc(doc(db, 'stores', 'main_store'), { staffPin: newPin }, { merge: true }).catch((err) =>
      console.warn('Sync update staff pin error:', err)
    );
  };

  const requestOwnerPin = (title: string, onSuccess: () => void, description?: string) => {
    if (isOwnerUnlocked || !settings.enablePinProtection) {
      onSuccess();
      return;
    }
    setPinModal({
      isOpen: true,
      title,
      description,
      onSuccess,
    });
  };

  const closePinModal = () => {
    setPinModal((prev) => ({ ...prev, isOpen: false, onSuccess: undefined }));
  };

  // Real-time Cloud Sync State with Firestore
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 1. Real-time Firestore Listener for Store Settings (Syncs staff accounts, PINs, and permissions across all devices)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'stores', 'main_store'),
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as Partial<StoreSettings>;
          setSettings((prev) => ({
            ...prev,
            ...cloudData,
            staffAccounts:
              cloudData.staffAccounts && Array.isArray(cloudData.staffAccounts) && cloudData.staffAccounts.length > 0
                ? cloudData.staffAccounts
                : prev.staffAccounts,
            staffPermissions: {
              ...DEFAULT_STAFF_PERMISSIONS,
              ...(prev.staffPermissions || {}),
              ...((cloudData.staffPermissions as Partial<StaffPermissions>) || {}),
            },
          }));
          setIsCloudSynced(true);
        } else {
          // Initialize in Firestore on very first run
          setDoc(doc(db, 'stores', 'main_store'), settings, { merge: true })
            .then(() => setIsCloudSynced(true))
            .catch((err) => console.warn('Init store settings in firestore note:', err));
        }
      },
      (error) => {
        console.warn('Firestore settings listener error:', error);
      }
    );
    return () => unsub();
  }, []);

  // 2. Real-time Firestore Listener for Accounts
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accounts'),
      (snap) => {
        if (!snap.empty) {
          const cloudAccounts = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AccountBalance));
          setAccounts(cloudAccounts);
        } else {
          INITIAL_ACCOUNTS.forEach((acc) => {
            setDoc(doc(db, 'accounts', acc.id), acc).catch((err) =>
              console.warn('Seed account note:', err)
            );
          });
        }
      },
      (error) => console.warn('Firestore accounts listener note:', error)
    );
    return () => unsub();
  }, []);

  // 3. Real-time Firestore Listener for Accessories
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accessories'),
      (snap) => {
        if (!snap.empty) {
          const cloudAccessories = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AccessoryItem));
          setAccessories(cloudAccessories);
        } else {
          INITIAL_ACCESSORIES.forEach((item) => {
            setDoc(doc(db, 'accessories', item.id), item).catch((err) =>
              console.warn('Seed accessory note:', err)
            );
          });
        }
      },
      (error) => console.warn('Firestore accessories listener note:', error)
    );
    return () => unsub();
  }, []);

  // 4. Real-time Firestore Listener for Transactions
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        if (!snap.empty) {
          const cloudTrx = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Transaction));
          cloudTrx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setTransactions(cloudTrx);
        }
      },
      (error) => console.warn('Firestore transactions listener note:', error)
    );
    return () => unsub();
  }, []);

  // 5. Real-time Firestore Listener for Kasbon
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'kasbon'),
      (snap) => {
        if (!snap.empty) {
          const cloudKasbon = snap.docs.map((d) => ({ ...d.data(), id: d.id } as KasbonRecord));
          cloudKasbon.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setKasbonList(cloudKasbon);
        }
      },
      (error) => console.warn('Firestore kasbon listener note:', error)
    );
    return () => unsub();
  }, []);

  // 6. Real-time Firestore Listener for Shifts
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'shifts'),
      (snap) => {
        if (!snap.empty) {
          const cloudShifts = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ShiftRecord));
          cloudShifts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          setShifts(cloudShifts);
        }
      },
      (error) => console.warn('Firestore shifts listener note:', error)
    );
    return () => unsub();
  }, []);

  // Sync to LocalStorage (as fast local offline cache)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCESSORIES, JSON.stringify(accessories));
  }, [accessories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PULSA, JSON.stringify(pulsaProducts));
  }, [pulsaProducts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(kasbonList));
  }, [kasbonList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  // Update Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    setDoc(doc(db, 'stores', 'main_store'), newSettings, { merge: true }).catch((err) =>
      console.warn('Sync updateSettings error:', err)
    );
  };

  // Update account balance
  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, balance: newBalance } : acc))
    );
  };

  // Add new account (Bank, E-Wallet, Cash, Server)
  const addAccount = (account: Omit<AccountBalance, 'id'>) => {
    const newAcc: AccountBalance = {
      ...account,
      id: 'acc-' + Date.now(),
    };
    setAccounts((prev) => [...prev, newAcc]);
  };

  const updateAccount = (id: string, updates: Partial<AccountBalance>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Transfer between accounts
  const transferBetweenAccounts = (fromId: string, toId: string, amount: number, notes: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );
  };

  // Adjust cash mutation
  const adjustCashMutation = (mutation: Omit<CashMutation, 'id' | 'timestamp'>) => {
    if (mutation.type === 'transfer' && mutation.fromAccountId && mutation.toAccountId) {
      transferBetweenAccounts(mutation.fromAccountId, mutation.toAccountId, mutation.amount, mutation.notes);
    } else if (mutation.type === 'masuk' && mutation.toAccountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === mutation.toAccountId ? { ...acc, balance: acc.balance + mutation.amount } : acc
        )
      );
    } else if (mutation.type === 'keluar' && mutation.fromAccountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === mutation.fromAccountId ? { ...acc, balance: acc.balance - mutation.amount } : acc
        )
      );
    }
  };

  // Accessories management
  const addAccessory = (item: Omit<AccessoryItem, 'id'>) => {
    const newItem: AccessoryItem = {
      ...item,
      id: 'acc-' + Date.now(),
    };
    setAccessories((prev) => [newItem, ...prev]);
  };

  const updateAccessory = (id: string, itemUpdates: Partial<AccessoryItem>) => {
    setAccessories((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...itemUpdates } : it))
    );
  };

  const deleteAccessory = (id: string) => {
    setAccessories((prev) => prev.filter((it) => it.id !== id));
  };

  const adjustAccessoryStock = (id: string, delta: number) => {
    setAccessories((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it
      )
    );
  };

  // Pulsa Products management
  const updatePulsaProduct = (id: string, updates: Partial<PulsaProduct>) => {
    setPulsaProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const addPulsaProduct = (prod: Omit<PulsaProduct, 'id'>) => {
    const newProd: PulsaProduct = {
      ...prod,
      id: 'prod-' + Date.now(),
    };
    setPulsaProducts((prev) => [...prev, newProd]);
  };

  // 4 Servers Shift Management
  const openShift = (params: OpenShiftParams): ShiftRecord => {
    const serverTitles = params.serverNames || settings.serverNames || [
      'Server 1 - Digipos',
      'Server 2 - SiDompul',
      'Server 3 - Mobo',
      'Server 4 - Multi PPOB',
    ];

    const initialServerItems: ServerShiftItem[] = [0, 1, 2, 3].map((idx) => ({
      serverId: `server-${idx + 1}`,
      serverName: serverTitles[idx],
      initialBalance: params.serverInitialBalances[idx] || 0,
      topUpAmount: 0,
      finalBalance: 0,
      usage: 0,
      grossSales: 0,
      profit: 0,
    }));

    const newShift: ShiftRecord = {
      id: 'shift-' + Date.now(),
      shiftNumber: shifts.length + 1,
      cashierName: params.cashierName,
      startTime: new Date().toISOString(),
      status: 'open',
      initialCashDrawer: params.initialCashDrawer,
      servers: initialServerItems,
      expenses: [],
      accessorySales: 0,
      accessoryProfit: 0,
      transferAdminProfit: 0,
      tarikTunaiAdminProfit: 0,
      totalPulseSales: 0,
      totalPulseUsage: 0,
      totalPulseProfit: 0,
      totalExpenses: 0,
      netProfit: 0,
    };

    // If there is any previously open shift, mark as closed
    setShifts((prev) => [
      newShift,
      ...prev.map((s) => (s.status === 'open' ? { ...s, status: 'closed' as const, endTime: new Date().toISOString() } : s)),
    ]);

    // Update initial balances in accounts list for 4 servers
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === 'acc-cash') {
          return { ...acc, balance: params.initialCashDrawer };
        }
        for (let i = 0; i < 4; i++) {
          if (acc.id === `acc-server-${i + 1}`) {
            return { ...acc, balance: params.serverInitialBalances[i] || 0 };
          }
        }
        return acc;
      })
    );

    return newShift;
  };

  const addShiftTopUp = (serverId: string, amount: number) => {
    if (!activeShift) return;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === activeShift.id) {
          const updatedServers = s.servers.map((srv) => {
            if (srv.serverId === serverId) {
              return { ...srv, topUpAmount: srv.topUpAmount + amount };
            }
            return srv;
          });
          return { ...s, servers: updatedServers };
        }
        return s;
      })
    );

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === `acc-${serverId}`) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      })
    );
  };

  const addShiftExpense = (amount: number, note: string) => {
    if (!activeShift) return;
    const expense: ShiftExpense = {
      id: 'exp-' + Date.now(),
      amount,
      note,
      time: new Date().toISOString(),
    };

    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === activeShift.id) {
          const newExpenses = [expense, ...s.expenses];
          const totalExp = newExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newNetProfit =
            s.totalPulseProfit +
            s.accessoryProfit +
            s.transferAdminProfit +
            s.tarikTunaiAdminProfit -
            totalExp;
          return {
            ...s,
            expenses: newExpenses,
            totalExpenses: totalExp,
            netProfit: newNetProfit,
          };
        }
        return s;
      })
    );

    // Deduct cash from cash drawer
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.type === 'cash') {
          return { ...acc, balance: Math.max(0, acc.balance - amount) };
        }
        return acc;
      })
    );
  };

  const updateActiveShiftServer = (
    serverIndex: number,
    data: { initialBalance?: number; topUpAmount?: number; serverName?: string }
  ) => {
    if (!activeShift) return;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === activeShift.id) {
          const updated = [...s.servers];
          if (updated[serverIndex]) {
            updated[serverIndex] = {
              ...updated[serverIndex],
              initialBalance: data.initialBalance !== undefined ? data.initialBalance : updated[serverIndex].initialBalance,
              topUpAmount: data.topUpAmount !== undefined ? data.topUpAmount : updated[serverIndex].topUpAmount,
              serverName: data.serverName || updated[serverIndex].serverName,
            };
          }
          return { ...s, servers: updated };
        }
        return s;
      })
    );
  };

  const closeShift = (params: CloseShiftParams): ShiftRecord => {
    if (!activeShift) throw new Error('Tidak ada shift yang sedang terbuka!');

    let totalPulseSales = 0;
    let totalPulseUsage = 0;
    let totalPulseProfit = 0;

    const updatedServers = activeShift.servers.map((srv, index) => {
      const finalBal = params.serverFinalBalances[index] ?? srv.finalBalance;
      // Total Saldo Modal per server (Saldo Awal + Top Up)
      const totalSaldo = (params.serverTotalBalances && params.serverTotalBalances[index] !== undefined && params.serverTotalBalances[index] !== null)
        ? params.serverTotalBalances[index]
        : (srv.initialBalance + srv.topUpAmount);

      let grossSales = 0;
      let profit = 0;

      if (params.serverGrossSales && params.serverGrossSales[index] !== undefined) {
        grossSales = params.serverGrossSales[index];
        // RUMUS SESUAI PERMINTAAN USER:
        // (penjualan + Saldo Akhir) - Total Saldo = laba bersih
        profit = (grossSales + finalBal) - totalSaldo;
      } else if (params.serverProfits && params.serverProfits[index] !== undefined) {
        profit = params.serverProfits[index];
        grossSales = totalSaldo + profit - finalBal;
      }

      // Pemakaian saldo server = Total Saldo Modal - Saldo Akhir
      const usage = Math.max(0, totalSaldo - finalBal);

      totalPulseUsage += usage;
      totalPulseSales += grossSales;
      totalPulseProfit += profit;

      return {
        ...srv,
        initialBalance: (params.serverTotalBalances && params.serverTotalBalances[index] !== undefined)
          ? params.serverTotalBalances[index] - srv.topUpAmount
          : srv.initialBalance,
        totalBalance: totalSaldo,
        finalBalance: finalBal,
        usage,
        grossSales,
        profit,
      };
    });

    const totalExp = activeShift.expenses.reduce((sum, e) => sum + e.amount, 0);
    const overallNetProfit =
      totalPulseProfit +
      activeShift.accessoryProfit +
      activeShift.transferAdminProfit +
      activeShift.tarikTunaiAdminProfit -
      totalExp;

    // Expected cash drawer:
    // Initial cash + Pulse cash sales + Accessory cash sales + Transfer admin fees - Shift expenses
    const expectedCashDrawer =
      activeShift.initialCashDrawer +
      totalPulseSales +
      activeShift.accessorySales +
      activeShift.transferAdminProfit -
      totalExp;

    const cashDiff = params.actualFinalCashDrawer - expectedCashDrawer;

    const closedShift: ShiftRecord = {
      ...activeShift,
      endTime: new Date().toISOString(),
      status: 'closed',
      finalCashDrawer: params.actualFinalCashDrawer,
      expectedCashDrawer,
      cashDifference: cashDiff,
      servers: updatedServers,
      totalPulseSales,
      totalPulseUsage,
      totalPulseProfit,
      totalExpenses: totalExp,
      netProfit: overallNetProfit,
      notes: params.notes,
    };

    setShifts((prev) => prev.map((s) => (s.id === activeShift.id ? closedShift : s)));

    // Synchronize account balances in store with final balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === 'acc-cash') {
          return { ...acc, balance: params.actualFinalCashDrawer };
        }
        for (let i = 0; i < 4; i++) {
          if (acc.id === `acc-server-${i + 1}`) {
            return { ...acc, balance: params.serverFinalBalances[i] || 0 };
          }
        }
        return acc;
      })
    );

    // Show shift receipt modal
    setActiveShiftReceipt(closedShift);

    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    return closedShift;
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  // Add transaction and sync with active shift metrics
  const addTransaction = (trxData: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
    const newTransaction: Transaction = {
      ...trxData,
      id: 'trx-' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    // Update balances
    setAccounts((currentAccounts) => {
      let updated = [...currentAccounts];
      const mutateAcc = (id: string, delta: number) => {
        updated = updated.map((a) => (a.id === id ? { ...a, balance: a.balance + delta } : a));
      };

      const cashDrawer = updated.find((a) => a.type === 'cash') || updated[0];

      if (
        newTransaction.type === 'pulsa' ||
        newTransaction.type === 'paket_data' ||
        newTransaction.type === 'token_pln' ||
        newTransaction.type === 'topup_ewallet'
      ) {
        if (newTransaction.paymentMethod === 'tunai') {
          mutateAcc(cashDrawer.id, newTransaction.totalAmount);
        } else {
          const bankAcc = updated.find((a) => a.type === 'bank' || a.type === 'ewallet') || cashDrawer;
          mutateAcc(bankAcc.id, newTransaction.totalAmount);
        }
      } else if (newTransaction.type === 'transfer_uang') {
        const sourceBankId = newTransaction.sourceAccountId || updated.find((a) => a.type === 'bank')?.id || updated[0].id;
        mutateAcc(sourceBankId, -newTransaction.nominal);

        if (newTransaction.paymentMethod === 'tunai') {
          mutateAcc(cashDrawer.id, newTransaction.totalAmount);
        } else {
          const destAcc = updated.find((a) => a.id !== sourceBankId && (a.type === 'bank' || a.type === 'ewallet')) || cashDrawer;
          mutateAcc(destAcc.id, newTransaction.totalAmount);
        }
      } else if (newTransaction.type === 'tarik_tunai') {
        mutateAcc(cashDrawer.id, -newTransaction.nominal);
        const targetBankId = newTransaction.sourceAccountId || updated.find((a) => a.type === 'bank')?.id || updated[0].id;
        mutateAcc(targetBankId, newTransaction.totalAmount);
      } else if (newTransaction.type === 'aksesoris') {
        if (newTransaction.paymentMethod === 'tunai') {
          mutateAcc(cashDrawer.id, newTransaction.totalAmount);
        } else {
          const bankAcc = updated.find((a) => a.type === 'bank' || a.type === 'ewallet') || cashDrawer;
          mutateAcc(bankAcc.id, newTransaction.totalAmount);
        }
      }

      return updated;
    });

    // Update physical accessories inventory stock
    if (newTransaction.type === 'aksesoris' && newTransaction.items) {
      setAccessories((prev) =>
        prev.map((acc) => {
          const sold = newTransaction.items?.find((it) => it.name === acc.name);
          if (sold) {
            return { ...acc, stock: Math.max(0, acc.stock - sold.quantity) };
          }
          return acc;
        })
      );
    }

    // Accumulate shift profit if shift is currently open
    if (activeShift) {
      setShifts((prev) =>
        prev.map((s) => {
          if (s.id === activeShift.id) {
            let accSales = s.accessorySales;
            let accProfit = s.accessoryProfit;
            let trfAdmin = s.transferAdminProfit;
            let trkAdmin = s.tarikTunaiAdminProfit;

            if (newTransaction.type === 'aksesoris') {
              accSales += newTransaction.totalAmount;
              accProfit += newTransaction.profit;
            } else if (newTransaction.type === 'transfer_uang') {
              trfAdmin += newTransaction.profit;
            } else if (newTransaction.type === 'tarik_tunai') {
              trkAdmin += newTransaction.profit;
            }

            const netProf =
              s.totalPulseProfit + accProfit + trfAdmin + trkAdmin - s.totalExpenses;

            return {
              ...s,
              accessorySales: accSales,
              accessoryProfit: accProfit,
              transferAdminProfit: trfAdmin,
              tarikTunaiAdminProfit: trkAdmin,
              netProfit: netProf,
            };
          }
          return s;
        })
      );
    }

    // If payment method is Kasbon
    if (newTransaction.paymentMethod === 'kasbon') {
      const newKasbon: KasbonRecord = {
        id: 'kasbon-' + Date.now(),
        customerName: newTransaction.targetName || 'Pelanggan Konter',
        customerPhone: newTransaction.targetNumber || '',
        amount: newTransaction.totalAmount,
        description: `${newTransaction.title} (No Nota: ${newTransaction.invoiceNo})`,
        date: new Date().toISOString(),
        isPaid: false,
        transactionId: newTransaction.id,
      };
      setKasbonList((prev) => [newKasbon, ...prev]);
    }

    setTransactions((prev) => [newTransaction, ...prev]);
    setActiveReceipt(newTransaction);

    return newTransaction;
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Kasbon operations
  const addKasbon = (record: Omit<KasbonRecord, 'id' | 'date' | 'isPaid'>) => {
    const newRecord: KasbonRecord = {
      ...record,
      id: 'kasbon-' + Date.now(),
      date: new Date().toISOString(),
      isPaid: false,
    };
    setKasbonList((prev) => [newRecord, ...prev]);
  };

  const settleKasbon = (id: string, targetAccountId?: string) => {
    setKasbonList((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          return {
            ...k,
            isPaid: true,
            paidDate: new Date().toISOString(),
          };
        }
        return k;
      })
    );

    const targetKasbon = kasbonList.find((k) => k.id === id);
    if (targetKasbon) {
      setAccounts((prev) =>
        prev.map((acc) => {
          const isTarget = targetAccountId ? acc.id === targetAccountId : acc.type === 'cash';
          if (isTarget) {
            return { ...acc, balance: acc.balance + targetKasbon.amount };
          }
          return acc;
        })
      );
    }
  };

  const deleteKasbon = (id: string) => {
    setKasbonList((prev) => prev.filter((k) => k.id !== id));
  };

  // Export & Import
  const exportDataJson = () => {
    const backup = {
      settings,
      accounts,
      accessories,
      pulsaProducts,
      transactions,
      kasbonList,
      shifts,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-mitracell-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) setSettings(data.settings);
      if (data.accounts) setAccounts(data.accounts);
      if (data.accessories) setAccessories(data.accessories);
      if (data.pulsaProducts) setPulsaProducts(data.pulsaProducts);
      if (data.transactions) setTransactions(data.transactions);
      if (data.kasbonList) setKasbonList(data.kasbonList);
      if (data.shifts) setShifts(data.shifts);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const resetAllData = () => {
    setSettings(INITIAL_SETTINGS);
    setAccounts(INITIAL_ACCOUNTS);
    setAccessories(INITIAL_ACCESSORIES);
    setPulsaProducts(INITIAL_PULSA_PRODUCTS);
    setTransactions([]);
    setKasbonList([]);
    setShifts([]);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        accounts,
        updateAccountBalance,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        adjustCashMutation,
        accessories,
        addAccessory,
        updateAccessory,
        deleteAccessory,
        adjustAccessoryStock,
        pulsaProducts,
        updatePulsaProduct,
        addPulsaProduct,
        transactions,
        addTransaction,
        deleteTransaction,
        kasbonList,
        addKasbon,
        settleKasbon,
        deleteKasbon,
        shifts,
        activeShift,
        openShift,
        updateActiveShiftServer,
        addShiftTopUp,
        addShiftExpense,
        closeShift,
        deleteShift,
        activeReceipt,
        setActiveReceipt,
        activeShiftReceipt,
        setActiveShiftReceipt,
        isOwnerUnlocked,
        unlockOwner,
        lockOwner,
        updateOwnerPin,
        updateStaffPin,
        verifyOwnerPin,
        viewMode,
        setViewMode,
        switchViewMode,
        hasPermission,
        updateStaffPermissions,
        resetStaffPermissions,
        pinModal,
        requestOwnerPin,
        closePinModal,
        isAuthenticated,
        currentUser,
        loginAsOwner,
        loginAsStaff,
        logout,
        staffAccounts,
        addStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        isCloudSynced,
        exportDataJson,
        importDataJson,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
