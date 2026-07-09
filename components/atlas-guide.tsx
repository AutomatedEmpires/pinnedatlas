'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/components/ui';
import { captureEvent } from '@/app/providers';

type Role = 'user' | 'assistant';

interface Msg {
  role: Role;
  content: string;
}

interface ErrorState {
  text: string;
  retry: boolean;
}

export interface AtlasGuideProps {
  locationContext?: {
    name: string;
    feature_type: string;
    slug: string;
    difficulty_tier: string;
  };
}

const SUGGESTIONS = [
  'Find an easy waterfall',
  'What should I bring to a cave?',
  'Best time for hot springs?',
];

// ---------------------------------------------------------------------------
// Minimal, injection-safe markdown. React escapes all string children, so we
// never touch innerHTML. We only elevate: internal [label](/path) links, **bold**,
// bullet lines, and newlines. Everything else renders as plain (escaped) text.
// ---------------------------------------------------------------------------

const INLINE_RE = /(\[[^\]]+\]\(\/[^)\s]+\))|(\*\*[^*]+\*\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      const link = /^\[([^\]]+)\]\((\/[^)\s]+)\)$/.exec(m[1]);
      if (link) {
        nodes.push(
          <a
            key={`${keyPrefix}-a${i}`}
            href={link[2]}
            className="font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(m[1]);
      }
    } else if (m[2]) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-stone-50">
          {m[2].slice(2, -2)}
        </strong>,
      );
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderRichText(text: string): ReactNode {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];

  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push(
        <ul key={`ul${blocks.length}`} className="ml-4 list-disc space-y-1">
          {bullets}
        </ul>,
      );
      bullets = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      bullets.push(<li key={`li${idx}`}>{renderInline(bullet[1], `li${idx}`)}</li>);
      return;
    }
    flushBullets();
    if (trimmed === '') return;
    blocks.push(
      <p key={`p${idx}`} className="first:mt-0 last:mb-0">
        {renderInline(trimmed, `p${idx}`)}
      </p>,
    );
  });
  flushBullets();

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
}

// ---------------------------------------------------------------------------

export function AtlasGuide({ locationContext }: AtlasGuideProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevOpen = useRef(false);

  // Open/close side effects: analytics, focus into the panel, focus back to FAB.
  useEffect(() => {
    if (open) {
      captureEvent('atlas_guide_opened');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      prevOpen.current = true;
      return () => clearTimeout(t);
    }
    if (prevOpen.current) {
      fabRef.current?.focus();
      prevOpen.current = false;
    }
  }, [open]);

  // Entrance transition.
  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [open]);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, loading, error, open]);

  async function runRequest(history: Msg[]) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          ...(locationContext ? { locationContext } : {}),
        }),
      });

      if (res.status === 503) {
        setUnconfigured(true);
        return;
      }
      if (res.status === 429) {
        setError({
          text: 'One moment — too many questions at once. Try again in a few seconds.',
          retry: true,
        });
        return;
      }
      if (!res.ok) {
        setError({ text: 'Something went wrong reaching Atlas Guide.', retry: true });
        return;
      }

      const data = (await res.json()) as { reply?: string };
      const reply = (data.reply ?? '').trim();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || "Sorry, I couldn't come up with a good answer just now.",
        },
      ]);
    } catch {
      setError({ text: 'Something went wrong reaching Atlas Guide.', retry: true });
    } finally {
      setLoading(false);
    }
  }

  function send(raw: string) {
    const content = raw.trim();
    if (!content || loading || unconfigured) return;
    captureEvent('atlas_guide_message_sent');
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    void runRequest(next);
  }

  function retry() {
    if (loading || messages.length === 0) return;
    void runRequest(messages);
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const inputDisabled = loading || unconfigured;

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Atlas Guide"
          className="group fixed bottom-20 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-stone-950 shadow-glow ring-1 ring-inset ring-white/20 transition-all duration-200 ease-spring hover:scale-105 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95 md:bottom-6"
        >
          {/* Subtle idle pulse — disabled under prefers-reduced-motion. */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-accent/30 motion-safe:animate-ping"
            aria-hidden
          />
          <Icon name="compass" size={26} weight="fill" className="relative" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Atlas Guide"
          className={cn(
            'glass fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-float transition duration-200 ease-spring',
            shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
            'inset-x-2 bottom-16 top-20 sm:inset-x-auto sm:bottom-20 sm:left-4 sm:top-auto sm:h-[560px] sm:max-h-[calc(100dvh-7rem)] sm:w-[380px] md:bottom-6',
          )}
        >
          {/* Header */}
          <header className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/25">
                <Icon name="compass" size={22} weight="fill" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold leading-tight text-stone-50">
                  Atlas Guide
                </h2>
                <p className="truncate text-xs text-stone-400">Your trail-savvy AI companion</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Atlas Guide"
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon name="close" size={20} />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {/* Greeting */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-overlay px-3.5 py-2.5 text-sm text-stone-100 ring-1 ring-inset ring-white/5">
                <div className="space-y-2 leading-relaxed">
                  <p>
                    Hi, I&apos;m Atlas Guide — your companion for caves, waterfalls, hot springs, and
                    springs. Ask me where to go or how to visit safely.
                  </p>
                  {locationContext && (
                    <p className="text-stone-300">
                      You&apos;re viewing{' '}
                      <span className="font-medium text-stone-100">{locationContext.name}</span> — ask
                      me anything about visiting it.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested prompts (first-open only) */}
            {messages.length === 0 && !unconfigured && (
              <div className="space-y-2 pt-1">
                <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2.5 text-sm text-emerald-50 ring-1 ring-inset ring-accent/20">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-[85%] break-words rounded-2xl rounded-bl-md bg-surface-overlay px-3.5 py-2.5 text-sm text-stone-100 ring-1 ring-inset ring-white/5">
                    {renderRichText(m.content)}
                  </div>
                </div>
              ),
            )}

            {/* Pending assistant bubble */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface-overlay px-3.5 py-3 ring-1 ring-inset ring-white/5">
                  <span className="flex items-end gap-1" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/70 motion-safe:animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/70 motion-safe:animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/70 motion-safe:animate-bounce" />
                  </span>
                  <span className="sr-only">Atlas Guide is thinking</span>
                </div>
              </div>
            )}

            {/* Inline error + retry */}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                  <div className="flex items-start gap-2">
                    <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                    <div className="space-y-1.5">
                      <p>{error.text}</p>
                      {error.retry && (
                        <button
                          type="button"
                          onClick={retry}
                          className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Unconfigured notice */}
          {unconfigured && (
            <div className="border-t border-white/8 px-4 py-3">
              <p className="flex items-center gap-2 text-xs text-stone-400">
                <Icon name="compass" size={16} className="text-accent" />
                Atlas Guide is coming online soon — check back shortly.
              </p>
            </div>
          )}

          {/* Input row */}
          {!unconfigured && (
            <div className="border-t border-white/8 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  rows={1}
                  disabled={inputDisabled}
                  aria-label="Ask Atlas Guide"
                  placeholder="Ask about a spot or how to visit safely…"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-surface/60 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 transition focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/60 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={inputDisabled || input.trim() === ''}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-stone-950 shadow-[0_8px_24px_-12px_rgba(52,211,153,0.6)] transition-all hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="report" size={20} weight="fill" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default AtlasGuide;
