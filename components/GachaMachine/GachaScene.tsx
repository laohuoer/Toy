'use client';

import { useEffect, useRef, useCallback } from 'react';
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

export default function GachaScene({ isAnimating, rarity = 'common', onAnimationEnd }: GachaSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    capsule: THREE.Group;
    particles: THREE.Points;
    animFrame: number;
    phase: 'idle' | 'shaking' | 'splitting' | 'reveal' | 'done';
    phaseTime: number;
    clock: THREE.Clock;
    animating: boolean;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6699ff, 2, 10);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);

    // Capsule group
    const capsule = new THREE.Group();
    scene.add(capsule);

    // Build capsule: two hemispheres + cylinder
    const capColor = RARITY_CAPSULE_COLOR[rarity] ?? 0x9ca3af;
    const mat = new THREE.MeshPhongMaterial({
      color: capColor,
      emissive: capColor,
      emissiveIntensity: 0.2,
      shininess: 120,
      transparent: true,
      opacity: 0.9,
    });
    const matWhite = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 150,
      transparent: true,
      opacity: 0.9,
    });

    const sphereGeomTop = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const topHemi = new THREE.Mesh(sphereGeomTop, mat.clone());
    topHemi.position.y = 0.5;

    const sphereGeomBot = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const botHemi = new THREE.Mesh(sphereGeomBot, matWhite.clone());
    botHemi.position.y = -0.5;

    const cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    const cylTop = new THREE.Mesh(cylinderGeom, mat.clone());
    cylTop.position.y = 0.2;
    const cylBot = new THREE.Mesh(cylinderGeom, matWhite.clone());
    cylBot.position.y = -0.2;

    capsule.add(topHemi, botHemi, cylTop, cylBot);

    // Particle system for burst effect
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const pColor = new THREE.Color(capColor);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = pColor.r + Math.random() * 0.3;
      colors[i * 3 + 1] = pColor.g + Math.random() * 0.3;
      colors[i * 3 + 2] = pColor.b + Math.random() * 0.3;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Velocities for particles
    const velocities: THREE.Vector3[] = Array.from({ length: particleCount }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5 + 2,
        (Math.random() - 0.5) * 5
      )
    );

    const clock = new THREE.Clock();
    let animFrame: number = 0;

    const refs = {
      scene,
      camera,
      renderer,
      capsule,
      particles,
      animFrame,
      phase: 'idle' as const,
      phaseTime: 0,
      clock,
      animating: false,
    };

    sceneRef.current = refs as typeof refs & { animFrame: number };

    // Idle floating animation
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = clock.getDelta();

      if (!refs.animating) {
        // Gentle idle float
        capsule.rotation.y = t * 0.5;
        capsule.position.y = Math.sin(t * 1.2) * 0.15;
        capsule.rotation.z = Math.sin(t * 0.8) * 0.05;
      } else {
        const phase = (refs as any).phase as string;
        const phaseTime = ((refs as any).phaseTime as number);

        if (phase === 'shaking') {
          // Shake violently
          capsule.rotation.z = Math.sin(t * 20) * 0.3;
          capsule.position.x = Math.sin(t * 25) * 0.15;
          capsule.rotation.y += 0.1;

          if (phaseTime > 1.5) {
            (refs as any).phase = 'splitting';
            (refs as any).phaseTime = 0;
          }
        } else if (phase === 'splitting') {
          // Split apart
          const prog = Math.min(phaseTime / 0.6, 1);
          topHemi.position.y = 0.5 + prog * 2;
          botHemi.position.y = -0.5 - prog * 2;
          cylTop.position.y = 0.2 + prog * 2;
          cylBot.position.y = -0.2 - prog * 2;
          topHemi.material.opacity = 1 - prog;
          botHemi.material.opacity = 1 - prog;
          cylTop.material.opacity = 1 - prog;
          cylBot.material.opacity = 1 - prog;

          // Activate particles
          particleMat.opacity = prog;
          const posArr = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            posArr[i * 3] += velocities[i].x * dt * prog * 2;
            posArr[i * 3 + 1] += (velocities[i].y * dt * prog * 2) - 0.02;
            posArr[i * 3 + 2] += velocities[i].z * dt * prog * 2;
          }
          particleGeo.attributes.position.needsUpdate = true;

          if (phaseTime > 0.6) {
            (refs as any).phase = 'reveal';
            (refs as any).phaseTime = 0;
          }
        } else if (phase === 'reveal') {
          // Fade out particles
          particleMat.opacity = Math.max(0, 1 - phaseTime / 0.8);

          const posArr = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            posArr[i * 3] += velocities[i].x * dt * 0.3;
            posArr[i * 3 + 1] += (velocities[i].y * dt * 0.3) - 0.015;
            posArr[i * 3 + 2] += velocities[i].z * dt * 0.3;
          }
          particleGeo.attributes.position.needsUpdate = true;

          if (phaseTime > 0.8) {
            (refs as any).phase = 'done';
            (refs as any).animating = false;
            // Reset
            topHemi.position.y = 0.5;
            botHemi.position.y = -0.5;
            cylTop.position.y = 0.2;
            cylBot.position.y = -0.2;
            topHemi.material.opacity = 0.9;
            botHemi.material.opacity = 0.9;
            cylTop.material.opacity = 0.9;
            cylBot.material.opacity = 0.9;
            particleMat.opacity = 0;
            for (let i = 0; i < particleCount; i++) {
              posArr[i * 3] = 0;
              posArr[i * 3 + 1] = 0;
              posArr[i * 3 + 2] = 0;
            }
            particleGeo.attributes.position.needsUpdate = true;
            capsule.rotation.z = 0;
            capsule.position.x = 0;
            onAnimationEnd?.();
          }
        }

        (refs as any).phaseTime += dt;
      }

      renderer.render(scene, camera);
    };

    animate();
    sceneRef.current!.animFrame = animFrame!;

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [rarity]);

  // Trigger animation
  useEffect(() => {
    if (isAnimating && sceneRef.current) {
      (sceneRef.current as any).animating = true;
      (sceneRef.current as any).phase = 'shaking';
      (sceneRef.current as any).phaseTime = 0;
      sceneRef.current.clock.start();
    }
  }, [isAnimating]);

  return <div ref={mountRef} className="w-full h-full" />;
}
