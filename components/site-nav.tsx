'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/icon';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Explore', icon: 'map' },
  { href: '/spots', label: 'Browse', icon: 'list' },
  { href: '/submit', label: 'Add', icon: 'submit' },
  { href: '/my', label: 'My Spots', icon: 'save' },
  { href: '/account', label: 'Account', icon: 'user' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 glass md:hidden"
    >
      <div
        className="mx-auto flex max-w-shell items-stretch justify-between"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? 'text-accent' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon name={tab.icon} size={22} weight={active ? 'fill' : 'regular'} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
