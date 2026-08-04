/**
 * Status meja dipakai bersama oleh halaman pelanggan (/meja)
 * dan halaman admin (/admin/meja) agar labelnya selalu konsisten.
 */
export const TABLE_STATUS = {
  available: {
    value: 'available',
    label: 'Tersedia',
    short: 'Kosong',
    tone: 'green',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200 bg-emerald-50/70',
    text: 'text-emerald-700',
    description: 'Meja kosong dan siap dipakai.',
  },
  occupied: {
    value: 'occupied',
    label: 'Terisi',
    short: 'Terisi',
    tone: 'rose',
    dot: 'bg-rose-500',
    ring: 'border-rose-200 bg-rose-50/70',
    text: 'text-rose-700',
    description: 'Sedang ada pesanan aktif di meja ini.',
  },
  reserved: {
    value: 'reserved',
    label: 'Direservasi',
    short: 'Booked',
    tone: 'amber',
    dot: 'bg-amber-500',
    ring: 'border-amber-200 bg-amber-50/70',
    text: 'text-amber-700',
    description: 'Meja sudah dipesan lebih dulu.',
  },
};

export const TABLE_STATUS_LIST = Object.values(TABLE_STATUS);

/**
 * Area meja — sengaja hanya dua.
 *
 * Sebelumnya ada 'Workspace' dan 'VIP' juga, tapi keduanya bukan area: ruang
 * kerja dan meeting room sama-sama berada di dalam ruangan. Sifat ruangannya
 * sekarang ditulis di `label` meja (mis. "Workspace / Meeting Room"), sehingga
 * area tetap menjawab satu pertanyaan saja — pelanggan duduk di dalam atau di
 * luar.
 *
 * Dipakai bersama oleh form admin dan validasi server action.
 */
export const TABLE_AREAS = ['Indoor', 'Outdoor'];

export function tableStatus(value) {
  return TABLE_STATUS[value] || TABLE_STATUS.available;
}

export const PAYMENT_LABEL = {
  cash: 'Tunai di kasir',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
};

export const ORDER_STATUS = {
  pending: { label: 'Menunggu diproses', tone: 'amber' },
  paid: { label: 'Lunas', tone: 'green' },
  cancelled: { label: 'Dibatalkan', tone: 'rose' },
};
