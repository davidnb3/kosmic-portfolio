export type MusicKind = "project" | "sample" | "experiment";

export type MusicProject = {
  id: string;
  title: string;
  subtitle: string;
  kind: MusicKind;
  color: string;
  duration: string;
  lengthBeats: number;
  seed: number;
  audioSrc?: string;
  videoSrc?: string;
};

export type TrackDefinition = {
  id: string;
  name: string;
  role: string;
  color: string;
};

export const tempo = 118;
export const beatsPerBar = 4;
export const barCount = 17;
export const totalBeats = beatsPerBar * barCount;
export const laneHeight = 78;

export const musicProjects: MusicProject[] = [
  {
    id: "glasshouse",
    title: "Glasshouse",
    subtitle: "Full production",
    kind: "project",
    color: "#b7a4f2",
    duration: "03:42",
    lengthBeats: 16,
    seed: 2.1,
  },
  {
    id: "afterimage",
    title: "Afterimage",
    subtitle: "Sound design",
    kind: "project",
    color: "#f0c36a",
    duration: "01:18",
    lengthBeats: 18,
    seed: 5.4,
  },
  {
    id: "low-tide",
    title: "Low Tide",
    subtitle: "Original sample",
    kind: "project",
    color: "#7ec8ea",
    duration: "00:54",
    lengthBeats: 14,
    seed: 8.2,
  },
  {
    id: "kinetic-bloom",
    title: "Kinetic Bloom",
    subtitle: "Mix & master",
    kind: "project",
    color: "#b6de73",
    duration: "04:07",
    lengthBeats: 16,
    seed: 3.7,
  },
  {
    id: "room-tone",
    title: "Room Tone",
    subtitle: "Ambience",
    kind: "sample",
    color: "#d7d3cc",
    duration: "00:32",
    lengthBeats: 8,
    seed: 1.2,
  },
  {
    id: "night-bus",
    title: "Night Bus",
    subtitle: "Field recording",
    kind: "sample",
    color: "#9bb0c9",
    duration: "02:11",
    lengthBeats: 12,
    seed: 4.4,
  },
  {
    id: "glass-hit",
    title: "Glass Hit",
    subtitle: "One shot",
    kind: "sample",
    color: "#e7b1c8",
    duration: "00:02",
    lengthBeats: 2,
    seed: 9.1,
  },
  {
    id: "sub-pulse",
    title: "Sub Pulse",
    subtitle: "Low end",
    kind: "sample",
    color: "#8fd0c4",
    duration: "00:08",
    lengthBeats: 4,
    seed: 6.6,
  },
  {
    id: "drift",
    title: "Drift",
    subtitle: "Texture study",
    kind: "experiment",
    color: "#c9b7a4",
    duration: "01:04",
    lengthBeats: 12,
    seed: 7.3,
  },
  {
    id: "phase",
    title: "Phase",
    subtitle: "Stereo test",
    kind: "experiment",
    color: "#d2c46a",
    duration: "00:46",
    lengthBeats: 8,
    seed: 2.8,
  },
  {
    id: "tape",
    title: "Tape",
    subtitle: "Degraded loop",
    kind: "experiment",
    color: "#e0a08a",
    duration: "00:28",
    lengthBeats: 8,
    seed: 5.9,
  },
];

export const categoryCounts = {
  project: "04",
  sample: "12",
  experiment: "06",
} as const;

export const trackDefinitions: TrackDefinition[] = [
  { id: "atmosphere", name: "Atmosphere", role: "Vocals", color: "#9b87e8" },
  { id: "rhythm", name: "Rhythm", role: "Drums", color: "#e2b34d" },
  { id: "texture", name: "Texture", role: "Vocals", color: "#7dcea0" },
  { id: "master", name: "Master", role: "Main out", color: "#5aa9e6" },
];

export const seedClips = [
  { id: "seed-atmosphere", projectId: "glasshouse", trackId: "atmosphere", startBeat: 4 },
  { id: "seed-rhythm", projectId: "afterimage", trackId: "rhythm", startBeat: 22 },
];

export function projectById(id: string) {
  return musicProjects.find((project) => project.id === id);
}

export function formatBeat(beat: number) {
  const whole = Math.max(0, Math.floor(beat));
  const bar = Math.floor(whole / beatsPerBar) + 1;
  const step = (whole % beatsPerBar) + 1;
  return `${String(bar).padStart(2, "0")}.${step}`;
}

export function clampClipStart(startBeat: number, lengthBeats: number) {
  return Math.max(0, Math.min(totalBeats - lengthBeats, Math.round(startBeat)));
}
