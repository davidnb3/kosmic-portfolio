import { site } from "../config/site";

export function BrandMark({ tone = "light" }: { tone?: "light" | "dark" }) {
  const color = tone === "light" ? "text-white" : "text-[#1a1a1a]";
  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="6.5" cy="8" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="9.8" cy="8" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="text-[11px] font-medium tracking-[0.18em]">{site.mark}</span>
    </span>
  );
}
