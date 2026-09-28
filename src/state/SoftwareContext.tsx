import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type EditorTab = {
  id: string;
  closable: boolean;
};

type SoftwareContextValue = {
  tabs: EditorTab[];
  activeId: string;
  openFile: (fileId: string) => void;
  focusTab: (id: string) => void;
  closeTab: (id: string) => void;
};

const SoftwareContext = createContext<SoftwareContextValue | null>(null);

const initialTabs: EditorTab[] = [{ id: "readme", closable: true }];

export function SoftwareProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<EditorTab[]>(initialTabs);
  const [activeId, setActiveId] = useState("readme");

  const openFile = useCallback((fileId: string) => {
    setTabs((current) => (current.some((tab) => tab.id === fileId) ? current : [...current, { id: fileId, closable: true }]));
    setActiveId(fileId);
  }, []);

  const focusTab = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      const index = tabs.findIndex((tab) => tab.id === id);
      if (index < 0) return;
      const next = tabs.filter((tab) => tab.id !== id);
      setTabs(next);
      setActiveId((active) => {
        if (active !== id) return active;
        return next[Math.max(0, index - 1)]?.id ?? "";
      });
    },
    [tabs],
  );

  const value = useMemo(
    () => ({ tabs, activeId, openFile, focusTab, closeTab }),
    [tabs, activeId, openFile, focusTab, closeTab],
  );

  return <SoftwareContext.Provider value={value}>{children}</SoftwareContext.Provider>;
}

export function useSoftware() {
  const value = useContext(SoftwareContext);
  if (!value) throw new Error("useSoftware must be used within SoftwareProvider");
  return value;
}
