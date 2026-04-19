"use client";

import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  Texture,
} from "three";

function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const flattened = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const current = mesh.material as MeshStandardMaterial | undefined;
      const map = (current?.map as Texture | undefined) ?? undefined;
      mesh.material = new MeshStandardMaterial({
        map,
        roughness: 1,
        metalness: 0,
        envMapIntensity: 0,
      });
    });
    return cloned;
  }, [scene]);
  return <primitive object={flattened} />;
}

export default function SnackViewer({ modelPath }: { modelPath: string }) {
  return (
    <Canvas
      camera={{ position: [1.2, 0.6, 2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ toneMapping: NoToneMapping }}
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.6} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Model path={modelPath} />
        </Bounds>
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
