// Some clients treat the configured URL as an OpenAI *base* and append a path
// (/chat/completions, /v1/chat/completions). The Even glasses post verbatim,
// but accepting both costs nothing and saves guessing which form a given app
// version uses — every sub-path lands on the same handler.
//
// runtime/dynamic are declared here rather than re-exported: Next.js only reads
// those fields when they are literal in the route file itself.
import { GET as baseGet, POST as basePost } from "../route";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const GET = baseGet;
export const POST = basePost;
