import Link from 'next/link';
import { site } from '@/lib/site';

export default function Logo({ href = '/', dark = false, compact = false }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-pop transition group-hover:scale-105">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" strokeLinejoin="round" />
          <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
          <path d="M8 3v2M12 3v2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
            {site.name}
          </span>
          <span className={`mt-1 text-[11px] font-medium ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
            Coffee &amp; POS
          </span>
        </span>
      )}
    </Link>
  );
}
