import { Transaction, StoreSettings, ShiftRecord } from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

// Common ESC/POS Bluetooth Printer Services and Characteristics
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Service
  'e7810a71-73ae-499d-8c15-aa9faef03367', // Zjiang / Iware / Panda Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom Thermal POS
  '0000e0ff-0000-1000-8000-00805f9b34fb', // Bluetooth Low Energy POS
  '0000fff0-0000-1000-8000-00805f9b34fb', // Mini Bluetooth POS
  '0000ae30-0000-1000-8000-00805f9b34fb', // VSC / Eppos POS
];

export interface BluetoothDeviceStatus {
  name: string;
  id: string;
  connected: boolean;
}

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  private isConnecting: boolean = false;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getConnectedDevice(): BluetoothDeviceStatus | null {
    if (this.device && this.device.gatt?.connected) {
      return {
        name: this.device.name || 'Printer Bluetooth',
        id: this.device.id,
        connected: true,
      };
    }
    return null;
  }

  public async connect(): Promise<BluetoothDeviceStatus> {
    if (!this.isSupported()) {
      throw new Error(
        'Browser ini belum mendukung Web Bluetooth secara langsung. Anda dapat menggunakan tombol "Cetak via RawBT" di HP Android atau "Cetak Sistem".'
      );
    }

    if (this.device && this.device.gatt?.connected && this.characteristic) {
      return {
        name: this.device.name || 'Printer Bluetooth',
        id: this.device.id,
        connected: true,
      };
    }

    this.isConnecting = true;
    try {
      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      this.device = device;

      device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
      });

      const server = await device.gatt.connect();

      // Find writable characteristic across known services
      let writeChar: any = null;

      for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              writeChar = c;
              break;
            }
          }
          if (writeChar) break;
        } catch {
          // Continue trying next known service UUID
        }
      }

      // If not found in known list, discover all available services
      if (!writeChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const s of allServices) {
            try {
              const chars = await s.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  writeChar = c;
                  break;
                }
              }
              if (writeChar) break;
            } catch {}
          }
        } catch {}
      }

      if (!writeChar) {
        throw new Error('Gagal menemukan jalur tulis (write characteristic) pada perangkat printer Bluetooth ini.');
      }

      this.characteristic = writeChar;

      return {
        name: device.name || 'Printer Bluetooth',
        id: device.id,
        connected: true,
      };
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      try {
        await this.device.gatt.disconnect();
      } catch {}
    }
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Write data chunks via Web Bluetooth LE (chunk size ~60 bytes to prevent buffer overflow)
   */
  public async writeBytes(data: Uint8Array): Promise<void> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      await this.connect();
    }

    if (!this.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const chunkSize = 60;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      try {
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
      } catch (err) {
        // Fallback retry
        if (this.characteristic.writeValue) {
          await this.characteristic.writeValue(chunk);
        } else {
          throw err;
        }
      }
      // Small pause between chunks
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  /**
   * Format and print a customer transaction receipt
   */
  public async printTransaction(trx: Transaction, settings: StoreSettings): Promise<void> {
    const bytes = buildTransactionEscPosBytes(trx, settings);
    await this.writeBytes(bytes);
  }

  /**
   * Format and print a shift recap receipt
   */
  public async printShift(shift: ShiftRecord, settings: StoreSettings): Promise<void> {
    const bytes = buildShiftEscPosBytes(shift, settings);
    await this.writeBytes(bytes);
  }

  /**
   * Print a quick diagnostic test receipt
   */
  public async printTestReceipt(settings: StoreSettings): Promise<void> {
    const encoder = new TextEncoder();
    const width = settings.printerPaperWidth === '80mm' ? 48 : 32;
    const divider = '-'.repeat(width) + '\n';

    const commands: number[] = [
      0x1b, 0x40, // ESC @ (Init)
      0x1b, 0x61, 0x01, // Center align
      0x1d, 0x21, 0x11, // Double height & width
      ...Array.from(encoder.encode((settings.storeName || 'NK STORE CELL') + '\n')),
      0x1d, 0x21, 0x00, // Normal font
      0x1b, 0x61, 0x01, // Center
      ...Array.from(encoder.encode('TES KONEKSI PRINTER BLUETOOTH\n')),
      ...Array.from(encoder.encode(divider)),
      0x1b, 0x61, 0x00, // Left
      ...Array.from(encoder.encode(formatTwoColumns('Status:', 'BERHASIL TERHUBUNG', width) + '\n')),
      ...Array.from(encoder.encode(formatTwoColumns('Kertas:', settings.printerPaperWidth || '58mm', width) + '\n')),
      ...Array.from(encoder.encode(formatTwoColumns('Waktu:', new Date().toLocaleTimeString('id-ID'), width) + '\n')),
      ...Array.from(encoder.encode(divider)),
      0x1b, 0x61, 0x01, // Center
      ...Array.from(encoder.encode('Siap digunakan mencetak struk!\n')),
      0x1b, 0x64, 0x04, // Feed 4 lines
    ];

    await this.writeBytes(new Uint8Array(commands));
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();

// =========================================================================
// ESC/POS FORMATTERS
// =========================================================================

function formatTwoColumns(left: string, right: string, width: number = 32): string {
  const leftLen = left.length;
  const rightLen = right.length;

  if (leftLen + rightLen >= width) {
    const available = width - rightLen - 1;
    if (available > 6) {
      return left.slice(0, available) + ' ' + right;
    }
    return left + '\n' + ' '.repeat(Math.max(0, width - rightLen)) + right;
  }

  const spaces = Math.max(1, width - leftLen - rightLen);
  return left + ' '.repeat(spaces) + right;
}

export function buildTransactionEscPosBytes(trx: Transaction, settings: StoreSettings): Uint8Array {
  const width = settings.printerPaperWidth === '80mm' ? 48 : 32;
  const divider = '-'.repeat(width) + '\n';
  const encoder = new TextEncoder();
  const cmds: number[] = [];

  // Helper push
  const pushText = (txt: string) => {
    cmds.push(...Array.from(encoder.encode(txt)));
  };

  // 1. Initialize Printer
  cmds.push(0x1b, 0x40); // ESC @

  // 2. Center Align Header
  cmds.push(0x1b, 0x61, 0x01); // ESC a 1
  cmds.push(0x1d, 0x21, 0x11); // Double size
  pushText((settings.storeName || 'NK STORE CELL').toUpperCase() + '\n');
  cmds.push(0x1d, 0x21, 0x00); // Normal size

  if (settings.tagline) {
    pushText(settings.tagline + '\n');
  }
  if (settings.address) {
    pushText(settings.address + '\n');
  }
  if (settings.phone) {
    pushText('WA: ' + settings.phone + '\n');
  }

  pushText(divider);

  // 3. Invoice Meta (Left Align)
  cmds.push(0x1b, 0x61, 0x00); // ESC a 0
  pushText(formatTwoColumns('No. Nota:', trx.invoiceNo, width) + '\n');
  pushText(formatTwoColumns('Waktu:', formatDateIndo(trx.timestamp), width) + '\n');
  pushText(formatTwoColumns('Metode:', trx.paymentMethod.toUpperCase(), width) + '\n');
  pushText(formatTwoColumns('Status:', trx.status.toUpperCase(), width) + '\n');

  pushText(divider);

  // 4. Transaction Specific Info
  cmds.push(0x1b, 0x45, 0x01); // Bold ON
  pushText(trx.title + '\n');
  cmds.push(0x1b, 0x45, 0x00); // Bold OFF

  if (trx.targetNumber) {
    const lbl =
      trx.type === 'token_pln'
        ? 'ID Meter:'
        : trx.type === 'transfer_uang'
        ? 'No. Rekening:'
        : 'Nomor HP:';
    pushText(formatTwoColumns(lbl, trx.targetNumber, width) + '\n');
  }

  if (trx.targetName) {
    pushText(formatTwoColumns('Nama:', trx.targetName, width) + '\n');
  }

  if (trx.providerBank) {
    pushText(formatTwoColumns('Bank/E-Wallet:', trx.providerBank, width) + '\n');
  }

  // Items if aksesoris
  if (trx.items && trx.items.length > 0) {
    trx.items.forEach((it) => {
      pushText(formatTwoColumns(`${it.name} x${it.quantity}`, formatRupiah(it.priceSell * it.quantity), width) + '\n');
    });
  }

  // Token PLN Highlight
  if (trx.type === 'token_pln' && trx.serialNumber) {
    pushText(divider);
    cmds.push(0x1b, 0x61, 0x01); // Center
    pushText('KODE TOKEN LISTRIK PLN:\n');
    cmds.push(0x1d, 0x21, 0x11); // Double size
    pushText(trx.serialNumber + '\n');
    cmds.push(0x1d, 0x21, 0x00); // Normal size
    pushText('Masukkan 20 digit angka ke meteran\n');
    cmds.push(0x1b, 0x61, 0x00); // Left
  } else if (trx.serialNumber) {
    pushText(formatTwoColumns('SN/Ref:', trx.serialNumber, width) + '\n');
  }

  pushText(divider);

  // 5. Financial Summary
  if (trx.type === 'tarik_tunai') {
    pushText(formatTwoColumns('Nominal Tarik:', formatRupiah(trx.nominal), width) + '\n');
    const feeLabel = trx.feePaymentMethod === 'tunai' ? 'Biaya Admin (Tunai):' : 'Biaya Admin:';
    pushText(formatTwoColumns(feeLabel, formatRupiah(trx.adminFee), width) + '\n');
    const cashOut = trx.feePaymentMethod === 'potong_tunai' ? Math.max(0, trx.nominal - trx.adminFee) : trx.nominal;
    pushText(formatTwoColumns('Uang Diterima:', formatRupiah(cashOut), width) + '\n');
    cmds.push(0x1b, 0x45, 0x01); // Bold ON
    pushText(formatTwoColumns('TRANSFER BANK:', formatRupiah(trx.totalAmount), width) + '\n');
    cmds.push(0x1b, 0x45, 0x00); // Bold OFF
  } else {
    pushText(formatTwoColumns('Nominal:', formatRupiah(trx.nominal), width) + '\n');
    if (trx.adminFee > 0) {
      pushText(formatTwoColumns('Biaya Admin:', formatRupiah(trx.adminFee), width) + '\n');
    }

    cmds.push(0x1b, 0x45, 0x01); // Bold ON
    pushText(formatTwoColumns('TOTAL BAYAR:', formatRupiah(trx.totalAmount), width) + '\n');
    cmds.push(0x1b, 0x45, 0x00); // Bold OFF

    pushText(formatTwoColumns('Uang Diterima:', formatRupiah(trx.amountPaid || trx.totalAmount), width) + '\n');
    pushText(formatTwoColumns('Kembalian:', formatRupiah(trx.changeAmount || 0), width) + '\n');
  }

  pushText(divider);

  // 6. Footer Message
  cmds.push(0x1b, 0x61, 0x01); // Center
  pushText((settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda') + '\n');
  pushText('Simpan struk sebagai bukti pembayaran sah\n');

  // 7. Feed and Paper Cut
  cmds.push(0x1b, 0x64, 0x04); // Feed 4 lines
  cmds.push(0x1d, 0x56, 0x42, 0x00); // Cut paper (if cutter exists)

  return new Uint8Array(cmds);
}

export function buildShiftEscPosBytes(shift: ShiftRecord, settings: StoreSettings): Uint8Array {
  const width = settings.printerPaperWidth === '80mm' ? 48 : 32;
  const divider = '-'.repeat(width) + '\n';
  const encoder = new TextEncoder();
  const cmds: number[] = [];

  const pushText = (txt: string) => {
    cmds.push(...Array.from(encoder.encode(txt)));
  };

  cmds.push(0x1b, 0x40); // Init
  cmds.push(0x1b, 0x61, 0x01); // Center
  cmds.push(0x1d, 0x21, 0x11); // Double size
  pushText((settings.storeName || 'NK STORE CELL').toUpperCase() + '\n');
  cmds.push(0x1d, 0x21, 0x00);
  pushText('REKAP TUTUP SHIFT KASIR\n');
  pushText(divider);

  cmds.push(0x1b, 0x61, 0x00); // Left
  pushText(formatTwoColumns('No. Shift:', '#' + shift.shiftNumber, width) + '\n');
  pushText(formatTwoColumns('Kasir:', shift.cashierName, width) + '\n');
  pushText(formatTwoColumns('Buka:', formatDateIndo(shift.startTime), width) + '\n');
  pushText(formatTwoColumns('Tutup:', shift.endTime ? formatDateIndo(shift.endTime) : '-', width) + '\n');

  pushText(divider);
  cmds.push(0x1b, 0x45, 0x01); // Bold ON
  pushText('RINCIAN SERVER PULSA & KUOTA:\n');
  cmds.push(0x1b, 0x45, 0x00); // Bold OFF

  shift.servers.forEach((srv, i) => {
    const srvTotal = srv.totalBalance || srv.initialBalance + (srv.topUpAmount || 0);
    pushText(`[${i + 1}] ${srv.serverName}\n`);
    pushText(formatTwoColumns('  Modal Total:', formatRupiah(srvTotal), width) + '\n');
    pushText(formatTwoColumns('  Saldo Akhir:', formatRupiah(srv.finalBalance), width) + '\n');
    pushText(formatTwoColumns('  Penjualan:', formatRupiah(srv.grossSales), width) + '\n');
    pushText(formatTwoColumns('  Laba Server:', `+${formatRupiah(srv.profit)}`, width) + '\n');
  });

  pushText(divider);
  pushText(formatTwoColumns('Total Jual Pulsa:', formatRupiah(shift.totalPulseSales), width) + '\n');
  pushText(formatTwoColumns('Total Laba Pulsa:', `+${formatRupiah(shift.totalPulseProfit)}`, width) + '\n');

  pushText(divider);
  cmds.push(0x1b, 0x45, 0x01); // Bold ON
  pushText('PENDAPATAN LAIN SHIFT:\n');
  cmds.push(0x1b, 0x45, 0x00); // Bold OFF
  pushText(formatTwoColumns('Laba Aksesoris:', `+${formatRupiah(shift.accessoryProfit)}`, width) + '\n');
  pushText(formatTwoColumns('Admin Transfer:', `+${formatRupiah(shift.transferAdminProfit)}`, width) + '\n');
  pushText(formatTwoColumns('Admin Tarik Tunai:', `+${formatRupiah(shift.tarikTunaiAdminProfit)}`, width) + '\n');
  pushText(formatTwoColumns('Total Pengeluaran:', `-${formatRupiah(shift.totalExpenses)}`, width) + '\n');

  pushText(divider);
  cmds.push(0x1b, 0x45, 0x01); // Bold ON
  pushText(formatTwoColumns('TOTAL LABA BERSIH:', `+${formatRupiah(shift.netProfit)}`, width) + '\n');
  cmds.push(0x1b, 0x45, 0x00); // Bold OFF

  pushText(divider);
  cmds.push(0x1b, 0x45, 0x01);
  pushText('KONTROL KAS LACI KASIR:\n');
  cmds.push(0x1b, 0x45, 0x00);
  pushText(formatTwoColumns('Modal Laci Awal:', formatRupiah(shift.initialCashDrawer), width) + '\n');
  pushText(formatTwoColumns('Kas Seharusnya:', formatRupiah(shift.expectedCashDrawer || 0), width) + '\n');
  pushText(formatTwoColumns('Kas Nyata Fisik:', formatRupiah(shift.finalCashDrawer || 0), width) + '\n');

  const diff = shift.cashDifference || 0;
  const diffStr = diff === 0 ? 'PAS (COCOK)' : diff > 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff);
  pushText(formatTwoColumns('Status Selisih:', diffStr, width) + '\n');

  pushText(divider);
  cmds.push(0x1b, 0x61, 0x01); // Center
  pushText('Laporan Rekap Resmi Konter\n');
  cmds.push(0x1b, 0x64, 0x04); // Feed 4 lines
  cmds.push(0x1d, 0x56, 0x42, 0x00); // Cut

  return new Uint8Array(cmds);
}

/**
 * Generates an Android RawBT URL scheme for 1-click printing on Android devices
 */
export function buildRawBTUrl(trx: Transaction, settings: StoreSettings): string {
  const bytes = buildTransactionEscPosBytes(trx, settings);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `rawbt:data:application/vnd.rawbt.print;base64,${base64}`;
}

export function buildShiftRawBTUrl(shift: ShiftRecord, settings: StoreSettings): string {
  const bytes = buildShiftEscPosBytes(shift, settings);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `rawbt:data:application/vnd.rawbt.print;base64,${base64}`;
}
