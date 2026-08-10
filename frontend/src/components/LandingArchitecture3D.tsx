// ==============================================================================
// FILE: src/components/LandingArchitecture3D.tsx
// WHAT THIS FILE IS: 3D Interactive WebGL Architecture Visualizer.
// WHY IT IS USED: Uses Three.js to render a 3D wireframe cube matrix and 
//                 data node pathways symbolizing the Phoenix AI voice pipeline.
// ==============================================================================

"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const LandingArchitecture3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xf9f8f6, 1.2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0xc9b59c, 3, 50);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const matrixGroup = new THREE.Group();
    scene.add(matrixGroup);

    // 3x3 Cube Matrix Grid representing micro-services
    const cubes: THREE.Mesh[] = [];
    const size = 0.7;
    const spacing = 1.3;

    const cubeGeo = new THREE.BoxGeometry(size, size, size);
    
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const isCenter = x === 0 && y === 0 && z === 0;
          const mat = new THREE.MeshStandardMaterial({
            color: isCenter ? 0xc9b59c : 0xd9cfc7,
            roughness: 0.3,
            metalness: 0.7,
            wireframe: true,
          });
          const cube = new THREE.Mesh(cubeGeo, mat);
          cube.position.set(x * spacing, y * spacing, z * spacing);
          matrixGroup.add(cube);
          cubes.push(cube);
        }
      }
    }

    // Outer bounding wireframe box
    const outerGeo = new THREE.BoxGeometry(4.2, 4.2, 4.2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const outerBox = new THREE.Mesh(outerGeo, outerMat);
    matrixGroup.add(outerBox);

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      matrixGroup.rotation.x = t * 0.2 + mouseY * 0.3;
      matrixGroup.rotation.y = t * 0.3 + mouseX * 0.3;

      cubes.forEach((c, idx) => {
        c.rotation.x = Math.sin(t + idx) * 0.2;
        c.rotation.y = Math.cos(t + idx) * 0.2;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-[320px] sm:h-[400px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};
