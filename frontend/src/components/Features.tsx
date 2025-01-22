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
    title: "TDS & EC Sensors",
    description:
      "Accurate TDS and EC measurement for nutrient solution consistency.",
  },
  {
    icon: <Thermometer className="w-8 h-8" />,
    title: "Temperature Monitoring",
    description:
      "Keep root-zone temperatures at optimal levels for plant growth.",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "pH Adjustment",
    description: "Automated pH balancing to prevent nutrient lockout.",
  },
  {
    icon: <Wand2 className="w-8 h-8" />,
    title: "Automated Control",
    description:
      "Real-time nutrient dosing and solution cycling using IoT devices.",
  },
  {
    icon: <LayoutGrid className="w-8 h-8" />,
    title: "Historical Data",
    description:
      "Access logs and graphs of your hydroponic system's performance.",
  },
  {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Alert System",
    description:
      "Receive instant alerts if sensor values exceed safe thresholds.",
  },
  {
    icon: <BatteryCharging className="w-8 h-8" />,
    title: "Energy Efficiency",
    description:
      "Smart scheduling reduces power consumption for pumps and sensors.",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Mobile Access",
    description: "Monitor and adjust settings from your smartphone or tablet.",
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
            Modern technology for precise hydroponic monitoring
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
