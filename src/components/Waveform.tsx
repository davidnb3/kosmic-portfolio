import { useMemo } from "react";

export function Waveform({ seed, className }: { seed: number; className?: string }) {
  const bars = useMemo(() => {
    return Array.from({ length: 56 }, (_, index) => {
      const a = Math.abs(Math.sin(seed * 3.1 + index * 0.55));
      const b = Math.abs(Math.cos(index * 0.31 + seed));
      const spike = index % 7 === 0 ? 0.25 : 0;
      return 4 + (a * 0.65 + b * 0.35 + spike) * 24;
    });
  }, [seed]);

  return (
    <svg viewBox={`0 0 ${bars.length} 32`} preserveAspectRatio="none" className={className} aria-hidden="true">
      {bars.map((height, index) => (
        <rect key={index} x={index + 0.2} y={(32 - height) / 2} width="0.45" height={height} fill="currentColor" rx="0.2" />
      ))}
    </svg>
  );
}
