import { Link } from "react-router-dom";

export function ExitWorld({ tone = "light" }: { tone?: "light" | "dark" }) {
  const classes =
    tone === "light"
      ? "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
      : "border-[#c8c8c4] text-[#3a3a3a] hover:border-[#1a1a1a] hover:text-[#1a1a1a]";

  return (
    <Link
      to="/"
      state={{ entered: true }}
      className={`rounded-sm border px-2.5 py-1 text-[10px] tracking-[0.18em] transition-colors ${classes}`}
    >
      Exit world
    </Link>
  );
}
