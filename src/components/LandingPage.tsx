"use client"
import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Users, 
  Clock, 
  Globe, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Building2,
  Smartphone,
  BarChart3,
  Shield,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartOnboarding }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const features = [
    {
      icon: QrCode,
      title: "QR Code Ordering",
      description: "Customers scan QR codes to order instantly from their table",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Track order status in real-time with instant notifications",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Support for English, Hindi, and Kannada languages",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Individual Item Delivery",
      description: "Deliver items as soon as they're ready, not waiting for entire orders",
      color: "from-orange-500 to-red-500"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Faster Service",
      description: "Reduce order processing time by 60%"
    },
    {
      icon: BarChart3,
      title: "Better Analytics",
      description: "Track performance with detailed insights"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your data"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Works perfectly on all devices"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      restaurant: "Spice Garden",
      rating: 5,
      text: "This system transformed our restaurant operations. Orders are 3x faster now!"
    },
    {
      name: "Priya Sharma",
      restaurant: "Taste of India",
      rating: 5,
      text: "The multi-language support helps our staff communicate better with customers."
    },
    {
      name: "Amit Patel",
      restaurant: "Royal Dhaba",
      rating: 5,
      text: "Individual item delivery is a game-changer. Our customers love it!"
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [180, 360, 180],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 sm:p-6 bg-gradient-to-r from-slate-900/90 to-purple-900/90 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          <span className="text-lg sm:text-xl font-bold text-white">RestaurantPro</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 sm:space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/admin/login'}
            className="text-white hover:text-gray-300 transition-colors px-2 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-white/10 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Admin Login</span>
            <span className="sm:hidden">Login</span>
          </motion.button>
          
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 text-center pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6"
          >
            Transform Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Restaurant
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
          >
            The complete restaurant management system with QR ordering, real-time tracking, 
            and multi-language support for modern restaurants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartOnboarding}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl w-full sm:w-auto"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 w-full sm:w-auto"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Choose RestaurantPro?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Built specifically for Indian restaurants with features that matter most to your business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 text-center hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  {React.createElement(benefit.icon, { className: "w-6 h-6 sm:w-8 sm:h-8 text-white" })}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm sm:text-base text-gray-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Interactive Feature Showcase */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
              Everything you need to run a modern restaurant efficiently.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="text-center px-4"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r ${features[currentFeature].color} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
                      {React.createElement(features[currentFeature].icon, { className: "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" })}
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">{features[currentFeature].title}</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-300">{features[currentFeature].description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Feature Indicators */}
              <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
                {features.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                      index === currentFeature ? 'bg-white scale-125' : 'bg-white/30'
                    }`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6 order-1 lg:order-2"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    currentFeature === index ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {React.createElement(feature.icon, { className: "w-5 h-5 sm:w-6 sm:h-6 text-white" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-white">{feature.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Loved by Restaurant Owners
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
              See what our customers have to say about RestaurantPro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{testimonial.restaurant}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-6 sm:p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of restaurants already using RestaurantPro to streamline their operations 
              and improve customer satisfaction.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartOnboarding}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-full text-base sm:text-lg lg:text-xl font-semibold flex items-center space-x-2 sm:space-x-3 mx-auto hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl w-full sm:w-auto"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform" />
            </motion.button>
            
            <p className="text-gray-400 mt-4 text-sm sm:text-base">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="text-base sm:text-lg font-semibold text-white">RestaurantPro</span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            © 2024 RestaurantPro. All rights reserved. Made with ❤️ for Indian restaurants.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 