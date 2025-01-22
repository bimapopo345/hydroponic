import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Anna Widjaja",
    role: "Home Grower",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    content:
      "HidroNutrient helped me fine-tune the nutrient solution for my lettuce. They grow faster and taste better!",
  },
  {
    name: "Rahul Verma",
    role: "Commercial Farm Manager",
    image: "https://randomuser.me/api/portraits/men/13.jpg",
    content:
      "Our yields increased by 30% after installing their automated monitoring system. We can’t go back now!",
  },
  {
    name: "Luciana Perez",
    role: "Hydroponic Consultant",
    image: "https://randomuser.me/api/portraits/women/14.jpg",
    content:
      "Real-time TDS and pH tracking is a game-changer. It’s user-friendly and saves tons of labor hours.",
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
            Success stories from hydroponic enthusiasts worldwide
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
