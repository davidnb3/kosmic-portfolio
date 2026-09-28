import { useMemo, useState } from "react";
import { categoryCounts, musicProjects, type MusicKind } from "../../config/music";
import { Waveform } from "../../components/Waveform";

const categories: { id: MusicKind; label: string; count: string }[] = [
  { id: "project", label: "Projects", count: categoryCounts.project },
  { id: "sample", label: "Samples", count: categoryCounts.sample },
  { id: "experiment", label: "Experiments", count: categoryCounts.experiment },
];

export function Library() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MusicKind>("project");
  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return musicProjects.filter((project) => {
      if (project.kind !== kind) return false;
      if (!needle) return true;
      return `${project.title} ${project.subtitle}`.toLowerCase().includes(needle);
    });
  }, [kind, query]);

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-[#d5d5d1] bg-[#f7f7f5]">
      <div className="flex items-center justify-between border-b border-[#e4e4e0] px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a86]">Browser</p>
        <SearchIcon />
      </div>
      <div className="px-3 py-2">
        <label className="flex items-center gap-2 rounded-md border border-[#e1e1dd] bg-white px-2 py-1.5">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search library"
            className="w-full bg-transparent text-xs text-[#1c1c1c] outline-none placeholder:text-[#a3a39e]"
          />
        </label>
      </div>
      <ul className="space-y-0.5 px-2">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => setKind(category.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                kind === category.id ? "bg-[#ecece8] text-[#1c1c1c]" : "text-[#6d6d69] hover:bg-[#f0f0ec]"
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-sm border border-current opacity-70" />
              <span className="flex-1">{category.label}</span>
              <span className="font-mono text-[10px] text-[#9a9a96]">{category.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 px-3 text-[10px] uppercase tracking-[0.18em] text-[#8a8a86]">
        {kind === "project" ? "My projects" : kind === "sample" ? "Samples" : "Experiments"}
      </p>
      <ul className="mt-1 flex-1 space-y-1 overflow-auto px-2 pb-3">
        {items.map((project) => (
          <li
            key={project.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", `project:${project.id}`);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="flex cursor-grab items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 hover:border-[#e4e4e0] hover:bg-white active:cursor-grabbing"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm" style={{ background: project.color }}>
              <Waveform seed={project.seed} className="h-6 w-8 text-[#1c1c1c]/80" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-[#1c1c1c]">{project.title}</span>
                <span className="font-mono text-[10px] text-[#9a9a96]">{project.duration}</span>
              </span>
              <span className="block truncate text-[10px] text-[#8a8a86]">{project.subtitle}</span>
            </span>
          </li>
        ))}
        {items.length === 0 ? <li className="px-2 py-4 text-xs text-[#8a8a86]">Nothing in this drawer.</li> : null}
      </ul>
      <p className="border-t border-[#e4e4e0] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[#9a9a96]">
        Drag a project into the timeline
      </p>
    </aside>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-[#9a9a96]">
      <circle cx="5" cy="5" r="3.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.6 7.6 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
