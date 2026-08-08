import { describe, expect, test } from "bun:test";
import { addResendContact } from "../lib/resend-contacts";

test("creates a subscribed contact with lowercased email", async () => {
  let body = "";
  let auth = "";
  const fetcher: typeof fetch = async (_url, init) => {
    body = String(init?.body ?? "");
    auth = String((init?.headers as Record<string, string>)?.authorization ?? "");
    return new Response(JSON.stringify({ id: "contact_1" }), { status: 200 });
  };
  await addResendContact("Person@Example.COM", "rk_test", fetcher);
  expect(body).toContain("person@example.com");
  expect(body).toContain('"unsubscribed":false');
  expect(auth).toBe("Bearer rk_test");
});

test("treats 409 as success", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({ message: "exists" }), { status: 409 });
  await expect(addResendContact("a@b.co", "rk_test", fetcher)).resolves.toBe("existing");
});

test("rejects provider errors", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({ message: "nope" }), { status: 500 });
  await expect(addResendContact("a@b.co", "rk_test", fetcher)).rejects.toThrow();
});

test("rejects missing api key before network", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };
  await expect(addResendContact("a@b.co", "", fetcher)).rejects.toThrow(/not configured/i);
  expect(called).toBe(false);
});
