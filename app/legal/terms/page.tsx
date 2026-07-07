import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of PinnedAtlas.',
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

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <article className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-50">Terms of Service</h1>
          <p className="text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
          <p className={p}>
            PinnedAtlas is operated by AutomatedEmpires (&ldquo;PinnedAtlas,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms of Service
            (&ldquo;Terms&rdquo;) govern your access to and use of the PinnedAtlas website,
            apps, and services (collectively, the &ldquo;Service&rdquo;).
          </p>
        </header>

        <Section number="1" title="Acceptance of These Terms">
          <p className={p}>
            By accessing or using the Service, you agree to be bound by these Terms and by our{' '}
            <Link href="/legal/privacy" className="text-accent underline underline-offset-2">
              Privacy Policy
            </Link>
            . If you do not agree, do not use the Service. You must be at least 13 years old to
            use the Service. If you use the Service on behalf of an organization, you represent
            that you have authority to bind that organization to these Terms.
          </p>
        </Section>

        <Section number="2" title="Description of the Service">
          <p className={p}>
            PinnedAtlas is a map and directory of natural features — caves, waterfalls, hot
            springs, and springs — built from open geodata and community contributions. The
            Service displays locations, approximate coordinates, difficulty and access notes,
            and user-submitted condition reports. Much of this information is{' '}
            <strong className="text-stone-100">community-sourced and not independently
            verified by us</strong>.
          </p>
        </Section>

        <Section number="3" title="Assumption of Risk & Outdoor Safety">
          <div className="space-y-3 rounded-xl border border-amber-600/40 bg-amber-950/30 p-4">
            <p className="text-sm font-semibold leading-relaxed text-amber-200">
              Read this section carefully. It affects your legal rights.
            </p>
            <p className={p}>
              Visiting caves, waterfalls, hot springs, and other natural features involves{' '}
              <strong className="text-stone-100">serious and inherent hazards</strong>,
              including but not limited to: drowning, falls from height, slippery terrain,
              flash floods, hypothermia, scalding from hot water, toxic gases, becoming lost,
              rockfall, cave collapse, wildlife encounters, and remoteness from medical help.
              People are seriously injured and killed at places like these every year.
            </p>
            <p className={p}>
              Information on the Service — including locations, coordinates, routes, difficulty
              ratings, access notes, and condition reports —{' '}
              <strong className="text-stone-100">
                may be inaccurate, incomplete, or out of date
              </strong>
              . We do not inspect locations and we do not verify current conditions. A spot
              that was safe or legally accessible when reported may no longer be either.
            </p>
            <ul className={list}>
              <li>
                <strong className="text-stone-100">You are solely responsible for your own
                safety</strong> and for the safety of anyone in your group, including your
                preparation, equipment, skills, and judgment.
              </li>
              <li>
                <strong className="text-stone-100">You are solely responsible for verifying
                legal access</strong> before visiting any location. Some locations shown may be
                on private property, seasonally closed, or otherwise off-limits.
              </li>
              <li>
                Obey all closures, postings, permits, and land-manager rules. Never enter
                private property without the owner&rsquo;s permission. Nothing on the Service
                is permission or an invitation to enter any location.
              </li>
            </ul>
            <p className={p}>
              By using the Service, you voluntarily accept all risks arising from visiting any
              location you learn about through it, to the maximum extent permitted by law.
            </p>
          </div>
        </Section>

        <Section number="4" title="No Warranty; Limitation of Liability">
          <p className={p}>
            THE SERVICE AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE,&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT ANY INFORMATION ON THE SERVICE IS
            ACCURATE, COMPLETE, OR CURRENT, OR THAT THE SERVICE WILL BE UNINTERRUPTED OR
            ERROR-FREE.
          </p>
          <p className={p}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PINNEDATLAS, AUTOMATEDEMPIRES, AND THEIR
            OFFICERS, EMPLOYEES, CONTRACTORS, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY
            PERSONAL INJURY, DEATH, OR PROPERTY DAMAGE, ARISING OUT OF OR RELATING TO YOUR USE
            OF THE SERVICE OR YOUR VISIT TO ANY LOCATION DESCRIBED ON IT.
          </p>
          <p className={p}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ALL CLAIMS
            RELATING TO THE SERVICE IS CAPPED AT THE FEES YOU PAID US IN THE TWELVE (12) MONTHS
            BEFORE THE EVENT GIVING RISE TO THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW CERTAIN
            EXCLUSIONS OR LIMITATIONS, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.
          </p>
        </Section>

        <Section number="5" title="Your Content">
          <p className={p}>
            You may submit content to the Service, such as new locations, condition reports,
            notes, and photos (&ldquo;User Content&rdquo;). You retain ownership of your User
            Content. By submitting it, you grant us a worldwide, non-exclusive, royalty-free,
            sublicensable license to host, store, reproduce, adapt, publish, display, and
            distribute it in connection with operating, improving, and promoting the Service.
          </p>
          <ul className={list}>
            <li>
              You represent that you have all rights necessary to submit your User Content and
              that it does not infringe anyone else&rsquo;s rights.
            </li>
            <li>
              You must not submit content that encourages trespass, describes access routes
              across private property without permission, or promotes unlawful or dangerous
              behavior.
            </li>
            <li>
              We may moderate, edit, decline to publish, or remove any User Content at our
              sole discretion, at any time, with or without notice.
            </li>
          </ul>
        </Section>

        <Section number="6" title="Subscriptions & Billing">
          <ul className={list}>
            <li>
              Paid plans (monthly and annual) <strong className="text-stone-100">renew
              automatically</strong> at the end of each billing period until you cancel.
              Payments are processed by Stripe.
            </li>
            <li>
              You can cancel anytime through the customer billing portal in your account.
              Cancellation takes effect at the end of the current billing period; you keep
              premium access until then.
            </li>
            <li>
              We do not offer partial or prorated refunds for unused time, except where a
              refund is required by applicable law.
            </li>
            <li>
              The lifetime plan is a one-time purchase that grants premium access for the{' '}
              <strong className="text-stone-100">lifetime of the Service</strong>, not the
              lifetime of the purchaser. If the Service is permanently discontinued, lifetime
              access ends with it.
            </li>
            <li>Prices may change; changes apply from your next renewal after notice.</li>
          </ul>
        </Section>

        <Section number="7" title="Acceptable Use">
          <p className={p}>You agree not to:</p>
          <ul className={list}>
            <li>Use the Service to plan or encourage trespassing or any unlawful activity.</li>
            <li>Submit false, misleading, or deliberately dangerous information.</li>
            <li>Scrape, bulk-export, or resell Service data except as its licenses permit.</li>
            <li>
              Interfere with the Service, probe or circumvent its security, or access it by
              automated means that burden our infrastructure.
            </li>
            <li>Impersonate others or misrepresent your affiliation with anyone.</li>
          </ul>
        </Section>

        <Section number="8" title="Termination">
          <p className={p}>
            You may stop using the Service at any time. We may suspend or terminate your
            access at any time, with or without notice, if you violate these Terms or if we
            reasonably believe your use poses a risk to the Service, other users, or third
            parties. Sections 3 through 5 and 9 through 11 survive termination.
          </p>
        </Section>

        <Section number="9" title="Changes to These Terms">
          <p className={p}>
            We may update these Terms from time to time. If we make material changes, we will
            post the updated Terms here and update the &ldquo;Last updated&rdquo; date, and
            where appropriate provide additional notice. Your continued use of the Service
            after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section number="10" title="Governing Law">
          <p className={p}>
            These Terms are governed by the laws of the State of Texas, without regard to its
            conflict-of-laws rules, and disputes will be resolved in the state or federal
            courts located in Texas.{' '}
            <span className="text-stone-500">[Governing law — confirm with counsel]</span>
          </p>
        </Section>

        <Section number="11" title="Contact">
          <p className={p}>
            Questions about these Terms? Email{' '}
            <a
              href="mailto:legal@pinnedatlas.com"
              className="text-accent underline underline-offset-2"
            >
              legal@pinnedatlas.com
            </a>
            .
          </p>
        </Section>

        <footer className="border-t border-stone-800 pt-6 text-sm text-stone-400">
          See also our{' '}
          <Link href="/legal/privacy" className="text-accent underline underline-offset-2">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/about" className="text-accent underline underline-offset-2">
            About page
          </Link>
          .
        </footer>
      </article>
    </div>
  );
}
