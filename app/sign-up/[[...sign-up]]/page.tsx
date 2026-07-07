import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { hasClerk } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create a PinnedAtlas account to save spots, log visits, and report conditions.',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-8">
      {hasClerk ? (
        <SignUp appearance={{ variables: { colorPrimary: '#34d399' } }} />
      ) : (
        <div className="w-full max-w-shell rounded-2xl border border-stone-800 bg-surface-raised p-6 text-center">
          <h1 className="text-lg font-semibold text-stone-100">
            Accounts are almost ready
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Sign-up launches shortly. In the meantime, the whole map is open — go explore.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-stone-950 hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Back to the map
          </Link>
        </div>
      )}
    </div>
  );
}
