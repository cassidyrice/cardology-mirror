"use client";

import { useMemo, useState } from "react";

import type { VideoFormat } from "@/lib/content-video";
import { VIDEO_FORMATS } from "@/lib/content-video";
import type { StoredCalendar } from "@/lib/content-engine/storage";
import {
  PIECE_KINDS,
  pieceKindLabel,
  type PieceKind,
} from "@/lib/content-engine/write-prompt";
import type { VideoOffer } from "@/lib/products";
import { VIDEO_SINGLE_SLUG, VIDEO_VOICE_ADDON_SLUG } from "@/lib/content-video";

type AssetState = {
  photos: string[];
  audio?: string;
  documents: string[];
  logos: string[];
};

type VideoOrderFormProps = {
  offer: VideoOffer;
  calendarSessionId: string;
  calendar: StoredCalendar;
  voiceAddonAvailable: boolean;
};

type UploadStatus = {
  uploading: boolean;
  error: string;
};

export function VideoOrderForm({
  offer,
  calendarSessionId,
  calendar,
  voiceAddonAvailable,
}: VideoOrderFormProps) {
  const [day, setDay] = useState(1);
  const [pieceKind, setPieceKind] = useState<PieceKind>("short-video");
  const [format, setFormat] = useState<VideoFormat>("vertical-short-60");
  const [voiceAddon, setVoiceAddon] = useState(false);
  const [assets, setAssets] = useState<AssetState>({
    photos: [],
    documents: [],
    logos: [],
  });
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});
  const [submitError, setSubmitError] = useState("");

  const scriptPreview = useMemo(() => {
    if (offer.slug !== VIDEO_SINGLE_SLUG) return "";
    return calendar.pieces?.[String(day)]?.[pieceKind]?.content ?? "";
  }, [calendar.pieces, day, offer.slug, pieceKind]);

  const needsScript = offer.slug === VIDEO_SINGLE_SLUG;
  const scriptMissing = needsScript && !scriptPreview;

  async function uploadFiles(field: "photos" | "audio" | "documents" | "logos", files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadStatus((s) => ({ ...s, [field]: { uploading: true, error: "" } }));
    try {
      const form = new FormData();
      form.set("calendarSessionId", calendarSessionId);
      form.set("field", field);
      for (const file of Array.from(files)) {
        form.append("files", file);
      }
      const res = await fetch("/api/content-engine/video/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        keys?: string[];
        audio?: string;
        message?: string;
      };
      if (!res.ok) {
        setUploadStatus((s) => ({
          ...s,
          [field]: { uploading: false, error: data.message || "Upload failed." },
        }));
        return;
      }
      setAssets((prev) => {
        if (field === "audio") {
          return { ...prev, audio: data.audio ?? data.keys?.[0] };
        }
        return { ...prev, [field]: [...prev[field], ...(data.keys ?? [])] };
      });
      setUploadStatus((s) => ({ ...s, [field]: { uploading: false, error: "" } }));
    } catch {
      setUploadStatus((s) => ({
        ...s,
        [field]: { uploading: false, error: "Could not reach the upload service." },
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");
    if (scriptMissing) {
      setSubmitError("Write the script for this day on your calendar first.");
      return;
    }

    const res = await fetch(`/checkout/${offer.slug}/session`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        calendarSessionId,
        day: needsScript ? day : undefined,
        pieceKind: needsScript ? pieceKind : undefined,
        format,
        voiceAddon,
        assetKeys: assets,
        source: "content-engine-video",
      }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setSubmitError(
        data.error === "unavailable"
          ? "Checkout is temporarily unavailable."
          : "Could not start checkout.",
      );
      return;
    }
    window.location.href = data.url;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {needsScript ? (
        <section>
          <h2 className="type-h3 text-brand-ink">Which script?</h2>
          <p className="mt-2 text-sm text-brand-ink-soft">
            Pick the calendar day and written piece to turn into video.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="block text-sm">
              <span className="font-medium text-brand-ink">Day</span>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="mt-1 block min-h-10 border border-brand-ink bg-brand-paper px-2"
              >
                {calendar.rows.map((row) => (
                  <option key={row.day} value={row.day}>
                    Day {row.day}: {row.theme}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-brand-ink">Piece type</span>
              <select
                value={pieceKind}
                onChange={(e) => setPieceKind(e.target.value as PieceKind)}
                className="mt-1 block min-h-10 border border-brand-ink bg-brand-paper px-2"
              >
                {PIECE_KINDS.map((k) => (
                  <option key={k} value={k}>{pieceKindLabel(k)}</option>
                ))}
              </select>
            </label>
          </div>
          {scriptPreview ? (
            <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap border border-brand-line bg-brand-paper-deep p-4 text-sm">
              {scriptPreview}
            </pre>
          ) : (
            <p className="mt-4 text-sm text-brand-oxblood">
              No written piece for this day yet. Go back to your calendar and tap Write this → first.
            </p>
          )}
        </section>
      ) : null}

      <section>
        <h2 className="type-h3 text-brand-ink">Format</h2>
        <div className="mt-3 space-y-2">
          {VIDEO_FORMATS.map((f) => (
            <label key={f.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="format"
                value={f.value}
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-h3 text-brand-ink">Your assets</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">
          Photos required for faceless video. Audio and logos optional. Documents help with facts and offers.
        </p>
        <div className="mt-4 space-y-4">
          <UploadField
            label="Photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            count={assets.photos.length}
            status={uploadStatus.photos}
            onChange={(files) => uploadFiles("photos", files)}
          />
          <UploadField
            label="Your voice (optional)"
            accept="audio/mpeg,audio/mp4,audio/wav"
            count={assets.audio ? 1 : 0}
            status={uploadStatus.audio}
            onChange={(files) => uploadFiles("audio", files)}
          />
          <UploadField
            label="Documents (optional)"
            accept="application/pdf,text/plain,.docx"
            multiple
            count={assets.documents.length}
            status={uploadStatus.documents}
            onChange={(files) => uploadFiles("documents", files)}
          />
          <UploadField
            label="Logos (optional)"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            multiple
            count={assets.logos.length}
            status={uploadStatus.logos}
            onChange={(files) => uploadFiles("logos", files)}
          />
        </div>
      </section>

      {voiceAddonAvailable ? (
        <section>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={voiceAddon}
              onChange={(e) => setVoiceAddon(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-brand-ink">Your-voice add-on (+$10)</span>
              <span className="block text-brand-ink-soft">
                Use your uploaded audio in the final mix.
              </span>
            </span>
          </label>
        </section>
      ) : null}

      {submitError ? (
        <p role="alert" className="text-sm text-brand-oxblood">{submitError}</p>
      ) : null}

      <button
        type="submit"
        className="accent-button large-button"
        disabled={scriptMissing}
      >
        Continue to checkout — {offer.priceLabel}
        {voiceAddon && voiceAddonAvailable ? " + $10 voice" : ""}
      </button>

      <input type="hidden" name="offer" value={offer.slug} />
      {offer.slug === VIDEO_VOICE_ADDON_SLUG ? null : null}
    </form>
  );
}

function UploadField({
  label,
  accept,
  multiple,
  count,
  status,
  onChange,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  count: number;
  status?: UploadStatus;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-ink">
        {label}
        {count > 0 ? ` (${count} uploaded)` : ""}
      </label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="mt-2 block w-full text-sm"
        onChange={(e) => onChange(e.target.files)}
        disabled={status?.uploading}
      />
      {status?.uploading ? (
        <p className="mt-1 text-xs text-brand-ink-soft">Uploading…</p>
      ) : null}
      {status?.error ? (
        <p className="mt-1 text-xs text-brand-oxblood">{status.error}</p>
      ) : null}
    </div>
  );
}
