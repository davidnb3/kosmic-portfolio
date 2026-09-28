import { useRef, type DragEvent, type RefObject } from "react";
import { barCount, laneHeight, projectById, totalBeats } from "../../config/music";
import { Waveform } from "../../components/Waveform";
import { useDaw, type ArrangementClip, type TrackState } from "../../state/DawContext";

export function Arrangement() {
  const daw = useDaw();
  const lanesRef = useRef<HTMLDivElement>(null);

  const dropProject = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const lanes = lanesRef.current;
    if (!lanes) return;
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("project:")) return;
    const rect = lanes.getBoundingClientRect();
    const startBeat = ((event.clientX - rect.left) / rect.width) * totalBeats;
    const index = Math.min(daw.tracks.length - 1, Math.max(0, Math.floor((event.clientY - rect.top) / laneHeight)));
    const trackId = daw.tracks[index]?.id;
    if (!trackId) return;
    daw.placeClip(payload.slice("project:".length), trackId, startBeat);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ecece9]">
      <div className="flex h-9 shrink-0 items-center border-b border-[#d8d8d4]">
        <div className="grid min-w-0 flex-1 pl-1" style={{ gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))` }}>
          {Array.from({ length: barCount }, (_, index) => (
            <span key={index} className="text-[10px] text-[#9a9a96]">
              {index + 1}
            </span>
          ))}
        </div>
        <div className="flex w-[248px] shrink-0 items-center justify-end gap-3 border-l border-[#d8d8d4] px-3">
          <button
            type="button"
            onClick={daw.removeSelectedClip}
            className="text-[10px] uppercase tracking-[0.16em] text-[#8a8a86] hover:text-[#1c1c1c]"
          >
            Remove clip
          </button>
          <button
            type="button"
            onClick={daw.addTrack}
            className="text-[10px] uppercase tracking-[0.16em] text-[#6f6f6b] hover:text-[#1c1c1c]"
          >
            + Add track
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 overflow-auto">
          <div
            ref={lanesRef}
            role="region"
            aria-label="Arrangement"
            className="relative min-h-full min-w-[760px]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(80,80,70,0.14) 1px, transparent 1px), linear-gradient(to right, rgba(80,80,70,0.05) 1px, transparent 1px)",
              backgroundSize: `${100 / barCount}% 100%, ${100 / totalBeats}% 100%`,
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={dropProject}
          >
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#e85d4c]"
              style={{ left: `${(daw.playheadBeat / totalBeats) * 100}%` }}
            />
            {daw.tracks.map((track) => (
              <Lane key={track.id} track={track} />
            ))}
            {daw.clips.map((clip) => (
              <ClipBlock
                key={clip.id}
                clip={clip}
                lanesRef={lanesRef}
                trackIndex={daw.tracks.findIndex((track) => track.id === clip.trackId)}
              />
            ))}
          </div>
        </div>
        <div className="w-[248px] shrink-0 border-l border-[#d8d8d4] bg-[#f3f3f0]">
          {daw.tracks.map((track, index) => (
            <TrackHeader key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackHeader({ track, index }: { track: TrackState; index: number }) {
  const { selectedTrackId, anySolo, selectTrack, toggleMute, toggleSolo, setPan, setVolume } = useDaw();
  const selected = selectedTrackId === track.id;
  const dimmed = anySolo && !track.solo;

  return (
    <div
      className={`flex gap-2 border-b border-[#e4e4e0] px-2 ${selected ? "bg-white" : ""} ${dimmed ? "opacity-45" : ""}`}
      style={{ height: laneHeight }}
    >
      <span className="mt-2 h-10 w-1 rounded-full" style={{ background: track.color }} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => selectTrack(track.id)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[11px] text-[#1c1c1c]">
              <span className="mr-1 font-mono text-[10px] text-[#a3a39e]">{String(index + 1).padStart(2, "0")}</span>
              {track.name}
            </span>
            <span className="block text-[10px] text-[#8a8a86]">{track.role}</span>
          </button>
          <RoundToggle label={`Mute ${track.name}`} pressed={track.mute} onClick={() => toggleMute(track.id)}>
            M
          </RoundToggle>
          <RoundToggle label={`Solo ${track.name}`} pressed={track.solo} solo onClick={() => toggleSolo(track.id)}>
            S
          </RoundToggle>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <MiniSlider label={`Volume ${track.name}`} caption="Vol" min={0} max={100} value={Math.round(track.volume * 100)} onChange={(value) => setVolume(track.id, value / 100)} />
          <MiniSlider label={`Pan ${track.name}`} caption="Pan" min={-100} max={100} value={Math.round(track.pan * 100)} onChange={(value) => setPan(track.id, value / 100)} />
        </div>
      </div>
    </div>
  );
}

function RoundToggle({
  label,
  pressed,
  solo,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  solo?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid h-5 w-5 place-items-center rounded-full border text-[9px] ${
        pressed
          ? solo
            ? "border-[#e2b34d] bg-[#e2b34d] text-[#2a2112]"
            : "border-[#1c1c1c] bg-[#1c1c1c] text-white"
          : "border-[#d0d0cc] text-[#8a8a86]"
      }`}
    >
      {children}
    </button>
  );
}

function MiniSlider({
  label,
  caption,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  caption: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-[#9a9a96]">
      {caption}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-1"
      />
    </label>
  );
}

function Lane({ track }: { track: TrackState }) {
  const { anySolo, selectTrack } = useDaw();
  const dimmed = (anySolo && !track.solo) || track.mute;
  return (
    <div
      className={`border-b border-[#e1e1dd] ${dimmed ? "opacity-40" : ""}`}
      style={{ height: laneHeight }}
      onClick={() => selectTrack(track.id)}
    />
  );
}

function ClipBlock({
  clip,
  lanesRef,
  trackIndex,
}: {
  clip: ArrangementClip;
  lanesRef: RefObject<HTMLDivElement | null>;
  trackIndex: number;
}) {
  const { tracks, selectedClipId, selectClip, moveClip, removeClip } = useDaw();
  const project = projectById(clip.projectId);
  const dragRef = useRef<{ originX: number; originBeat: number; width: number } | null>(null);
  if (!project || trackIndex < 0) return null;
  const width = (project.lengthBeats / totalBeats) * 100;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={project.title}
      className={`absolute z-10 cursor-grab overflow-hidden rounded-[3px] active:cursor-grabbing ${
        selectedClipId === clip.id ? "ring-1 ring-[#1c1c1c]" : ""
      }`}
      style={{
        top: trackIndex * laneHeight + 14,
        left: `${(clip.startBeat / totalBeats) * 100}%`,
        width: `${width}%`,
        height: laneHeight - 28,
        background: project.color,
      }}
      onPointerDown={(event) => {
        const lanes = lanesRef.current;
        if (!lanes) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { originX: event.clientX, originBeat: clip.startBeat, width: lanes.getBoundingClientRect().width };
        selectClip(clip.id, clip.trackId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        const lanes = lanesRef.current;
        if (!drag || !lanes) return;
        const rect = lanes.getBoundingClientRect();
        const index = Math.min(tracks.length - 1, Math.max(0, Math.floor((event.clientY - rect.top) / laneHeight)));
        const trackId = tracks[index]?.id ?? clip.trackId;
        const deltaBeats = ((event.clientX - drag.originX) / drag.width) * totalBeats;
        moveClip(clip.id, trackId, drag.originBeat + deltaBeats);
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          event.stopPropagation();
          removeClip(clip.id);
        }
      }}
    >
      <Waveform seed={project.seed} className="h-full w-full text-[#1c1c1c]/75" />
    </div>
  );
}
