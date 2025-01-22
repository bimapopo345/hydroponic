import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "399",
    description: "For small home hydroponic setups",
    features: [
      "Basic TDS/EC monitoring",
      "Manual nutrient adjustment",
      "Email support",
      "1 sensor station",
    ],
  },
  {
    name: "Professional",
    price: "799",
    description: "Ideal for medium-scale growers",
    features: [
      "Full TDS/EC/pH monitoring",
      "Automated nutrient dosing",
      "Real-time alerts",
      "Priority support",
      "Up to 3 sensor stations",
    ],
  },
  {
    name: "Enterprise",
    price: "1499",
    description: "For commercial operations",
    features: [
      "Complete automation suite",
      "Advanced analytics & AI",
      "Custom integrations",
      "24/7 dedicated support",
      "Unlimited sensor stations",
    ],
  },
];

export default function Pricing() {
  const handleGetStarted = (planName: string) => {
    localStorage.setItem("selectedPlan", planName);

    const contactSection = document.querySelector("#contact");
    if (contactSection) {
      const navHeight = 64;
      const elementPosition =
        contactSection.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your hydroponic setup
          </p>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
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
  );
}
