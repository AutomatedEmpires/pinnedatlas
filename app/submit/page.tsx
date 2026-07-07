import type { Metadata } from 'next';
import Link from 'next/link';
import { getUserId } from '@/lib/auth';
import { SubmitForm } from '@/components/submit-form';

export const metadata: Metadata = {
  title: 'Add a spot',
  description: 'Submit a cave, waterfall, hot spring, or spring to the PinnedAtlas map.',
};

export default async function SubmitPage() {
  const userId = await getUserId();

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-shell px-4 py-8">
        <section className="rounded-xl border border-stone-800 bg-surface-raised p-6">
          <h1 className="text-2xl font-semibold text-stone-100">Add a spot</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Know a cave, waterfall, hot spring, or spring that belongs on the map? Sign in to
            contribute it to the atlas. Every submission is reviewed by a moderator before it is
            published, so the map stays accurate and trustworthy.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 font-medium text-stone-950 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
          >
            Sign in to contribute
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-100">Add a spot</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-400">
        Submissions are reviewed before publishing — your spot will appear on the map once a
        moderator approves it.
      </p>
      <div className="mt-6">
        <SubmitForm />
      </div>
    </div>
  );
}
