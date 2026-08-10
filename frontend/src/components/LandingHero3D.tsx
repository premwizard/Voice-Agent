// ==============================================================================
// FILE: src/components/LandingHero3D.tsx
// WHAT THIS FILE IS: 3D Interactive WebGL Hero Canvas Component.
// WHY IT IS USED: Uses Three.js to render a 3D rotating geometric orb, wireframe 
//                 torus rings, dynamic lights, and floating particles in the warm luxury theme.
// ==============================================================================

"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const LandingHero3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Warm Luxury Lighting
    const ambientLight = new THREE.AmbientLight(0xf9f8f6, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xc9b59c, 3, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xd9cfc7, 2, 50);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    // Group for 3D objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Core Icosahedron Wireframe Sphere
    const geometryCore = new THREE.IcosahedronGeometry(1.6, 2);
    const materialCore = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(geometryCore, materialCore);
    mainGroup.add(coreMesh);

    // 2. Inner Solid Glowing Orb
    const geometryInner = new THREE.SphereGeometry(1.1, 32, 32);
    const materialInner = new THREE.MeshStandardMaterial({
      color: 0xefe9e3,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xc9b59c,
      emissiveIntensity: 0.3,
    });
    const innerMesh = new THREE.Mesh(geometryInner, materialInner);
    mainGroup.add(innerMesh);

    // 3. Outer Torus Ring 1
    const geometryRing1 = new THREE.TorusGeometry(2.4, 0.03, 16, 100);
    const materialRing1 = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(geometryRing1, materialRing1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // 4. Outer Torus Ring 2
    const geometryRing2 = new THREE.TorusGeometry(2.9, 0.02, 16, 100);
    const materialRing2 = new THREE.MeshStandardMaterial({
      color: 0xd9cfc7,
      roughness: 0.4,
      metalness: 0.6,
    });
    const ring2 = new THREE.Mesh(geometryRing2, materialRing2);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // 5. Floating Gold Particle Dust Field
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc9b59c,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Tracking for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width - 0.5) * 2;
      mouseY = ((event.clientY - rect.top) / height - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotate 3D Objects
      coreMesh.rotation.x = elapsedTime * 0.25;
      coreMesh.rotation.y = elapsedTime * 0.35;

      ring1.rotation.z = elapsedTime * 0.2;
      ring2.rotation.x = elapsedTime * 0.15;
      ring2.rotation.z = elapsedTime * 0.1;

      particles.rotation.y = elapsedTime * 0.05;

      // Group Tilt
      mainGroup.rotation.y = targetX * 0.5;
      mainGroup.rotation.x = -targetY * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-[360px] sm:h-[450px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};
