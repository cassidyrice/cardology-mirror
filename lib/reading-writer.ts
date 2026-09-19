// The call to the `cardology-reading` Worker. Kept apart from reading-service.ts so it
// carries no Cloudflare request-context import and can be tested as a plain function.

export type WrittenReading = {
  text: string;
  words: number;
  lint: string[];
  clean: boolean;
  model: string;
};

/** Ask the Worker for the reading. Throws on anything short of a finished text. */
export async function writeReading(
  birthday: string,
  question: string,
  fetcher: typeof fetch = fetch,
): Promise<WrittenReading> {
  const url = process.env.READING_WORKER_URL;
  const secret = process.env.READING_SHARED_SECRET;
  if (!url || !secret) {
    throw new Error("reading worker not configured");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    throw new Error("birthday missing or malformed");
  }
  if (question.trim().length < 5) {
    throw new Error("question missing");
  }
  const res = await fetcher(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-reading-key": secret },
    body: JSON.stringify({ birthday, question }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await res.json().catch(() => ({}))) as Partial<WrittenReading> & {
    error?: string;
  };
  if (!res.ok || typeof body.text !== "string" || !body.text.trim()) {
    throw new Error(`reading worker ${res.status}: ${body.error ?? "no text"}`);
  }
  return {
    text: body.text.trim(),
    words: body.words ?? body.text.trim().split(/\s+/).length,
    lint: body.lint ?? [],
    clean: body.clean ?? true,
    model: body.model ?? "unknown",
  };
}
