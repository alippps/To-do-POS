'use client';

import { createContext, useContext, useMemo } from 'react';

/**
 * Identitas outlet untuk komponen sisi klien.
 *
 * Komponen server cukup memanggil `getTenant(params.slug)`. Yang di sisi klien
 * tidak punya akses itu — Navbar, AdminShell, Logo, dan seluruh keranjang
 * berjalan di browser, tapi tetap perlu tahu sedang melayani outlet mana untuk
 * membentuk tautannya.
 *
 * Alternatifnya adalah menurunkan `slug` sebagai prop lewat setiap lapisan
 * komponen, dan itu berarti setiap komponen di jalur itu ikut memikul
 * pengetahuan yang sebenarnya bukan urusannya. Context menaruhnya satu kali di
 * layout outlet.
 */
const TenantContext = createContext(null);

export function TenantProvider({ tenant, children }) {
  /*
    Nilai di-memo terhadap isinya, bukan terhadap identitas objeknya. Layout
    server mengirim objek baru pada tiap render; tanpa ini setiap navigasi
    membuat seluruh pohon konsumen ikut render ulang tanpa ada yang berubah.
  */
  const value = useMemo(
    () => tenant,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant?.slug, tenant?.name, tenant?.wa_number]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const tenant = useContext(TenantContext);

  if (!tenant) {
    throw new Error(
      'useTenant() dipakai di luar TenantProvider. Komponen ini hanya boleh hidup di bawah /k/[slug].'
    );
  }

  return tenant;
}

/**
 * Pembentuk tautan dalam outlet yang sedang dibuka.
 *
 * Kembarannya di sisi server adalah `tenantPath()` di src/lib/tenant.js —
 * keduanya sengaja menghasilkan bentuk yang sama persis, jadi memindahkan skema
 * alamat kelak cukup menyentuh dua fungsi ini.
 */
export function useTenantHref() {
  const { slug } = useTenant();

  return useMemo(
    () => (path = '') => {
      const bersih = String(path || '');
      const berawalanGaris = bersih.startsWith('/') || bersih === '' ? bersih : `/${bersih}`;
      // Bentuk kanonik tanpa garis miring di ujung — lihat catatan di
      // `tenantPath()` (src/lib/tenant.js) soal normalisasi `next/link`.
      const jalur = berawalanGaris === '/' ? '' : berawalanGaris;
      return `/k/${encodeURIComponent(slug)}${jalur}`;
    },
    [slug]
  );
}
