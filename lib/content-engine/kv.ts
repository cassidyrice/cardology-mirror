import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import type { ContentCalendarKv } from "./storage";

type ContentCalendarEnv = {
  CONTENT_CALENDARS?: ContentCalendarKv;
};

/** Pages KV binding for paid 52-day calendars. Null when the binding is missing. */
export function contentCalendarsKv(): ContentCalendarKv | null {
  try {
    const context = getOptionalRequestContext();
    const env = context?.env as ContentCalendarEnv | undefined;
    return env?.CONTENT_CALENDARS ?? null;
  } catch {
    return null;
  }
}
