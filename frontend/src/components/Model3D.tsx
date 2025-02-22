import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import { motion } from "framer-motion";

function HydroponicModel() {
  // @ts-ignore
  const { scene } = useGLTF(
    new URL(
      "../../model/Hydroponic_System_Des_0222144816_texture.glb",
      import.meta.url
    ).href
  );
  return <primitive object={scene} scale={25} position={[0, 8, 0]} />; // Scale lebih besar lagi
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );
}

export default function Model3D() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen bg-gradient-to-b from-emerald-50 to-white rounded-xl shadow-lg overflow-hidden"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas shadows camera={{ position: [80, 80, 80], fov: 45 }}>
          {/* Lighting */}
          <ambientLight intensity={3} />
          <directionalLight
            position={[30, 30, 30]}
            castShadow
            intensity={5}
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
          />

          {/* Environment & Ground */}
          <Environment preset="sunset" />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[2000, 2000]} />
            <shadowMaterial opacity={0.2} />
          </mesh>

          {/* Model */}
          <HydroponicModel />

          {/* Controls dengan range yang lebih luas lagi */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            zoomSpeed={2}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={40}
            maxDistance={500}
            target={[0, 15, 0]}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>

      {/* Instructions dengan style yang lebih menarik */}
      <div className="absolute top-4 left-4 text-sm bg-white/90 p-4 rounded-lg shadow-xl space-y-2 backdrop-blur-sm border border-emerald-100">
        <div className="font-bold text-emerald-600 border-b pb-2 mb-2 text-base">
          Kontrol Model 3D:
        </div>
        <div className="flex items-center space-x-2 hover:bg-emerald-50 p-1 rounded transition-colors">
          <span className="bg-emerald-100 p-1.5 rounded-lg shadow-sm">🖱️</span>
          <span>Klik & Geser untuk Rotasi</span>
        </div>
        <div className="flex items-center space-x-2 hover:bg-emerald-50 p-1 rounded transition-colors">
          <span className="bg-emerald-100 p-1.5 rounded-lg shadow-sm">⚲</span>
          <span>Scroll untuk Zoom In/Out</span>
        </div>
        <div className="flex items-center space-x-2 hover:bg-emerald-50 p-1 rounded transition-colors">
          <span className="bg-emerald-100 p-1.5 rounded-lg shadow-sm">👆</span>
          <span>Klik Kanan & Geser untuk Pan</span>
        </div>
      </div>

      {/* Watermark dengan style yang lebih elegan */}
      <div className="absolute bottom-4 right-4 text-sm bg-black/20 text-white px-4 py-2 rounded-full backdrop-blur-sm shadow-lg font-medium">
        Model by HidroNutrient Team
      </div>
    </motion.div>
  );
}

// Pre-load model
useGLTF.preload(
  new URL(
    "../../model/Hydroponic_System_Des_0222144816_texture.glb",
    import.meta.url
  ).href
);
