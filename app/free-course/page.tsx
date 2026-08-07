import type { Metadata } from "next";

import { FreeCourseSignupForm } from "@/components/free-course/FreeCourseSignupForm";
import { SeoShell } from "@/components/seo/SeoShell";
import { FREE_COURSE_MODULES } from "@/lib/free-course";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Free Course: Read Your Birth Card",
  description: "A free four-part Cardology video course: find your birth card, read rank and suit, understand three expression states, and build a useful reflection.",
  alternates: { canonical: "/free-course" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Free Course: Read Your Birth Card",
    description: "Learn the Cardology pattern language in four concise video modules.",
    url: "/free-course",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default async function FreeCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source = "free-course" } = await searchParams;
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Free Course", href: "/free-course" }]}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-start">
        <div>
          <p className="eyebrow text-gold">Free four-part video course</p>
          <h1 className="display mt-3 text-4xl leading-tight text-bone sm:text-5xl">Read Your Birth Card</h1>
          <p className="prose-reading mt-5 max-w-2xl text-mist">
            Learn Cardology as a clear pattern language, not fortune-telling. In about 14 minutes you will calculate your card, combine rank and suit, recognize its three expression states, and turn it into a practical reflection.
          </p>

          <ol className="mt-8 space-y-4">
            {FREE_COURSE_MODULES.map((module) => (
              <li key={module.number} className="card-surface rounded-2xl p-5">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 font-serif text-gold">{module.number}</span>
                  <div>
                    <h2 className="font-serif text-lg text-bone">{module.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-mist">{module.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-faint">{module.duration}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="card-surface rounded-3xl border border-gold/20 p-6 sm:p-8 lg:sticky lg:top-24">
          <p className="eyebrow text-gold">Get instant access</p>
          <h2 className="mt-3 font-serif text-2xl text-bone">Where should we send your course?</h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">Enter your name and email to unlock all four modules now. We will also email your return link.</p>
          <FreeCourseSignupForm source={source.slice(0, 80)} />
        </aside>
      </div>
    </SeoShell>
  );
}
