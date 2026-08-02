/**
 * Menerjemahkan pesan error Supabase Auth (bahasa Inggris) menjadi pesan
 * berbahasa Indonesia yang bisa ditindaklanjuti pengguna.
 *
 * Tanpa ini, pengguna hanya melihat teks mentah seperti
 * `Email address "admin@gmail.com" is invalid` tanpa tahu harus berbuat apa.
 *
 * Daftar kode error resmi:
 * https://supabase.com/docs/guides/auth/debugging/error-codes
 */

const BY_CODE = {
  // Supabase menolak alamat yang dianggap email contoh/percobaan —
  // termasuk pola seperti admin@, test@, demo@ walau domainnya asli.
  email_address_invalid:
    'Alamat email ini ditolak Supabase karena dianggap email percobaan (pola seperti admin@, test@, atau demo@). Gunakan alamat email asli yang benar-benar kamu miliki.',

  // Proyek yang masih memakai SMTP bawaan Supabase hanya boleh mengirim
  // email ke anggota organisasi Supabase-nya sendiri.
  email_address_not_authorized:
    'Supabase tidak bisa mengirim email ke alamat ini. Proyek masih memakai SMTP bawaan yang hanya melayani anggota organisasi Supabase kamu. Matikan "Confirm email" di Authentication → Providers → Email, atau pasang SMTP sendiri.',

  email_exists: 'Email ini sudah terdaftar. Silakan masuk lewat halaman Login.',
  user_already_exists: 'Email ini sudah terdaftar. Silakan masuk lewat halaman Login.',
  weak_password: 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter dan kombinasikan huruf serta angka.',
  over_email_send_rate_limit:
    'Terlalu banyak email dikirim ke alamat ini. Tunggu beberapa menit sebelum mencoba lagi.',
  over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  invalid_credentials: 'Email atau kata sandi salah.',
  email_not_confirmed:
    'Email belum dikonfirmasi. Cek kotak masuk kamu, atau matikan "Confirm email" di pengaturan Supabase.',
  signup_disabled: 'Pendaftaran akun baru sedang dinonaktifkan di pengaturan Supabase.',
};

/** Sebagian error lama tidak membawa `code`, jadi dicocokkan lewat teksnya. */
const BY_MESSAGE = [
  [/is invalid/i, BY_CODE.email_address_invalid],
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already registered|already exists/i, BY_CODE.email_exists],
  [/password should be at least/i, BY_CODE.weak_password],
  [/rate limit/i, BY_CODE.over_request_rate_limit],
  [/signups not allowed|signup is disabled/i, BY_CODE.signup_disabled],
  [/failed to fetch|network/i, 'Gagal terhubung ke server. Periksa koneksi internet kamu.'],
];

export function authErrorMessage(error) {
  if (!error) return '';

  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];

  const raw = error.message || '';
  const matched = BY_MESSAGE.find(([pattern]) => pattern.test(raw));
  if (matched) return matched[1];

  return raw || 'Terjadi kesalahan. Coba lagi beberapa saat.';
}
