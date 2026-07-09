'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Reveals its children with a gentle fade-up the first time they enter the
// viewport. Falls back to visible immediately under prefers-reduced-motion
// (handled in globals.css).
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            window.setTimeout(() => el.setAttribute('data-reveal', 'shown'), delayMs);
            io.unobserve(el);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
