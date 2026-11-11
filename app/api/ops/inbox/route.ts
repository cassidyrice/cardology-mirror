import { NextRequest, NextResponse } from "next/server";

import {
  approveAndSendQuestionOrder,
  getQuestionOrderById,
  hydrateQuestionOrder,
  listQuestionOrdersForInbox,
  regenerateQuestionOrderAngles,
  verifyOpsMasterToken,
  verifyOpsOrderToken,
  type QuestionOrderStatus,
} from "@/lib/question-reading-service";
import { readJsonObject } from "@/lib/request-body";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

async function resolveAuth(
  req: NextRequest,
  orderIdParam?: string,
  sigParam?: string,
): Promise<{ mode: "master" } | { mode: "magic"; orderId: string } | null> {
  const headerToken = req.headers.get("x-ops-token") ?? req.nextUrl.searchParams.get("t");
  if (verifyOpsMasterToken(headerToken)) {
    return { mode: "master" };
  }
  const sig = sigParam || req.nextUrl.searchParams.get("sig") || "";
  const orderId = orderIdParam || req.nextUrl.searchParams.get("order") || "";
  if (sig) {
    const verified = await verifyOpsOrderToken(sig, orderId || undefined);
    if (verified) return { mode: "magic", orderId: verified.orderId };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const requestedOrder = req.nextUrl.searchParams.get("order") || "";
  const auth = await resolveAuth(req, requestedOrder);
  if (!auth) {
    return NextResponse.json({ error: "Operator token or valid signed order link required." }, { status: 401, headers: NO_STORE });
  }

  if (auth.mode === "magic") {
    const row = await getQuestionOrderById(auth.orderId);
    if (!row) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(
      { mode: "single", orders: [hydrateQuestionOrder(row)] },
      { headers: NO_STORE },
    );
  }

  if (requestedOrder) {
    const row = await getQuestionOrderById(requestedOrder);
    const all = await listQuestionOrdersForInbox();
    const list = row
      ? [hydrateQuestionOrder(row), ...all.filter((o) => o.id !== row.id)]
      : all;
    return NextResponse.json({ mode: "queue", orders: list }, { headers: NO_STORE });
  }

  const statusFilter = req.nextUrl.searchParams.get("status") as QuestionOrderStatus | null;
  const orders = await listQuestionOrdersForInbox(statusFilter || undefined);
  return NextResponse.json({ mode: "queue", orders }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: NO_STORE });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const sig = typeof body.sig === "string" ? body.sig.trim() : "";
  const auth = await resolveAuth(req, orderId, sig);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: NO_STORE });
  }
  if (auth.mode === "magic" && auth.orderId !== orderId) {
    return NextResponse.json({ error: "Magic link does not match orderId." }, { status: 403, headers: NO_STORE });
  }
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400, headers: NO_STORE });
  }

  const action = body.action;
  if (action === "regenerate") {
    try {
      const updated = await regenerateQuestionOrderAngles({
        orderId,
        steeringNote: typeof body.steeringNote === "string" ? body.steeringNote : undefined,
      });
      return NextResponse.json({ ok: true, order: updated }, { headers: NO_STORE });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Regeneration failed." },
        { status: 500, headers: NO_STORE },
      );
    }
  }

  if (action === "approve") {
    const rawAngle = Number(body.angle ?? body.angleNumber ?? 1);
    const angle: 1 | 2 | 3 = rawAngle === 2 ? 2 : rawAngle === 3 ? 3 : 1;
    try {
      const result = await approveAndSendQuestionOrder({
        orderId,
        angle,
        subject: typeof body.subject === "string" ? body.subject : undefined,
        emailBody: typeof body.emailBody === "string" ? body.emailBody : undefined,
        smsBody: typeof body.smsBody === "string" ? body.smsBody : undefined,
        manualSmsDispatched: Boolean(body.manualSmsDispatched),
      });
      return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Delivery failed." },
        { status: 502, headers: NO_STORE },
      );
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400, headers: NO_STORE });
}
