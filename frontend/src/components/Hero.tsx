import { Fish } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import DemoModal from './DemoModal'

export default function Hero() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  const handleGetStarted = () => {
    const pricingSection = document.querySelector('#pricing')
    if (pricingSection) {
      const navHeight = 64
      const elementPosition = pricingSection.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - navHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleViewDemo = () => {
    setIsDemoModalOpen(true)
  }

  return (
    <>
      <div id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-teal-900 to-blue-800 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ x: -100, y: Math.random() * 100 }}
              animate={{
                x: window.innerWidth + 100,
                y: Math.random() * 100,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                delay: i * 2,
              }}
            >
              <Fish className="text-white w-12 h-12" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Fish className="w-12 h-12 text-teal-400" />
              <h1 className="text-5xl font-bold text-white">GrowFeed</h1>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              Smart IoT Fish Feeding System
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Revolutionize your fish farming with our automated feeding system. Monitor water quality, automate feeding schedules, and optimize fish growth with IoT technology.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:from-teal-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-teal-500/20"
              >
                Get Started
              </button>
              <button 
                onClick={handleViewDemo}
                className="border-2 border-teal-400 text-teal-400 px-8 py-3 rounded-full font-semibold hover:bg-teal-400/10 transition-all transform hover:scale-105"
              >
                View Demo
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900 to-transparent"></div>
      </div>

      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </>
  )
}