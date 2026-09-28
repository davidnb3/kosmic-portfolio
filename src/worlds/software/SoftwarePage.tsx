import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "../../components/BrandMark";
import { ExitWorld } from "../../components/ExitWorld";
import {
  fileSearchText,
  packageSource,
  profile,
  projectFiles,
  skillLevels,
  studioFileById,
  studioFiles,
  type StudioFile,
} from "../../config/software";
import { useSoftware } from "../../state/SoftwareContext";

export function SoftwarePage() {
  const { tabs, activeId, openFile, focusTab, closeTab } = useSoftware();
  const [activity, setActivity] = useState<"explorer" | "search">("explorer");
  const [query, setQuery] = useState("");
  const [caseOpen, setCaseOpen] = useState(false);
  const active = studioFileById(activeId);
  const highlight = activity === "search" ? query.trim() : "";

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return studioFiles.filter((file) => fileSearchText(file).toLowerCase().includes(needle));
  }, [query]);

  return (
    <div className="h-dvh overflow-auto bg-[#1b1b1b] text-[#e6e6e6]">
      <div className="flex h-dvh min-w-[980px] flex-col">
        <header className="flex h-9 shrink-0 items-center gap-4 border-b border-white/10 bg-[#141414] px-3">
          <BrandMark />
          <div className="ml-auto flex items-center gap-3">
            <p className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#bdbdbd]">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#c6f54a]" />
              Portfolio / local
            </p>
            <ExitWorld />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[#111111] py-2">
            <ActivityButton label="Explorer" active={activity === "explorer"} onClick={() => setActivity("explorer")}>
              <path d="M4 5h6l2 2h8v10H4z" />
            </ActivityButton>
            <ActivityButton label="Search" active={activity === "search"} onClick={() => setActivity("search")}>
              <circle cx="10" cy="10" r="5" />
              <path d="M14 14l4 4" />
            </ActivityButton>
            <ActivityButton label="Source control" active={false} onClick={() => setActivity("explorer")}>
              <circle cx="6" cy="6" r="2" />
              <circle cx="6" cy="16" r="2" />
              <circle cx="16" cy="11" r="2" />
              <path d="M6 8v6M8 7l6 3" />
            </ActivityButton>
          </aside>

          {activity === "search" ? (
            <SearchPane query={query} onQuery={setQuery} matches={matches} activeId={activeId} onOpen={openFile} />
          ) : (
            <ExplorerPane activeId={activeId} onOpen={openFile} />
          )}

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-9 items-end gap-1 overflow-auto border-b border-white/10 bg-[#141414] px-2" role="tablist">
              {tabs.map((tab) => {
                const file = studioFileById(tab.id);
                const selected = tab.id === activeId;
                return (
                  <div key={tab.id} className={`flex items-center rounded-t-sm ${selected ? "bg-[#1e1e1e] text-white" : "text-[#9a9a9a]"}`}>
                    <button type="button" role="tab" aria-selected={selected} onClick={() => focusTab(tab.id)} className="px-3 py-1.5 text-xs">
                      {file?.name ?? tab.id}
                    </button>
                    <button
                      type="button"
                      aria-label={`Close ${file?.name ?? tab.id}`}
                      onClick={() => closeTab(tab.id)}
                      className="pr-2 text-[11px] text-[#8d8d8d] hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {active ? (
              <>
                <p className="flex h-7 items-center gap-1 border-b border-white/5 px-4 text-[11px] text-[#8d8d8d]">
                  {active.crumbs.map((crumb, index) => (
                    <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                      {index > 0 ? <span className="text-[#555]">›</span> : null}
                      <span className={index === active.crumbs.length - 1 ? "text-[#d0d0d0]" : ""}>
                        <Highlight text={crumb} query={highlight} />
                      </span>
                    </span>
                  ))}
                </p>
                <div className="min-h-0 flex-1 overflow-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                    >
                      <FileView file={active} query={highlight} caseOpen={caseOpen} onCase={() => setCaseOpen((value) => !value)} onOpen={openFile} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-sm text-[#8d8d8d]">Open a file from the explorer.</div>
            )}
          </section>
        </div>

        <footer className="flex h-6 shrink-0 items-center justify-between bg-[#c6f54a] px-3 text-[11px] text-[#142006]">
          <span className="flex items-center gap-4">
            <span>main</span>
            <span>0 errors</span>
          </span>
          <span className="flex items-center gap-4">
            <span>{active?.cursor ?? "Ln 1, Col 1"}</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>TypeScript React</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

function ExplorerPane({ activeId, onOpen }: { activeId: string; onOpen: (id: string) => void }) {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-white/10 bg-[#161616]">
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2 text-[12px]">
        <p className="px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7d7d7d]">Portfolio</p>
        <TreeLabel>src</TreeLabel>
        <TreeLabel nested>projects</TreeLabel>
        {studioFiles
          .filter((file) => file.section === "projects")
          .map((file) => (
            <FileRow key={file.id} name={file.name} active={file.id === activeId} nested onOpen={() => onOpen(file.id)} />
          ))}
        <TreeLabel>public</TreeLabel>
        {studioFiles
          .filter((file) => file.section === "root")
          .map((file) => (
            <FileRow key={file.id} name={file.name} active={file.id === activeId} onOpen={() => onOpen(file.id)} />
          ))}
      </div>
    </aside>
  );
}

function SearchPane({
  query,
  onQuery,
  matches,
  activeId,
  onOpen,
}: {
  query: string;
  onQuery: (value: string) => void;
  matches: StudioFile[];
  activeId: string;
  onOpen: (id: string) => void;
}) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-[#161616]">
      <div className="px-3 py-3">
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="w-full rounded-sm border border-white/10 bg-[#111] px-2 py-1.5 text-xs outline-none"
        />
      </div>
      <ul className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        {query.trim() && matches.length === 0 ? <li className="px-2 py-2 text-xs text-[#8d8d8d]">No files match.</li> : null}
        {matches.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              onClick={() => onOpen(file.id)}
              className={`block w-full rounded-sm px-2 py-2 text-left hover:bg-white/5 ${file.id === activeId ? "bg-white/10" : ""}`}
            >
              <span className="block text-xs text-white">{file.name}</span>
              <span className="mt-1 block truncate font-mono text-[11px] text-[#8d8d8d]">{snippet(file, query)}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FileView({
  file,
  query,
  caseOpen,
  onCase,
  onOpen,
}: {
  file: StudioFile;
  query: string;
  caseOpen: boolean;
  onCase: () => void;
  onOpen: (id: string) => void;
}) {
  if (file.id === "readme") return <ReadmeView query={query} onOpen={onOpen} />;
  if (file.id === "index") return <ProjectGrid query={query} onOpen={onOpen} />;
  if (file.id === "package") return <PackageView query={query} />;
  return <ProjectDocument file={file} query={query} caseOpen={caseOpen} onCase={onCase} />;
}

function ReadmeView({ query, onOpen }: { query: string; onOpen: (id: string) => void }) {
  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-auto px-8 py-8">
        <h1 className="font-display text-5xl text-white">
          <Highlight text={profile.name} query={query} />
        </h1>
        <p className="mt-2 text-sm text-[#a3a3a3]">
          <Highlight text={`${profile.role} · ${profile.location}`} query={query} />
        </p>

        <section className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d8d8d]">Start</p>
          <div className="mt-3 space-y-2">
            <TextLink label="Explore all projects" onClick={() => onOpen("index")} />
            <TextLink label="Open package.json" onClick={() => onOpen("package")} />
          </div>
        </section>

        <section className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d8d8d]">Recent projects</p>
          <ul className="mt-3 space-y-1">
            {projectFiles.map((project) => (
              <li key={project.id}>
                <button type="button" onClick={() => onOpen(project.id)} className="text-sm text-[#7eb6ff] hover:underline">
                  <Highlight text={project.title} query={query} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d8d8d]">Skills and expertise</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skillLevels.map((skill) => (
              <span key={skill.name} className="rounded-sm border border-white/10 px-2 py-1 text-[11px] text-[#d0d0d0]">
                <Highlight text={skill.name} query={query} />
              </span>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d8d8d]">Featured walkthrough</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {projectFiles.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpen(project.id)}
                className="rounded-md border border-white/10 bg-[#242424] p-4 text-left hover:border-white/25"
              >
                <p className="text-sm text-white">
                  <Highlight text={project.title} query={query} />
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#a3a3a3]">
                  <Highlight text={project.lede} query={query} />
                </p>
              </button>
            ))}
          </div>
        </section>

        <p className="mt-10 rounded-md border border-white/10 px-4 py-3 text-sm text-[#c8c8c8]">
          <Highlight text={profile.availability} query={query} />
        </p>
      </div>
      <Manifest query={query} />
    </div>
  );
}

function Manifest({ query }: { query: string }) {
  return (
    <aside className="border-t border-white/10 bg-[#141414] p-4 lg:border-l lg:border-t-0">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#d0d0d0]">Portfolio manifest</p>
      <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-[#8d8d8d]">Core tech</p>
      <ul className="mt-3 space-y-3">
        {skillLevels.map((skill) => (
          <li key={skill.name}>
            <div className="flex justify-between text-[11px] text-[#c8c8c8]">
              <Highlight text={skill.name} query={query} />
              <span>{skill.level}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#3d9eff]" style={{ width: `${skill.level}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[10px] uppercase tracking-[0.16em] text-[#8d8d8d]">Connect</p>
      <a href={`mailto:${profile.email}`} className="mt-2 block text-sm text-[#7eb6ff] hover:underline">
        <Highlight text={profile.email} query={query} />
      </a>
      <p className="mt-2 text-xs text-[#8d8d8d]">
        <Highlight text={profile.location} query={query} />
      </p>
    </aside>
  );
}

function ProjectGrid({ query, onOpen }: { query: string; onOpen: (id: string) => void }) {
  return (
    <div className="px-8 py-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d8d8d]">Projects</p>
      <h1 className="mt-2 font-display text-4xl text-white">All projects</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projectFiles.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onOpen(project.id)}
            className="rounded-xl border border-white/10 bg-[#242424] p-5 text-left hover:border-white/30"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d8d8d]">
              <Highlight text={project.kicker} query={query} />
            </p>
            <h2 className="mt-2 font-display text-3xl text-white">
              <Highlight text={project.title} query={query} />
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#bdbdbd]">
              <Highlight text={project.lede} query={query} />
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-[#8d8d8d]">
              <Highlight text={project.tags.join(" · ")} query={query} />
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PackageView({ query }: { query: string }) {
  const lines = packageSource.split("\n");
  return (
    <pre className="overflow-auto px-6 py-6 font-mono text-[13px] leading-6 text-[#d4d4d4]">
      {lines.map((line, index) => (
        <div key={`${index}-${line}`} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
          <span className="text-right text-[#5c5c5c]">{index + 1}</span>
          <span>
            <Highlight text={line} query={query} />
          </span>
        </div>
      ))}
    </pre>
  );
}

function ProjectDocument({
  file,
  query,
  caseOpen,
  onCase,
}: {
  file: StudioFile;
  query: string;
  caseOpen: boolean;
  onCase: () => void;
}) {
  return (
    <div className="flex min-h-full">
      <div className="grid min-w-0 flex-1 grid-cols-[48px_minmax(0,1fr)] content-start gap-x-2 px-2 py-6">
        <Gutter n="01" />
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d8d8d]">
          <Highlight text={file.kicker} query={query} />
        </p>
        <Gutter n="02" />
        <h1 className="max-w-[14ch] pt-3 font-display text-5xl font-medium leading-[0.95] text-white sm:text-6xl">
          <Highlight text={file.title} query={query} />
        </h1>
        <Gutter n="07" />
        <div className="max-w-xl pt-4">
          <p className="text-sm leading-relaxed text-[#c8c8c8]">
            <Highlight text={file.lede} query={query} />
          </p>
          {caseOpen && file.body
            ? file.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">
                  <Highlight text={paragraph} query={query} />
                </p>
              ))
            : null}
        </div>
        <Gutter n="09" />
        <div className="pt-5">
          <div className="flex flex-wrap gap-2">
            {file.tags.map((tag) => (
              <span key={tag} className="rounded-sm border border-white/10 px-2 py-1 text-[11px] text-[#c8c8c8]">
                <Highlight text={tag} query={query} />
              </span>
            ))}
          </div>
          {file.primary ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={onCase} className="rounded-sm bg-[#3d7eff] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white">
                {file.primary} →
              </button>
              {file.secondary ? (
                <button type="button" className="rounded-sm border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[#e6e6e6]">
                  {file.secondary} →
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <Preview file={file} />
    </div>
  );
}

function Preview({ file }: { file: StudioFile }) {
  const tone = file.preview === "aether" ? "#7eb6ff" : "#9dbe7a";
  return (
    <aside className="hidden w-[42%] shrink-0 flex-col border-l border-white/10 bg-[#141414] p-4 lg:flex">
      <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-md border border-white/10 bg-[#101010]">
        <div className="flex items-center border-b border-white/10 px-3 py-2">
          <span className="flex gap-1">
            <i className="h-2 w-2 rounded-full bg-[#3a3a3a]" />
            <i className="h-2 w-2 rounded-full bg-[#3a3a3a]" />
            <i className="h-2 w-2 rounded-full bg-[#3a3a3a]" />
          </span>
          <span className="flex-1 text-center text-[10px] text-[#8d8d8d]">{file.previewTitle}</span>
        </div>
        <div className="relative grid flex-1 place-items-center">
          <p className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.18em] text-[#6d6d6d]">{file.previewLabel}</p>
          <div className="relative grid h-56 w-56 place-items-center">
            <span className="spin-slow absolute inset-0 rounded-full border border-dashed" style={{ borderColor: tone }} />
            <span className="spin-slow absolute inset-6 rounded-full border" style={{ borderColor: tone, animationDuration: "18s" }} />
            <span className="spin-slow absolute inset-12 rounded-full border opacity-70" style={{ borderColor: tone, animationDuration: "12s" }} />
            <p className="font-display text-3xl text-white">{file.title}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const matcher = new RegExp(`(${escapeRegExp(needle)})`, "ig");
  const parts = text.split(matcher);
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded-sm bg-[#c6f54a]/35 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function snippet(file: StudioFile, query: string) {
  const needle = query.trim().toLowerCase();
  const line = fileSearchText(file)
    .split("\n")
    .find((entry) => entry.toLowerCase().includes(needle));
  return line?.trim() || file.name;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Gutter({ n }: { n: string }) {
  return <span className="pt-1 text-right font-mono text-[11px] text-[#5c5c5c]">{n}</span>;
}

function TextLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block text-sm text-[#7eb6ff] hover:underline">
      {label}
    </button>
  );
}

function FileRow({ name, active, nested, onOpen }: { name: string; active: boolean; nested?: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-2 rounded-sm py-1 text-left ${nested ? "pl-8" : "pl-3"} ${
        active ? "bg-white/10 text-white" : "text-[#c8c8c8] hover:bg-white/5"
      }`}
    >
      <span className="h-3 w-2.5 rounded-[1px] border border-[#6d8cff]/70" />
      {name}
    </button>
  );
}

function TreeLabel({ children, nested }: { children: string; nested?: boolean }) {
  return <p className={`py-1 text-[#bdbdbd] ${nested ? "pl-5" : "pl-2"}`}>▾ {children}</p>;
}

function ActivityButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center border-l-2 ${active ? "border-[#c6f54a] text-white" : "border-transparent text-[#8d8d8d] hover:text-white"}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        {children}
      </svg>
    </button>
  );
}
