'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/icon';

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: '/', label: 'Map', icon: 'map', exact: true },
  { href: '/spots', label: 'Browse', icon: 'list' },
  { href: '/explore', label: 'Explore', icon: 'compass' },
  { href: '/collections', label: 'Collections', icon: 'collections' },
  { href: '/downloaded', label: 'Downloaded', icon: 'save' },
];

export function TopNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-white/8 glass md:block">
      <div className="mx-auto flex h-full max-w-wide items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="PinnedAtlas home">
          <Icon name="pin" weight="fill" size={20} className="text-accent" />
          <span className="font-display text-lg font-semibold tracking-tight text-stone-50">
            PinnedAtlas
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                }`}
              >
                <Icon name={l.icon} size={16} weight={active ? 'fill' : 'regular'} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-300 transition-colors hover:bg-white/5 hover:text-stone-100"
          >
            <Icon name="plus" size={16} />
            Add a spot
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-stone-200 transition-colors hover:border-white/20 hover:bg-white/5"
          >
            <Icon name="user" size={16} />
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}
