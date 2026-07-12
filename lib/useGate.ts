"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "cardology.gate";

interface Stored {
  token: string;
  email: string;
}

function load(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

// Store a token directly (magic-link flow) so every consumer of useGate
// picks it up through the same storage + event path as unlock().
export function storeGateToken(token: string, email: string): void {
  const next: Stored = { token, email: email.trim().toLowerCase() };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("cardology:gate"));
}

export function useGate() {
  const [stored, setStored] = useState<Stored | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStored(load());
    setReady(true);
    const on = () => setStored(load());
    window.addEventListener("cardology:gate", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cardology:gate", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const unlock = useCallback(async (email: string, code: string) => {
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) return { ok: false as const, error: json.error || "Could not unlock." };
      storeGateToken(json.token, json.email);
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "Network error. Try again." };
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("cardology:gate"));
  }, []);

  return {
    token: stored?.token ?? null,
    email: stored?.email ?? null,
    unlocked: !!stored?.token,
    ready,
    unlock,
    clear,
  };
}
