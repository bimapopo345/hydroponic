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
  return <primitive object={scene} scale={35} position={[0, 12, 0]} />; // Scale super besar
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
      id="model3d"
      className="relative w-full h-screen bg-gradient-to-b from-emerald-50 to-white rounded-xl shadow-lg overflow-hidden"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas shadows camera={{ position: [100, 100, 100], fov: 45 }}>
          {/* Lighting */}
          <ambientLight intensity={4} />
          <directionalLight
            position={[50, 50, 50]}
            castShadow
            intensity={6}
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
            <planeGeometry args={[3000, 3000]} />
            <shadowMaterial opacity={0.2} />
          </mesh>

          {/* Model */}
          <HydroponicModel />

          {/* Super wide range controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            zoomSpeed={2.5}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={50}
            maxDistance={1000}
            target={[0, 20, 0]}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>

      {/* Fancy Instructions Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 text-sm bg-white/95 p-5 rounded-xl shadow-2xl space-y-3 backdrop-blur-sm border border-emerald-100"
      >
        <div className="font-bold text-emerald-600 border-b-2 border-emerald-100 pb-2 mb-3 text-base">
          🎮 Kontrol Model 3D:
        </div>
        <div className="flex items-center space-x-3 hover:bg-emerald-50 p-2 rounded-lg transition-colors duration-200">
          <span className="bg-emerald-100 p-2 rounded-lg shadow-sm min-w-[32px] text-center">
            🖱️
          </span>
          <span>Klik & Geser untuk Rotasi</span>
        </div>
        <div className="flex items-center space-x-3 hover:bg-emerald-50 p-2 rounded-lg transition-colors duration-200">
          <span className="bg-emerald-100 p-2 rounded-lg shadow-sm min-w-[32px] text-center">
            ⚲
          </span>
          <span>Scroll untuk Zoom In/Out</span>
        </div>
        <div className="flex items-center space-x-3 hover:bg-emerald-50 p-2 rounded-lg transition-colors duration-200">
          <span className="bg-emerald-100 p-2 rounded-lg shadow-sm min-w-[32px] text-center">
            👆
          </span>
          <span>Klik Kanan & Geser untuk Pan</span>
        </div>
      </motion.div>

      {/* Fancy Watermark */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 right-4 text-sm bg-black/30 text-white px-5 py-2.5 rounded-full backdrop-blur-sm shadow-xl font-medium"
      >
        Model by HidroNutrient Team ✨
      </motion.div>
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
