'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Hapus data ini?',
  description = 'Tindakan ini tidak dapat dibatalkan.',
  confirmLabel = 'Ya, Hapus',
  loading,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title} description={description}>
      <div className="mt-2 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? 'Memproses...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
