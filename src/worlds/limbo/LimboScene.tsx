import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh, type MeshStandardMaterial } from "three";

const cool = new Color("#e7d9ff");
const warm = new Color("#8d78c4");
const mixed = new Color();

export function LimboScene({ blendRef }: { blendRef: RefObject<number> }) {
  const coreRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const blend = blendRef.current ?? 0.5;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coreRef.current && !reduce) {
      coreRef.current.rotation.y += delta * 0.18;
      coreRef.current.rotation.x = -0.15 + Math.sin(performance.now() / 2400) * 0.04;
    }
    if (materialRef.current) {
      mixed.copy(cool).lerp(warm, blend);
      materialRef.current.color.copy(mixed);
    }
  });

  return (
    <>
      <hemisphereLight args={["#c4b0e8", "#120818", 0.45]} />
      <directionalLight position={[-4.2, 1.4, 3.4]} intensity={4.2} color="#d7b4ff" />
      <directionalLight position={[3.4, -1.2, 1.6]} intensity={0.35} color="#2a1848" />
      <mesh ref={coreRef} position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.96, 80, 80]} />
        <meshStandardMaterial ref={materialRef} color="#cbb6ef" metalness={0.04} roughness={0.62} />
      </mesh>
      <mesh rotation={[1.15, 0.2, 0.5]} position={[0, 0.05, 0]}>
        <torusGeometry args={[1.2, 0.005, 12, 120]} />
        <meshBasicMaterial color="#e8e8e8" transparent opacity={0.4} />
      </mesh>
    </>
  );
}
