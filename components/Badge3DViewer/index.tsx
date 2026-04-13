'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Badge } from '@/lib/types';
import { RARITY_COLORS } from '@/lib/badges';
import { BASE_PATH } from '@/lib/constants';

interface Badge3DViewerProps {
  badge: Badge;
  className?: string;
}

// ── Resource disposal ─────────────────────────────────────────────
/** Traverse a THREE.Object3D and dispose all geometries, materials and textures. */
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (!m) return;
        Object.values(m).forEach((val) => {
          if (val instanceof THREE.Texture) val.dispose();
        });
        m.dispose();
      });
    }
    if ((child as THREE.Points).isPoints) {
      const pts = child as THREE.Points;
      pts.geometry?.dispose();
      (pts.material as THREE.Material | null)?.dispose();
    }
  });
}

// ── Procedural badge geometry (fallback when no .glb is available) ─
/**
 * Builds the classic enamel-pin style badge entirely from Three.js primitives
 * and adds it to `group`. Used when `badge.modelUrl` is absent or fails to load.
 */
function buildProceduralBadge(group: THREE.Group, badge: Badge) {
  const rarityColor = new THREE.Color(RARITY_COLORS[badge.rarity]);

  // Front geometry
  let frontGeo: THREE.BufferGeometry;
  switch (badge.modelType) {
    case 'hexagon': {
      const shape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        i === 0
          ? shape.moveTo(Math.cos(angle), Math.sin(angle))
          : shape.lineTo(Math.cos(angle), Math.sin(angle));
      }
      shape.closePath();
      frontGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.15, bevelEnabled: true,
        bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4,
      });
      break;
    }
    case 'star': {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 1 : 0.45;
        i === 0
          ? shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
          : shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      shape.closePath();
      frontGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.12, bevelEnabled: true,
        bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3,
      });
      break;
    }
    case 'shield': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.1);
      shape.bezierCurveTo(0.8, 1.1,  1.1, 0.6,  1.1,  0);
      shape.bezierCurveTo(1.1, -0.5, 0.6, -0.9, 0,   -1.2);
      shape.bezierCurveTo(-0.6, -0.9, -1.1, -0.5, -1.1, 0);
      shape.bezierCurveTo(-1.1, 0.6, -0.8, 1.1, 0, 1.1);
      frontGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.14, bevelEnabled: true,
        bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4,
      });
      break;
    }
    case 'diamond': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.3);
      shape.lineTo(0.9, 0);
      shape.lineTo(0, -1.3);
      shape.lineTo(-0.9, 0);
      shape.closePath();
      frontGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.14, bevelEnabled: true,
        bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4,
      });
      break;
    }
    default: {
      frontGeo = new THREE.CylinderGeometry(1, 1, 0.2, 64);
      frontGeo.rotateX(Math.PI / 2);
    }
  }

  const frontMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(badge.color),
    metalness: 0.2, roughness: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.05, reflectivity: 0.9,
  });
  const sideMat = new THREE.MeshPhysicalMaterial({
    color: rarityColor, metalness: 0.9, roughness: 0.1, envMapIntensity: 1,
  });

  const frontMesh = new THREE.Mesh(frontGeo, [frontMat, sideMat]);
  if (badge.modelType !== 'circle') frontMesh.position.set(0, 0, -0.07);
  group.add(frontMesh);

  // Back plate
  const backGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.08, 64);
  backGeo.rotateX(Math.PI / 2);
  const backMesh = new THREE.Mesh(
    backGeo,
    new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.2 }),
  );
  backMesh.position.z = -0.15;
  group.add(backMesh);

  // Rim ring
  group.add(new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.06, 16, 64),
    new THREE.MeshPhysicalMaterial({ color: rarityColor, metalness: 1, roughness: 0.05 }),
  ));

  // Particle halo for legendary / epic
  if (badge.rarity === 'legendary' || badge.rarity === 'epic') {
    const PARTICLE_COUNT = 80;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const r = 1.4 + Math.random() * 0.3;
      positions[i * 3]     = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    group.add(new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: rarityColor, size: 0.05, transparent: true, opacity: 0.8 }),
    ));
  }
}

// ── Component ─────────────────────────────────────────────────────
export default function Badge3DViewer({ badge, className }: Badge3DViewerProps) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef    = useRef<{
    renderer: THREE.WebGLRenderer;
    isDragging: boolean;
    lastX: number; lastY: number;
    rotX: number; rotY: number;
    targetRotX: number; targetRotY: number;
    badgeMesh: THREE.Group;
    scale: number; targetScale: number;
  } | null>(null);

  // True while the GLB file is being fetched (only when modelUrl is set)
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth  || 300;
    const h = container.clientHeight || 300;

    // ── Scene ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // ── Lighting ───────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.8);
    fillLight.position.set(-5, 0, 3);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffd700, 0.6);
    rimLight.position.set(0, -5, -3);
    scene.add(rimLight);

    // ── Badge group ────────────────────────────────────────────
    const badgeGroup = new THREE.Group();
    scene.add(badgeGroup);

    // ── Model loading ──────────────────────────────────────────
    // cancelled flag: prevents state updates after unmount
    let cancelled = false;

    if (badge.modelUrl) {
      // Show loading overlay
      setIsLoading(true);

      const loader = new GLTFLoader();
      const fullUrl = `${BASE_PATH}${badge.modelUrl}`;

      loader.load(
        fullUrl,
        (gltf) => {
          if (cancelled) return;

          const model = gltf.scene;

          // Auto-center: translate model so its bounding-box center sits at origin
          const box    = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size   = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          // Uniform scale so the longest axis fills ~2 units (fits the camera view)
          if (maxDim > 0) {
            const s = 2.0 / maxDim;
            model.scale.setScalar(s);
            model.position.sub(center.multiplyScalar(s));
          }

          // Wrap in a sub-group so rotation/animation can be applied to badgeGroup
          badgeGroup.add(model);
          setIsLoading(false);
        },
        undefined, // progress callback (unused)
        (error) => {
          if (cancelled) return;
          console.warn(
            `[Badge3DViewer] 加载模型失败 (${fullUrl})，使用程序化几何体兜底：`,
            error,
          );
          buildProceduralBadge(badgeGroup, badge);
          setIsLoading(false);
        },
      );
    } else {
      // No modelUrl — use the built-in procedural geometry immediately
      buildProceduralBadge(badgeGroup, badge);
    }

    // ── State ref ──────────────────────────────────────────────
    const state = {
      renderer,
      isDragging: false,
      lastX: 0, lastY: 0,
      rotX: 0, rotY: 0,
      targetRotX: 0, targetRotY: 0,
      badgeMesh: badgeGroup,
      scale: 1, targetScale: 1,
    };
    stateRef.current = state;

    // ── Animation loop ─────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!state.isDragging) state.targetRotY += 0.005;

      state.rotX  += (state.targetRotX  - state.rotX)  * 0.1;
      state.rotY  += (state.targetRotY  - state.rotY)  * 0.1;
      state.scale += (state.targetScale - state.scale) * 0.1;

      badgeGroup.rotation.x = state.rotX;
      badgeGroup.rotation.y = state.rotY;
      badgeGroup.scale.setScalar(state.scale);
      badgeGroup.position.y = Math.sin(t * 0.8) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // ── Interaction handlers ───────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      state.targetRotY += (e.clientX - state.lastX) * 0.01;
      state.targetRotX += (e.clientY - state.lastY) * 0.01;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerUp  = () => { state.isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.targetScale = Math.max(0.5, Math.min(2, state.targetScale - e.deltaY * 0.001));
    };
    const onDblClick   = () => {
      state.targetRotX = 0; state.targetRotY = 0; state.targetScale = 1;
    };
    const handleResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove',  onPointerMove);
    window.addEventListener('pointerup',    onPointerUp);
    renderer.domElement.addEventListener('wheel',    onWheel,  { passive: false });
    renderer.domElement.addEventListener('dblclick', onDblClick);
    window.addEventListener('resize', handleResize);

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelled = true;

      cancelAnimationFrame(animFrameRef.current);

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove',  onPointerMove);
      window.removeEventListener('pointerup',    onPointerUp);
      renderer.domElement.removeEventListener('wheel',    onWheel);
      renderer.domElement.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('resize', handleResize);

      disposeObject(scene);
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      stateRef.current = null;
    };
  }, [badge.id]); // Re-run only when a different badge is selected

  return (
    <div className="relative w-full h-full">
      {/* Three.js canvas mount point */}
      <div
        ref={mountRef}
        className={className ?? 'w-full h-full'}
        style={{ cursor: 'grab' }}
      />

      {/* Loading overlay — shown while the .glb file is being fetched */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 rounded-2xl pointer-events-none">
          <div className="text-center">
            <div className="text-4xl animate-spin mb-2">🔮</div>
            <p className="text-gray-400 text-sm">模型加载中…</p>
          </div>
        </div>
      )}
    </div>
  );
}
