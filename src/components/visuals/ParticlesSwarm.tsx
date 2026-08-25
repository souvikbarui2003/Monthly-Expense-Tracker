import { useEffect, useRef, useCallback } from "react";

interface ParticlesSwarmProps {
  particleCount?: number;
  speed?: number;
  interactive?: boolean;
  className?: string;
}

function getAdaptiveCount(requested: number): number {
  if (typeof window === "undefined") return Math.min(requested, 6000);
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  if (width < 640 || dpr > 2) return Math.min(requested, 4000);
  if (width < 1024 || dpr > 1.5) return Math.min(requested, 10000);
  return requested;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function ParticlesSwarm({
  particleCount = 20000,
  speed = 1,
  interactive = false,
  className = "",
}: ParticlesSwarmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    scene: any;
    camera: any;
    renderer: any;
    composer: any;
    mesh: any;
    geometry: any;
    material: any;
    dummy: any;
    color: any;
    target: any;
    pColor: any;
    positions: any[];
    clock: any;
    animId: number;
    disposed: boolean;
    reducedMotion: boolean;
  } | null>(null);

  const init = useCallback(async () => {
    const container = containerRef.current;
    if (!container || stateRef.current) return;

    // Check WebGL support
    if (!hasWebGL()) return;

    const reducedMotion = prefersReducedMotion();
    const count = reducedMotion ? Math.min(getAdaptiveCount(particleCount), 2000) : getAdaptiveCount(particleCount);

    try {
      const THREE = await import("three");
      const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");

      const rect = container.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 400;

      // Scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.01);

      // Camera
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
      camera.position.set(0, 0, 100);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // Post processing
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
      bloomPass.strength = reducedMotion ? 0.8 : 1.8;
      bloomPass.radius = 0.4;
      bloomPass.threshold = 0;
      composer.addPass(bloomPass);

      // Instanced mesh
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      const target = new THREE.Vector3();
      const pColor = new THREE.Color();

      const geometry = new THREE.TetrahedronGeometry(0.25);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);

      // Initialize positions
      const positions: any[] = [];
      for (let i = 0; i < count; i++) {
        positions.push(new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ));
        mesh.setColorAt(i, color.setHex(0x00ff88));
      }

      const clock = new THREE.Clock();

      // Animation state
      const s = stateRef.current = {
        scene, camera, renderer, composer, mesh, geometry, material,
        dummy, color, target, pColor, positions, clock,
        animId: 0, disposed: false as boolean, reducedMotion,
      };

      // Animation loop
      const PARAMS = { scale: 80, field: 5, speed, flare: 30, hue: 0.6, sat: 0 };

      const animate = () => {
        if (s.disposed) return;
        s.animId = requestAnimationFrame(animate);

        const time = s.clock.getElapsedTime() * PARAMS.speed;

        for (let i = 0; i < count; i++) {
          const n = i / count;
          const t = time * 1.5;
          const group = n * 3.0;

          let px: number, py: number, pz: number;
          let lit: number;

          if (group < 1.0) {
            // Surface boil
            const phi = Math.acos(1 - 2 * n);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const surfaceBoil = Math.sin(phi * 10 + t * 2) * Math.cos(theta * 10 + t * 2.5) * (PARAMS.scale * 0.05);
            const r = PARAMS.scale + surfaceBoil;
            px = r * Math.sin(phi) * Math.cos(theta);
            py = r * Math.sin(phi) * Math.sin(theta);
            pz = r * Math.cos(phi);
            lit = 0.6 + (surfaceBoil > 0 ? 0.3 : 0.0);
          } else if (group < 2.0) {
            // Magnetic field lines
            const localN = group - 1.0;
            const numLines = 50;
            const lineId = Math.floor(localN * numLines);
            const posOnLine = (localN * numLines) - lineId;
            const flowPos = (posOnLine + t * 0.2) % 1.0;
            const lineAngle = (lineId / numLines) * Math.PI * 2.0;
            const polarAngle = 0.1 + flowPos * (Math.PI - 0.2);
            const shellLevel = (lineId % 5) / 5;
            const L = PARAMS.scale * 1.2 + shellLevel * PARAMS.scale * PARAMS.field;
            const r = L * Math.pow(Math.sin(polarAngle), 2);
            const finalR = Math.max(r, PARAMS.scale * 1.01);
            px = finalR * Math.sin(polarAngle) * Math.cos(lineAngle);
            pz = finalR * Math.sin(polarAngle) * Math.sin(lineAngle);
            py = finalR * Math.cos(polarAngle);
            lit = 0.8 * (1.0 - (finalR / (PARAMS.scale * PARAMS.field * 1.5)));
          } else {
            // Solar flares
            const localN = group - 2.0;
            const numFlares = 30;
            const flareId = Math.floor(localN * numFlares);
            const posOnFlare = (localN * numFlares) - flareId;
            const flowPos = (posOnFlare + t * 0.5) % 1.0;
            const angleOffset = (flareId / numFlares) * Math.PI * 2.0;
            const basePhi = (flareId % 3 === 0) ? 0.1 : (flareId % 3 === 1) ? Math.PI - 0.1 : Math.PI / 2;
            const spread = (flareId % 5) / 5 * 0.5;
            const polarAngle = basePhi + spread * Math.sin(flareId * 13.37);
            const r = PARAMS.scale + flowPos * PARAMS.scale * PARAMS.flare;
            const wiggleAmount = flowPos * PARAMS.scale * 0.2;
            const wiggleX = Math.sin(flowPos * 10 + t * 5 + flareId) * wiggleAmount;
            const wiggleZ = Math.cos(flowPos * 10 + t * 5 + flareId) * wiggleAmount;
            px = r * Math.sin(polarAngle) * Math.cos(angleOffset) + wiggleX;
            pz = r * Math.sin(polarAngle) * Math.sin(angleOffset) + wiggleZ;
            py = r * Math.cos(polarAngle);
            lit = (1.0 - flowPos) * (1.0 - flowPos);
          }

          // Rotate
          const rotY = time * 0.1;
          const cy = Math.cos(rotY), sy = Math.sin(rotY);
          const finalX = px * cy + pz * sy;
          const finalZ = -px * sy + pz * cy;

          target.set(finalX, py, finalZ);
          pColor.setHSL(PARAMS.hue % 1.0, Math.min(1.0, Math.max(0, PARAMS.sat)), Math.min(1.0, Math.max(0.01, lit)));

          positions[i].lerp(target, 0.1);
          s.dummy.position.copy(positions[i]);
          s.dummy.updateMatrix();
          s.mesh.setMatrixAt(i, s.dummy.matrix);
          s.mesh.setColorAt(i, s.pColor);
        }
        s.mesh.instanceMatrix.needsUpdate = true;
        if (s.mesh.instanceColor) s.mesh.instanceColor.needsUpdate = true;

        s.composer.render();
      };

      animate();

      // Resize handler
      const onResize = () => {
        if (s.disposed) return;
        const rect = container.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w === 0 || h === 0) return;
        s.camera.aspect = w / h;
        s.camera.updateProjectionMatrix();
        s.renderer.setSize(w, h);
        s.composer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);
      (s as any).resizeObserver = resizeObserver;

      // Reduced motion listener
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onMotionChange = (e: MediaQueryListEvent) => {
        if (e.matches && s.animId) {
          cancelAnimationFrame(s.animId);
          s.disposed = true as boolean;
          onDispose();
        }
      };
      mq.addEventListener("change", onMotionChange);

    } catch (err) {
      console.warn("ParticlesSwarm: WebGL initialization failed", err);
    }
  }, [particleCount, speed, interactive]);

  const onDispose = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    s.disposed = true;
    if (s.animId) cancelAnimationFrame(s.animId);
    if ((s as any).resizeObserver) (s as any).resizeObserver.disconnect();
    s.geometry?.dispose();
    s.material?.dispose();
    s.mesh && s.scene?.remove(s.mesh);
    s.composer?.dispose();
    s.renderer?.dispose();
    s.renderer?.domElement?.remove();
    stateRef.current = null;
  }, []);

  useEffect(() => {
    init();
    return onDispose;
  }, [init, onDispose]);

  // Check for reduced motion
  const reduced = prefersReducedMotion();

  if (reduced || !hasWebGL()) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    />
  );
}
