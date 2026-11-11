"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { HydratedQuestionOrder } from "@/lib/question-reading-service";
import { buildOperatorSmsHref } from "@/lib/sms";

const TOKEN_STORAGE_KEY = "cb_ops_inbox_token";

function formatElapsed(paidAt: number | null, createdAt: number): { label: string; urgent: boolean } {
  const ref = paidAt ?? createdAt;
  const hours = Math.max(0, (Date.now() - ref) / 3_600_000);
  if (hours < 1) return { label: `${Math.max(1, Math.round(hours * 60))}m ago`, urgent: false };
  const rounded = Math.round(hours * 10) / 10;
  return {
    label: `${rounded}h elapsed · ${hours < 24 ? "inside <24h target" : hours < 48 ? "inside 48h SLA" : "past 48h window"}`,
    urgent: hours >= 20,
  };
}

export function ApprovalStudio() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [sig, setSig] = useState("");
  const [orders, setOrders] = useState<HydratedQuestionOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeAngle, setActiveAngle] = useState<1 | 2 | 3>(1);

  const [draftSubject, setDraftSubject] = useState("");
  const [draftEmailBody, setDraftEmailBody] = useState("");
  const [draftSmsBody, setDraftSmsBody] = useState("");
  const [steeringNote, setSteeringNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"approve" | "regenerate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadInbox = useCallback(
    async (opts: { tok?: string; orderParam?: string; sigParam?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (opts.orderParam) qs.set("order", opts.orderParam);
        if (opts.sigParam) qs.set("sig", opts.sigParam);
        const res = await fetch(`/api/ops/inbox?${qs.toString()}`, {
          headers: opts.tok ? { "x-ops-token": opts.tok } : undefined,
          cache: "no-store",
        });
        const data = (await res.json()) as {
          orders?: HydratedQuestionOrder[];
          error?: string;
        };
        if (!res.ok) {
          setError(data.error || "Sign in with your operator token or open the signed email link.");
          setOrders([]);
          setLoading(false);
          return;
        }
        const list = data.orders ?? [];
        setOrders(list);
        if (list.length > 0) {
          const initial =
            (opts.orderParam ? list.find((o) => o.id === opts.orderParam) : null) ??
            list.find((o) => o.status === "awaiting_approval") ??
            list[0];
          setSelectedId(initial.id);
        }
      } catch {
        setError("Network error loading reading inbox.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("t") || "";
    const urlOrder = params.get("order") || "";
    const urlSig = params.get("sig") || "";
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
    const effectiveToken = urlToken || stored;
    if (urlToken) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, urlToken);
    }
    setToken(effectiveToken);
    setSig(urlSig);
    void loadInbox({ tok: effectiveToken, orderParam: urlOrder, sigParam: urlSig });
  }, [loadInbox]);

  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? orders[0] ?? null,
    [orders, selectedId],
  );

  // Sync editor fields when order or selected angle tab changes
  useEffect(() => {
    if (!currentOrder) return;
    const chosenAngleNum = (currentOrder.approvedAngle as 1 | 2 | 3 | null) ?? activeAngle;
    const angleObj =
      currentOrder.angles.find((a) => a.angle === activeAngle) ??
      currentOrder.angles.find((a) => a.angle === chosenAngleNum) ??
      currentOrder.angles[0];

    if (currentOrder.status === "sent" && currentOrder.approvedAngle === activeAngle) {
      setDraftSubject(currentOrder.approvedSubject || angleObj?.subject || "");
      setDraftEmailBody(currentOrder.approvedBody || angleObj?.emailBody || "");
      setDraftSmsBody(currentOrder.approvedSmsBody || angleObj?.smsBody || "");
    } else if (angleObj) {
      setDraftSubject(angleObj.subject);
      setDraftEmailBody(angleObj.emailBody);
      setDraftSmsBody(angleObj.smsBody);
    }
    setSteeringNote(currentOrder.steeringNote || "");
  }, [currentOrder, activeAngle]);

  const liveManualSmsHref = useMemo(() => {
    if (!currentOrder?.buyerPhone) return null;
    return buildOperatorSmsHref(currentOrder.buyerPhone, draftSmsBody || draftEmailBody.slice(0, 900));
  }, [currentOrder?.buyerPhone, draftSmsBody, draftEmailBody]);

  async function handleApprove(manualSmsDispatched = false) {
    if (!currentOrder) return;
    setBusy("approve");
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/ops/inbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { "x-ops-token": token } : {}),
        },
        body: JSON.stringify({
          action: "approve",
          orderId: currentOrder.id,
          sig,
          angle: activeAngle,
          subject: draftSubject,
          emailBody: draftEmailBody,
          smsBody: draftSmsBody,
          manualSmsDispatched,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: HydratedQuestionOrder;
        emailSent?: boolean;
        smsSent?: boolean;
        requiresManualSmsTap?: boolean;
        warnings?: string[];
        error?: string;
      };
      if (!res.ok || !data.order) {
        setError(data.error || "Could not send reading.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === data.order!.id ? data.order! : o)));
      if (data.requiresManualSmsTap) {
        setFlash(
          "Email backup processed. Tap 'Open in Messages & Mark Sent' below to send the text message directly from your phone.",
        );
      } else {
        const channels = [
          data.smsSent ? "Text message" : null,
          data.emailSent ? "Email" : null,
        ]
          .filter(Boolean)
          .join(" + ");
        setFlash(`Sent Angle ${activeAngle} (${channels || "dispatched"}).`);
      }
    } catch {
      setError("Network error while approving reading.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRegenerate() {
    if (!currentOrder) return;
    setBusy("regenerate");
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/ops/inbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { "x-ops-token": token } : {}),
        },
        body: JSON.stringify({
          action: "regenerate",
          orderId: currentOrder.id,
          sig,
          steeringNote,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; order?: HydratedQuestionOrder; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "Could not regenerate angles.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === data.order!.id ? data.order! : o)));
      setFlash("3 fresh angles drafted.");
    } catch {
      setError("Network error regenerating angles.");
    } finally {
      setBusy(null);
    }
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) return;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, cleaned);
    setToken(cleaned);
    void loadInbox({ tok: cleaned });
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#171512]">
      <header className="border-b border-[#171512]/10 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E675F]">
              Card Blueprints · Approval Studio
            </p>
            <h1 className="mt-0.5 text-lg font-medium tracking-tight">
              Question Readings Inbox
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6E675F]">
            <span>
              {orders.filter((o) => o.status === "awaiting_approval").length} awaiting approval
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {!token && !sig && orders.length === 0 && !loading ? (
          <form
            onSubmit={handleTokenSubmit}
            className="mx-auto max-w-md rounded-2xl border border-[#171512]/12 bg-white p-6 shadow-sm"
          >
            <h2 className="text-base font-medium">Unlock Reading Queue</h2>
            <p className="mt-1 text-sm text-[#6E675F]">
              Paste your operator token, or tap the 1-click magic link inside any order notification email.
            </p>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="OPS_INBOX_TOKEN or LIVE_DASH_TOKEN"
              className="mt-4 w-full rounded-xl border border-[#171512]/15 px-3.5 py-2.5 text-sm focus:border-[#171512] focus:outline-none"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-full bg-[#171512] px-4 py-2.5 text-sm font-medium text-white"
            >
              Open Queue
            </button>
            {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
          </form>
        ) : loading ? (
          <p className="text-sm text-[#6E675F]">Loading reading drafts…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-[#171512]/10 bg-white p-8 text-center">
            <p className="text-base font-medium">Inbox zero.</p>
            <p className="mt-1 text-sm text-[#6E675F]">
              Paid $26 Timing and $39 Chemistry Check questions will land here automatically with 3 drafted angles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Order Rail */}
            <aside className="space-y-2">
              {orders.map((order) => {
                const elapsed = formatElapsed(order.paidAt, order.createdAt);
                const selected = currentOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(order.id);
                      setFlash(null);
                      setError(null);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[#171512] bg-white shadow-sm"
                        : "border-[#171512]/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          order.status === "sent"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {order.status === "sent" ? "Sent" : "Needs Approval"}
                      </span>
                      <span className="text-xs font-medium">
                        ${(order.amountCents / 100).toFixed(0)} · {order.deliveryChannel.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-[#171512]">
                      {order.name1 || order.buyerEmail || order.buyerPhone}
                      {order.name2 ? ` + ${order.name2}` : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-[#6E675F]">
                      “{order.question}”
                    </p>
                    <p
                      className={`mt-2 text-[11px] ${
                        elapsed.urgent && order.status !== "sent" ? "font-medium text-amber-800" : "text-[#6E675F]"
                      }`}
                    >
                      {order.status === "sent" ? "Delivered" : elapsed.label}
                    </p>
                  </button>
                );
              })}
            </aside>

            {/* Studio Main */}
            {currentOrder && (
              <section className="space-y-6 rounded-3xl border border-[#171512]/12 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#171512]/10 pb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#171512] px-2.5 py-0.5 text-[11px] font-medium text-white">
                        {currentOrder.trackTitle} · ${(currentOrder.amountCents / 100).toFixed(0)}
                      </span>
                      <span className="rounded-full border border-[#171512]/15 px-2.5 py-0.5 text-[11px] font-medium">
                        Deliver via {currentOrder.deliveryChannel === "sms" ? "Text Message (SMS)" : "Email"}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-medium leading-snug">
                      “{currentOrder.question}”
                    </h2>
                    <p className="mt-2 text-xs text-[#6E675F]">
                      Buyer: {currentOrder.name1 || "Unnamed"} ({currentOrder.birth1})
                      {currentOrder.birth2
                        ? ` · Person 2: ${currentOrder.name2 || "Person B"} (${currentOrder.birth2})`
                        : ""}
                      {currentOrder.buyerEmail ? ` · ${currentOrder.buyerEmail}` : ""}
                      {currentOrder.buyerPhone ? ` · ${currentOrder.buyerPhone}` : ""}
                    </p>
                  </div>
                </div>

                {/* Verified Engine Spread Summary */}
                {currentOrder.facts && (
                  <details className="rounded-2xl border border-[#171512]/10 bg-[#FAF8F5] p-4" open>
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-[#57514A]">
                      Verified Spread Receipts (Engine Math)
                    </summary>
                    <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-[#2C2824]">
                      {currentOrder.facts.summaryBullets.map((b, idx) => (
                        <li key={idx}>• {b}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* 3-Angle Selector Tabs */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6E675F]">
                    Choose 1 of 3 AI Angles (Edit Inline Before Sending)
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {([1, 2, 3] as const).map((num) => {
                      const angle = currentOrder.angles.find((a) => a.angle === num);
                      const active = activeAngle === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setActiveAngle(num)}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            active
                              ? "border-[#171512] bg-[#171512] text-white"
                              : "border-[#171512]/12 bg-[#FAF8F5] text-[#171512] hover:border-[#171512]/35"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider opacity-80">
                            <span>Angle {num}</span>
                            {currentOrder.approvedAngle === num && <span>✓ Sent</span>}
                          </div>
                          <p className="mt-1 text-sm font-medium">
                            {angle?.label ?? `Angle ${num}`}
                          </p>
                          {angle?.thesis && (
                            <p className={`mt-1 line-clamp-2 text-xs ${active ? "text-white/80" : "text-[#6E675F]"}`}>
                              {angle.thesis}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Editor */}
                <div className="space-y-4">
                  {currentOrder.deliveryChannel === "sms" ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#57514A]">
                          Text Message Body (Primary Delivery to {currentOrder.buyerPhone})
                        </label>
                        <span className="text-xs text-[#6E675F]">{draftSmsBody.length} chars</span>
                      </div>
                      <textarea
                        rows={7}
                        value={draftSmsBody}
                        onChange={(e) => setDraftSmsBody(e.target.value)}
                        className="mt-1.5 w-full rounded-2xl border border-[#171512]/15 bg-[#FAF8F5] p-4 text-sm leading-relaxed focus:border-[#171512] focus:bg-white focus:outline-none"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#57514A]">
                      Email Subject {currentOrder.deliveryChannel === "sms" ? "(Backup Copy)" : ""}
                    </label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#171512]/15 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-[#171512] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#57514A]">
                      Full Email Reading {currentOrder.deliveryChannel === "sms" ? "(Sent as Email Backup if Email Provided)" : ""}
                    </label>
                    <textarea
                      rows={13}
                      value={draftEmailBody}
                      onChange={(e) => setDraftEmailBody(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#171512]/15 bg-[#FAF8F5] p-4 text-sm leading-relaxed focus:border-[#171512] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {flash && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {flash}
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {error}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void handleApprove(false)}
                    className="rounded-full bg-[#171512] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2E2A25] disabled:opacity-50"
                  >
                    {busy === "approve"
                      ? "Sending…"
                      : `Approve Angle ${activeAngle} & Send ${
                          currentOrder.deliveryChannel === "sms" ? "Text + Email" : "Email"
                        }`}
                  </button>

                  {liveManualSmsHref && (
                    <a
                      href={liveManualSmsHref}
                      onClick={() => {
                        void handleApprove(true);
                      }}
                      className="rounded-full border border-[#171512] bg-white px-5 py-3 text-sm font-medium text-[#171512] transition hover:bg-[#FAF8F5]"
                    >
                      Open in Messages / SMS & Mark Sent
                    </a>
                  )}
                </div>

                {/* Optional Regenerate Bar */}
                <div className="border-t border-[#171512]/10 pt-5">
                  <label className="text-xs font-medium text-[#6E675F]">
                    Want a different slant? Add an optional note and regenerate all 3 angles:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={steeringNote}
                      onChange={(e) => setSteeringNote(e.target.value)}
                      placeholder="e.g. Lean harder on her Uranus 10♣ window and keep it under 250 words"
                      className="min-w-[240px] flex-1 rounded-xl border border-[#171512]/15 px-3.5 py-2 text-sm focus:border-[#171512] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void handleRegenerate()}
                      className="rounded-xl border border-[#171512]/20 px-4 py-2 text-xs font-medium text-[#171512] hover:bg-[#FAF8F5] disabled:opacity-50"
                    >
                      {busy === "regenerate" ? "Drafting…" : "Regenerate 3 Angles"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
