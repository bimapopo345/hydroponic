import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

const plans = [
  {
    name: "Starter",
    price: "499",
    description: "Perfect for small fish farms",
    features: [
      "Basic feeding automation",
      "Temperature monitoring",
      "Mobile app access",
      "Email support",
      "1 feeding station"
    ]
  },
  {
    name: "Professional",
    price: "999",
    description: "Ideal for medium-sized operations",
    features: [
      "Advanced feeding automation",
      "Full environmental monitoring",
      "Real-time analytics",
      "Priority support",
      "Up to 3 feeding stations"
    ]
  },
  {
    name: "Enterprise",
    price: "1999",
    description: "For large commercial farms",
    features: [
      "Complete automation suite",
      "Advanced analytics & AI",
      "Custom integration",
      "24/7 dedicated support",
      "Unlimited feeding stations"
    ]
  }
]

export default function Pricing() {
  const handleGetStarted = (planName: string) => {
    // Save selected plan to localStorage
    localStorage.setItem('selectedPlan', planName)
    
    // Scroll to contact form
    const contactSection = document.querySelector('#contact')
    if (contactSection) {
      const navHeight = 64
      const elementPosition = contactSection.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - navHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the perfect plan for your farm</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border rounded-xl p-8 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted(plan.name)}
                className="w-full btn-primary"
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}