/**
 * Vertex AI auth for the edge runtime: mint a short-lived OAuth2 access token from a
 * service-account JSON (VERTEX_SA_JSON) using WebCrypto RS256, cache it in module
 * memory, and expose the generateContent endpoint URL.
 *
 * Env: VERTEX_SA_JSON (secret), VERTEX_PROJECT, VERTEX_LOCATION (default us-central1).
 * Dev override: VERTEX_ACCESS_TOKEN (e.g. `gcloud auth application-default print-access-token`).
 * Nothing here logs the key or the token.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const REFRESH_MARGIN_S = 300;

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

let cached: { token: string; exp: number } | null = null;

export type VertexConfig = { project: string; location: string };

export function vertexConfig(): VertexConfig | null {
  const project = (process.env.VERTEX_PROJECT || "").trim();
  if (!project) return null;
  return { project, location: (process.env.VERTEX_LOCATION || "us-central1").trim() };
}

export function vertexConfigured(): boolean {
  return Boolean(vertexConfig() && (process.env.VERTEX_SA_JSON || process.env.VERTEX_ACCESS_TOKEN));
}

export function vertexGenerateUrl(model: string, cfg = vertexConfig()): string {
  if (!cfg) throw new Error("VERTEX_PROJECT is not configured");
  return `https://${cfg.location}-aiplatform.googleapis.com/v1/projects/${cfg.project}/locations/${cfg.location}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
}

function b64url(bytes: ArrayBuffer | Uint8Array | string): string {
  const u8 = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Build and sign the JWT assertion for the service-account flow. Exported for tests. */
export async function signServiceAccountJwt(sa: ServiceAccount, nowSeconds = Math.floor(Date.now() / 1000)): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri || TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  const key = await crypto.subtle.importKey("pkcs8", pemToPkcs8(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  return `${header}.${claims}.${b64url(sig)}`;
}

/** Access token for Vertex: dev override, then cached, then minted from the service account. */
export async function vertexAccessToken(fetcher: typeof fetch = fetch): Promise<string> {
  const override = (process.env.VERTEX_ACCESS_TOKEN || "").trim();
  if (override) return override;
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - REFRESH_MARGIN_S > now) return cached.token;
  const raw = process.env.VERTEX_SA_JSON;
  if (!raw) throw new Error("VERTEX_SA_JSON is not configured");
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("VERTEX_SA_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) throw new Error("VERTEX_SA_JSON is missing client_email or private_key");
  const assertion = await signServiceAccountJwt(sa, now);
  const res = await fetcher(sa.token_uri || TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
  });
  if (!res.ok) throw new Error(`Vertex token exchange failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Vertex token exchange returned no access_token");
  cached = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return cached.token;
}
