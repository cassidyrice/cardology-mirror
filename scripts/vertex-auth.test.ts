import { describe, expect, test } from "bun:test";

import { signServiceAccountJwt, vertexAccessToken, vertexGenerateUrl } from "@/lib/content-engine/vertex-auth";

function toPem(pkcs8: ArrayBuffer): string {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

describe("vertex service-account auth", () => {
  test("signs an RS256 JWT the token endpoint would accept", async () => {
    const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    const pem = toPem(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const jwt = await signServiceAccountJwt({ client_email: "sa@example.iam.gserviceaccount.com", private_key: pem }, 1_800_000_000);
    const [h, c, sig] = jwt.split(".");
    expect(JSON.parse(new TextDecoder().decode(fromB64url(h)))).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(c)));
    expect(claims.iss).toBe("sa@example.iam.gserviceaccount.com");
    expect(claims.scope).toBe("https://www.googleapis.com/auth/cloud-platform");
    expect(claims.aud).toBe("https://oauth2.googleapis.com/token");
    expect(claims.exp - claims.iat).toBe(3600);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", pair.publicKey, fromB64url(sig), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });

  test("exchanges the assertion for an access token and caches it", async () => {
    const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign"]);
    const pem = toPem(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    process.env.VERTEX_ACCESS_TOKEN = "";
    process.env.VERTEX_SA_JSON = JSON.stringify({ client_email: "sa@example.iam.gserviceaccount.com", private_key: pem });
    let calls = 0;
    const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls += 1;
      expect(String(init?.body)).toContain("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer");
      return new Response(JSON.stringify({ access_token: "ya29.test", expires_in: 3600 }), { status: 200 });
    }) as unknown as typeof fetch;
    expect(await vertexAccessToken(fetcher)).toBe("ya29.test");
    expect(await vertexAccessToken(fetcher)).toBe("ya29.test");
    expect(calls).toBe(1);
  });

  test("builds the regional generateContent URL", () => {
    expect(vertexGenerateUrl("gemini-2.5-flash", { project: "p-1", location: "us-central1" })).toBe(
      "https://us-central1-aiplatform.googleapis.com/v1/projects/p-1/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent",
    );
  });
});
