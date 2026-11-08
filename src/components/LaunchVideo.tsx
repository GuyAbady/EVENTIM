"use client";

import { useRef, useState } from "react";

// Launch video with a large play button over the poster. Nothing is
// downloaded until the visitor presses play (preload="none"); after that the
// native controls take over for keyboard and screen-reader access.
export function LaunchVideo({ src, poster, playLabel, title }: { src: string; poster: string; playLabel: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const play = () => {
    setStarted(true);
    void ref.current?.play();
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#1a1113] shadow-xl ring-1 ring-black/5">
      <video
        ref={ref}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        controls={started}
        aria-label={title}
        className="h-full w-full object-cover"
        onPlay={() => setStarted(true)}
      />
      {!started && (
        <button
          type="button"
          onClick={play}
          aria-label={playLabel}
          className="group absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20 focus-visible:outline-none"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/10 transition-transform group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-accent sm:size-24">
            <svg aria-hidden viewBox="0 0 24 24" className="ml-1 size-9 fill-[#3d2c2e] sm:size-11">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </span>
          <span className="sr-only">{playLabel}</span>
        </button>
      )}
    </div>
  );
}
