"use client";

import { useEffect } from "react";
import { useProfile } from "@/lib/profile";

import { APP_URL } from "@/lib/site";

// Renders nothing. Returning users (those with a saved profile) are sent
// straight to their reading; new visitors and crawlers stay on the landing
// page, which is server-rendered and fully indexable.
export function ReturningUserRedirect() {
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (ready && profile) {
      window.location.href = `${APP_URL}/today`;
    }
  }, [ready, profile]);

  return null;
}
