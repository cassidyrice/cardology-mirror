"use client";

import { useCallback, useEffect, useState } from "react";

import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";

const EVENT = "cb:birthdate";

/**
 * One birthday for the whole visit. Entered once (on any tool), it fills every
 * other tool in the same tab: home, your year, compatibility and checkout.
 *
 * Storage is the existing tab-scoped checkout key (sessionStorage): it never
 * goes into a URL and it is gone when the tab closes.
 */
export function useBirthday(): {
  birthdate: string;
  ready: boolean;
  setBirthdate: (iso: string) => void;
} {
  const [birthdate, setState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readCheckoutBirthdate());
    setReady(true);
    const sync = () => setState(readCheckoutBirthdate());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const setBirthdate = useCallback((value: string) => {
    const iso = storeCheckoutBirthdate(value);
    setState(iso);
    if (iso) window.dispatchEvent(new Event(EVENT));
  }, []);

  return { birthdate, ready, setBirthdate };
}
