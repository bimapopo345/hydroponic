import { TrendingUp, BarChart3, HeartPulse, Droplets } from 'lucide-react'
import { motion } from 'framer-motion'

const benefits = [
  {
    icon: <TrendingUp className="w-12 h-12" />,
    title: "Improved Efficiency",
    description: "Save up to 30% on feed costs with precise automated dispensing and smart monitoring"
  },
  {
    icon: <BarChart3 className="w-12 h-12" />,
    title: "Optimal Growth",
    description: "Achieve better growth rates with precise feeding schedules and environmental control"
  },
  {
    icon: <HeartPulse className="w-12 h-12" />,
    title: "Better Fish Health",
    description: "Maintain ideal conditions with real-time pH and temperature monitoring"
  },
  {
    icon: <Droplets className="w-12 h-12" />,
    title: "Water Quality",
    description: "Prevent overfeeding and maintain optimal water conditions automatically"
  }
]

export default function Benefits() {
  return (
    <div id="benefits" className="py-20 bg-gradient-to-br from-teal-900 via-blue-900 to-teal-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">Key Benefits</h2>
          <p className="text-xl text-teal-100">Why choose GrowFeed for your fish farm</p>
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
                <h3 className="text-xl font-semibold mb-2 text-white">{benefit.title}</h3>
                <p className="text-teal-100">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}