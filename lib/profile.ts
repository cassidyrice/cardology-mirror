"use client";

import { useEffect, useState } from "react";

export interface Profile {
  name: string;
  birthdate: string; // YYYY-MM-DD
  createdAt: string;
}

const KEY = "cardology.profile";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("cardology:profile"));
}

export function clearProfile() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("cardology:profile"));
}

// Reactive hook. `ready` flips true after first client read (avoids SSR flash).
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
    const on = () => setProfile(loadProfile());
    window.addEventListener("cardology:profile", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cardology:profile", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return { profile, ready };
}
