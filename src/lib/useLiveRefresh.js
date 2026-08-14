'use client';

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Menjaga layar admin tetap sinkron tanpa perlu ditekan F5.
 *
 * Masalah yang diperbaikinya nyata di jam sibuk: pesanan masuk lewat QR meja,
 * barisnya sudah ada di database, tapi layar kasir masih menampilkan hasil
 * render terakhir — dan baru ketahuan saat pelanggan datang menagih.
 *
 * Dua pemicu, sengaja dua-duanya:
 *
 *   1. Supabase Realtime — perubahan didorong server, tampil dalam hitungan
 *      detik. Ini jalur utamanya.
 *   2. Polling `router.refresh()` — jaring pengaman. Realtime bisa gagal
 *      tersambung (publikasi belum dinyalakan di database, WebSocket ditutup
 *      jaringan kafe, koneksi putus diam-diam tanpa memberi status error), dan
 *      layar kasir yang diam justru bug yang sedang kita perbaiki.
 *
 * Karena itu polling TIDAK dimatikan saat Realtime tersambung, hanya
 * dijarangkan (`BACKOFF`). Mematikannya berarti menaruh seluruh kepercayaan
 * pada satu WebSocket yang tidak selalu memberi tahu ketika ia mati.
 *
 * Keduanya bergantung pada halaman yang memakainya berstatus `force-dynamic`;
 * `router.refresh()` hanya benar-benar menarik data baru kalau server tidak
 * menyajikan hasil cache.
 */

/** Jeda polling saat Realtime TIDAK tersambung. */
export const LIVE_INTERVAL_MS = 10_000;

/** Pengali jeda saat Realtime tersambung — polling turun jadi sekadar cadangan. */
const BACKOFF = 6;

/*
  Satu pesanan menghasilkan lebih dari satu event: baris `transactions` masuk,
  lalu trigger `transactions_sync_table` ikut mengubah `cafe_tables`. Tanpa
  jeda ini, satu pesanan memicu dua kali render ulang server.
*/
const DEBOUNCE_MS = 400;

/**
 * @param {object}   opsi
 * @param {string}   opsi.tenantId    id outlet — pembatas langganan Realtime.
 * @param {string[]} opsi.tables      tabel yang diawasi, mis. ['transactions'].
 * @param {number}   [opsi.intervalMs]
 * @param {boolean}  [opsi.paused]    tahan pembaruan (mis. ada modal terbuka).
 */
export function useLiveRefresh({
  tenantId,
  tables = [],
  intervalMs = LIVE_INTERVAL_MS,
  paused = false,
} = {}) {
  const router = useRouter();
  // `useId()` memulangkan bentuk ber-titik-dua (`:r0:`) yang tidak enak dipakai
  // sebagai nama topik channel.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');

  const [pending, startTransition] = useTransition();
  const [syncedAt, setSyncedAt] = useState(null);
  const [live, setLive] = useState(false);

  const pausedRef = useRef(paused);
  const tertahanRef = useRef(false);
  const debounceRef = useRef(null);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  /*
    `refresh` ikut berubah bila `router` berganti identitas. Langganan Realtime
    membacanya lewat ref supaya perubahan itu tidak membongkar-pasang channel.
  */
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  /** Satu-satunya pintu masuk: dipakai interval, Realtime, dan pemanggil manual. */
  const minta = useCallback(() => {
    if (pausedRef.current) {
      // Bukan dibuang — ditahan, lalu dijalankan begitu jedanya dibuka.
      tertahanRef.current = true;
      return;
    }
    if (debounceRef.current) return; // sudah ada yang mengantre
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      refreshRef.current();
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && tertahanRef.current) {
      tertahanRef.current = false;
      minta();
    }
  }, [paused, minta]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  /*
    Waktu sinkron dicatat saat transisi SELESAI, bukan saat dimintakan — yang
    ingin diketahui kasir adalah kapan angka di layar terakhir benar, bukan
    kapan permintaannya dikirim.
  */
  const sedangRef = useRef(false);
  useEffect(() => {
    if (sedangRef.current && !pending) setSyncedAt(Date.now());
    sedangRef.current = pending;
  }, [pending]);

  // Render pertama sudah membawa data segar dari server. Diisi di effect,
  // bukan sebagai nilai awal state, supaya hidrasi tidak berselisih.
  useEffect(() => {
    setSyncedAt(Date.now());
  }, []);

  /** POLLING */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const jeda = live ? intervalMs * BACKOFF : intervalMs;
    let timer = null;

    const jalan = () => {
      if (timer === null) timer = window.setInterval(minta, jeda);
    };
    const henti = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    /*
      Tab yang tersembunyi tidak perlu menanyai database tiap 10 detik — dan
      tab kasir memang sering ditinggal di belakang tab lain. Yang penting
      justru sebaliknya: begitu kembali dilihat, isinya harus langsung benar,
      bukan menunggu giliran interval berikutnya.
    */
    const saatBerubah = () => {
      if (document.visibilityState === 'visible') {
        minta();
        jalan();
      } else {
        henti();
      }
    };

    if (document.visibilityState === 'visible') jalan();
    document.addEventListener('visibilitychange', saatBerubah);

    return () => {
      henti();
      document.removeEventListener('visibilitychange', saatBerubah);
    };
  }, [live, intervalMs, minta]);

  /** REALTIME */
  const tableKey = tables.join(',');

  useEffect(() => {
    const daftar = tableKey ? tableKey.split(',') : [];
    if (!tenantId || daftar.length === 0) return undefined;

    const supabase = createClient();
    // `instanceId` menjaga dua komponen di halaman yang sama tidak berebut
    // satu nama channel.
    const channel = supabase.channel(`live:${tenantId}:${instanceId}`);

    for (const table of daftar) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          // Outlet lain tidak perlu membangunkan layar ini. RLS tetap lapis
          // sesungguhnya — filter ini soal kebisingan, bukan keamanan.
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => minta()
      );
    }

    channel.subscribe((status) => {
      setLive(status === 'SUBSCRIBED');
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, tableKey, instanceId, minta]);

  return { syncedAt, live, pending, refresh: minta };
}
