'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { TABLE_STATUS_LIST, tableStatus } from '@/lib/tables';
import { createTable, updateTable, deleteTable, setTableStatus } from '@/app/admin/meja/actions';

const AREAS = ['Indoor', 'Outdoor', 'Workspace', 'VIP'];

const EMPTY = { table_no: '', label: '', area: 'Indoor', capacity: 2, is_active: true };

export default function TableManager({ tables = [] }) {
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Semua');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return tables.filter((t) => {
      const cocokKata =
        !q ||
        t.table_no.toLowerCase().includes(q) ||
        (t.label || '').toLowerCase().includes(q) ||
        t.area.toLowerCase().includes(q);
      const cocokStatus = status === 'Semua' || t.status === status;
      return cocokKata && cocokStatus;
    });
  }, [tables, keyword, status]);

  const counts = useMemo(
    () =>
      TABLE_STATUS_LIST.reduce(
        (acc, s) => ({ ...acc, [s.value]: tables.filter((t) => t.status === s.value).length }),
        {}
      ),
    [tables]
  );

  function openCreate() {
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(table) {
    setEditing(table);
    setValues({
      table_no: table.table_no,
      label: table.label || '',
      area: table.area,
      capacity: table.capacity,
      is_active: table.is_active,
    });
    setErrors({});
    setFormOpen(true);
  }

  function change(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = { ...values, capacity: Number(values.capacity) };
    const res = editing ? await updateTable(editing.id, payload) : await createTable(payload);

    setLoading(false);
    setErrors(res.errors || {});

    if (res.ok) {
      setFormOpen(false);
      router.refresh();
    }
    setToast({ ok: res.ok, message: res.message });
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    const res = await deleteTable(deleting.id);
    setLoading(false);
    setDeleting(null);
    if (res.ok) router.refresh();
    setToast({ ok: res.ok, message: res.message });
  }

  async function handleStatus(table, next) {
    const res = await setTableStatus(table.id, next);
    if (res.ok) router.refresh();
    setToast({ ok: res.ok, message: res.message });
  }

  return (
    <>
      {/* Ringkasan status */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Meja</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{tables.length}</p>
        </div>
        {TABLE_STATUS_LIST.map((s) => (
          <div key={s.value} className="card p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{counts[s.value] || 0}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="Cari nomor meja, label, atau area..."
          className="flex-1"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter status meja"
          className="input-base cursor-pointer sm:w-52"
        >
          <option value="Semua">Semua status</option>
          {TABLE_STATUS_LIST.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button onClick={openCreate} className="shrink-0">
          + Tambah Meja
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Meja tidak ditemukan"
          description="Ubah kata kunci pencarian, atau tambahkan meja baru untuk melengkapi denah."
          action={
            <Button onClick={openCreate} className="mt-2">
              + Tambah Meja
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const s = tableStatus(t.status);
            return (
              <article key={t.id} className={`card flex flex-col gap-4 border p-5 ${s.ring}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl font-bold text-slate-900">
                        {t.table_no}
                      </span>
                      {!t.is_active && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-700">
                      {t.label || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.area} · {t.capacity} kursi
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/60 bg-white px-2.5 py-1 text-[11px] font-bold ${s.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {TABLE_STATUS_LIST.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatus(t, opt.value)}
                      disabled={t.status === opt.value}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                        t.status === opt.value
                          ? 'cursor-default bg-slate-900 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>

                <div className="mt-auto flex gap-2 border-t border-white/70 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="flex-1 rounded-lg bg-white py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(t)}
                    className="flex-1 rounded-lg bg-white py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Form tambah / ubah */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Ubah Meja ${editing.table_no}` : 'Tambah Meja'}
        description="Nomor meja dipakai pada QR dan pada struk pesanan."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nomor meja"
              value={values.table_no}
              onChange={(e) => change('table_no', e.target.value)}
              placeholder="01"
              error={errors.table_no}
              required
            />
            <Input
              label="Kapasitas (kursi)"
              type="number"
              min="1"
              value={values.capacity}
              onChange={(e) => change('capacity', e.target.value)}
              error={errors.capacity}
              required
            />
          </div>

          <Input
            label="Label (opsional)"
            value={values.label}
            onChange={(e) => change('label', e.target.value)}
            placeholder="Dekat jendela"
          />

          <Select label="Area" value={values.area} onChange={(e) => change('area', e.target.value)}>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
            <input
              type="checkbox"
              checked={values.is_active}
              onChange={(e) => change('is_active', e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm">
              <span className="font-semibold text-slate-800">Tampilkan ke pelanggan</span>
              <span className="block text-xs text-slate-500">
                Meja nonaktif tidak muncul di halaman /meja dan tidak bisa dipilih saat memesan.
              </span>
            </span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setFormOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Meja'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={loading}
        title={`Hapus meja ${deleting?.table_no}?`}
        description="Riwayat transaksi yang pernah memakai meja ini tetap tersimpan."
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
