import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "John Smith",
    role: "Fish Farm Owner",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    content:
      "GrowFeed has transformed our operations. We've seen a 40% increase in efficiency and significant cost savings.",
  },
  {
    name: "Maria Garcia",
    role: "Aquaculture Specialist",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    content:
      "The smart monitoring system is incredible. It's like having an expert watching over your fish 24/7.",
  },
  {
    name: "David Chen",
    role: "Commercial Farm Manager",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    content:
      "Implementation was smooth and the results were immediate. Our fish health has never been better.",
  },
];

export default function Testimonials() {
  return (
    <div className="py-20 bg-gray-50" id="testimonials">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600">
            Success stories from fish farms worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-100" />
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{testimonial.content}</p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
