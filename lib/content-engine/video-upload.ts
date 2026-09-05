/** Buyer asset upload validation for Content Calendar video jobs. */

export type UploadField = "photos" | "audio" | "documents" | "logos";

export const UPLOAD_LIMITS = {
  photos: { maxBytes: 10 * 1024 * 1024, maxCount: 20 },
  audio: { maxBytes: 25 * 1024 * 1024, maxCount: 1 },
  documents: { maxBytes: 10 * 1024 * 1024, maxCount: 5 },
  logos: { maxBytes: 5 * 1024 * 1024, maxCount: 5 },
} as const;

const MIME_BY_FIELD: Record<UploadField, Set<string>> = {
  photos: new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]),
  audio: new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/m4a", "audio/x-m4a"]),
  documents: new Set([
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  logos: new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]),
};

const EXT_BY_FIELD: Record<UploadField, Set<string>> = {
  photos: new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]),
  audio: new Set([".mp3", ".m4a", ".wav"]),
  documents: new Set([".pdf", ".txt", ".docx"]),
  logos: new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]),
};

export function isUploadField(value: string): value is UploadField {
  return value === "photos" || value === "audio" || value === "documents" || value === "logos";
}

export function safeUploadFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return cleaned || "file";
}

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateUploadFile(
  field: UploadField,
  file: { name: string; type: string; size: number },
): UploadValidationResult {
  const limits = UPLOAD_LIMITS[field];
  if (file.size <= 0) {
    return { ok: false, reason: "Empty file." };
  }
  if (file.size > limits.maxBytes) {
    const mb = Math.round(limits.maxBytes / (1024 * 1024));
    return { ok: false, reason: `File too large (max ${mb} MB).` };
  }

  const ext = fileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  const mimeOk = mime && MIME_BY_FIELD[field].has(mime);
  const extOk = ext && EXT_BY_FIELD[field].has(ext);

  if (!mimeOk && !extOk) {
    return { ok: false, reason: "File type not allowed." };
  }

  if (ext === ".svg" && field === "logos") {
    return validateSvgSafe(file);
  }

  return { ok: true };
}

function validateSvgSafe(file: { name: string; size: number }): UploadValidationResult {
  if (file.size > 512 * 1024) {
    return { ok: false, reason: "SVG logo too large (max 512 KB)." };
  }
  return { ok: true };
}

export function buildVideoAssetKey(
  calendarSessionId: string,
  field: UploadField,
  filename: string,
): string {
  const safeSession = calendarSessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  const safeName = safeUploadFilename(filename);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `video-assets/${safeSession}/${field}/${stamp}-${rand}-${safeName}`;
}

export function validateAssetKeyForSession(
  key: string,
  calendarSessionId: string,
): boolean {
  const safeSession = calendarSessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  const prefix = `video-assets/${safeSession}/`;
  if (!key.startsWith(prefix)) return false;
  if (key.includes("..")) return false;
  return /^video-assets\/[a-zA-Z0-9_-]+\/(photos|audio|documents|logos)\/[a-zA-Z0-9._-]+$/.test(
    key,
  );
}
