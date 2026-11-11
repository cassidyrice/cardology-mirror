"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";

import {
  SUGGESTED_QUESTION_CATEGORIES,
  SUGGESTED_QUESTIONS_FILENAME,
  SUGGESTED_QUESTIONS_PDF_PATH,
} from "@/lib/suggested-questions";
import type { DeliveryChannel, QuestionOrderStatus } from "@/lib/question-reading-tracks";

export interface ClientPassQuestionItem {
  questionNumber: 1 | 2 | 3;
  orderId: string;
  question: string;
  birth1: string;
  name1: string;
  birth2: string;
  name2: string;
  rel2: string;
  status: QuestionOrderStatus;
  submittedAt: number;
  sentAt: number | null;
  approvedSubject: string | null;
  approvedBody: string | null;
  approvedSmsBody: string | null;
}

export interface ClientReadingPassState {
  orderId: string;
  trackTitle: string;
  priceDollars: number;
  birth1: string;
  name1: string;
  defaultBirth2: string;
  defaultName2: string;
  defaultRel2: string;
  deliveryChannel: DeliveryChannel;
  destination: string;
  paidAt: number;
  accessExpiresAt: number;
  windowHours: number;
  windowOpen: boolean;
  maxQuestions: number;
  questionsUsed: number;
  questionsRemaining: number;
  canSubmitQuestion: boolean;
  suggestedQuestionsUrl: string;
  passUrl: string;
  turnaround: string;
  questions: ClientPassQuestionItem[];
}

function formatRemainingWindow(accessExpiresAt: number): { open: boolean; label: string } {
  const diffMs = accessExpiresAt - Date.now();
  if (diffMs <= 0) {
    return { open: false, label: "48-hour question window closed" };
  }
  const totalMinutes = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) {
    return { open: true, label: `${hours}h ${minutes}m left in your 48-hour window` };
  }
  return { open: true, label: `${minutes}m left in your 48-hour window` };
}

export function ReadingPassInteractivePanel({
  passToken,
  initialPass,
  compact = false,
}: {
  passToken: string;
  initialPass?: ClientReadingPassState | null;
  compact?: boolean;
}) {
  const uid = useId();
  const [pass, setPass] = useState<ClientReadingPassState | null>(initialPass ?? null);
  const [loading, setLoading] = useState(!initialPass);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [includePartner, setIncludePartner] = useState(Boolean(initialPass?.defaultBirth2));
  const [birth2, setBirth2] = useState(initialPass?.defaultBirth2 ?? "");
  const [name2, setName2] = useState(initialPass?.defaultName2 ?? "");
  const [rel2, setRel2] = useState(initialPass?.defaultRel2 ?? "");
  const [activeCategory, setActiveCategory] = useState<string>("timing");
  const [showSuggestions, setShowSuggestions] = useState(!compact);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [jokerBlocked, setJokerBlocked] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchPass = useCallback(async () => {
    if (!passToken) {
      setLoadError("Missing Reading Pass link token. Open the link from your confirmation email or text.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/reading-pass?token=${encodeURIComponent(passToken)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        pass?: ClientReadingPassState;
        error?: string;
      };
      if (!res.ok || !data.pass) {
        setLoadError(data.error || "Could not open this Reading Pass.");
        setLoading(false);
        return;
      }
      setPass(data.pass);
      if (data.pass.defaultBirth2) {
        setBirth2((prev) => prev || data.pass!.defaultBirth2);
        setName2((prev) => prev || data.pass!.defaultName2);
        setRel2((prev) => prev || data.pass!.defaultRel2);
      }
    } catch {
      setLoadError("Network error loading your Reading Pass.");
    } finally {
      setLoading(false);
    }
  }, [passToken]);

  useEffect(() => {
    if (!initialPass) {
      void fetchPass();
    }
  }, [fetchPass, initialPass]);

  async function handleSubmitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!pass) return;
    setSubmitting(true);
    setSubmitError(null);
    setJokerBlocked(false);
    setFlash(null);

    try {
      const res = await fetch("/api/reading-pass", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: passToken,
          question,
          birth2: includePartner ? birth2 : "",
          name2: includePartner ? name2 : "",
          rel2: includePartner ? rel2 : "",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        submittedQuestionNumber?: number;
        pass?: ClientReadingPassState;
        code?: string;
        error?: string;
      };
      if (!res.ok || !data.pass) {
        if (data.code === "JOKER_UNSUPPORTED") setJokerBlocked(true);
        setSubmitError(data.error || "Could not submit your question.");
        setSubmitting(false);
        return;
      }
      setPass(data.pass);
      setQuestion("");
      setFlash(
        `Question ${data.submittedQuestionNumber ?? data.pass.questionsUsed} of ${data.pass.maxQuestions} is now in Cass’s queue. Your answer will arrive via ${
          data.pass.deliveryChannel === "sms" ? "text message" : "email"
        } (${data.pass.destination}) ${data.pass.turnaround}.`,
      );
    } catch {
      setSubmitError("Network error submitting your question. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePickSuggested(qText: string, requiresSecondPerson?: boolean) {
    setQuestion(qText);
    if (requiresSecondPerson) {
      setIncludePartner(true);
    }
    setSubmitError(null);
  }

  async function handleCopyPassLink() {
    if (!pass?.passUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(pass.passUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore clipboard restrictions
    }
  }

  if (loading) {
    return (
      <div className="qr-pass-shell">
        <p className="qr-sub">Loading your Reading Pass…</p>
      </div>
    );
  }

  if (loadError || !pass) {
    return (
      <div className="qr-pass-shell">
        <div className="qr-error" role="alert">
          <p>{loadError || "Reading Pass unavailable."}</p>
          <p className="qr-mt-2">
            Need help finding your pass?{" "}
            <Link href="/contact" className="editorial-link">
              Message us on the contact page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const windowStatus = formatRemainingWindow(pass.accessExpiresAt);
  const canAskNow = pass.canSubmitQuestion && windowStatus.open && pass.questionsRemaining > 0;
  const nextQuestionNumber = Math.min(pass.maxQuestions, pass.questionsUsed + 1);
  const currentCat =
    SUGGESTED_QUESTION_CATEGORIES.find((c) => c.id === activeCategory) ??
    SUGGESTED_QUESTION_CATEGORIES[0];

  return (
    <div className="qr-pass-shell" data-reading-pass>
      {/* 1. Instant Download + Bookmarkable Pass Header */}
      <div className="qr-pass-banner">
        <div className="qr-eyebrow-row">
          <span className="qr-eyebrow">
            {pass.trackTitle} · ${pass.priceDollars} Paid
          </span>
          <span className="qr-sla-pill tnum">
            {pass.questionsUsed} of {pass.maxQuestions} questions used · {windowStatus.label}
          </span>
        </div>

        <h4 className="qr-confirmed-title">
          {pass.questionsUsed === 0
            ? "Your Reading Pass is active. Download the guide or ask Question 1 below."
            : pass.questionsRemaining > 0 && windowStatus.open
              ? `Question ${pass.questionsUsed} is in Cass’s queue — ${pass.questionsRemaining} question${
                  pass.questionsRemaining === 1 ? "" : "s"
                } remaining.`
              : `Your Reading Pass (${pass.questionsUsed} of ${pass.maxQuestions} questions submitted)`}
        </h4>

        <p className="qr-confirmed-body">
          Delivering to <strong>{pass.destination}</strong> ({pass.deliveryChannel === "sms" ? "Text message" : "Email"}) {pass.turnaround}. You have{" "}
          <strong>48 hours after purchase</strong> to submit up to <strong>3 questions</strong> — pick from the guide or ask any question in your own words.
        </p>

        <div className="qr-pass-actions">
          <a
            href={pass.suggestedQuestionsUrl || SUGGESTED_QUESTIONS_PDF_PATH}
            download={SUGGESTED_QUESTIONS_FILENAME}
            className="accent-button qr-download-btn"
          >
            Download Suggested Questions (.pdf)
          </a>
          {compact ? (
            <a href={pass.passUrl} className="quiet-button qr-pass-link-btn">
              Open full 48h Reading Pass →
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void handleCopyPassLink()}
              className="quiet-button qr-pass-link-btn"
            >
              {copied ? "Pass link copied ✓" : "Copy private 48h pass link"}
            </button>
          )}
        </div>

        <p className="qr-confirmed-meta">
          Order reference: <code>{pass.orderId}</code> · Primary birth date: <span className="tnum">{pass.birth1}</span>
        </p>
      </div>

      {/* 2. Submitted Questions & Delivered Answers */}
      {pass.questions.length > 0 && (
        <div className="qr-pass-history">
          <p className="qr-eyebrow">Your Questions on This Pass</p>
          <div className="qr-pass-list">
            {pass.questions.map((item) => (
              <article key={item.orderId} className="qr-pass-card">
                <div className="qr-eyebrow-row">
                  <span className="qr-eyebrow">
                    Question {item.questionNumber} of {pass.maxQuestions}
                    {item.birth2 ? ` · Two-person (${item.name2 || item.birth2})` : " · Solo spread"}
                  </span>
                  <span className="qr-sla-pill">
                    {item.status === "sent" ? "Delivered ✓" : "In Cass’s review queue"}
                  </span>
                </div>
                <p className="qr-pass-qtext">“{item.question}”</p>
                {item.status === "sent" && (item.approvedBody || item.approvedSmsBody) ? (
                  <div className="qr-pass-answer">
                    {item.approvedSubject && (
                      <p className="qr-pass-answer-subj">{item.approvedSubject}</p>
                    )}
                    <div className="qr-pass-answer-body">
                      {item.approvedBody || item.approvedSmsBody}
                    </div>
                  </div>
                ) : (
                  <p className="qr-micro qr-mt-2">
                    Drafted against your spread and queued for Cass’s personal review ({pass.turnaround}).
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {flash && (
        <div className="qr-pass-flash" role="status">
          {flash}
        </div>
      )}

      {/* 3. Submit Next Question (if inside 48h window and < 3 used) */}
      {canAskNow ? (
        <div className="qr-pass-composer">
          <div className="qr-eyebrow-row">
            <span className="qr-eyebrow">
              Ask Question {nextQuestionNumber} of {pass.maxQuestions}
            </span>
            <button
              type="button"
              onClick={() => setShowSuggestions((s) => !s)}
              className="editorial-link qr-edit-btn"
            >
              {showSuggestions ? "Hide suggested questions" : "Browse suggested questions"}
            </button>
          </div>

          {showSuggestions && (
            <div className="qr-suggestions-panel">
              <div className="qr-channel-toggle" role="tablist" aria-label="Suggested question topics">
                {SUGGESTED_QUESTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`qr-channel-btn ${activeCategory === cat.id ? "is-active" : ""}`}
                  >
                    {cat.id === "timing"
                      ? "Timing"
                      : cat.id === "chemistry"
                        ? "Relationships"
                        : cat.id === "work-money"
                          ? "Work & Money"
                          : "Blind Spots"}
                  </button>
                ))}
              </div>
              <p className="qr-micro qr-mt-2">{currentCat.note} Tap any prompt to load and edit it:</p>
              <div className="qr-chip-list">
                {currentCat.questions.map((qText) => (
                  <button
                    key={qText}
                    type="button"
                    onClick={() => handlePickSuggested(qText, currentCat.requiresSecondPerson)}
                    className="qr-suggestion-chip"
                  >
                    {qText}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitQuestion} className="qr-form qr-mt-3">
            <div className="qr-field">
              <label htmlFor={`${uid}-pass-q`}>
                Your Question {nextQuestionNumber} of {pass.maxQuestions} (ask anything in your own words)
              </label>
              <textarea
                id={`${uid}-pass-q`}
                required
                rows={4}
                maxLength={1200}
                placeholder="Type any question on your mind — or tap one of the suggested prompts above and tailor it to your situation."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="qr-textarea"
              />
            </div>

            <div className="qr-partner-toggle-box">
              <button
                type="button"
                onClick={() => setIncludePartner((v) => !v)}
                className="editorial-link qr-edit-btn"
              >
                {includePartner
                  ? "− Remove second person’s birthday from this question"
                  : "+ Include a second person’s birthday on this question (relationship / chemistry)"}
              </button>

              {includePartner && (
                <div className="qr-grid qr-mt-3">
                  <div className="qr-field">
                    <label htmlFor={`${uid}-pass-b2`}>Second person’s birth date</label>
                    <input
                      id={`${uid}-pass-b2`}
                      type="date"
                      required={includePartner}
                      value={birth2}
                      onChange={(e) => setBirth2(e.target.value)}
                      className="qr-input"
                    />
                  </div>
                  <div className="qr-field">
                    <label htmlFor={`${uid}-pass-n2`}>Their first name or initials (optional)</label>
                    <input
                      id={`${uid}-pass-n2`}
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Alex"
                      value={name2}
                      onChange={(e) => setName2(e.target.value)}
                      className="qr-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div className="qr-error" role="alert">
                <p>{submitError}</p>
                {jokerBlocked && (
                  <p className="qr-mt-2">
                    <Link href="/contact" className="editorial-link">
                      Message us on the contact page
                    </Link>
                  </p>
                )}
              </div>
            )}

            <div className="qr-submit-row">
              <button type="submit" disabled={submitting} className="accent-button qr-submit-btn">
                {submitting
                  ? "Sending to Cass’s queue…"
                  : `Send Question ${nextQuestionNumber} of ${pass.maxQuestions} to Cass`}
              </button>
              <p className="qr-micro">
                {pass.questionsRemaining - 1 > 0
                  ? `You will still have ${pass.questionsRemaining - 1} more question${
                      pass.questionsRemaining - 1 === 1 ? "" : "s"
                    } available until your 48-hour window closes.`
                  : "This is the final question on your 3-question Reading Pass."}
              </p>
            </div>
          </form>
        </div>
      ) : (
        <div className="qr-pass-closed">
          <p className="qr-sub">
            {pass.questionsRemaining === 0
              ? `All ${pass.maxQuestions} questions included with this Reading Pass have been submitted. Your Suggested Questions PDF and delivered answers remain saved here.`
              : "Your 48-hour question submission window after purchase has closed. Your Suggested Questions PDF and delivered answers remain available above."}
          </p>
        </div>
      )}
    </div>
  );
}
