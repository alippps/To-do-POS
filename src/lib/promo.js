/**
 * Aturan harga promo — SATU tempat, dipakai katalog, menu, keranjang,
 * halaman promo, dan panel admin.
 *
 * Promo dianggap aktif hanya bila `promo_price` terisi DAN lebih kecil dari
 * `price`. Tidak ada flag boolean terpisah, jadi tidak mungkin muncul kondisi
 * "promo menyala tapi harganya kosong" — aturan yang sama persis juga dipakai
 * `create_order()` di supabase/schema.sql saat menghitung total.
 *
 * Harga yang ditagih tetap ditentukan server. Nilai di sini murni untuk
 * tampilan; kalau keduanya berbeda, yang benar adalah versi database.
 */
export function promoInfo(product) {
  const basePrice = Number(product?.price || 0);
  const raw = product?.promo_price;
  const promoPrice = raw === null || raw === undefined || raw === '' ? null : Number(raw);

  const isPromo = promoPrice !== null && Number.isFinite(promoPrice) && promoPrice < basePrice;

  return {
    isPromo,
    basePrice,
    /** Harga yang benar-benar dibayar pelanggan. */
    finalPrice: isPromo ? promoPrice : basePrice,
    /** Potongan dalam persen, dibulatkan — untuk badge “−25%”. */
    discountPercent: isPromo && basePrice > 0
      ? Math.round(((basePrice - promoPrice) / basePrice) * 100)
      : 0,
  };
}

/** Menu yang sedang promo dan masih layak ditampilkan ke pelanggan. */
export function activePromos(products = []) {
  return products.filter((p) => promoInfo(p).isPromo);
}
