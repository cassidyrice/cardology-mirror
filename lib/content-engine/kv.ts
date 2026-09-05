import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import type { ContentCalendarKv } from "./storage";

type ContentCalendarEnv = {
  CONTENT_CALENDARS?: ContentCalendarKv;
};

let stubKv: ContentCalendarKv | null = null;

function stubCalendarsKv(): ContentCalendarKv {
  const globalKey = "__cardBlueprintsContentCalendarStubKv";
  const g = globalThis as typeof globalThis & {
    [key: string]: ContentCalendarKv | undefined;
  };
  if (g[globalKey]) return g[globalKey]!;

  const store = new Map<string, { value: string; expirationTtl?: number }>();
  stubKv = {
    async get(key: string) {
      return store.get(key)?.value ?? null;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, { value, expirationTtl: options?.expirationTtl });
    },
  };
  g[globalKey] = stubKv;
  return stubKv;
}

/** Pages KV binding for paid 52-day calendars. Null when the binding is missing. */
export function contentCalendarsKv(): ContentCalendarKv | null {
  if (process.env.CONTENT_ENGINE_TEST_STUB === "1") {
    return stubCalendarsKv();
  }
  try {
    const context = getOptionalRequestContext();
    const env = context?.env as ContentCalendarEnv | undefined;
    return env?.CONTENT_CALENDARS ?? null;
  } catch {
    return null;
  }
}
