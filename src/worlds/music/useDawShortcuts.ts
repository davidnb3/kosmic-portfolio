import { useEffect } from "react";
import { useDaw } from "../../state/DawContext";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useDawShortcuts() {
  const { togglePlay, toggleSolo, toggleMute, removeSelectedClip, selectedTrackId } = useDaw();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
        return;
      }
      if ((event.key === "s" || event.key === "S") && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (selectedTrackId) toggleSolo(selectedTrackId);
        return;
      }
      if ((event.key === "m" || event.key === "M") && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (selectedTrackId) toggleMute(selectedTrackId);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeSelectedClip();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeSelectedClip, selectedTrackId, toggleMute, togglePlay, toggleSolo]);
}
