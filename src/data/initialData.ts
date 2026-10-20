import {
  PulsaProduct,
  AccessoryItem,
  AccountBalance,
  StoreSettings,
  StaffPermissions,
  Transaction,
  KasbonRecord,
  Operator,
  ShiftRecord,
} from '../types';

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canAccessShift: true,
  canAccessTransfer: true,
  canAccessTarikTunai: true,
  canAccessPosAksesoris: true,
  canAccessKasbon: true,
  canAccessInventory: false,
  canAccessFinance: false,
  canAccessReports: false,
  canDeleteTransactions: false,
  canDeleteShifts: false,
  canEditSettings: false,
  canViewCostPrice: false,
};

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'NK STORE CELL',
  tagline: 'Solution Payment Digital - Pulsa, Kuota, Aksesoris, Transfer & Tarik Tunai',
  ownerName: 'Nikko Alfian',
  address: 'Jl. Pemuda No. 88, Blok C (Depan Indomaret)',
  phone: '081298765432',
  receiptFooterMessage: 'Terima kasih atas kepercayaannya. Transaksi cepat, aman & terpercaya!',
  defaultTransferAdminFee: 5000,
  defaultTarikTunaiAdminFee: 5000,
  printerPaperWidth: '58mm',
  serverNames: [
    'Server 1 - Digipos (Telkomsel)',
    'Server 2 - SiDompul (XL & Axis)',
    'Server 3 - Mobo (Indosat Ooredoo)',
    'Server 4 - Multi PPOB (PLN, E-Wallet & Lainnya)',
  ],
  ownerPin: '1234',
  enablePinProtection: true,
  staffPermissions: DEFAULT_STAFF_PERMISSIONS,
};

export const INITIAL_ACCOUNTS: AccountBalance[] = [
  {
    id: 'acc-cash',
    name: 'Kas Laci Konter (Uang Tunai)',
    type: 'cash',
    balance: 0,
    description: 'Uang fisik di laci kasir konter',
    color: '#10B981', // green
  },
  {
    id: 'acc-server-1',
    name: 'Server 1: Digipos (Telkomsel)',
    type: 'server_pulsa',
    balance: 0,
    description: 'Saldo chip/aplikasi Server 1 Telkomsel',
    color: '#E11D48', // red
  },
  {
    id: 'acc-server-2',
    name: 'Server 2: SiDompul (XL & Axis)',
    type: 'server_pulsa',
    balance: 0,
    description: 'Saldo chip/aplikasi Server 2 XL-Axis',
    color: '#2563EB', // blue
  },
  {
    id: 'acc-server-3',
    name: 'Server 3: Mobo (Indosat)',
    type: 'server_pulsa',
    balance: 0,
    description: 'Saldo chip/aplikasi Server 3 Indosat',
    color: '#EAB308', // yellow
  },
  {
    id: 'acc-server-4',
    name: 'Server 4: Multi PPOB & E-Wallet',
    type: 'server_pulsa',
    balance: 0,
    description: 'Saldo Server Multi (Token PLN, E-Wallet, Tri)',
    color: '#06B6D4', // cyan
  },
  {
    id: 'acc-bri',
    name: 'Bank BRI (Agen BRILink)',
    type: 'bank',
    accountNumber: '0206-01-045678-50-3',
    balance: 0,
    description: 'Rekening utama transfer & tarik tunai agen',
    color: '#0284C7', // sky
  },
  {
    id: 'acc-bca',
    name: 'Bank BCA Operasional',
    type: 'bank',
    accountNumber: '8720-3341-21',
    balance: 0,
    description: 'Rekening alternatif transfer bank swasta',
    color: '#1D4ED8', // deep blue
  },
  {
    id: 'acc-dana',
    name: 'DANA Bisnis & QRIS Kasir',
    type: 'ewallet',
    accountNumber: '0812-9876-5432',
    balance: 0,
    description: 'Penerimaan QRIS & top up e-wallet',
    color: '#06B6D4', // cyan
  },
];

export const INITIAL_PULSA_PRODUCTS: PulsaProduct[] = [
  // Telkomsel Pulsa
  { id: 'tsel-5k', category: 'pulsa', operator: 'Telkomsel', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5850, priceSell: 7000 },
  { id: 'tsel-10k', category: 'pulsa', operator: 'Telkomsel', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10750, priceSell: 12000 },
  { id: 'tsel-15k', category: 'pulsa', operator: 'Telkomsel', nominal: 15000, label: 'Pulsa 15.000', priceCost: 15300, priceSell: 17000 },
  { id: 'tsel-20k', category: 'pulsa', operator: 'Telkomsel', nominal: 20000, label: 'Pulsa 20.000', priceCost: 20250, priceSell: 22000 },
  { id: 'tsel-25k', category: 'pulsa', operator: 'Telkomsel', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25150, priceSell: 27000 },
  { id: 'tsel-50k', category: 'pulsa', operator: 'Telkomsel', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49800, priceSell: 52000 },
  { id: 'tsel-100k', category: 'pulsa', operator: 'Telkomsel', nominal: 100000, label: 'Pulsa 100.000', priceCost: 98700, priceSell: 102000 },

  // Indosat Pulsa
  { id: 'isat-5k', category: 'pulsa', operator: 'Indosat', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5800, priceSell: 7000 },
  { id: 'isat-10k', category: 'pulsa', operator: 'Indosat', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10700, priceSell: 12000 },
  { id: 'isat-25k', category: 'pulsa', operator: 'Indosat', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25100, priceSell: 27000 },
  { id: 'isat-50k', category: 'pulsa', operator: 'Indosat', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49750, priceSell: 52000 },
  { id: 'isat-100k', category: 'pulsa', operator: 'Indosat', nominal: 100000, label: 'Pulsa 100.000', priceCost: 98500, priceSell: 102000 },

  // XL Pulsa
  { id: 'xl-5k', category: 'pulsa', operator: 'XL', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5800, priceSell: 7000 },
  { id: 'xl-10k', category: 'pulsa', operator: 'XL', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10700, priceSell: 12000 },
  { id: 'xl-25k', category: 'pulsa', operator: 'XL', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25050, priceSell: 27000 },
  { id: 'xl-50k', category: 'pulsa', operator: 'XL', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49700, priceSell: 52000 },
  { id: 'xl-100k', category: 'pulsa', operator: 'XL', nominal: 100000, label: 'Pulsa 100.000', priceCost: 98500, priceSell: 102000 },

  // Axis Pulsa
  { id: 'axis-5k', category: 'pulsa', operator: 'Axis', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5800, priceSell: 7000 },
  { id: 'axis-10k', category: 'pulsa', operator: 'Axis', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10700, priceSell: 12000 },
  { id: 'axis-25k', category: 'pulsa', operator: 'Axis', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25050, priceSell: 27000 },
  { id: 'axis-50k', category: 'pulsa', operator: 'Axis', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49700, priceSell: 52000 },

  // Tri Pulsa
  { id: 'tri-5k', category: 'pulsa', operator: 'Tri', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5750, priceSell: 7000 },
  { id: 'tri-10k', category: 'pulsa', operator: 'Tri', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10650, priceSell: 12000 },
  { id: 'tri-25k', category: 'pulsa', operator: 'Tri', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25000, priceSell: 27000 },
  { id: 'tri-50k', category: 'pulsa', operator: 'Tri', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49600, priceSell: 52000 },
  { id: 'tri-100k', category: 'pulsa', operator: 'Tri', nominal: 100000, label: 'Pulsa 100.000', priceCost: 98300, priceSell: 102000 },

  // Smartfren Pulsa
  { id: 'sf-5k', category: 'pulsa', operator: 'Smartfren', nominal: 5000, label: 'Pulsa 5.000', priceCost: 5800, priceSell: 7000 },
  { id: 'sf-10k', category: 'pulsa', operator: 'Smartfren', nominal: 10000, label: 'Pulsa 10.000', priceCost: 10700, priceSell: 12000 },
  { id: 'sf-25k', category: 'pulsa', operator: 'Smartfren', nominal: 25000, label: 'Pulsa 25.000', priceCost: 25100, priceSell: 27000 },
  { id: 'sf-50k', category: 'pulsa', operator: 'Smartfren', nominal: 50000, label: 'Pulsa 50.000', priceCost: 49750, priceSell: 52000 },

  // Paket Data
  { id: 'data-tsel-3gb', category: 'paket_data', operator: 'Telkomsel', nominal: 20000, label: 'Data 3GB 3 Hari', description: 'Kuota Nasional 3GB full 24 jam', priceCost: 17500, priceSell: 20000 },
  { id: 'data-tsel-8gb', category: 'paket_data', operator: 'Telkomsel', nominal: 35000, label: 'Data 8GB 7 Hari', description: 'Kuota Internet + Chat 7 Hari', priceCost: 31000, priceSell: 35000 },
  { id: 'data-tsel-15gb', category: 'paket_data', operator: 'Telkomsel', nominal: 60000, label: 'Data 15GB 30 Hari', description: 'OMG Internet 15GB 30 Hari', priceCost: 53500, priceSell: 60000 },
  { id: 'data-isat-5gb', category: 'paket_data', operator: 'Indosat', nominal: 25000, label: 'Freedom 5GB 5 Hari', description: '5GB Utama full 24 jam', priceCost: 21500, priceSell: 25000 },
  { id: 'data-isat-15gb', category: 'paket_data', operator: 'Indosat', nominal: 55000, label: 'Freedom 15GB 30 Hari', description: '15GB Utama + Nelpon Sesama', priceCost: 48500, priceSell: 55000 },
  { id: 'data-xl-12gb', category: 'paket_data', operator: 'XL', nominal: 45000, label: 'Xtra Combo 12GB 30 Hari', description: '12GB Kuota Utama + YouTube', priceCost: 39500, priceSell: 45000 },
  { id: 'data-tri-always10', category: 'paket_data', operator: 'Tri', nominal: 50000, label: 'AON 10GB Masa Aktif Selamanya', description: '10GB Kuota AON masa aktif kartu', priceCost: 44000, priceSell: 50000 },

  // Token Listrik PLN
  { id: 'pln-20k', category: 'token_pln', operator: 'PLN', nominal: 20000, label: 'Token PLN 20.000', priceCost: 20500, priceSell: 23000 },
  { id: 'pln-50k', category: 'token_pln', operator: 'PLN', nominal: 50000, label: 'Token PLN 50.000', priceCost: 50500, priceSell: 53000 },
  { id: 'pln-100k', category: 'token_pln', operator: 'PLN', nominal: 100000, label: 'Token PLN 100.000', priceCost: 100500, priceSell: 103000 },
  { id: 'pln-200k', category: 'token_pln', operator: 'PLN', nominal: 200000, label: 'Token PLN 200.000', priceCost: 200500, priceSell: 203000 },
  { id: 'pln-500k', category: 'token_pln', operator: 'PLN', nominal: 500000, label: 'Token PLN 500.000', priceCost: 500500, priceSell: 503000 },

  // E-Wallet Top Up
  { id: 'ew-dana-20k', category: 'ewallet', operator: 'DANA', nominal: 20000, label: 'Saldo DANA 20.000', priceCost: 20500, priceSell: 23000 },
  { id: 'ew-dana-50k', category: 'ewallet', operator: 'DANA', nominal: 50000, label: 'Saldo DANA 50.000', priceCost: 50500, priceSell: 53000 },
  { id: 'ew-dana-100k', category: 'ewallet', operator: 'DANA', nominal: 100000, label: 'Saldo DANA 100.000', priceCost: 100500, priceSell: 103000 },
  { id: 'ew-gopay-20k', category: 'ewallet', operator: 'GoPay', nominal: 20000, label: 'Saldo GoPay 20.000', priceCost: 20500, priceSell: 23000 },
  { id: 'ew-gopay-50k', category: 'ewallet', operator: 'GoPay', nominal: 50000, label: 'Saldo GoPay 50.000', priceCost: 50500, priceSell: 53000 },
  { id: 'ew-ovo-50k', category: 'ewallet', operator: 'OVO', nominal: 50000, label: 'Saldo OVO 50.000', priceCost: 50500, priceSell: 53000 },
  { id: 'ew-spay-50k', category: 'ewallet', operator: 'ShopeePay', nominal: 50000, label: 'ShopeePay 50.000', priceCost: 50500, priceSell: 53000 },
];

export const INITIAL_ACCESSORIES: AccessoryItem[] = [
  {
    id: 'acc-1',
    sku: 'ACC-001',
    name: 'Kabel Data Fast Charging Type-C 65W (Braided 1M)',
    category: 'Kabel & Adaptor',
    stock: 24,
    minStock: 5,
    priceCost: 12000,
    priceSell: 25000,
  },
  {
    id: 'acc-2',
    sku: 'ACC-002',
    name: 'Kabel Data iPhone Lightning Fast 2.4A (1M)',
    category: 'Kabel & Adaptor',
    stock: 18,
    minStock: 5,
    priceCost: 13000,
    priceSell: 25000,
  },
  {
    id: 'acc-3',
    sku: 'ACC-003',
    name: 'Kabel Micro USB Android 2A Kuat & Awet',
    category: 'Kabel & Adaptor',
    stock: 15,
    minStock: 5,
    priceCost: 8000,
    priceSell: 15000,
  },
  {
    id: 'acc-4',
    sku: 'ACC-004',
    name: 'Kepala Charger 33W Fast Charging Quick Charge 3.0',
    category: 'Kabel & Adaptor',
    stock: 12,
    minStock: 4,
    priceCost: 28000,
    priceSell: 50000,
  },
  {
    id: 'acc-5',
    sku: 'ACC-005',
    name: 'Tempered Glass Anti Spy / Privasi (All Type HP)',
    category: 'Casing & Pelindung',
    stock: 35,
    minStock: 10,
    priceCost: 9000,
    priceSell: 25000,
  },
  {
    id: 'acc-6',
    sku: 'ACC-006',
    name: 'Tempered Glass Bening 9D Full Lem',
    category: 'Casing & Pelindung',
    stock: 45,
    minStock: 10,
    priceCost: 6500,
    priceSell: 20000,
  },
  {
    id: 'acc-7',
    sku: 'ACC-007',
    name: 'Softcase Silikon Bening Anti Crack Shockproof',
    category: 'Casing & Pelindung',
    stock: 28,
    minStock: 8,
    priceCost: 7000,
    priceSell: 20000,
  },
  {
    id: 'acc-8',
    sku: 'ACC-008',
    name: 'Earphone Bass Jack 3.5mm dengan Mic Jernih',
    category: 'Audio & TWS',
    stock: 20,
    minStock: 5,
    priceCost: 11000,
    priceSell: 25000,
  },
  {
    id: 'acc-9',
    sku: 'ACC-009',
    name: 'TWS Bluetooth Earbuds Wireless True Stereo',
    category: 'Audio & TWS',
    stock: 8,
    minStock: 3,
    priceCost: 55000,
    priceSell: 95000,
  },
  {
    id: 'acc-10',
    sku: 'ACC-010',
    name: 'Kartu Perdana Telkomsel Kuota 14GB 30 Hari Aktif',
    category: 'Kartu Perdana & Voucher',
    stock: 14,
    minStock: 5,
    priceCost: 27000,
    priceSell: 35000,
  },
  {
    id: 'acc-11',
    sku: 'ACC-011',
    name: 'Kartu Perdana Tri Happy 10GB 30 Hari',
    category: 'Kartu Perdana & Voucher',
    stock: 3, // Low stock trigger
    minStock: 5,
    priceCost: 21000,
    priceSell: 28000,
  },
  {
    id: 'acc-12',
    sku: 'ACC-012',
    name: 'Ring Stand Holder HP & Dudukan Meja Lipat',
    category: 'Lainnya',
    stock: 25,
    minStock: 5,
    priceCost: 3500,
    priceSell: 10000,
  },
  {
    id: 'acc-13',
    sku: 'ACC-013',
    name: 'OTG Adapter USB to Type-C Metal',
    category: 'Lainnya',
    stock: 2, // Low stock trigger
    minStock: 5,
    priceCost: 4000,
    priceSell: 12000,
  },
];

export const POPULAR_BANKS = [
  { code: 'BRI', name: 'Bank BRI (Bank Rakyat Indonesia)', isTop: true, color: 'bg-blue-600' },
  { code: 'BCA', name: 'Bank BCA (Bank Central Asia)', isTop: true, color: 'bg-blue-700' },
  { code: 'MANDIRI', name: 'Bank Mandiri', isTop: true, color: 'bg-amber-600' },
  { code: 'BNI', name: 'Bank BNI (Bank Negara Indonesia)', isTop: true, color: 'bg-emerald-600' },
  { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', isTop: true, color: 'bg-teal-600' },
  { code: 'DANA', name: 'DANA (Dompet Digital)', isTop: true, color: 'bg-sky-500' },
  { code: 'GOPAY', name: 'GoPay / Gojek', isTop: true, color: 'bg-green-600' },
  { code: 'OVO', name: 'OVO Cash', isTop: true, color: 'bg-purple-600' },
  { code: 'SHOPEEPAY', name: 'ShopeePay', isTop: true, color: 'bg-orange-500' },
  { code: 'CIMB', name: 'CIMB Niaga', isTop: false, color: 'bg-red-700' },
  { code: 'SEABANK', name: 'SeaBank Indonesia', isTop: false, color: 'bg-orange-600' },
  { code: 'JAGO', name: 'Bank Jago', isTop: false, color: 'bg-yellow-500' },
  { code: 'NEO', name: 'Bank Neo Commerce (BNC)', isTop: false, color: 'bg-yellow-600' },
  { code: 'PERMATA', name: 'Bank Permata', isTop: false, color: 'bg-green-700' },
  { code: 'DANAMON', name: 'Bank Danamon', isTop: false, color: 'bg-amber-700' },
  { code: 'BTPN', name: 'Bank BTPN / Jenius', isTop: false, color: 'bg-sky-600' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_KASBON: KasbonRecord[] = [];

export const INITIAL_SHIFTS: ShiftRecord[] = [];


