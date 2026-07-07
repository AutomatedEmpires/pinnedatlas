import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PinnedAtlas collects, uses, and protects your data.',
};

const LAST_UPDATED = 'July 6, 2026';

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-stone-100">
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

const p = 'text-sm leading-relaxed text-stone-300';
const list = 'list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-300';

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <article className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-50">Privacy Policy</h1>
          <p className="text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
          <p className={p}>
            This policy explains what data PinnedAtlas (operated by AutomatedEmpires)
            collects, how we use it, and the choices you have. It applies to the PinnedAtlas
            website, apps, and services (the &ldquo;Service&rdquo;).
          </p>
        </header>

        <Section number="1" title="Data We Collect">
          <ul className={list}>
            <li>
              <strong className="text-stone-100">Account information.</strong> Sign-in is
              handled by Clerk, our authentication provider. When you create an account we
              receive your name, email address, and a unique account identifier.
            </li>
            <li>
              <strong className="text-stone-100">Content you create.</strong> Saved spots,
              visited log entries, personal notes, location submissions, and condition
              reports you choose to submit.
            </li>
            <li>
              <strong className="text-stone-100">Payment information.</strong> Payments are
              handled by Stripe. We receive subscription status and plan details;{' '}
              <strong className="text-stone-100">we never store your card numbers</strong>.
            </li>
            <li>
              <strong className="text-stone-100">Usage and device data.</strong> We use
              PostHog analytics to understand how the Service is used, including pages
              viewed, actions taken, device and browser type, and approximate region.
            </li>
            <li>
              <strong className="text-stone-100">Error logs.</strong> Diagnostic logs when
              something goes wrong, so we can find and fix bugs.
            </li>
          </ul>
        </Section>

        <Section number="2" title="Device Location (GPS)">
          <p className={p}>
            If you grant your browser location permission, your device&rsquo;s GPS position is
            used <strong className="text-stone-100">only in your browser</strong> to center
            the map and compute distances to nearby locations. It is{' '}
            <strong className="text-stone-100">never transmitted to us or stored</strong> —
            unless you explicitly submit a new location, in which case only the coordinates
            you choose to submit are saved as part of that submission. You can revoke location
            permission at any time in your browser or device settings.
          </p>
        </Section>

        <Section number="3" title="Cookies & Local Storage">
          <p className={p}>
            We use cookies and browser local storage to keep you signed in (session
            management via Clerk) and to support analytics (PostHog). We do not use
            third-party advertising cookies.
          </p>
        </Section>

        <Section number="4" title="How We Share Data">
          <p className={p}>
            We <strong className="text-stone-100">never sell your personal data</strong>. We
            share it only with service providers (processors) that operate the Service on our
            behalf, under contracts that limit how they may use it:
          </p>
          <ul className={list}>
            <li>Clerk — authentication and account management</li>
            <li>Stripe — payments and subscription billing</li>
            <li>Supabase — application database hosting</li>
            <li>PostHog — product analytics</li>
            <li>Vercel — application hosting and delivery</li>
          </ul>
          <p className={p}>
            We may also disclose data if required by law or to protect the rights, safety, or
            property of PinnedAtlas, our users, or the public. Content you submit for
            publication (locations, condition reports) is shown publicly by design.
          </p>
        </Section>

        <Section number="5" title="Retention & Deletion">
          <p className={p}>
            We keep your data for as long as your account is active or as needed to operate
            the Service and meet legal obligations. You can request deletion of your account
            and associated personal data at any time by emailing us at the address below;
            we will act on verified requests within a reasonable period. Published community
            contributions may be retained in anonymized form to preserve data quality for
            other users.
          </p>
        </Section>

        <Section number="6" title="Children">
          <p className={p}>
            The Service is not directed to children under 13, and we do not knowingly collect
            personal data from them. If you believe a child under 13 has provided us personal
            data, contact us and we will delete it.
          </p>
        </Section>

        <Section number="7" title="Changes to This Policy">
          <p className={p}>
            We may update this policy from time to time. We will post changes here and update
            the &ldquo;Last updated&rdquo; date, and where changes are material we will
            provide additional notice.
          </p>
        </Section>

        <Section number="8" title="Contact">
          <p className={p}>
            Privacy questions or requests? Email{' '}
            <a
              href="mailto:privacy@pinnedatlas.com"
              className="text-accent underline underline-offset-2"
            >
              privacy@pinnedatlas.com
            </a>
            .
          </p>
        </Section>

        <footer className="border-t border-stone-800 pt-6 text-sm text-stone-400">
          See also our{' '}
          <Link href="/legal/terms" className="text-accent underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </footer>
      </article>
    </div>
  );
}
