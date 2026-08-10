// ==============================================================================
// FILE: src/components/LandingHero3D.tsx
// WHAT THIS FILE IS: Expanded 3D Interactive WebGL Hero Canvas.
// WHY IT IS USED: Uses Three.js to render a 3D WebGL scene with floating geometric 
//                 crystals, dual orbiting torus rings, core wireframe sphere, and mouse physics.
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Warm Luxury Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xf9f8f6, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xc9b59c, 4, 60);
    mainLight.position.set(6, 6, 6);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xd9cfc7, 3, 50);
    rimLight.position.set(-6, -4, 4);
    scene.add(rimLight);

    // Main 3D Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Core Icosahedron Wireframe Sphere
    const geometryCore = new THREE.IcosahedronGeometry(1.7, 2);
    const materialCore = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(geometryCore, materialCore);
    mainGroup.add(coreMesh);

    // 2. Inner Solid Glowing Orb
    const geometryInner = new THREE.SphereGeometry(1.15, 32, 32);
    const materialInner = new THREE.MeshStandardMaterial({
      color: 0xefe9e3,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0xc9b59c,
      emissiveIntensity: 0.4,
    });
    const innerMesh = new THREE.Mesh(geometryInner, materialInner);
    mainGroup.add(innerMesh);

    // 3. Orbiting Torus Ring 1
    const geometryRing1 = new THREE.TorusGeometry(2.6, 0.035, 16, 100);
    const materialRing1 = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(geometryRing1, materialRing1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // 4. Orbiting Torus Ring 2
    const geometryRing2 = new THREE.TorusGeometry(3.1, 0.025, 16, 100);
    const materialRing2 = new THREE.MeshStandardMaterial({
      color: 0xd9cfc7,
      roughness: 0.4,
      metalness: 0.7,
    });
    const ring2 = new THREE.Mesh(geometryRing2, materialRing2);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // 5. Floating Geometric Satellites (Octahedrons & Dodecahedrons)
    const satellites: THREE.Mesh[] = [];
    const satGeometry = new THREE.OctahedronGeometry(0.25, 0);
    const satMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9b59c,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (let i = 0; i < 6; i++) {
      const sat = new THREE.Mesh(satGeometry, satMaterial);
      const angle = (i / 6) * Math.PI * 2;
      const radius = 3.6;
      sat.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius);
      satellites.push(sat);
      mainGroup.add(sat);
    }

    // 6. Gold Particle Dust Field
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 14;
      positions[i + 1] = (Math.random() - 0.5) * 14;
      positions[i + 2] = (Math.random() - 0.5) * 14;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc9b59c,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Parallax Physics
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
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotations
      coreMesh.rotation.x = elapsedTime * 0.22;
      coreMesh.rotation.y = elapsedTime * 0.32;

      ring1.rotation.z = elapsedTime * 0.18;
      ring2.rotation.x = elapsedTime * 0.14;
      ring2.rotation.z = elapsedTime * 0.09;

      // Satellite Orbit Animations
      satellites.forEach((sat, idx) => {
        const speed = 0.4 + idx * 0.05;
        const angle = elapsedTime * speed + (idx / satellites.length) * Math.PI * 2;
        const radius = 3.6 + Math.sin(elapsedTime + idx) * 0.3;
        sat.position.x = Math.cos(angle) * radius;
        sat.position.z = Math.sin(angle) * radius;
        sat.rotation.x = elapsedTime * 0.8;
        sat.rotation.y = elapsedTime * 0.6;
      });

      particles.rotation.y = elapsedTime * 0.04;

      // Main Group Tilt
      mainGroup.rotation.y = targetX * 0.45;
      mainGroup.rotation.x = -targetY * 0.45;

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
      className="w-full h-[400px] sm:h-[480px] lg:h-[540px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};
