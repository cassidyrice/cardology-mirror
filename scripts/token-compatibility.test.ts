import { afterEach, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { mintToken, verifyToken } from "../lib/gate";
import { mintDownloadToken, verifyDownloadToken } from "../lib/download-token";
import { mintReportToken, verifyReportToken } from "../lib/report-token";
import { mintMembershipToken, verifyMembershipToken } from "../lib/membership-token";

const keys = ["MEMBERSHIP_TOKEN_SECRET", "REPORT_TOKEN_SECRET", "DOWNLOAD_TOKEN_SECRET", "GATE_SECRET", "CARDOLOGY_GATE_SECRET"];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});
const secret = "test-only-token-compatibility-key";
const email = "reader+é@example.test";
const exp = 4102444800000;
const families = [
  { name: "gate", keys: keys.slice(3), payload: { email, exp }, mint: () => mintToken(` ${email.toUpperCase()} `), verify: verifyToken },
  { name: "download", keys: keys.slice(2), payload: { email, exp, slug: "guide", jti: "legacy-id" }, mint: () => mintDownloadToken(email, "guide"), verify: verifyDownloadToken },
  { name: "report", keys: keys.slice(1), payload: { email, exp, slug: "year", sessionId: "cs_test_legacy", birthdate: "1991-02-17", jti: "legacy-id" }, mint: () => mintReportToken(email, "year", "cs_test_legacy", "1991-02-17"), verify: verifyReportToken },
  { name: "membership", keys, payload: { email, exp, slug: "membership", subscriptionId: "sub_test_legacy", birthdate: "1991-02-17", jti: "legacy-id" }, mint: () => mintMembershipToken(email, "membership", "sub_test_legacy", "1991-02-17"), verify: verifyMembershipToken },
];
// Independent Node implementation of the pre-refactor wire format. This proves
// old buyer links remain valid and newly minted links use identical signatures.
function legacyToken(payload: unknown, signingKey = secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", signingKey).update(body).digest("base64url")}`;
}
for (const family of families) {
  test(`${family.name}: accepts legacy links through every secret fallback`, async () => {
    for (const key of family.keys) {
      for (const item of keys) delete process.env[item];
      process.env[key] = secret;
      expect(await family.verify(legacyToken(family.payload))).toEqual(family.payload);
    }
  });
  test(`${family.name}: preserves secret precedence and newly minted wire format`, async () => {
    for (const key of keys) process.env[key] = "lower-priority-test-key";
    process.env[family.keys[0]] = secret;
    const minted = await family.mint();
    const [encoded] = minted.split(".");
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString());
    expect(minted).toBe(legacyToken(decoded));
    expect(decoded.email).toBe(email);
    expect(decoded.exp).toBeGreaterThan(Date.now());
    expect(await family.verify(minted)).toEqual(decoded);
    if (family.name !== "gate") expect(decoded.jti).toMatch(/^[A-Za-z0-9_-]{16}$/);
    if (family.name !== "gate") expect(await family.mint()).not.toBe(minted);
  });
  test(`${family.name}: rejects expired, altered, wrong-key and malformed links`, async () => {
    for (const key of keys) delete process.env[key];
    process.env[family.keys[0]] = secret;
    const valid = legacyToken(family.payload);
    for (const token of [null, undefined, "", "bad", ".bad", "bad.", valid.slice(0,-1)+"!", legacyToken(family.payload,"wrong-test-key"), legacyToken({...family.payload, exp: 1}), legacyToken(null)]) {
      expect(await family.verify(token)).toBeNull();
    }
  });
  test(`${family.name}: fails closed with no configured secret`, async () => {
    for (const key of keys) delete process.env[key];
    expect(await family.verify(legacyToken(family.payload))).toBeNull();
    await expect(family.mint()).rejects.toThrow("missing");
  });
}
