// OpenAI-compatible gateway config, read purely from process.env so this module
// is Edge/Cloudflare-safe (no node:fs). Locally these come from .env.local; in
// production they're Cloudflare secrets/vars (OPENAI_API_KEY, OPENAI_BASE_URL,
// OPENAI_MODEL). NOTE: the gateway is chat-only (no audio/TTS/whisper).
let cached: { key: string; baseURL: string; model: string } | null = null;

export function getLLMConfig() {
  if (cached) return cached;
  // Prefer app-specific MIRROR_LLM_* vars so a shell-exported OPENAI_API_KEY
  // (a different account) can't collide with the gateway base URL. Fall back to
  // OPENAI_* for convenience. Set these as Cloudflare secrets in production.
  const key = process.env.MIRROR_LLM_KEY || process.env.OPENAI_API_KEY || "";
  const baseURL =
    process.env.MIRROR_LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  const model =
    process.env.MIRROR_LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  cached = { key, baseURL, model };
  return cached;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Non-streaming chat completion against the gateway.
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; max_tokens?: number } = {},
): Promise<string> {
  const { key, baseURL, model } = getLLMConfig();
  if (!key) throw new Error("missing OPENAI_API_KEY");
  const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? 1600,
    }),
  });
  if (!res.ok) {
    throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Streaming chat completion -> async iterator of text deltas.
export async function* chatStream(
  messages: ChatMessage[],
  opts: { temperature?: number; max_tokens?: number } = {},
): AsyncGenerator<string> {
  const { key, baseURL, model } = getLLMConfig();
  if (!key) throw new Error("missing OPENAI_API_KEY");
  const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? 1600,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore keep-alive / partial
      }
    }
  }
}
