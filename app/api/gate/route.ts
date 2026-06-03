import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCode, mintToken } from "@/lib/gate";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST {email, code} -> {token} on success. Unlocks the AI deep-dive features.
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  const email = (body.email ?? "").trim();
  const code = (body.code ?? "").trim();

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Enter your access code." }, { status: 400 });
  }
  if (!process.env.GATE_SECRET && !process.env.CARDOLOGY_GATE_SECRET) {
    return NextResponse.json(
      { error: "Access isn't configured yet. Check back soon." },
      { status: 503 },
    );
  }
  if (!isValidAccessCode(code)) {
    return NextResponse.json({ error: "That code didn't work." }, { status: 403 });
  }

  const token = await mintToken(email);
  return NextResponse.json({ token, email: email.toLowerCase() });
}
