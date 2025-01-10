import {
  Wifi,
  Thermometer,
  Timer,
  Scale,
  Database,
  Gauge,
  Settings,
  Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Settings className="w-8 h-8" />,
    title: "Arduino Control",
    description: "Central control system with Arduino UNO and WiFi ESP module",
  },
  {
    icon: <Scale className="w-8 h-8" />,
    title: "Precise Feeding",
    description: "HX711 and Load Cell for accurate feed measurement",
  },
  {
    icon: <Thermometer className="w-8 h-8" />,
    title: "Environment Monitoring",
    description: "Temperature and pH sensors for optimal water conditions",
  },
  {
    icon: <Timer className="w-8 h-8" />,
    title: "Automated Timing",
    description: "Scheduled feeding with precise servo control",
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "Fuzzy Logic",
    description: "Smart feed adjustment based on environmental conditions",
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Mobile Control",
    description: "Real-time monitoring via Blynk mobile application",
  },
  {
    icon: <Gauge className="w-8 h-8" />,
    title: "LCD Display",
    description: "On-site display for instant system status",
  },
  {
    icon: <Wifi className="w-8 h-8" />,
    title: "IoT Integration",
    description: "Complete wireless control and monitoring",
  },
];

export default function Features() {
  return (
    <div className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            System Components
          </h2>
          <p className="text-xl text-gray-600">
            Advanced technology for intelligent fish feeding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
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
