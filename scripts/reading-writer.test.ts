import { afterEach, expect, test } from "bun:test";

import { writeReading } from "../lib/reading-writer";

const ORIGINAL = {
  url: process.env.READING_WORKER_URL,
  secret: process.env.READING_SHARED_SECRET,
};

afterEach(() => {
  process.env.READING_WORKER_URL = ORIGINAL.url;
  process.env.READING_SHARED_SECRET = ORIGINAL.secret;
});

function configured() {
  process.env.READING_WORKER_URL = "https://reading.example/";
  process.env.READING_SHARED_SECRET = "shhh";
}

function okFetch(body: unknown, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

test("writeReading sends the birthday, the question and the shared secret", async () => {
  configured();
  const { fetcher, calls } = okFetch({
    text: "  a reading  ",
    words: 612,
    lint: [],
    clean: true,
    model: "anthropic/claude-sonnet-4.5",
  });
  const out = await writeReading("1991-02-17", "Should I take the promotion?", fetcher);
  expect(out.text).toBe("a reading");
  expect(out.words).toBe(612);
  expect(out.clean).toBe(true);
  expect(calls).toHaveLength(1);
  expect(calls[0]!.url).toBe("https://reading.example/");
  const headers = calls[0]!.init.headers as Record<string, string>;
  expect(headers["x-reading-key"]).toBe("shhh");
  expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
    birthday: "1991-02-17",
    question: "Should I take the promotion?",
  });
});

test("writeReading refuses to spend a call on input the worker would reject", async () => {
  configured();
  const { fetcher, calls } = okFetch({ text: "x" });
  await expect(writeReading("17/02/1991", "Should I go?", fetcher)).rejects.toThrow(/birthday/);
  await expect(writeReading("1991-02-17", "hi", fetcher)).rejects.toThrow(/question/);
  expect(calls).toHaveLength(0);
});

test("writeReading throws when the worker is not configured", async () => {
  delete process.env.READING_WORKER_URL;
  delete process.env.READING_SHARED_SECRET;
  const { fetcher } = okFetch({ text: "x" });
  await expect(writeReading("1991-02-17", "Should I go for it?", fetcher)).rejects.toThrow(
    /not configured/,
  );
});

test("an empty or failed worker response is an error, never an empty reading", async () => {
  configured();
  const blank = okFetch({ text: "   " });
  await expect(writeReading("1991-02-17", "Should I go for it?", blank.fetcher)).rejects.toThrow(
    /no text/,
  );
  const down = okFetch({ error: "OpenRouter 429" }, 502);
  await expect(writeReading("1991-02-17", "Should I go for it?", down.fetcher)).rejects.toThrow(
    /502/,
  );
});
