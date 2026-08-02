'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { CATEGORIES } from '@/lib/site';

const EMPTY = {
  name: '',
  category: CATEGORIES[0],
  price: '',
  stock: '',
  description: '',
  image_url: '',
  is_active: true,
};

export default function ProductFormModal({ open, onClose, onSubmit, product, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            name: product.name || '',
            category: product.category || CATEGORIES[0],
            price: String(product.price ?? ''),
            stock: String(product.stock ?? ''),
            description: product.description || '',
            image_url: product.image_url || '',
            is_active: product.is_active ?? true,
          }
        : EMPTY
    );
  }, [open, product]);

  function change(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Nama produk minimal 2 karakter.';
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price)))
      e.price = 'Harga harus angka ≥ 0.';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
      e.stock = 'Stok harus bilangan bulat ≥ 0.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={product ? 'Ubah Produk' : 'Tambah Produk Baru'}
      description={
        product ? 'Perubahan langsung tampil di halaman menu pelanggan.' : 'Produk baru otomatis muncul di menu pelanggan.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama produk *"
            value={form.name}
            onChange={(e) => change('name', e.target.value)}
            placeholder="Contoh: Kopi Susu Gula Aren"
            error={errors.name}
          />
          <Select label="Kategori *" value={form.category} onChange={(e) => change('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Harga (Rp) *"
            type="number"
            min="0"
            step="500"
            value={form.price}
            onChange={(e) => change('price', e.target.value)}
            placeholder="25000"
            error={errors.price}
          />
          <Input
            label="Stok *"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => change('stock', e.target.value)}
            placeholder="50"
            error={errors.stock}
          />
        </div>

        <Input
          label="URL gambar"
          value={form.image_url}
          onChange={(e) => change('image_url', e.target.value)}
          placeholder="https://images.unsplash.com/..."
          hint="Opsional. Kosongkan untuk memakai ikon default."
        />

        <Textarea
          label="Deskripsi"
          value={form.description}
          onChange={(e) => change('description', e.target.value)}
          placeholder="Deskripsi singkat yang tampil di kartu menu."
          className="min-h-[90px]"
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => change('is_active', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Tampilkan di menu pelanggan</span>
            <span className="block text-xs text-slate-400">Nonaktifkan untuk menyembunyikan sementara.</span>
          </span>
        </label>

        <div className="flex gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
