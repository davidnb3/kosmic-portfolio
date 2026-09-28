import type { ReactNode } from "react";
import { beatsPerBar, tempo } from "../../config/music";
import { BrandMark } from "../../components/BrandMark";
import { ExitWorld } from "../../components/ExitWorld";
import { useDaw } from "../../state/DawContext";

export function Transport() {
  const { playing, playheadBeat, togglePlay, stop, seekStart } = useDaw();
  const bar = Math.floor(playheadBeat / beatsPerBar) + 1;

  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[#d5d5d1] bg-[#efefec] px-3">
      <BrandMark tone="dark" />
      <div className="flex items-center overflow-hidden rounded-md border border-[#d0d0cc] bg-white">
        <TransportButton label="Return to start" onClick={seekStart}>
          <path d="M6 5v10M9 7.5 14 5v10l-5-2.5z" />
        </TransportButton>
        <TransportButton label={playing ? "Pause" : "Play"} pressed={playing} onClick={togglePlay}>
          {playing ? <path d="M7 5h2.2v10H7zM11 5h2.2v10H11z" /> : <path d="M7 5.2v9.6l8-4.8z" />}
        </TransportButton>
        <TransportButton label="Stop" onClick={stop}>
          <path d="M6 6l8 8M14 6 6 14" />
        </TransportButton>
      </div>
      <p className="flex items-baseline gap-2 text-[11px] tracking-[0.12em] text-[#8a8a86]">
        <span>Tempo</span>
        <span className="font-mono text-[13px] text-[#1c1c1c]">{tempo.toFixed(2)}</span>
        <span>BPM</span>
        <span className="px-1">4 / 4</span>
        <span className="font-mono text-[13px] text-[#1c1c1c]">{bar} bar</span>
      </p>
      <div className="ml-auto flex items-end gap-3">
        <div className="flex h-4 items-end gap-0.5" aria-hidden="true">
          {[0, 0.15, 0.3, 0.08].map((delay) => (
            <span
              key={delay}
              className={`meter-bar w-1 rounded-sm bg-[#7dce3a] ${playing ? "" : "paused"}`}
              style={{ height: 16, animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <span className="text-[10px] tracking-[0.14em] text-[#8a8a86]">48 kHz</span>
        <ExitWorld tone="dark" />
      </div>
    </header>
  );
}

function TransportButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center border-r border-[#ececec] last:border-r-0 ${pressed ? "bg-[#1c1c1c] text-white" : "text-[#1c1c1c] hover:bg-[#f6f6f4]"}`}
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.4">
        {children}
      </svg>
    </button>
  );
}
