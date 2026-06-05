import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";
import {
  allCardSeo,
  cardBySlug,
  cardMeta,
  type CardSeo,
} from "@/lib/seo-cards";

export function generateStaticParams() {
  return allCardSeo().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (!card) return {};
  const { title, description } = cardMeta(card);
  return {
    title,
    description,
    alternates: { canonical: `/birth-card/${card.slug}` },
    openGraph: { title, description, url: `/birth-card/${card.slug}`, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function BirthCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (!card) notFound();

  const siblings = allCardSeo().filter(
    (c) => c.suit === card.suit && c.slug !== card.slug,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Birth Cards", item: `${SITE_URL}/birth-card` },
      { "@type": "ListItem", position: 3, name: `${card.label}`, item: `${SITE_URL}/birth-card/${card.slug}` },
    ],
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: card.label, href: `/birth-card/${card.slug}` },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-serif text-5xl" style={{ color: card.color }}>
          {card.code}
        </span>
        <span className="eyebrow text-faint">{card.suitDomain}</span>
      </div>
      <h1 className="display mb-2 text-3xl text-bone">
        {card.label}
        {card.title && <span className="block text-lg text-gold">{card.title}</span>}
      </h1>

      {/* Core identity */}
      <Section title="Who this card is at core">
        {card.coreIdentity ? (
          <p>{card.coreIdentity}</p>
        ) : (
          <p>
            The {card.label} sits in the {suitWord(card)} suit —{" "}
            {card.suitDomain.toLowerCase()}. Below is how this card tends to play
            out across its balanced center and its two slips.
          </p>
        )}
      </Section>

      {/* Three-lens: the universal under/sweet/over */}
      <Section title="The pattern, in three positions">
        <div className="space-y-4">
          <Lens label="Balanced" tone="#7fae8f" text={card.sweetSpot} />
          <Lens label="Under-expressed" tone="#d9b26a" text={card.under} />
          <Lens label="Over-expressed" tone="#e0654a" text={card.over} />
        </div>
        <p className="mt-4 text-sm text-faint">
          This isn&rsquo;t a verdict — it&rsquo;s the range. The work is noticing
          which way you tend to slip, and steering back to center.
        </p>
      </Section>

      {/* Gifts + shadow + direction (rich cards only) */}
      {card.gifts.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1.5">
            {card.gifts.map((g, i) => (
              <li key={i} className="flex gap-2 text-mist">
                <span className="text-gold">·</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {card.shadow && (
        <Section title="The shadow to watch">
          <p className="text-mist">{card.shadow}</p>
        </Section>
      )}
      {card.lifeDirection && (
        <Section title="Where it points">
          <p className="text-mist">{card.lifeDirection}</p>
        </Section>
      )}

      {/* CTA */}
      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">
          Not sure this is your card?
        </p>
        <p className="mt-1 text-sm text-faint">
          Your birth card is fixed by your birthday. Find yours in seconds.
        </p>
        <Link
          href="/birth-card-calculator"
          className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink"
        >
          Birth Card Calculator →
        </Link>
      </div>

      {/* Internal links: suit siblings */}
      <nav className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">More {suitWord(card)} cards</h2>
        <ul className="flex flex-wrap gap-2">
          {siblings.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/birth-card/${c.slug}`}
                className="rounded-full border border-white/12 px-3 py-1 text-sm text-mist transition hover:border-gold/40 hover:text-bone"
              >
                {c.code} {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">
            See how {card.label} pairs with other cards →
          </Link>
        </p>
      </nav>
    </SeoShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="eyebrow mb-2 text-gold">{title}</h2>
      <div className="prose-reading text-mist">{children}</div>
    </section>
  );
}

function Lens({ label, tone, text }: { label: string; tone: string; text: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tone}33`, background: `${tone}0d` }}>
      <p className="eyebrow mb-1" style={{ color: tone }}>{label}</p>
      <p className="mb-0 text-mist">{text}</p>
    </div>
  );
}

function suitWord(card: CardSeo): string {
  return card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
}
