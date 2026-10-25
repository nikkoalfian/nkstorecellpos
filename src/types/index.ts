export type TransactionType = 'pulsa' | 'paket_data' | 'token_pln' | 'topup_ewallet' | 'transfer_uang' | 'tarik_tunai' | 'aksesoris';

export type PaymentMethod = 'tunai' | 'transfer_bank' | 'qris' | 'saldo_ewallet' | 'kasbon';

export type Operator = 'Telkomsel' | 'Indosat' | 'XL' | 'Axis' | 'Tri' | 'Smartfren' | 'PLN' | 'DANA' | 'GoPay' | 'OVO' | 'ShopeePay' | 'LinkAja' | 'Lainnya';

export interface PulsaProduct {
  id: string;
  category: 'pulsa' | 'paket_data' | 'token_pln' | 'ewallet';
  operator: Operator;
  nominal: number;
  label: string;
  description?: string;
  priceCost: number; // Harga modal
  priceSell: number; // Harga jual
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'Kabel & Adaptor' | 'Casing & Pelindung' | 'Audio & TWS' | 'Kartu Perdana & Voucher' | 'Lainnya';
  sku: string;
  stock: number;
  minStock: number;
  priceCost: number;
  priceSell: number;
  image?: string;
}

export interface CartAccessoryItem {
  item: AccessoryItem;
  quantity: number;
}

export interface StockOpnameItem {
  accessoryId: string;
  sku: string;
  name: string;
  category: string;
  systemStock: number; // Stok tercatat di sistem sebelum opname
  physicalStock: number; // Stok riil dihitung fisik
  difference: number; // physicalStock - systemStock (0 = cocok, minus = kurang/hilang, plus = surplus)
  priceCost: number; // Harga modal satuan
  priceSell: number; // Harga jual satuan
  costDifference: number; // difference * priceCost (nilai rupiah selisih)
  reason?: string; // Alasan selisih (misal: "Rusak", "Hilang", "Salah Input", "Bonus Kulakan", "Lainnya")
}

export interface StockOpnameRecord {
  id: string;
  opnameNumber: string; // misal: "SO-20261023-001"
  date: string; // ISO date string
  auditorName: string; // Nama kasir/staf atau owner pemeriksa
  notes?: string; // Catatan sesi stock opname
  totalItemsCounted: number; // Jumlah varian barang yang diaudit
  totalSystemUnits: number; // Total unit stok sistem
  totalPhysicalUnits: number; // Total unit stok fisik
  totalDifferenceUnits: number; // Total selisih unit fisik vs sistem
  totalCostDifference: number; // Total nilai rupiah selisih harga modal
  items: StockOpnameItem[];
  status: 'applied';
  appliedAt: string;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string; // ISO date string
  type: TransactionType;
  title: string;
  targetNumber?: string; // No HP, No Meter PLN, No Rekening
  targetName?: string; // Nama pemilik rek / nama pelanggan
  operator?: Operator;
  providerBank?: string; // BRI, BCA, DANA, dll.
  nominal: number; // Nominal transaksi utama
  adminFee: number; // Biaya admin jasa konter
  priceCost: number; // Total harga modal bagi konter
  totalAmount: number; // Total bayar pelanggan
  profit: number; // Laba bersih konter
  paymentMethod: PaymentMethod;
  amountPaid: number; // Uang yang diserahkan pelanggan
  changeAmount: number; // Kembalian ke pelanggan
  sourceAccountId?: string; // Saldo yang berkurang/bertambah (laci, bank, digipos)
  serialNumber?: string; // SN Pulsa / Ref Bank / Token Listrik (20 digit)
  status: 'sukses' | 'pending' | 'gagal';
  notes?: string;
  items?: { name: string; quantity: number; priceSell: number; priceCost: number }[];
}

export interface AccountBalance {
  id: string;
  name: string; // Misal: "Uang Kas Laci", "Saldo Server Pulsa (Digipos)", "Rekening BRI (BRILink)"
  type: 'cash' | 'server_pulsa' | 'bank' | 'ewallet';
  accountNumber?: string;
  balance: number;
  description?: string;
  color: string;
}

export interface KasbonRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  description: string;
  dueDate?: string; // Tanggal jatuh tempo pembayaran kasbon
  date: string;
  isPaid: boolean;
  paidDate?: string;
  transactionId?: string;
  takeFromCashDrawer?: boolean; // Ambil dari Cashdrawer
}

export interface CashMutation {
  id: string;
  timestamp: string;
  type: 'masuk' | 'keluar' | 'transfer';
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  category: 'Operasional' | 'Setor Kas' | 'Tarik Modal' | 'Top Up Server' | 'Koreksi Saldo' | 'Lainnya';
  notes: string;
}

export interface ServerShiftItem {
  serverId: string; // 'server-1', 'server-2', 'server-3', 'server-4'
  serverName: string; // misal 'Server 1 (Digipos)', 'Server 2 (SiDompul)'
  initialBalance: number; // Saldo Awal saat buka shift
  topUpAmount: number; // Tambah saldo di tengah shift
  totalBalance?: number; // Total Saldo = initialBalance + topUpAmount
  finalBalance: number; // Saldo Akhir saat tutup shift
  usage: number; // Pemakaian Saldo = Total Saldo - finalBalance
  grossSales: number; // Total Penjualan Pulsa / Omset
  profit: number; // Laba Bersih = (grossSales + finalBalance) - Total Saldo
}

export interface ShiftExpense {
  id: string;
  amount: number;
  note: string;
  time: string;
}

export interface ShiftRecord {
  id: string;
  shiftNumber: number;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  initialCashDrawer: number;
  finalCashDrawer?: number;
  expectedCashDrawer?: number;
  cashDifference?: number; // Kelebihan / Kekurangan uang kas
  servers: ServerShiftItem[]; // 4 server
  expenses: ShiftExpense[];
  
  // Realtime profit from other services during this shift
  accessorySales: number;
  accessoryProfit: number;
  transferAdminProfit: number;
  tarikTunaiAdminProfit: number;

  totalPulseSales: number;
  totalPulseUsage: number;
  totalPulseProfit: number;
  totalExpenses: number;
  netProfit: number; // Total Laba Bersih Keseluruhan Shift
  notes?: string;
}

export interface StaffPermissions {
  canAccessShift: boolean; // Buka & Tutup Shift 4 Server
  canAccessTransfer: boolean; // Menu Transaksi Transfer Uang
  canAccessTarikTunai: boolean; // Menu Transaksi Tarik Tunai
  canAccessPosAksesoris: boolean; // Kasir Penjualan Aksesoris POS
  canAccessKasbon: boolean; // Catatan Kasbon Pelanggan
  canAccessInventory: boolean; // Manajemen Stok Gudang & Tambah/Edit Barang
  canAccessFinance: boolean; // Buku Kas & Mutasi Saldo Rekening / Bank
  canAccessReports: boolean; // Laporan Laba Rugi Toko & Omset Keseluruhan
  canDeleteTransactions: boolean; // Hapus Riwayat Transaksi
  canDeleteShifts: boolean; // Hapus Riwayat Shift
  canEditSettings: boolean; // Pengaturan Toko & Printer
  canViewCostPrice: boolean; // Melihat Estimasi Laba & Harga Modal di Kasir POS
  canAccessStockOpname: boolean; // Fitur Stock Opname & Koreksi Fisik Stok
}

export interface StaffAccount {
  id: string;
  name: string; // Nama kasir, misal: "Kasir 1 - Siti"
  username: string; // Username untuk login kasir, misal: "kasir1"
  pin: string; // PIN login kasir 4-6 digit
  roleTitle?: string; // Jabatan / peran, misal: "Kasir Konter", "Shift Pagi"
  isActive: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string; // URL atau base64 gambar logo toko kustom
  ownerName: string;
  address: string;
  phone: string;
  receiptFooterMessage: string;
  defaultTransferAdminFee: number;
  defaultTarikTunaiAdminFee: number;
  printerPaperWidth: '58mm' | '80mm';
  serverNames: [string, string, string, string]; // Nama 4 server pulsa
  ownerPin?: string; // Default '1234'
  staffPin?: string; // PIN akses cepat untuk staf/kasir (opsional fallback)
  staffAccounts?: StaffAccount[]; // Daftar akun login staf/kasir yang dibuat oleh owner
  enablePinProtection?: boolean; // Aktifkan proteksi PIN
  requireLoginOnStart?: boolean; // Wajibkan otentikasi login saat pertama buka web app
  staffPermissions?: StaffPermissions; // Pengaturan hak akses staf/kasir oleh pemilik
}

export interface AuthUser {
  role: 'owner' | 'staff';
  name: string;
  username?: string;
  loginAt: string;
}

