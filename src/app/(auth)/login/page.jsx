import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun To Do Anda.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}>
      <LoginForm />
    </Suspense>
  );
}
