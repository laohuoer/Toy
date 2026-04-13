'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Badge } from '@/lib/types';
import { RARITY_COLORS } from '@/lib/badges';

interface Badge3DViewerProps {
  badge: Badge;
  className?: string;
}

export default function Badge3DViewer({ badge, className }: Badge3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    animFrame: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    rotX: number;
    rotY: number;
    targetRotX: number;
    targetRotY: number;
    badgeMesh: THREE.Group;
    scale: number;
    targetScale: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
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

    // Parse badge color
    const rarityColor = new THREE.Color(RARITY_COLORS[badge.rarity]);

    // Badge group
    const badgeGroup = new THREE.Group();
    scene.add(badgeGroup);

    // Build badge geometry based on modelType
    let frontGeo: THREE.BufferGeometry;
    switch (badge.modelType) {
      case 'hexagon': {
        const shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = Math.cos(angle);
          const y = Math.sin(angle);
          i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
        }
        shape.closePath();
        frontGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4 });
        break;
      }
      case 'star': {
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? 1 : 0.45;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
        }
        shape.closePath();
        frontGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
        break;
      }
      case 'shield': {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1.1);
        shape.bezierCurveTo(0.8, 1.1, 1.1, 0.6, 1.1, 0);
        shape.bezierCurveTo(1.1, -0.5, 0.6, -0.9, 0, -1.2);
        shape.bezierCurveTo(-0.6, -0.9, -1.1, -0.5, -1.1, 0);
        shape.bezierCurveTo(-1.1, 0.6, -0.8, 1.1, 0, 1.1);
        frontGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 });
        break;
      }
      case 'diamond': {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1.3);
        shape.lineTo(0.9, 0);
        shape.lineTo(0, -1.3);
        shape.lineTo(-0.9, 0);
        shape.closePath();
        frontGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4 });
        break;
      }
      default: {
        frontGeo = new THREE.CylinderGeometry(1, 1, 0.2, 64);
        frontGeo.rotateX(Math.PI / 2);
        break;
      }
    }

    // Front face material (glossy enamel)
    const frontMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(badge.color),
      metalness: 0.2,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    // Side/rim material (metal)
    const sideMat = new THREE.MeshPhysicalMaterial({
      color: rarityColor,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1,
    });

    const frontMesh = new THREE.Mesh(frontGeo, [frontMat, sideMat]);
    if (badge.modelType !== 'circle') {
      frontMesh.position.set(-0, 0, -0.07);
    }
    badgeGroup.add(frontMesh);

    // Back plate
    const backGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.08, 64);
    backGeo.rotateX(Math.PI / 2);
    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x888888,
      metalness: 0.95,
      roughness: 0.2,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.z = -0.15;
    badgeGroup.add(backMesh);

    // Rim ring
    const rimGeo = new THREE.TorusGeometry(1.05, 0.06, 16, 64);
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: rarityColor,
      metalness: 1,
      roughness: 0.05,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    badgeGroup.add(rim);

    // Particle halo for legendary/epic
    if (badge.rarity === 'legendary' || badge.rarity === 'epic') {
      const particleCount = 80;
      const pGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const r = 1.4 + Math.random() * 0.3;
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = Math.sin(angle) * r;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: rarityColor,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
      });
      badgeGroup.add(new THREE.Points(pGeo, pMat));
    }

    const clock = new THREE.Clock();
    let animFrame: number = 0;

    const state = {
      renderer,
      animFrame,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      badgeMesh: badgeGroup,
      scale: 1,
      targetScale: 1,
    };
    stateRef.current = state;

    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!state.isDragging) {
        state.targetRotY += 0.005;
      }

      // Smooth interpolation
      state.rotX += (state.targetRotX - state.rotX) * 0.1;
      state.rotY += (state.targetRotY - state.rotY) * 0.1;
      state.scale += (state.targetScale - state.scale) * 0.1;

      badgeGroup.rotation.x = state.rotX;
      badgeGroup.rotation.y = state.rotY;
      badgeGroup.scale.setScalar(state.scale);
      badgeGroup.position.y = Math.sin(t * 0.8) * 0.05;

      renderer.render(scene, camera);
    };
    animate();
    state.animFrame = animFrame!;

    // Interaction
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.targetRotY += dx * 0.01;
      state.targetRotX += dy * 0.01;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerUp = () => { state.isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.targetScale = Math.max(0.5, Math.min(2, state.targetScale - e.deltaY * 0.001));
    };
    const onDblClick = () => {
      state.targetRotX = 0;
      state.targetRotY = 0;
      state.targetScale = 1;
    };
    const handleResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('dblclick', onDblClick);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [badge.id]);

  return <div ref={mountRef} className={className ?? 'w-full h-full'} style={{ cursor: 'grab' }} />;
}
