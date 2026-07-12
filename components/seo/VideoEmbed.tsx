"use client";

import { useState } from "react";

// Click-to-load YouTube embed: renders only the thumbnail and a play
// affordance until clicked, so pages ship no iframe by default.
// `frameClassName` replaces the default dark rounded frame so light-themed
// pages (e.g. /videos) can restyle the border without Tailwind conflicts.
export function VideoEmbed({
  videoId,
  title,
  frameClassName,
}: {
  videoId: string;
  title: string;
  frameClassName?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const frame = frameClassName ?? "rounded-2xl border border-white/10";

  if (playing) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden bg-black ${frame}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative block aspect-video w-full overflow-hidden bg-black text-left ${frame}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, loaded lazily */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        width={480}
        height={360}
        className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/70 transition group-hover:bg-black/85">
          <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current text-bone" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
