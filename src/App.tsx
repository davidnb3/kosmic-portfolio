import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "./config/site";
import { DawProvider } from "./state/DawContext";
import { SoftwareProvider } from "./state/SoftwareContext";
import { ArrivalPage } from "./worlds/arrival/ArrivalPage";
import { MusicPage } from "./worlds/music/MusicPage";
import { SoftwarePage } from "./worlds/software/SoftwarePage";

const ease = [0.22, 1, 0.36, 1] as const;

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    const entered = Boolean((location.state as { entered?: boolean } | null)?.entered);
    if (location.pathname === "/" && entered) return;
    window.scrollTo(0, 0);
  }, [location]);

  if (location.pathname === "/") {
    return <ArrivalPage />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <Routes location={location}>
          <Route path="/music" element={<MusicPage />} />
          <Route path="/software" element={<SoftwarePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    document.title = `${site.mark}`;
  }, []);

  return (
    <DawProvider>
      <SoftwareProvider>
        <AnimatedRoutes />
      </SoftwareProvider>
    </DawProvider>
  );
}
