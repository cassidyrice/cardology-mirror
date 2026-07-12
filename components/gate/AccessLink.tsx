"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeGateToken } from "@/lib/useGate";

// Landing client for emailed magic links: /access#token=...&email=...
// The token rides in the hash fragment so it never reaches server or CDN logs.
export function AccessLink() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const email = params.get("email");
    if (token && email) {
      storeGateToken(token, email);
      router.replace("/reading");
    } else {
      setFailed(true);
    }
  }, [router]);

  if (!failed) {
    return (
      <p className="mt-6 text-center text-sm text-mist">Opening your reading…</p>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-sm text-center">
      <p className="text-sm leading-relaxed text-mist">
        This access link looks incomplete. Open the link from your purchase
        email again, or unlock with the access code from that email instead.
      </p>
      <Link
        href="/reading"
        className="mt-5 inline-block rounded-full bg-foil px-6 py-3 font-serif text-base text-ink shadow-lg"
      >
        Enter with access code
      </Link>
    </div>
  );
}
