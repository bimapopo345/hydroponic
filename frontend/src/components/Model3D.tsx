import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";

function HydroponicModel() {
  return (
    <mesh>
      {/* Base stand */}
      <cylinderGeometry args={[2, 2, 0.2, 32]} />
      <meshStandardMaterial color="#047857" />

      {/* Vertical pipe */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 4, 32]} />
        <meshStandardMaterial color="#059669" />
      </mesh>

      {/* Water container */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
        <meshStandardMaterial color="#0EA5E9" opacity={0.6} transparent />
      </mesh>

      {/* Plant holders */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, 3, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.8]} />
          <meshStandardMaterial color="#065f46" />
        </mesh>
      ))}
    </mesh>
  );
}

export default function Model3D() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-[400px] bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: "#f0fdf4" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <HydroponicModel />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </motion.div>
  );
}
