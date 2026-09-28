import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { LimboPage } from "../limbo/LimboPage";

const IMAGE = { w: 1280, h: 720 };
/** Inner glass of the widescreen monitor. Measured on public/studio.png. */
const SCREEN = { x: 493 / 1280, y: 296 / 720, w: 292 / 1280, h: 156 / 720 };

type ArrivalState = { entered?: boolean };

export function ArrivalPage() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const entered = Boolean((location.state as ArrivalState | null)?.entered);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const scene = sceneRef.current;
    const plate = plateRef.current;
    const reveal = revealRef.current;
    const hint = hintRef.current;
    if (!scrollEl || !scene || !plate || !reveal || !hint) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (entered || reduce) {
      const max = scrollEl.offsetHeight - window.innerHeight;
      window.scrollTo(0, Math.max(0, max));
    }

    const apply = () => {
      const max = scrollEl.offsetHeight - window.innerHeight;
      const raw = reduce ? 1 : max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max));
      const u = raw * raw * (3 - 2 * raw);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cover = Math.max(vw / IMAGE.w, vh / IMAGE.h);
      const rw = IMAGE.w * cover;
      const rh = IMAGE.h * cover;
      const ox = (vw - rw) / 2;
      const oy = (vh - rh) / 2;
      const gx = ox + SCREEN.x * rw;
      const gy = oy + SCREEN.y * rh;
      const gw = SCREEN.w * rw;
      const gh = SCREEN.h * rh;
      // A window with the viewport's aspect, centered in the glass, so the
      // bezel leaves on all four sides together instead of top and bottom first.
      const viewAspect = vw / Math.max(1, vh);
      const glassAspect = gw / Math.max(1, gh);
      let fx = gx;
      let fy = gy;
      let fw = gw;
      let fh = gh;
      if (glassAspect > viewAspect) {
        fh = gh;
        fw = gh * viewAspect;
        fx = gx + (gw - fw) / 2;
      } else {
        fw = gw;
        fh = gw / viewAspect;
        fy = gy + (gh - fh) / 2;
      }
      const scx = fx + fw / 2;
      const scy = fy + fh / 2;
      const zoom = vw / Math.max(1, fw);
      const z = 1 + (zoom - 1) * u;
      const tx = (vw / 2 - scx) * u;
      const ty = (vh / 2 - scy) * u;
      const left = scx + (fx - scx) * z + tx;
      const top = scy + (fy - scy) * z + ty;
      const width = fw * z;
      const scale = width / Math.max(1, vw);

      scene.style.transformOrigin = `${scx}px ${scy}px`;
      scene.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;

      plate.style.left = `${ox}px`;
      plate.style.top = `${oy}px`;
      plate.style.width = `${rw}px`;
      plate.style.height = `${rh}px`;

      reveal.style.left = "0px";
      reveal.style.top = "0px";
      reveal.style.right = "auto";
      reveal.style.bottom = "auto";
      reveal.style.width = `${vw}px`;
      reveal.style.height = `${vh}px`;
      reveal.style.transformOrigin = "0 0";
      reveal.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${scale})`;
      reveal.style.opacity = "1";
      reveal.style.pointerEvents = scale > 0.92 ? "auto" : "none";
      hint.style.opacity = String(Math.max(0, 1 - u * 2.4));
    };

    apply();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entered]);

  return (
    <div ref={scrollRef} className="relative bg-black" style={{ height: "320vh" }}>
      <div className="sticky top-0 h-dvh overflow-hidden bg-black">
        <div ref={sceneRef} className="absolute inset-0 will-change-transform">
          <div ref={plateRef} className="absolute">
            <img src="/studio.png" alt="A dark retro studio, Limbo glowing on the computer" className="h-full w-full select-none" draggable={false} />
            <div className="studio-window pointer-events-none absolute left-0 top-[6%] h-[58%] w-[20%] bg-[radial-gradient(circle_at_30%_40%,rgba(255,228,180,0.55),transparent_70%)] mix-blend-screen" />
            <div className="studio-beam pointer-events-none absolute left-0 top-0 h-[40%] w-full mix-blend-screen blur-[10px] [mask-image:linear-gradient(90deg,#000_0%,#000_32%,transparent_80%)]">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,244,214,0.08)_18%,rgba(255,236,196,0.72)_48%,rgba(255,196,120,0.2)_68%,transparent_100%)]" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.28)_0_2px,transparent_2px_18px)] opacity-50" />
            </div>
            <div className="studio-beam studio-beam-b pointer-events-none absolute left-[4%] top-0 h-[26%] w-[70%] bg-[linear-gradient(to_bottom,transparent,rgba(255,250,240,0.5)_46%,rgba(180,190,255,0.16)_62%,transparent)] mix-blend-screen blur-md [mask-image:linear-gradient(90deg,#000_0%,transparent_75%)]" />
            <div
              className="absolute bg-[#07060d]"
              style={{
                left: `${SCREEN.x * 100}%`,
                top: `${SCREEN.y * 100}%`,
                width: `${SCREEN.w * 100}%`,
                height: `${SCREEN.h * 100}%`,
              }}
            />
          </div>
        </div>
        <div ref={revealRef} className="absolute left-0 top-0 overflow-hidden bg-[#07060d] opacity-0">
          <LimboPage />
        </div>
        <p
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-white/75"
        >
          Scroll
          <span className="scroll-cue block h-6 w-px bg-white/70" />
        </p>
      </div>
    </div>
  );
}
