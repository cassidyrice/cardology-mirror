import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import type { VideoJobsKv } from "./video-jobs";

type VideoJobsEnv = {
  VIDEO_JOBS?: VideoJobsKv;
};

let stubKv: VideoJobsKv | null = null;

function stubVideoJobsKv(): VideoJobsKv {
  const globalKey = "__cardBlueprintsVideoJobsStubKv";
  const g = globalThis as typeof globalThis & {
    [key: string]: VideoJobsKv | undefined;
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

/** Pages KV binding for video render jobs. Null when the binding is missing. */
export function videoJobsKv(): VideoJobsKv | null {
  if (process.env.CONTENT_ENGINE_TEST_STUB === "1") {
    return stubVideoJobsKv();
  }
  try {
    const context = getOptionalRequestContext();
    const env = context?.env as VideoJobsEnv | undefined;
    return env?.VIDEO_JOBS ?? null;
  } catch {
    return null;
  }
}
