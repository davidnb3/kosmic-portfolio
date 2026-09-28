import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clampClipStart,
  musicProjects,
  projectById,
  seedClips,
  tempo,
  totalBeats,
  trackDefinitions,
} from "../config/music";

export type TrackState = {
  id: string;
  name: string;
  role: string;
  color: string;
  mute: boolean;
  solo: boolean;
  volume: number;
  pan: number;
};

export type ArrangementClip = {
  id: string;
  projectId: string;
  trackId: string;
  startBeat: number;
};

export type BottomPanel = "clip" | "devices";
export type DeviceParam = "size" | "decay" | "damp" | "mix";

type Devices = Record<DeviceParam, number>;

type DawContextValue = {
  tracks: TrackState[];
  clips: ArrangementClip[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
  playing: boolean;
  playheadBeat: number;
  panel: BottomPanel;
  anySolo: boolean;
  devices: Devices;
  selectTrack: (trackId: string) => void;
  selectClip: (clipId: string, trackId: string) => void;
  placeClip: (projectId: string, trackId: string, startBeat: number) => void;
  moveClip: (clipId: string, trackId: string, startBeat: number) => void;
  removeSelectedClip: () => void;
  removeClip: (clipId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  setPan: (trackId: string, pan: number) => void;
  setDevice: (key: DeviceParam, value: number) => void;
  addTrack: () => void;
  togglePlay: () => void;
  stop: () => void;
  seekStart: () => void;
  togglePanel: () => void;
};

const DawContext = createContext<DawContextValue | null>(null);

function createTracks(): TrackState[] {
  return trackDefinitions.map((track) => ({
    id: track.id,
    name: track.name,
    role: track.role,
    color: track.color,
    mute: false,
    solo: false,
    volume: 0.72,
    pan: 0,
  }));
}

const trackColors = ["#c4b4a4", "#8fb7d6", "#d6a0b4", "#b7c48a", "#d2c46a"];

export function DawProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<TrackState[]>(createTracks);
  const [clips, setClips] = useState<ArrangementClip[]>(seedClips);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(trackDefinitions[0]?.id ?? null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [panel, setPanel] = useState<BottomPanel>("devices");
  const [devices, setDevices] = useState<Devices>({ size: 0.42, decay: 0.58, damp: 0.36, mix: 0.64 });
  const [clock, setClock] = useState(0);
  const playheadRef = useRef(0);
  const extraTracks = useRef(0);

  useEffect(() => {
    playheadRef.current = playheadBeat;
  }, [playheadBeat]);

  useEffect(() => {
    if (!playing) return;
    const origin = playheadRef.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsedBeats = ((now - started) / 1000) * (tempo / 60);
      const next = (origin + elapsedBeats) % totalBeats;
      playheadRef.current = next;
      setPlayheadBeat(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, clock]);

  const selectTrack = useCallback((trackId: string) => {
    setSelectedTrackId(trackId);
    setSelectedClipId(null);
  }, []);

  const selectClip = useCallback((clipId: string, trackId: string) => {
    setSelectedClipId(clipId);
    setSelectedTrackId(trackId);
  }, []);

  const placeClip = useCallback((projectId: string, trackId: string, startBeat: number) => {
    const project = projectById(projectId);
    if (!project) return;
    const id = crypto.randomUUID();
    setClips((current) => [
      ...current,
      { id, projectId, trackId, startBeat: clampClipStart(startBeat, project.lengthBeats) },
    ]);
    setSelectedClipId(id);
    setSelectedTrackId(trackId);
  }, []);

  const moveClip = useCallback((clipId: string, trackId: string, startBeat: number) => {
    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== clipId) return clip;
        const project = projectById(clip.projectId);
        const lengthBeats = project?.lengthBeats ?? 4;
        return { ...clip, trackId, startBeat: clampClipStart(startBeat, lengthBeats) };
      }),
    );
    setSelectedClipId(clipId);
    setSelectedTrackId(trackId);
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setClips((clipsNow) => clipsNow.filter((clip) => clip.id !== clipId));
    setSelectedClipId((current) => (current === clipId ? null : current));
  }, []);

  const removeSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    removeClip(selectedClipId);
  }, [removeClip, selectedClipId]);

  const toggleMute = useCallback((trackId: string) => {
    setTracks((current) => current.map((track) => (track.id === trackId ? { ...track, mute: !track.mute } : track)));
    setSelectedTrackId(trackId);
  }, []);

  const toggleSolo = useCallback((trackId: string) => {
    setTracks((current) => current.map((track) => (track.id === trackId ? { ...track, solo: !track.solo } : track)));
    setSelectedTrackId(trackId);
  }, []);

  const setVolume = useCallback((trackId: string, volume: number) => {
    setTracks((current) => current.map((track) => (track.id === trackId ? { ...track, volume } : track)));
  }, []);

  const setPan = useCallback((trackId: string, pan: number) => {
    setTracks((current) => current.map((track) => (track.id === trackId ? { ...track, pan } : track)));
  }, []);

  const setDevice = useCallback((key: DeviceParam, value: number) => {
    setDevices((current) => ({ ...current, [key]: value }));
  }, []);

  const addTrack = useCallback(() => {
    extraTracks.current += 1;
    const index = extraTracks.current;
    const id = `audio-${index}`;
    setTracks((current) => [
      ...current,
      {
        id,
        name: `Audio ${current.length + 1}`,
        role: "Audio",
        color: trackColors[(current.length + index) % trackColors.length] ?? "#c4b4a4",
        mute: false,
        solo: false,
        volume: 0.72,
        pan: 0,
      },
    ]);
    setSelectedTrackId(id);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((current) => !current);
  }, []);

  const seekStart = useCallback(() => {
    playheadRef.current = 0;
    setPlayheadBeat(0);
    setClock((current) => current + 1);
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    playheadRef.current = 0;
    setPlayheadBeat(0);
  }, []);

  const togglePanel = useCallback(() => {
    setPanel((current) => (current === "clip" ? "devices" : "clip"));
  }, []);

  const anySolo = tracks.some((track) => track.solo);

  const value = useMemo(
    () => ({
      tracks,
      clips,
      selectedTrackId,
      selectedClipId,
      playing,
      playheadBeat,
      panel,
      anySolo,
      devices,
      selectTrack,
      selectClip,
      placeClip,
      moveClip,
      removeClip,
      removeSelectedClip,
      toggleMute,
      toggleSolo,
      setVolume,
      setPan,
      setDevice,
      addTrack,
      togglePlay,
      stop,
      seekStart,
      togglePanel,
    }),
    [
      tracks,
      clips,
      selectedTrackId,
      selectedClipId,
      playing,
      playheadBeat,
      panel,
      anySolo,
      devices,
      selectTrack,
      selectClip,
      placeClip,
      moveClip,
      removeClip,
      removeSelectedClip,
      toggleMute,
      toggleSolo,
      setVolume,
      setPan,
      setDevice,
      addTrack,
      togglePlay,
      stop,
      seekStart,
      togglePanel,
    ],
  );

  return <DawContext.Provider value={value}>{children}</DawContext.Provider>;
}

export function useDaw() {
  const value = useContext(DawContext);
  if (!value) throw new Error("useDaw must be used within DawProvider");
  return value;
}

export function libraryProject(id: string) {
  return musicProjects.find((project) => project.id === id);
}
