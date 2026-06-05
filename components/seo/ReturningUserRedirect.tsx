"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile";

// Renders nothing. Returning users (those with a saved profile) are sent
// straight to their reading; new visitors and crawlers stay on the landing
// page, which is server-rendered and fully indexable.
export function ReturningUserRedirect() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (ready && profile) router.replace("/today");
  }, [ready, profile, router]);

  return null;
}
