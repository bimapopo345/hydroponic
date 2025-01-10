import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">GrowFeed Demo</h2>
            
            {/* Demo video */}
            <div className="aspect-video mb-6 bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with your actual demo video
                title="GrowFeed Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Demo features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Key Features Demo:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Automated Feeding System</h4>
                  <p className="text-gray-600">Watch how our smart system dispenses feed at optimal times.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Real-time Monitoring</h4>
                  <p className="text-gray-600">See live water quality and environmental data tracking.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Mobile App Control</h4>
                  <p className="text-gray-600">Control and monitor your system from anywhere.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Data Analytics</h4>
                  <p className="text-gray-600">View comprehensive reports and insights.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Ready to Get Started?
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}