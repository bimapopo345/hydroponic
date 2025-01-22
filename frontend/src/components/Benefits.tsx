import { Droplets, Leaf, Flower, Sun } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: <Droplets className="w-12 h-12" />,
    title: "Optimized Water Usage",
    description:
      "Control nutrient solution more precisely, reducing water waste in your hydroponic setup.",
  },
  {
    icon: <Leaf className="w-12 h-12" />,
    title: "Faster Plant Growth",
    description:
      "Consistent monitoring of TDS, EC, and pH leads to stronger, healthier plants with quicker growth.",
  },
  {
    icon: <Flower className="w-12 h-12" />,
    title: "Higher Yields",
    description:
      "Keep nutrients balanced at all times to enhance overall productivity and crop yield.",
  },
  {
    icon: <Sun className="w-12 h-12" />,
    title: "Energy Efficiency",
    description:
      "Automate nutrient cycles to keep resource usage low and maintain ideal growing conditions.",
  },
];

export default function Benefits() {
  return (
    <div
      id="benefits"
      className="py-20 bg-gradient-to-br from-teal-900 via-blue-900 to-teal-900"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            Key Benefits
          </h2>
          <p className="text-xl text-teal-100">
            Why monitor your hydroponic system with HidroNutrient
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-6 p-6 rounded-xl bg-gradient-to-br from-teal-800/50 to-blue-900/50 hover:from-teal-800 hover:to-blue-900 transition-all transform hover:scale-105 backdrop-blur-sm shadow-lg"
            >
              <div className="text-teal-400">{benefit.icon}</div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {benefit.title}
                </h3>
                <p className="text-teal-100">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
