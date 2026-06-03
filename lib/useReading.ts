"use client";

import { useEffect, useState } from "react";
import type { Reading } from "./types";

export function useReading(birthdate?: string, date?: string) {
  const [data, setData] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!birthdate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ birthdate });
    if (date) params.set("date", date);
    fetch(`/api/reading?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "failed");
        return json as Reading;
      })
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [birthdate, date]);

  return { data, error, loading };
}
