import { Transaction, StoreSettings } from '../types';

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatDateIndo(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export const formatTanggal = formatDateIndo;

export function generateInvoiceNo(typePrefix: string = 'TRX'): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${typePrefix}${year}${month}${day}-${random}`;
}

export function generateSN(type: string): string {
  if (type === 'token_pln') {
    // 20 digit token PLN format: xxxx-xxxx-xxxx-xxxx-xxxx
    const part = () => Math.floor(1000 + Math.random() * 9000).toString();
    return `${part()}-${part()}-${part()}-${part()}-${part()}`;
  }
  if (type === 'transfer_uang' || type === 'tarik_tunai') {
    return 'RRN' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }
  // Pulsa SN
  const chars = '0123456789ABCDEF';
  let sn = 'SN';
  for (let i = 0; i < 14; i++) {
    sn += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sn;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function buildReceiptWhatsAppText(trx: Transaction, settings: StoreSettings): string {
  const line = '--------------------------------';
  let detailContent = '';

  if (trx.type === 'pulsa' || trx.type === 'paket_data') {
    detailContent = `Layanan: ${trx.title} (${trx.operator || ''})
Nomor HP: ${trx.targetNumber}
Nominal: ${formatRupiah(trx.nominal)}
SN / Ref: ${trx.serialNumber || '-'}`;
  } else if (trx.type === 'token_pln') {
    detailContent = `Layanan: Token Listrik PLN
ID Pelanggan / Meter: ${trx.targetNumber}
Nama: ${trx.targetName || '-'}
Nominal: ${formatRupiah(trx.nominal)}
KODE TOKEN:
👉 *${trx.serialNumber || '-'}* 👈`;
  } else if (trx.type === 'transfer_uang') {
    detailContent = `Layanan: Transfer Uang ke Rekening
Bank / E-Wallet: ${trx.providerBank}
No Rekening: ${trx.targetNumber}
Nama Penerima: ${trx.targetName}
Nominal Transfer: ${formatRupiah(trx.nominal)}
Biaya Admin: ${formatRupiah(trx.adminFee)}
No Referensi: ${trx.serialNumber || '-'}`;
  } else if (trx.type === 'tarik_tunai') {
    detailContent = `Layanan: Tarik Tunai Kasir
Metode: ${trx.providerBank}
Jumlah Diterima Pelanggan: ${formatRupiah(trx.nominal)}
Biaya Admin Konter: ${formatRupiah(trx.adminFee)}
Total Ditransfer Pelanggan: ${formatRupiah(trx.totalAmount)}
No Ref: ${trx.serialNumber || '-'}`;
  } else if (trx.type === 'aksesoris') {
    const itemsList = trx.items?.map(it => `• ${it.name} (${it.quantity}x) = ${formatRupiah(it.priceSell * it.quantity)}`).join('\n') || '';
    detailContent = `Pembelian Aksesoris HP:
${itemsList}`;
  }

  const text = `🧾 *STRUK PEMBAYARAN RESMI*
*${settings.storeName.toUpperCase()}*
${settings.address}
WA: ${settings.phone}
${line}
No Nota: ${trx.invoiceNo}
Waktu: ${formatDateIndo(trx.timestamp)}
Status: ${trx.status.toUpperCase()}
${line}
${detailContent}
${line}
*TOTAL TAGIHAN: ${formatRupiah(trx.totalAmount)}*
Metode Bayar: ${trx.paymentMethod.toUpperCase()}
Bayar: ${formatRupiah(trx.amountPaid || trx.totalAmount)}
Kembali: ${formatRupiah(trx.changeAmount || 0)}
${line}
_${settings.receiptFooterMessage}_
_Simpan bukti transaksi ini sebagai bukti pembayaran yang sah._`;

  return text;
}

export function openWhatsAppReceipt(customerPhone: string, text: string) {
  const cleaned = cleanPhoneNumber(customerPhone);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}
