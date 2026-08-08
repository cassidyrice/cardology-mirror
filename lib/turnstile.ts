export type TurnstileEnv = {
  secret: string;
  expectedAction: string;
  allowedHostnames: Set<string>;
};

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export function resolveTurnstileConfig(
  runtimeEnv?: Record<string, string | undefined>,
  processEnv: Record<string, string | undefined> = process.env,
): TurnstileEnv {
  const secret =
    runtimeEnv?.TURNSTILE_SECRET || processEnv.TURNSTILE_SECRET || "";
  const hostRaw =
    runtimeEnv?.TURNSTILE_HOSTNAMES ||
    processEnv.TURNSTILE_HOSTNAMES ||
    "cardblueprints.com,www.cardblueprints.com";
  const allowedHostnames = new Set(
    hostRaw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
  return {
    secret,
    expectedAction: "elroy_micro_reading",
    allowedHostnames,
  };
}

export async function verifyTurnstile(
  token: string,
  remoteIp: string,
  env: TurnstileEnv,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!env.secret || !token) return false;

  try {
    const response = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret: env.secret,
          response: token,
          remoteip: remoteIp || "",
        }),
      },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as SiteverifyResult;
    return Boolean(
      result.success &&
        result.action === env.expectedAction &&
        typeof result.hostname === "string" &&
        env.allowedHostnames.has(result.hostname),
    );
  } catch {
    return false;
  }
}
