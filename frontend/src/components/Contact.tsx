import { Mail, Phone, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Message {
  name: string;
  email: string;
  message: string;
  date: string;
  plan?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Get selected plan from localStorage when component mounts
    const plan = localStorage.getItem('selectedPlan');
    setSelectedPlan(plan);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get existing messages from localStorage
    const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    
    // Create new message
    const newMessage: Message = {
      ...formData,
      date: new Date().toISOString(),
      plan: selectedPlan || undefined
    };
    
    // Save to localStorage
    localStorage.setItem('contactMessages', JSON.stringify([...existingMessages, newMessage]));
    
    // Show success state
    setSubmitted(true);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      message: ''
    });

    // Clear selected plan from localStorage
    localStorage.removeItem('selectedPlan');
    setSelectedPlan(null);

    // Reset success message after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-xl text-gray-600">
            {selectedPlan 
              ? `Complete your ${selectedPlan} plan registration`
              : "Learn more about GrowFeed smart feeding solutions"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Email Us</h3>
                <p className="text-gray-600">info@growfeed.tech</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Call Us</h3>
                <p className="text-gray-600">+62 123 456 7890</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Visit Us</h3>
                <p className="text-gray-600">Jakarta, Indonesia</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitted && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Message sent successfully!</span>
              </div>
            )}
            
            {selectedPlan && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">Selected plan: {selectedPlan}</span>
              </div>
            )}
            
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={selectedPlan 
                ? "Tell us about your fish farm and specific requirements..."
                : "Your Message"
              }
              required
              rows={4}
              className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            ></textarea>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {selectedPlan ? 'Complete Registration' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}