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
  StockOpnameItem,
  StockOpnameRecord,
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
  setDoc as rawSetDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';

/**
 * Recursively removes any keys with `undefined` values from an object or array.
 * Firestore strictly disallows `undefined` values and throws an error if present.
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        result[key] = cleanFirestoreData(value);
      }
    }
    return result as T;
  }
  return data;
}

const setDoc = (docRef: any, data: any, options?: any) => {
  const cleaned = cleanFirestoreData(data);
  return options ? rawSetDoc(docRef, cleaned, options) : rawSetDoc(docRef, cleaned);
};

interface OpenShiftParams {
  cashierName: string;
  initialCashDrawer: number;
  serverInitialBalances: number[];
  serverNames?: string[];
  serverIds?: string[];
}

interface CloseShiftParams {
  serverTotalBalances?: number[];
  serverFinalBalances: number[];
  serverGrossSales?: number[];
  serverProfits?: number[];
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

  // Stock Opname
  stockOpnameList: StockOpnameRecord[];
  applyStockOpname: (params: { auditorName: string; notes?: string; items: StockOpnameItem[] }) => StockOpnameRecord;
  deleteStockOpnameRecord: (id: string) => void;

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
  addShiftCashDrawerTopUp: (amount: number, sourceAccountId?: string, note?: string) => void;
  addShiftExpense: (amount: number, note: string, sourceAccountId?: string) => void;
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
  STOCK_OPNAME: 'nkstorecell_stockopname_v2',
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

// Stable sorting and equality check helpers to prevent flickering and unnecessary re-renders
const sortAccessories = (items: AccessoryItem[]): AccessoryItem[] => {
  return [...items].sort((a, b) => {
    return (
      (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      (a.name || '').localeCompare(b.name || '') ||
      (a.id || '').localeCompare(b.id || '')
    );
  });
};

const areAccessoriesEqual = (prev: AccessoryItem[], next: AccessoryItem[]): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.stock !== b.stock ||
      a.minStock !== b.minStock ||
      a.priceSell !== b.priceSell ||
      a.priceCost !== b.priceCost ||
      a.name !== b.name ||
      a.category !== b.category ||
      a.sku !== b.sku
    ) {
      return false;
    }
  }
  return true;
};

const sortAccounts = (items: AccountBalance[]): AccountBalance[] => {
  return [...items].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
};

const areAccountsEqual = (prev: AccountBalance[], next: AccountBalance[]): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.balance !== b.balance ||
      a.name !== b.name ||
      a.accountNumber !== b.accountNumber
    ) {
      return false;
    }
  }
  return true;
};

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

  // 2. Accounts State (Stably sorted)
  const [accounts, setAccounts] = useState<AccountBalance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? sortAccounts(JSON.parse(saved)) : sortAccounts(INITIAL_ACCOUNTS);
    } catch {
      return sortAccounts(INITIAL_ACCOUNTS);
    }
  });

  // 3. Accessories State (Stably sorted)
  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCESSORIES);
      return saved ? sortAccessories(JSON.parse(saved)) : sortAccessories(INITIAL_ACCESSORIES);
    } catch {
      return sortAccessories(INITIAL_ACCESSORIES);
    }
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

  // 7b. Stock Opname State (Physical Inventory Audits)
  const [stockOpnameList, setStockOpnameList] = useState<StockOpnameRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  // 2. Real-time Firestore Listener for Accounts (Stably sorted, diff-checked)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accounts'),
      (snap) => {
        if (!snap.empty) {
          const cloudAccounts = sortAccounts(
            snap.docs.map((d) => ({ ...d.data(), id: d.id } as AccountBalance))
          );
          setAccounts((prev) => (areAccountsEqual(prev, cloudAccounts) ? prev : cloudAccounts));
        } else {
          // If Firestore is empty, seed initial accounts without clearing local state
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

  // 3. Real-time Firestore Listener for Accessories (Stably sorted, diff-checked, preserves local items)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accessories'),
      (snap) => {
        if (!snap.empty) {
          const cloudAccessories = sortAccessories(
            snap.docs.map((d) => ({ ...d.data(), id: d.id } as AccessoryItem))
          );
          setAccessories((prev) => {
            // Check if local state has items that are not in cloud yet (e.g. newly created), keep them and push to cloud
            const cloudIds = new Set(cloudAccessories.map((c) => c.id));
            const missingFromCloud = prev.filter((p) => !cloudIds.has(p.id));

            if (missingFromCloud.length > 0) {
              missingFromCloud.forEach((item) => {
                setDoc(doc(db, 'accessories', item.id), item).catch((err) =>
                  console.warn('Sync missing accessory to Firestore note:', err)
                );
              });
              const merged = sortAccessories([...cloudAccessories, ...missingFromCloud]);
              return areAccessoriesEqual(prev, merged) ? prev : merged;
            }

            return areAccessoriesEqual(prev, cloudAccessories) ? prev : cloudAccessories;
          });
        } else {
          // If Firestore is empty, do NOT wipe local state! Seed existing or initial items in the background
          setAccessories((prev) => {
            const itemsToSeed = prev && prev.length > 0 ? prev : INITIAL_ACCESSORIES;
            itemsToSeed.forEach((item) => {
              setDoc(doc(db, 'accessories', item.id), item).catch((err) =>
                console.warn('Seed accessory note:', err)
              );
            });
            return itemsToSeed;
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

  // 7. Real-time Firestore Listener for Stock Opname Sessions
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'stockOpname'),
      (snap) => {
        if (!snap.empty) {
          const cloudOpnames = snap.docs.map((d) => ({ ...d.data(), id: d.id } as StockOpnameRecord));
          cloudOpnames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setStockOpnameList(cloudOpnames);
        }
      },
      (error) => console.warn('Firestore stockOpname listener note:', error)
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(stockOpnameList));
  }, [stockOpnameList]);

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
    setDoc(doc(db, 'accounts', accountId), { balance: newBalance }, { merge: true }).catch((err) =>
      console.warn('Sync update account balance error:', err)
    );
  };

  // Add new account (Bank, E-Wallet, Cash, Server)
  const addAccount = (account: Omit<AccountBalance, 'id'>) => {
    const newAcc: AccountBalance = {
      ...account,
      id: 'acc-' + Date.now(),
    };
    setAccounts((prev) => [...prev, newAcc]);
    setDoc(doc(db, 'accounts', newAcc.id), newAcc).catch((err) =>
      console.warn('Sync add account to Firestore error:', err)
    );
  };

  const updateAccount = (id: string, updates: Partial<AccountBalance>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
    setDoc(doc(db, 'accounts', id), updates, { merge: true }).catch((err) =>
      console.warn('Sync update account to Firestore error:', err)
    );
  };

  const deleteAccount = (id: string) => {
    console.log('[AppContext] deleteAccount triggered for ID:', id);
    setAccounts((prev) => {
      const next = prev.filter((acc) => acc.id !== id);
      console.log('[AppContext] setAccounts state updated. Remaining accounts count:', next.length);
      return next;
    });
    deleteDoc(doc(db, 'accounts', id))
      .then(() => console.log('[AppContext] Successfully deleted account document from Firestore:', id))
      .catch((err) => console.warn('[AppContext] Firestore delete account error:', err));
  };

  // Transfer between accounts
  const transferBetweenAccounts = (fromId: string, toId: string, amount: number, notes: string) => {
    setAccounts((prev) => {
      const fromAcc = prev.find((acc) => acc.id === fromId);
      const toAcc = prev.find((acc) => acc.id === toId);

      if (fromAcc) {
        const newFromBalance = fromAcc.balance - amount;
        setDoc(doc(db, 'accounts', fromId), { balance: newFromBalance }, { merge: true }).catch((err) =>
          console.warn('Sync transfer fromAccount error:', err)
        );
      }
      if (toAcc) {
        const newToBalance = toAcc.balance + amount;
        setDoc(doc(db, 'accounts', toId), { balance: newToBalance }, { merge: true }).catch((err) =>
          console.warn('Sync transfer toAccount error:', err)
        );

        // Jika tujuan transfer adalah kas laci konter dan shift sedang aktif, tambahkan ke modal kas laci shift
        if (activeShift && (toId === 'acc-cash' || toAcc.type === 'cash')) {
          setShifts((shiftsPrev) =>
            shiftsPrev.map((s) => {
              if (s.id === activeShift.id) {
                const updated = {
                  ...s,
                  additionalCashDrawer: (s.additionalCashDrawer || 0) + amount,
                };
                setDoc(doc(db, 'shifts', s.id), { additionalCashDrawer: updated.additionalCashDrawer }, { merge: true }).catch(console.warn);
                return updated;
              }
              return s;
            })
          );
        }

        // Jika tujuan transfer adalah server pulsa dan shift sedang aktif, tambahkan ke topUpAmount server tersebut
        if (activeShift && (toAcc.type === 'server_pulsa' || toId.includes('server'))) {
          setShifts((shiftsPrev) =>
            shiftsPrev.map((s) => {
              if (s.id === activeShift.id) {
                const serverAccounts = prev.filter((a) => a.type === 'server_pulsa');
                const srvIdx = serverAccounts.findIndex((a) => a.id === toId);
                const updatedServers = s.servers.map((srv, idx) => {
                  const isMatch =
                    srv.serverId === toId ||
                    (srvIdx !== -1 && (idx === srvIdx || srv.serverId === `server-${srvIdx + 1}`));
                  if (isMatch) {
                    return { ...srv, topUpAmount: (srv.topUpAmount || 0) + amount };
                  }
                  return srv;
                });
                const updated = {
                  ...s,
                  servers: updatedServers,
                };
                setDoc(doc(db, 'shifts', s.id), { servers: updatedServers }, { merge: true }).catch(console.warn);
                return updated;
              }
              return s;
            })
          );
        }
      }

      return prev.map((acc) => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
        return acc;
      });
    });
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
      if (activeShift) {
        if (mutation.toAccountId === 'acc-cash') {
          setShifts((shiftsPrev) =>
            shiftsPrev.map((s) => {
              if (s.id === activeShift.id) {
                const updated = { ...s, additionalCashDrawer: (s.additionalCashDrawer || 0) + mutation.amount };
                setDoc(doc(db, 'shifts', s.id), { additionalCashDrawer: updated.additionalCashDrawer }, { merge: true }).catch(console.warn);
                return updated;
              }
              return s;
            })
          );
        } else {
          setShifts((shiftsPrev) =>
            shiftsPrev.map((s) => {
              if (s.id === activeShift.id) {
                const updatedServers = s.servers.map((srv) => {
                  if (
                    srv.serverId === mutation.toAccountId ||
                    srv.serverId === `server-${mutation.toAccountId?.replace('acc-server-', '')}`
                  ) {
                    return { ...srv, topUpAmount: (srv.topUpAmount || 0) + mutation.amount };
                  }
                  return srv;
                });
                setDoc(doc(db, 'shifts', s.id), { servers: updatedServers }, { merge: true }).catch(console.warn);
                return { ...s, servers: updatedServers };
              }
              return s;
            })
          );
        }
      }
    } else if (mutation.type === 'keluar' && mutation.fromAccountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === mutation.fromAccountId ? { ...acc, balance: acc.balance - mutation.amount } : acc
        )
      );
    }
  };

  // Accessories management (Stably sorted, synchronized to Firestore)
  const addAccessory = (item: Omit<AccessoryItem, 'id'>) => {
    const newItem: AccessoryItem = {
      ...item,
      id: 'acc-' + Date.now(),
    };
    setAccessories((prev) => sortAccessories([newItem, ...prev]));
    setDoc(doc(db, 'accessories', newItem.id), newItem).catch((err) =>
      console.warn('Sync add accessory error:', err)
    );
  };

  const updateAccessory = (id: string, itemUpdates: Partial<AccessoryItem>) => {
    setAccessories((prev) =>
      sortAccessories(prev.map((it) => (it.id === id ? { ...it, ...itemUpdates } : it)))
    );
    setDoc(doc(db, 'accessories', id), itemUpdates, { merge: true }).catch((err) =>
      console.warn('Sync update accessory error:', err)
    );
  };

  const deleteAccessory = (id: string) => {
    console.log('[AppContext] deleteAccessory triggered for ID:', id);
    setAccessories((prev) => {
      const next = prev.filter((it) => it.id !== id);
      console.log('[AppContext] setAccessories state updated. Remaining accessories count:', next.length);
      return next;
    });
    deleteDoc(doc(db, 'accessories', id))
      .then(() => console.log('[AppContext] Successfully deleted accessory document from Firestore:', id))
      .catch((err) => console.warn('Sync delete accessory error from Firestore:', err));
  };

  const adjustAccessoryStock = (id: string, delta: number) => {
    setAccessories((prev) => {
      const updated = prev.map((it) => {
        if (it.id === id) {
          const newStock = Math.max(0, it.stock + delta);
          setDoc(doc(db, 'accessories', id), { stock: newStock }, { merge: true }).catch((err) =>
            console.warn('Sync adjust accessory stock error:', err)
          );
          return { ...it, stock: newStock };
        }
        return it;
      });
      return sortAccessories(updated);
    });
  };

  // Stock Opname Operations (Audit fisik & koreksi stok aksesoris)
  const applyStockOpname = (params: {
    auditorName: string;
    notes?: string;
    items: StockOpnameItem[];
  }): StockOpnameRecord => {
    const now = new Date();
    const dateStr = now.toISOString();
    const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const opnameNumber = `SO-${dateFormatted}-${randomSuffix}`;
    const id = `so-${Date.now()}`;

    // Calculate totals
    const totalItemsCounted = params.items.length;
    const totalSystemUnits = params.items.reduce((sum, it) => sum + it.systemStock, 0);
    const totalPhysicalUnits = params.items.reduce((sum, it) => sum + it.physicalStock, 0);
    const totalDifferenceUnits = params.items.reduce((sum, it) => sum + it.difference, 0);
    const totalCostDifference = params.items.reduce((sum, it) => sum + it.costDifference, 0);

    const record: StockOpnameRecord = {
      id,
      opnameNumber,
      date: dateStr,
      auditorName: params.auditorName.trim() || 'Petugas Konter',
      notes: params.notes?.trim() || '',
      totalItemsCounted,
      totalSystemUnits,
      totalPhysicalUnits,
      totalDifferenceUnits,
      totalCostDifference,
      items: params.items,
      status: 'applied',
      appliedAt: dateStr,
    };

    // Update physical accessories inventory stock to match counted physicalStock
    const physicalStockMap = new Map<string, number>();
    params.items.forEach((it) => {
      physicalStockMap.set(it.accessoryId, it.physicalStock);
    });

    setAccessories((prev) => {
      const updated = prev.map((acc) => {
        if (physicalStockMap.has(acc.id)) {
          const newStock = physicalStockMap.get(acc.id)!;
          // Only write to Firestore if stock actually changed
          if (newStock !== acc.stock) {
            setDoc(doc(db, 'accessories', acc.id), { stock: newStock }, { merge: true }).catch((err) =>
              console.warn('Sync stock opname accessory stock note:', err)
            );
          }
          return { ...acc, stock: newStock };
        }
        return acc;
      });
      return sortAccessories(updated);
    });

    // Save record locally and in Firestore
    setStockOpnameList((prev) => [record, ...prev]);
    setDoc(doc(db, 'stockOpname', record.id), record).catch((err) =>
      console.warn('Sync stock opname record note:', err)
    );

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    return record;
  };

  const deleteStockOpnameRecord = (id: string) => {
    setStockOpnameList((prev) => prev.filter((r) => r.id !== id));
    deleteDoc(doc(db, 'stockOpname', id)).catch((err) =>
      console.warn('Sync delete stock opname record note:', err)
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

  // Kasir POS Shift Management (Dynamic Servers)
  const openShift = (params: OpenShiftParams): ShiftRecord => {
    const serverAccounts = accounts.filter((a) => a.type === 'server_pulsa');

    // Tentukan jumlah server secara dinamis berdasarkan input, akun buku kas, atau default
    const count = Math.max(
      params.serverInitialBalances.length,
      serverAccounts.length,
      params.serverNames?.length || 0,
      1
    );

    const initialServerItems: ServerShiftItem[] = [];
    for (let idx = 0; idx < count; idx++) {
      const serverAcc = serverAccounts[idx];
      const serverId = params.serverIds?.[idx] || serverAcc?.id || `server-${idx + 1}`;
      const serverName =
        params.serverNames?.[idx] ||
        serverAcc?.name ||
        settings.serverNames?.[idx] ||
        `Server ${idx + 1}`;
      const initialBal = params.serverInitialBalances[idx] ?? (serverAcc?.balance || 0);

      initialServerItems.push({
        serverId,
        serverName,
        initialBalance: initialBal,
        topUpAmount: 0,
        finalBalance: 0,
        usage: 0,
        grossSales: 0,
        profit: 0,
      });
    }

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
    setDoc(doc(db, 'shifts', newShift.id), newShift).catch(console.warn);

    // Update initial balances in accounts list for servers & cash drawer and sync to Firestore
    setAccounts((prev) => {
      const srvAccs = prev.filter((a) => a.type === 'server_pulsa');
      return prev.map((acc) => {
        if (acc.id === 'acc-cash' || acc.type === 'cash') {
          const newBal = params.initialCashDrawer;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync open shift cash drawer note:', err)
          );
          return { ...acc, balance: newBal };
        }
        
        const srvIdx = srvAccs.findIndex((s) => s.id === acc.id);
        const itemIdx = initialServerItems.findIndex(
          (it, i) => it.serverId === acc.id || (srvIdx !== -1 && i === srvIdx)
        );
        if (itemIdx !== -1 && params.serverInitialBalances[itemIdx] !== undefined) {
          const newBal = params.serverInitialBalances[itemIdx] || 0;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync open shift server note:', err)
          );
          return { ...acc, balance: newBal };
        }
        return acc;
      });
    });

    return newShift;
  };

  const addShiftTopUp = (serverId: string, amount: number) => {
    if (!activeShift) return;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === activeShift.id) {
          const updatedServers = s.servers.map((srv, idx) => {
            const isTarget =
              srv.serverId === serverId ||
              `server-${idx + 1}` === serverId ||
              `acc-server-${idx + 1}` === serverId ||
              srv.serverName === serverId;
            if (isTarget) {
              return { ...srv, topUpAmount: (srv.topUpAmount || 0) + amount };
            }
            return srv;
          });
          setDoc(doc(db, 'shifts', s.id), { servers: updatedServers }, { merge: true }).catch(console.warn);
          return { ...s, servers: updatedServers };
        }
        return s;
      })
    );

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (
          acc.id === serverId ||
          acc.id === `acc-${serverId}` ||
          acc.id === serverId.replace('server-', 'acc-server-')
        ) {
          const newBal = acc.balance + amount;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch(console.warn);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );
  };

  const addShiftCashDrawerTopUp = (amount: number, sourceAccountId?: string, note?: string) => {
    if (!activeShift) return;

    const additional = (activeShift.additionalCashDrawer || 0) + amount;

    // 1. Update active shift with additional cash drawer from owner
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === activeShift.id) {
          const updated = {
            ...s,
            additionalCashDrawer: additional,
          };
          setDoc(doc(db, 'shifts', s.id), { additionalCashDrawer: additional }, { merge: true }).catch((err) =>
            console.warn('Sync shift additional cash drawer note:', err)
          );
          return updated;
        }
        return s;
      })
    );

    // 2. Synchronize to Kas Laci Konter (Uang Tunai) in accounts & Firestore
    setAccounts((prev) => {
      return prev.map((acc) => {
        // Jika diambil dari akun tertentu (misal rekening bank), potong saldo akun tersebut
        if (sourceAccountId && acc.id === sourceAccountId) {
          const newBal = acc.balance - amount;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync source account deduction note:', err)
          );
          return { ...acc, balance: newBal };
        }
        // Tambahkan ke Kas Laci Konter (acc-cash)
        if (acc.id === 'acc-cash' || acc.type === 'cash') {
          const newBal = acc.balance + amount;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync cash drawer top up to Buku Kas note:', err)
          );
          return { ...acc, balance: newBal };
        }
        return acc;
      });
    });
  };

  const addShiftExpense = (amount: number, note: string, sourceAccountId?: string) => {
    if (!activeShift) return;

    // Tentukan akun sumber dana (default: Kas Laci Konter)
    const selectedAccount =
      accounts.find((a) => a.id === sourceAccountId) ||
      accounts.find((a) => a.id === 'acc-cash' || a.type === 'cash');
    const finalSourceId = selectedAccount ? selectedAccount.id : 'acc-cash';
    const finalSourceName = selectedAccount ? selectedAccount.name : 'Kas Laci Konter';

    const expense: ShiftExpense = {
      id: 'exp-' + Date.now(),
      amount,
      note,
      sourceAccountId: finalSourceId,
      sourceAccountName: finalSourceName,
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
          const updatedShift: ShiftRecord = {
            ...s,
            expenses: newExpenses,
            totalExpenses: totalExp,
            netProfit: newNetProfit,
          };
          setDoc(doc(db, 'shifts', s.id), updatedShift, { merge: true }).catch((err) =>
            console.warn('Sync shift expense to Firestore error:', err)
          );
          return updatedShift;
        }
        return s;
      })
    );

    // Potong saldo dari akun sumber yang dipilih (Kas Laci atau Akun Buku Kas & Bank)
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === finalSourceId) {
          const newBal = Math.max(0, acc.balance - amount);
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync expense deduction to Firestore error:', err)
          );
          return { ...acc, balance: newBal };
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
    // Initial cash + Additional cash from owner + Pulse cash sales + Accessory cash sales + Transfer admin fees - Shift expenses taken from cash drawer + (Tarik tunai fee cash in - Tarik tunai cash out)
    const additionalCash = activeShift.additionalCashDrawer || 0;
    const cashDrawerExpenses = activeShift.expenses
      .filter((e) => !e.sourceAccountId || e.sourceAccountId === 'acc-cash' || e.sourceAccountName?.toLowerCase().includes('laci'))
      .reduce((sum, e) => sum + e.amount, 0);

    const tarikTunaiCashOut = activeShift.tarikTunaiCashOut || 0;
    const tarikTunaiFeeCashIn = activeShift.tarikTunaiFeeCashIn || 0;
    const netTarikTunaiCashChange = tarikTunaiFeeCashIn - tarikTunaiCashOut;

    const expectedCashDrawer =
      activeShift.initialCashDrawer +
      additionalCash +
      totalPulseSales +
      activeShift.accessorySales +
      activeShift.transferAdminProfit +
      netTarikTunaiCashChange -
      cashDrawerExpenses;

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
    setDoc(doc(db, 'shifts', closedShift.id), closedShift).catch((err) =>
      console.warn('Sync close shift note:', err)
    );

    // Synchronize account balances in store with final balances
    setAccounts((prev) => {
      const serverAccounts = prev.filter((a) => a.type === 'server_pulsa');
      return prev.map((acc) => {
        if (acc.id === 'acc-cash' || acc.type === 'cash') {
          const newBal = params.actualFinalCashDrawer;
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync cash drawer balance note:', err)
          );
          return { ...acc, balance: newBal };
        }
        // Match server by index or ID
        const srvIdx = serverAccounts.findIndex((s) => s.id === acc.id);
        if (srvIdx !== -1 && params.serverFinalBalances[srvIdx] !== undefined) {
          const newBal = params.serverFinalBalances[srvIdx];
          setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
            console.warn('Sync server balance note:', err)
          );
          return { ...acc, balance: newBal };
        }

        const matchItem = updatedServers.find(
          (srv) => srv.serverId === acc.id || srv.serverId === `server-${acc.id.replace('acc-server-', '')}`
        );
        if (matchItem && matchItem.finalBalance !== undefined) {
          setDoc(doc(db, 'accounts', acc.id), { balance: matchItem.finalBalance }, { merge: true }).catch((err) =>
            console.warn('Sync server balance note:', err)
          );
          return { ...acc, balance: matchItem.finalBalance };
        }
        return acc;
      });
    });

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
    deleteDoc(doc(db, 'shifts', id)).catch((err) =>
      console.warn('Sync delete shift note:', err)
    );
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
        updated = updated.map((a) => {
          if (a.id === id) {
            const nextBalance = a.balance + delta;
            setDoc(doc(db, 'accounts', a.id), { balance: nextBalance }, { merge: true }).catch((err) =>
              console.warn('Sync account balance error from addTransaction:', err)
            );
            return { ...a, balance: nextBalance };
          }
          return a;
        });
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
        const targetBankId = newTransaction.sourceAccountId || updated.find((a) => a.type === 'bank')?.id || updated[0].id;
        const feeMode = newTransaction.feePaymentMethod || 'tunai';

        if (feeMode === 'tunai') {
          // 1. Sesuai operasional konter:
          // Pelanggan transfer nominal penarikan ke rekening bank konter (BCA bertambah nominal)
          mutateAcc(targetBankId, newTransaction.nominal);
          // Kas laci berkurang sejumlah uang fisik penarikan (-nominal) dan bertambah biaya admin fee (+adminFee)
          // Net perubahan kas laci = -nominal + adminFee (contoh: -100.000 + 3.000 = -97.000)
          mutateAcc(cashDrawer.id, -newTransaction.nominal + newTransaction.adminFee);
        } else if (feeMode === 'potong_tunai') {
          // Pelanggan transfer nominal ke rekening bank konter (+nominal)
          mutateAcc(targetBankId, newTransaction.nominal);
          // Kasir serahkan tunai bersih (nominal - adminFee), laci berkurang -(nominal - adminFee)
          mutateAcc(cashDrawer.id, -(newTransaction.nominal - newTransaction.adminFee));
        } else {
          // feeMode === 'transfer' (Pelanggan transfer nominal + fee sekaligus ke bank konter)
          mutateAcc(targetBankId, newTransaction.totalAmount);
          // Kasir serahkan nominal uang fisik utuh dari laci
          mutateAcc(cashDrawer.id, -newTransaction.nominal);
        }
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

    // Update physical accessories inventory stock and sync new stock to Firestore
    if (newTransaction.type === 'aksesoris' && newTransaction.items) {
      setAccessories((prev) => {
        const updated = prev.map((acc) => {
          const sold = newTransaction.items?.find((it) => it.name === acc.name);
          if (sold) {
            const newStock = Math.max(0, acc.stock - sold.quantity);
            setDoc(doc(db, 'accessories', acc.id), { stock: newStock }, { merge: true }).catch((err) =>
              console.warn('Sync sold accessory stock note:', err)
            );
            return { ...acc, stock: newStock };
          }
          return acc;
        });
        return sortAccessories(updated);
      });
    }

    // Accumulate shift profit & cash drawer metrics if shift is currently open
    if (activeShift) {
      setShifts((prev) =>
        prev.map((s) => {
          if (s.id === activeShift.id) {
            let accSales = s.accessorySales;
            let accProfit = s.accessoryProfit;
            let trfAdmin = s.transferAdminProfit;
            let trkAdmin = s.tarikTunaiAdminProfit;
            let trkNominal = s.tarikTunaiNominal || 0;
            let trkCashOut = s.tarikTunaiCashOut || 0;
            let trkFeeCashIn = s.tarikTunaiFeeCashIn || 0;

            if (newTransaction.type === 'aksesoris') {
              accSales += newTransaction.totalAmount;
              accProfit += newTransaction.profit;
            } else if (newTransaction.type === 'transfer_uang') {
              trfAdmin += newTransaction.profit;
            } else if (newTransaction.type === 'tarik_tunai') {
              trkAdmin += newTransaction.profit;
              trkNominal += newTransaction.nominal;
              const feeMode = newTransaction.feePaymentMethod || 'tunai';
              if (feeMode === 'tunai') {
                trkCashOut += newTransaction.nominal;
                trkFeeCashIn += newTransaction.adminFee;
              } else if (feeMode === 'potong_tunai') {
                trkCashOut += (newTransaction.nominal - newTransaction.adminFee);
              } else {
                trkCashOut += newTransaction.nominal;
              }
            }

            const netProf =
              s.totalPulseProfit + accProfit + trfAdmin + trkAdmin - s.totalExpenses;

            const updatedShift: ShiftRecord = {
              ...s,
              accessorySales: accSales,
              accessoryProfit: accProfit,
              transferAdminProfit: trfAdmin,
              tarikTunaiAdminProfit: trkAdmin,
              tarikTunaiNominal: trkNominal,
              tarikTunaiCashOut: trkCashOut,
              tarikTunaiFeeCashIn: trkFeeCashIn,
              netProfit: netProf,
            };
            setDoc(doc(db, 'shifts', s.id), updatedShift, { merge: true }).catch((err) =>
              console.warn('Sync active shift update error:', err)
            );
            return updatedShift;
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
      setDoc(doc(db, 'kasbon', newKasbon.id), newKasbon).catch((err) =>
        console.warn('Sync kasbon from transaction note:', err)
      );
    }

    setTransactions((prev) => [newTransaction, ...prev]);
    setDoc(doc(db, 'transactions', newTransaction.id), newTransaction).catch((err) =>
      console.warn('Sync add transaction note:', err)
    );
    setActiveReceipt(newTransaction);

    return newTransaction;
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, 'transactions', id)).catch((err) =>
      console.warn('Sync delete transaction note:', err)
    );
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
    setDoc(doc(db, 'kasbon', newRecord.id), newRecord).catch((err) =>
      console.warn('Sync add kasbon note:', err)
    );

    // If takeFromCashDrawer is selected, deduct from cash drawer balance
    if (record.takeFromCashDrawer && record.amount > 0) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.type === 'cash') {
            const newBal = Math.max(0, acc.balance - record.amount);
            setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
              console.warn('Sync cash drawer for kasbon note:', err)
            );
            return { ...acc, balance: newBal };
          }
          return acc;
        })
      );
    }
  };

  const settleKasbon = (id: string, targetAccountId?: string) => {
    const paidAt = new Date().toISOString();
    const targetKasbon = kasbonList.find((k) => k.id === id);

    setKasbonList((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          setDoc(doc(db, 'kasbon', id), { isPaid: true, paidDate: paidAt }, { merge: true }).catch((err) =>
            console.warn('Sync settle kasbon note:', err)
          );
          return {
            ...k,
            isPaid: true,
            paidDate: paidAt,
          };
        }
        return k;
      })
    );

    if (targetKasbon && targetKasbon.amount > 0) {
      setAccounts((prev) => {
        // Kas masuk hanya untuk Kas Laci dan Rekening Bank & Dompet Digital
        const cashDrawer = prev.find((a) => a.type === 'cash') || prev[0];
        const validTarget = targetAccountId
          ? prev.find((a) => a.id === targetAccountId && (a.type === 'cash' || a.type === 'bank' || a.type === 'ewallet'))
          : null;
        const effectiveTargetId = validTarget ? validTarget.id : cashDrawer?.id;

        return prev.map((acc) => {
          if (acc.id === effectiveTargetId) {
            const newBal = acc.balance + targetKasbon.amount;
            setDoc(doc(db, 'accounts', acc.id), { balance: newBal }, { merge: true }).catch((err) =>
              console.warn('Sync settle kasbon account balance note:', err)
            );
            return { ...acc, balance: newBal };
          }
          return acc;
        });
      });
    }
  };

  const deleteKasbon = (id: string) => {
    setKasbonList((prev) => prev.filter((k) => k.id !== id));
    deleteDoc(doc(db, 'kasbon', id)).catch((err) =>
      console.warn('Sync delete kasbon note:', err)
    );
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
      stockOpnameList,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-nkstorecell-${new Date().toISOString().slice(0, 10)}.json`;
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
      if (data.stockOpnameList) setStockOpnameList(data.stockOpnameList);
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
    setStockOpnameList([]);
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
        stockOpnameList,
        applyStockOpname,
        deleteStockOpnameRecord,
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
        addShiftCashDrawerTopUp,
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
