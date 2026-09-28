export type PreviewKind = "aether" | "relay" | "note";

export type StudioFile = {
  id: string;
  name: string;
  section: "projects" | "root";
  crumbs: string[];
  kicker: string;
  title: string;
  lede: string;
  body?: string[];
  tags: string[];
  primary?: string;
  secondary?: string;
  preview: PreviewKind;
  previewTitle: string;
  previewLabel: string;
  cursor: string;
};

export const profile = {
  name: "David Pieri",
  email: "david.mario.pieri@gmail.com",
  role: "Creative technologist",
  country: "Luxembourg",
  location: "Luxembourg, LU",
  availability: "Available for select projects",
};

export const skillLevels = [
  { name: "TypeScript", level: 92 },
  { name: "Next.js", level: 88 },
  { name: "React", level: 90 },
  { name: "Node.js", level: 84 },
  { name: "Tailwind CSS", level: 86 },
  { name: "Three.js", level: 78 },
] as const;

export const packageManifest = {
  name: "david-pieri",
  private: true,
  author: {
    name: profile.name,
    email: profile.email,
  },
  country: profile.country,
  dependencies: {
    typescript: "5.9.2",
    next: "15.5.4",
    react: "19.2.0",
    "node": "24.8.0",
    tailwindcss: "4.1.12",
    three: "0.180.0",
  },
};

export const packageSource = JSON.stringify(packageManifest, null, 2);

export const studioFiles: StudioFile[] = [
  {
    id: "aether",
    name: "aether.tsx",
    section: "projects",
    crumbs: ["src", "projects", "aether.tsx", "Aether"],
    kicker: "Featured / 2025",
    title: "Aether",
    lede: "A spatial music platform that turns listening into an explorable, shared environment.",
    body: [
      "Listeners move through a shared room instead of a playlist. Each piece occupies a place, and proximity changes what you hear.",
      "The study covers the room model, the session graph, and the interface that keeps the space legible.",
    ],
    tags: ["React", "WebGL", "Web Audio"],
    primary: "View case study",
    secondary: "Live project",
    preview: "aether",
    previewTitle: "aether.studio",
    previewLabel: "Selected work / 01",
    cursor: "Ln 12, Col 34",
  },
  {
    id: "relay",
    name: "relay.tsx",
    section: "projects",
    crumbs: ["src", "projects", "relay.tsx", "Relay"],
    kicker: "Selected / 2025",
    title: "Relay",
    lede: "A quiet bridge between a session and the people listening, built to stay out of the music.",
    body: [
      "Relay carries a performance from the desk to a remote room without turning the show into a dashboard.",
      "The work is the clock, the fallback, and the moment the stream hands back to the room.",
    ],
    tags: ["TypeScript", "WebSocket", "Audio"],
    primary: "View case study",
    secondary: "Live project",
    preview: "relay",
    previewTitle: "relay.studio",
    previewLabel: "Selected work / 02",
    cursor: "Ln 28, Col 12",
  },
  {
    id: "index",
    name: "index.tsx",
    section: "projects",
    crumbs: ["src", "projects", "index.tsx", "Projects"],
    kicker: "Projects",
    title: "Projects",
    lede: "A grid of the work in this studio.",
    tags: ["TypeScript", "Next.js", "React"],
    preview: "note",
    previewTitle: "index.tsx",
    previewLabel: "Projects",
    cursor: "Ln 4, Col 2",
  },
  {
    id: "package",
    name: "package.json",
    section: "root",
    crumbs: ["package.json"],
    kicker: "Manifest",
    title: "package.json",
    lede: packageSource,
    tags: [],
    preview: "note",
    previewTitle: "package.json",
    previewLabel: "File",
    cursor: "Ln 1, Col 1",
  },
  {
    id: "readme",
    name: "README.md",
    section: "root",
    crumbs: ["README.md"],
    kicker: "Readme",
    title: profile.name,
    lede: `${profile.role}. Based in ${profile.location}. ${profile.email}. ${profile.availability}.`,
    tags: skillLevels.map((skill) => skill.name),
    preview: "note",
    previewTitle: "README.md",
    previewLabel: "Portfolio",
    cursor: "Ln 8, Col 2",
  },
];

export const projectFiles = studioFiles.filter((file) => file.section === "projects" && file.id !== "index");

export function studioFileById(id: string) {
  return studioFiles.find((file) => file.id === id);
}

export function fileSearchText(file: (typeof studioFiles)[number]) {
  return [file.name, file.kicker, file.title, file.lede, ...(file.body ?? []), ...file.tags, ...file.crumbs].join("\n");
}
