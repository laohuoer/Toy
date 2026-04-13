'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GachaSceneProps {
  isAnimating: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  onAnimationEnd?: () => void;
}

const RARITY_CAPSULE_COLOR: Record<string, number> = {
  common: 0x9ca3af,
  rare: 0x3b82f6,
  epic: 0x8b5cf6,
  legendary: 0xf59e0b,
};

type AnimPhase = 'idle' | 'shaking' | 'splitting' | 'reveal' | 'done';

export default function GachaScene({ isAnimating, rarity = 'common', onAnimationEnd }: GachaSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // All mutable animation state lives here — never re-created on prop change
  const stateRef = useRef({
    animating: false,
    phase: 'idle' as AnimPhase,
    phaseTime: 0,
    animFrame: 0,
  });

  // Hold Three.js objects so the trigger-effect can reach them
  const threeRef = useRef<{
    capsule: THREE.Group;
    topHemi: THREE.Mesh;
    botHemi: THREE.Mesh;
    cylTop: THREE.Mesh;
    cylBot: THREE.Mesh;
    particleGeo: THREE.BufferGeometry;
    particleMat: THREE.PointsMaterial;
    velocities: THREE.Vector3[];
    onEnd?: () => void;
  } | null>(null);

  // ── Build scene once (or when rarity changes capsule color) ──────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 220;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x6699ff, 2, 10);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);

    // --- Capsule ---
    const capColor = RARITY_CAPSULE_COLOR[rarity] ?? 0x9ca3af;

    const makeMat = (color: number) =>
      new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        shininess: 120,
        transparent: true,
        opacity: 0.9,
      });

    const topHemi = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      makeMat(capColor),
    );
    topHemi.position.y = 0.5;

    const botHemi = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      makeMat(0xffffff),
    );
    botHemi.position.y = -0.5;

    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    const cylTop = new THREE.Mesh(cylGeo, makeMat(capColor));
    cylTop.position.y = 0.2;
    const cylBot = new THREE.Mesh(cylGeo, makeMat(0xffffff));
    cylBot.position.y = -0.2;

    const capsule = new THREE.Group();
    capsule.add(topHemi, botHemi, cylTop, cylBot);
    scene.add(capsule);

    // --- Particles ---
    const PARTICLE_COUNT = 200;
    const pColor = new THREE.Color(capColor);
    const pPositions = new Float32Array(PARTICLE_COUNT * 3); // all zeros
    const pColors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pColors[i * 3]     = Math.min(1, pColor.r + Math.random() * 0.3);
      pColors[i * 3 + 1] = Math.min(1, pColor.g + Math.random() * 0.3);
      pColors[i * 3 + 2] = Math.min(1, pColor.b + Math.random() * 0.3);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color',    new THREE.BufferAttribute(pColors,    3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    const velocities = Array.from({ length: PARTICLE_COUNT }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 5,
      ),
    );

    // Expose objects so the trigger-effect can reset them
    threeRef.current = { capsule, topHemi, botHemi, cylTop, cylBot, particleGeo, particleMat, velocities };

    // Helper: reset capsule parts to rest positions
    const resetCapsule = () => {
      topHemi.position.y = 0.5;
      botHemi.position.y = -0.5;
      cylTop.position.y  = 0.2;
      cylBot.position.y  = -0.2;
      (topHemi.material as THREE.MeshPhongMaterial).opacity = 0.9;
      (botHemi.material as THREE.MeshPhongMaterial).opacity = 0.9;
      (cylTop.material  as THREE.MeshPhongMaterial).opacity = 0.9;
      (cylBot.material  as THREE.MeshPhongMaterial).opacity = 0.9;
      particleMat.opacity = 0;
      const pos = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) pos[i] = 0;
      particleGeo.attributes.position.needsUpdate = true;
      capsule.rotation.set(0, 0, 0);
      capsule.position.set(0, 0, 0);
    };

    // --- Clock (manual delta tracking to avoid Three.js Clock pitfall) ---
    let lastTime = performance.now();

    // --- Animation loop ---
    const animate = () => {
      stateRef.current.animFrame = requestAnimationFrame(animate);

      // ── BUG FIX: compute dt manually to avoid the Three.js
      //   clock.getElapsedTime() / getDelta() conflict where
      //   getElapsedTime() internally consumes the delta making
      //   getDelta() return ~0 every frame ──────────────────────
      const now = performance.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.1); // cap at 100 ms
      lastTime  = now;
      const t   = now / 1000;

      const s = stateRef.current;

      if (!s.animating) {
        // Idle float: incremental Y rotation avoids snap when returning from animation
        capsule.rotation.y += dt * 0.5;
        capsule.position.y  = Math.sin(t * 1.2) * 0.15;
        capsule.rotation.z  = Math.sin(t * 0.8) * 0.05;
      } else {
        s.phaseTime += dt;

        if (s.phase === 'shaking') {
          capsule.rotation.z  = Math.sin(t * 20) * 0.3;
          capsule.position.x  = Math.sin(t * 25) * 0.15;
          capsule.rotation.y += dt * 8; // controlled spin (not += 0.1 per frame)

          if (s.phaseTime >= 1.5) {
            s.phase     = 'splitting';
            s.phaseTime = 0;
          }

        } else if (s.phase === 'splitting') {
          const prog = Math.min(s.phaseTime / 0.6, 1);
          topHemi.position.y = 0.5  + prog * 2;
          botHemi.position.y = -0.5 - prog * 2;
          cylTop.position.y  = 0.2  + prog * 2;
          cylBot.position.y  = -0.2 - prog * 2;

          (topHemi.material as THREE.MeshPhongMaterial).opacity = 1 - prog;
          (botHemi.material as THREE.MeshPhongMaterial).opacity = 1 - prog;
          (cylTop.material  as THREE.MeshPhongMaterial).opacity = 1 - prog;
          (cylBot.material  as THREE.MeshPhongMaterial).opacity = 1 - prog;

          particleMat.opacity = prog;
          const pos = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3]     += velocities[i].x * dt * prog * 3;
            pos[i * 3 + 1] += (velocities[i].y * dt * prog * 3) - 0.02;
            pos[i * 3 + 2] += velocities[i].z * dt * prog * 3;
          }
          particleGeo.attributes.position.needsUpdate = true;

          if (s.phaseTime >= 0.6) {
            s.phase     = 'reveal';
            s.phaseTime = 0;
          }

        } else if (s.phase === 'reveal') {
          particleMat.opacity = Math.max(0, 1 - s.phaseTime / 0.8);
          const pos = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3]     += velocities[i].x * dt * 0.4;
            pos[i * 3 + 1] += (velocities[i].y * dt * 0.4) - 0.015;
            pos[i * 3 + 2] += velocities[i].z * dt * 0.4;
          }
          particleGeo.attributes.position.needsUpdate = true;

          if (s.phaseTime >= 0.8) {
            s.phase     = 'done';
            s.animating = false;
            resetCapsule();
            // Notify parent — do it after resetting so the scene looks clean
            const cb = threeRef.current?.onEnd;
            cb?.();
          }
        }
        // 'done' phase falls through to idle on next frame (animating = false)
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(stateRef.current.animFrame);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      threeRef.current = null;
    };
  }, [rarity]); // recreate only when rarity (= capsule color) changes

  // ── Trigger animation when parent says "go" ──────────────────────
  useEffect(() => {
    if (!isAnimating) return;
    // Store latest callback reference so the animation loop can call it
    if (threeRef.current) threeRef.current.onEnd = onAnimationEnd;
    stateRef.current.animating  = true;
    stateRef.current.phase      = 'shaking';
    stateRef.current.phaseTime  = 0;
  }, [isAnimating, onAnimationEnd]);

  return <div ref={mountRef} className="w-full h-full" />;
}
