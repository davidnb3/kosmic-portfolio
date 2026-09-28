# Kosmic Portfolio

David Pieri’s portfolio, based in Luxembourg. The site is three worlds in one session: a dark threshold, a light music studio, and a dark code editor.

## What it is

The first view is a still of a retro studio. Scrolling zooms into the monitor until the glass fills the browser. The page on that glass is the live Limbo view, not a picture of it, so the zoom lands on the same layout the visitor then uses.

**Limbo** (`/`) is the threshold. A rotating particle orb sits behind the title. The pointer moves it across the page. Passing through it disturbs the shell. Moving toward a side gradually compresses it, until it becomes a tight orbit on **Enter sound** or **Enter code**. The orb sheds stray particles and takes them back only when it passes very close. Once a stray rejoins, it moves and shades with the rest of the shell.

**Music** (`/music`) is a light, Ableton-style arrangement view. It is visual only: there is no audio engine. Clips, track controls, and the playhead persist while you stay on the site.

**Software** (`/software`) is a dark editor. Project files live under `src/projects` and open as tabs. The arrangement and the open tabs are kept above the router, so leaving a world and coming back does not reset that session.

Limbo and the editor stay dark. The DAW stays light. There is no theme toggle in the page chrome.

Leaving Music or Software returns to Limbo already zoomed into the monitor.

## Local setup

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL Vite prints. Scroll the studio until the monitor fills the window, then choose a world.

```bash
npm run build    # typecheck and production build
npm run preview  # serve the build
npm run lint
```

## Stack

Vite, React 19, TypeScript, Tailwind CSS, React Router, Framer Motion, GSAP, and React Three Fiber.
