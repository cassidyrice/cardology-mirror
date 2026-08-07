import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SeoShell } from "@/components/seo/SeoShell";
import { verifyDownloadToken } from "@/lib/download-token";
import { FREE_COURSE_MODULES } from "@/lib/free-course";
import { FREE_COURSE_SLUG } from "@/lib/free-course-signup";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Free Birth Card Course",
  robots: { index: false, follow: false },
};

export default async function FreeCourseWatchPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const payload = await verifyDownloadToken(token);
  if (!payload || payload.slug !== FREE_COURSE_SLUG) redirect("/free-course");

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Free Course", href: "/free-course" }, { label: "Watch", href: "/free-course/watch" }]}>
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow text-gold">Your free course</p>
        <h1 className="display mt-3 text-4xl text-bone">Read Your Birth Card</h1>
        <p className="prose-reading mt-4 text-mist">Work through the modules in order. Keep a note open for the short prompts, and test every description against your real behavior rather than treating it as a verdict.</p>
      </header>

      <div className="space-y-10">
        {FREE_COURSE_MODULES.map((module) => (
          <section key={module.number} className="card-surface overflow-hidden rounded-3xl border border-white/10">
            <div className="p-5 sm:p-7">
              <p className="eyebrow text-gold">Module {module.number} · {module.duration}</p>
              <h2 className="mt-2 font-serif text-2xl text-bone">{module.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">{module.description}</p>
            </div>
            <video className="aspect-video w-full bg-black" controls preload="none" poster={module.poster} playsInline>
              <source src={module.video} type="video/mp4" />
              Your browser does not support HTML video.
            </video>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-gold/20 bg-gold/[0.06] p-6">
        <h2 className="font-serif text-xl text-bone">Ready to apply it?</h2>
        <p className="mt-2 text-sm text-mist">Use the calculator to find your card, then open its full meaning page and identify which expression state is most active right now.</p>
        <Link href="/birth-card-calculator" className="mt-4 inline-flex rounded-full bg-foil px-5 py-2.5 font-serif text-sm text-ink">Open the birth card calculator →</Link>
      </section>
    </SeoShell>
  );
}
