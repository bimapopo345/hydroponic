import {
  Droplets,
  Thermometer,
  Wand2,
  LayoutGrid,
  BatteryCharging,
  AlertTriangle,
  Leaf,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Droplets className="w-8 h-8" />,
    title: "Sensor PPM",
    description:
      "Pengukuran PPM yang akurat untuk konsistensi larutan nutrisi.",
  },
  {
    icon: <Thermometer className="w-8 h-8" />,
    title: "Monitor Suhu",
    description:
      "Jaga suhu zona akar pada level optimal untuk pertumbuhan tanaman.",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Pengaturan pH",
    description: "Penyeimbangan pH otomatis untuk mencegah kekurangan nutrisi.",
  },
  {
    icon: <Wand2 className="w-8 h-8" />,
    title: "Kontrol Otomatis",
    description:
      "Pemberian nutrisi dan sirkulasi larutan secara real-time menggunakan perangkat IoT.",
  },
  {
    icon: <LayoutGrid className="w-8 h-8" />,
    title: "Data Historis",
    description: "Akses log dan grafik performa sistem hidroponik Anda.",
  },
  {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Sistem Peringatan",
    description:
      "Terima peringatan langsung jika nilai sensor melebihi ambang batas aman.",
  },
  {
    icon: <BatteryCharging className="w-8 h-8" />,
    title: "Hemat Energi",
    description:
      "Penjadwalan pintar mengurangi konsumsi daya untuk pompa dan sensor.",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Akses Mobile",
    description:
      "Pantau dan sesuaikan pengaturan dari smartphone atau tablet Anda.",
  },
];

export default function Features() {
  return (
    <div className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Komponen Sistem
          </h2>
          <p className="text-xl text-gray-600">
            Teknologi modern untuk pemantauan hidroponik yang presisi
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="text-green-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
