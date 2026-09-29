import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { BrandMark } from "../../components/BrandMark";
import { site } from "../../config/site";
import { LimboScene, type LimboPointer, type LimboStage } from "./LimboScene";

const codeBits = [
  { label: "01011  FUNCTION", top: "16%", right: "3%" },
  { label: "L::INIT", top: "20%", right: "3%" },
  { label: "10110  BUILD", top: "24%", right: "3%" },
  { label: "SYS / WEB / 02", top: "28%", right: "3%" },
];

export function LimboPage() {
  const rootRef = useRef<HTMLElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const blendRef = useRef(0.5);
  const pointerRef = useRef<LimboPointer>({ x: 0, y: 0, active: false });
  const stageRef = useRef<LimboStage>({ depart: false });

  const slideChrome = (xPercent: number) => {
    const chrome = chromeRef.current;
    if (!chrome) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(chrome);
    if (reduce) gsap.set(chrome, { xPercent });
    else gsap.to(chrome, { xPercent, duration: 1.35, ease: "power3.inOut" });
  };

  const enterMusic = () => {
    if (stageRef.current.depart) return;
    stageRef.current.depart = true;
    slideChrome(110);
  };

  const exitMusic = () => {
    if (!stageRef.current.depart) return;
    stageRef.current.depart = false;
    slideChrome(0);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const tick = () => {
      const current = blendRef.current;
      const target = Number(root.dataset.target ?? "0.5");
      const next = reduce ? target : current + (target - current) * 0.08;
      blendRef.current = next;
      root.style.setProperty("--blend", next.toFixed(4));
      const side = next < 0.42 ? "music" : next > 0.58 ? "software" : "center";
      if (root.dataset.side !== side) root.dataset.side = side;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const context = gsap.context(() => {
      if (reduce) return;
      gsap.fromTo(".limbo-rise", { y: 16 }, { y: 0, duration: 1.05, ease: "power3.out", stagger: 0.06 });
      gsap.fromTo(
        ".limbo-fade",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 1.05, ease: "power3.out", stagger: 0.08 },
      );
    }, root);

    return () => {
      cancelAnimationFrame(frame);
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let acc = 0;
    let idle = 0;
    const onWheel = (event: WheelEvent) => {
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      // A sideways trackpad swipe is also the browser's back/forward gesture.
      event.preventDefault();
      const reveal = root.parentElement;
      if (reveal && getComputedStyle(reveal).pointerEvents === "none") return;
      acc += dx;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        acc = 0;
      }, 240);
      if (stageRef.current.depart) {
        if (acc > 90) {
          acc = 0;
          exitMusic();
        }
        return;
      }
      if (acc < -90) {
        acc = 0;
        enterMusic();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.target = String(event.clientX / window.innerWidth);
    pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerRef.current.y = 1 - (event.clientY / window.innerHeight) * 2;
    pointerRef.current.active = true;
  };

  return (
    <section
      ref={rootRef}
      data-side="center"
      data-target="0.5"
      onPointerMove={onPointerMove}
      className="limbo-root relative h-dvh overflow-hidden bg-[#07060d] text-[#f4f1ff]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(64, 110, 78, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(64, 110, 78, 0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-[58%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,50,190,0.42),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_36%,rgba(0,0,0,0.55)_78%)]" />
      <div className="limbo-rings pointer-events-none absolute inset-0">
        <div className="absolute left-[28%] top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(92,48,160,0.45),rgba(18,10,40,0.2)_42%,transparent_68%)]" />
        {[320, 480, 680, 920].map((size, index) => (
          <div
            key={size}
            className="absolute left-[30%] top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: size, height: size }}
          >
            <div
              className="spin-slow h-full w-full rounded-full border border-dashed border-white/15"
              style={{ animationDuration: `${36 + index * 8}s` }}
            />
          </div>
        ))}
      </div>
      <div className="limbo-grid pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_70%_45%,rgba(90,140,40,0.22),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(120, 190, 110, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 190, 110, 0.2) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        {codeBits.map((bit) => (
          <span
            key={bit.label}
            className="absolute font-mono text-[10px] tracking-[0.22em] text-[#9dbe62]/70"
            style={{ top: bit.top, right: bit.right }}
          >
            {bit.label}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0">
        <Canvas
          resize={{ offsetSize: true }}
          camera={{ position: [0, 0.15, 7.2], fov: 28 }}
          dpr={[1, 1.6]}
          gl={{ alpha: true, antialias: true }}
        >
          <LimboScene blendRef={blendRef} pointerRef={pointerRef} stageRef={stageRef} />
        </Canvas>
      </div>

      <div ref={chromeRef} className="relative z-10 flex h-full flex-col">
        <header className="limbo-fade flex items-center justify-between px-6 py-4 sm:px-8">
          <BrandMark />
          <p className="hidden text-center text-[10px] leading-4 tracking-[0.16em] text-white/55 sm:block">
            {site.role}
            <br />
            {site.location}
          </p>
          <p className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-white/70">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#c6f54a]" />
            {site.availability}
          </p>
        </header>

        <div className="relative grid min-h-0 flex-1 grid-cols-1 items-center gap-8 px-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.9fr)_minmax(0,1fr)] md:px-12">
          <Portal
            side="music"
            index="World / 01"
            title={site.musicTitle}
            lede={site.musicLede}
            action="Enter sound"
            align="left"
            onEnter={enterMusic}
          />
          <div className="limbo-fade pointer-events-none" />
          <Portal
            side="software"
            index="World / 02"
            title={site.softwareTitle}
            lede={site.softwareLede}
            action="Enter code"
            align="right"
            onEnter={() => {}}
          />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
            <p className="limbo-fade text-[10px] uppercase tracking-[0.42em] text-white/50">{site.limboKicker}</p>
            <h1 className="limbo-fade mx-auto mt-3 max-w-[14ch] font-display text-[clamp(3rem,8vw,7rem)] font-medium uppercase leading-[0.9] tracking-[0.06em] text-transparent [-webkit-text-stroke:3px_rgba(255,255,255,0.92)]">
              {site.limboTitle}
            </h1>
            <p className="limbo-fade mx-auto mt-8 max-w-[16rem] text-xs leading-relaxed text-white/70">{site.limboLede}</p>
          </div>
        </div>

        <footer className="limbo-fade flex items-center justify-center gap-4 py-4 text-[10px] uppercase tracking-[0.28em] text-white/45">
          <span>Move your cursor</span>
          <span className="limbo-orb relative h-4 w-7 rounded-full border border-white/30">
            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/80" />
          </span>
          <span>Choose a world</span>
        </footer>
      </div>
    </section>
  );
}

function Portal({
  side,
  index,
  title,
  lede,
  action,
  align,
  onEnter,
}: {
  side: "music" | "software";
  index: string;
  title: string;
  lede: string;
  action: string;
  align: "left" | "right";
  onEnter: () => void;
}) {
  return (
    <div
      className={`portal portal-${side} limbo-rise flex flex-col ${
        align === "right" ? "items-end text-right md:translate-y-8" : "items-start text-left md:-translate-y-8"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">{index}</p>
      <h2 className="mt-3 font-display text-3xl font-medium leading-none tracking-[0.02em] sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/55">{lede}</p>
      <button
        type="button"
        onClick={onEnter}
        className="group mt-6 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/80"
      >
        <span className="border-b border-white/30 pb-1 transition-colors group-hover:border-white">{action}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </button>
    </div>
  );
}
