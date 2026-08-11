/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next lint` hanya memeriksa beberapa folder bawaan; suite Playwright ada di
  // luar daftar itu dan ikut disertakan supaya berkas test tidak jadi satu-satunya
  // bagian repo yang tidak pernah dilint.
  eslint: {
    dirs: ['src', 'tests'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
