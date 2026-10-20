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
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  ownerName: string;
  address: string;
  phone: string;
  receiptFooterMessage: string;
  defaultTransferAdminFee: number;
  defaultTarikTunaiAdminFee: number;
  printerPaperWidth: '58mm' | '80mm';
  serverNames: [string, string, string, string]; // Nama 4 server pulsa
  ownerPin?: string; // Default '1234'
  enablePinProtection?: boolean; // Aktifkan proteksi PIN
  staffPermissions?: StaffPermissions; // Pengaturan hak akses staf/kasir oleh pemilik
}
