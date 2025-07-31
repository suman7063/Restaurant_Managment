"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
  User, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Star,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import { Restaurant, User as UserType } from './types';
import { userService, restaurantService } from '../lib/database';
import { authService } from '../lib/auth';
import { Input, Select } from './ui';

const AnimatedOnboardingPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Animated progress value
  const progress = useMotionValue(0);
  const progressPercent = useTransform(progress, [0, 3], [0, 100]);

  // Restaurant details
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    cuisine_type: 'Indian',
    languages: ['en'] as string[],
    subscription_plan: 'starter' as 'starter' | 'professional' | 'enterprise'
  });

  // Admin user details
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const subscriptionPlans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '$99/month',
      icon: Star,
      color: 'from-blue-500 to-cyan-500',
      features: [
        'Up to 20 tables',
        'Basic menu management (up to 100 items)',
        'Single kitchen configuration',
        'QR code ordering',
        'Individual item delivery',
        'Basic analytics',
        'English + 1 local language',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      price: '$199/month',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      features: [
        'Up to 50 tables',
        'Advanced menu management (unlimited items)',
        'Multiple kitchen stations (up to 5)',
        'Advanced customizations and add-ons',
        'Real-time notifications',
        'Individual item delivery with special notes',
        'Detailed analytics and reporting',
        'English + 2 local languages',
        'Priority email + chat support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '$399/month',
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      features: [
        'Unlimited tables',
        'Unlimited menu items and kitchens',
        'Multi-location support',
        'Advanced analytics with custom reports',
        'All language options',
        'API access for integrations',
        'Dedicated account manager',
        'Phone + email + chat support'
      ]
    }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' }
  ];

  const cuisineTypes = [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 
    'Thai', 'Mediterranean', 'American', 'French', 'Korean'
  ];

  useEffect(() => {
    progress.set(currentStep - 1);
  }, [currentStep, progress]);

  const handleRestaurantChange = (field: string, value: string | string[]) => {
    setRestaurantData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAdminChange = (field: string, value: string) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLanguageToggle = (languageCode: string) => {
    const newLanguages = restaurantData.languages.includes(languageCode)
      ? restaurantData.languages.filter(lang => lang !== languageCode)
      : [...restaurantData.languages, languageCode];
    
    // Ensure English is always included
    if (!newLanguages.includes('en')) {
      newLanguages.push('en');
    }
    
    handleRestaurantChange('languages', newLanguages);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!restaurantData.name.trim()) errors.name = 'Restaurant name is required';
      if (!restaurantData.address.trim()) errors.address = 'Address is required';
      if (!restaurantData.phone.trim()) errors.phone = 'Phone number is required';
      if (!restaurantData.email.trim()) errors.email = 'Email is required';
      if (restaurantData.email && !/\S+@\S+\.\S+/.test(restaurantData.email)) {
        errors.email = 'Please enter a valid email';
      }
    }

    if (step === 2) {
      if (!adminData.name.trim()) errors.name = 'Admin name is required';
      if (!adminData.password) errors.password = 'Password is required';
      if (adminData.password && adminData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (adminData.password !== adminData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Create restaurant
      const restaurantPayload = {
        ...restaurantData,
        subscription_status: "active" as 'active',
      };
      const restaurant = await restaurantService.createRestaurant(restaurantPayload);
      if (!restaurant) throw new Error("Failed to create restaurant.");

      // 2. Create admin user with proper password hashing
      const admin = await authService.createStaffUser({
        name: adminData.name,
        email: restaurantData.email, // Use restaurant email for admin (as per form design)
        phone: restaurantData.phone, // Use restaurant phone for admin (as per form design)
        role: 'admin',
        restaurant_id: restaurant.id,
        language: (restaurant.languages[0] || "en") as 'en' | 'hi' | 'kn',
        temporary_password: adminData.password
      });
      if (!admin) throw new Error("Failed to create admin user.");

      setIsComplete(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      const err = error as Error;
      alert(err.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <style jsx>{`
        input, select {
          background: white !important;
          border: 2px solid #d1d5db !important;
          border-radius: 12px !important;
          padding: 16px !important;
          font-size: 16px !important;
          color: #111827 !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        
        input:focus, select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          outline: none !important;
        }
        
        input:hover, select:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        
        input::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
        
        label {
          font-weight: 600 !important;
          color: #1f2937 !important;
          margin-bottom: 12px !important;
          display: block !important;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Sparkles size={48} className="text-blue-500" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Restaurant Management System</h1>
            <p className="text-gray-600">Let&apos;s get your restaurant set up in minutes</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Step {currentStep} of 3</h2>
              <p className="text-gray-600">Configure your restaurant and admin account</p>
            </div>

            <div className="flex justify-center mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-semibold
                      ${step <= currentStep 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {step}
                  </motion.div>
                  {step < 3 && (
                    <motion.div
                      className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: step < currentStep ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                      type="text"
                      label="Restaurant Name *"
                      value={restaurantData.name}
                      onChange={(e) => handleRestaurantChange('name', e.target.value)}
                      placeholder="Enter restaurant name"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                    
                                        <Select
                      label="Cuisine Type"
                      value={restaurantData.cuisine_type}
                      onChange={(e) => handleRestaurantChange('cuisine_type', e.target.value)}
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    >
                      {cuisineTypes.map((cuisine) => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </Select>
                  </div>

                                    <Input
                    type="text"
                    label="Address *"
                    value={restaurantData.address}
                    onChange={(e) => handleRestaurantChange('address', e.target.value)}
                    placeholder="Enter full address"
                    className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="text"
                      label="City"
                      value={restaurantData.city}
                      onChange={(e) => handleRestaurantChange('city', e.target.value)}
                      placeholder="Enter city"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                    
                    <Input
                      type="text"
                      label="State"
                      value={restaurantData.state}
                      onChange={(e) => handleRestaurantChange('state', e.target.value)}
                      placeholder="Enter state"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="tel"
                      label="Phone Number *"
                      value={restaurantData.phone}
                      onChange={(e) => handleRestaurantChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                    
                    <Input
                      type="email"
                      label="Email Address *"
                      value={restaurantData.email}
                      onChange={(e) => handleRestaurantChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Languages
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {languages.map((lang) => {
                        const isSelected = restaurantData.languages.includes(lang.code);
                        const isEnglish = lang.code === 'en';
                        
                        return (
                          <motion.button
                            key={lang.code}
                            type="button"
                            onClick={() => !isEnglish && handleLanguageToggle(lang.code)}
                            disabled={isEnglish}
                            className={`
                              relative p-3 rounded-lg border-2 transition-all duration-300
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }
                              ${isEnglish ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                            `}
                            whileHover={!isEnglish ? { scale: 1.02, y: -2 } : {}}
                            whileTap={!isEnglish ? { scale: 0.98 } : {}}
                          >
                            <motion.div
                              animate={{ scale: isSelected ? 1 : 0 }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <CheckCircle size={14} className="text-white" />
                            </motion.div>
                            <div className="text-center">
                              <div className="text-2xl mb-1">{lang.flag}</div>
                              <div className="text-sm font-medium">{lang.name}</div>
                              {isEnglish && (
                                <div className="text-xs text-gray-500 mt-1">Required</div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      English is required and will be used as the default language
                    </p>
                  </div>
                </motion.div>
              )}

                             {currentStep === 2 && (
                 <motion.div
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                 >
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-center mb-8"
                   >
                     <motion.div
                       animate={{ y: [0, -5, 0] }}
                       transition={{ duration: 2, repeat: Infinity }}
                       className="inline-block mb-4"
                     >
                       <User size={48} className="text-purple-500" />
                     </motion.div>
                     <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Account Setup</h2>
                     <p className="text-gray-600">Create your admin account to manage the restaurant</p>
                   </motion.div>

                   <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                     <div className="flex items-center mb-4">
                       <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                         <CheckCircle size={20} className="text-white" />
                       </div>
                       <h3 className="text-lg font-semibold text-blue-800">Restaurant Information Complete</h3>
                     </div>
                     <p className="text-blue-700 text-sm">
                       We&apos;ll use the restaurant&apos;s contact information ({restaurantData.email}) for admin access. 
                       You can update this later in your admin settings.
                     </p>
                   </div>

                                     <Input
                    type="text"
                    label="Admin Full Name *"
                    value={adminData.name}
                    onChange={(e) => handleAdminChange('name', e.target.value)}
                    placeholder="Enter admin's full name"
                    className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                  />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <Input
                      type="password"
                      label="Admin Password *"
                      value={adminData.password}
                      onChange={(e) => handleAdminChange('password', e.target.value)}
                      placeholder="Create admin password"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                     
                                         <Input
                      type="password"
                      label="Confirm Password *"
                      value={adminData.confirmPassword}
                      onChange={(e) => handleAdminChange('confirmPassword', e.target.value)}
                      placeholder="Confirm admin password"
                      className="px-4 py-4 border-2 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white shadow-sm hover:shadow-md"
                    />
                   </div>

                   <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                     <div className="flex items-start">
                       <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
                         <span className="text-white text-xs">i</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-700 font-medium mb-1">Admin Account Details</p>
                         <p className="text-xs text-gray-600">
                           • Email: <span className="font-medium">{restaurantData.email}</span> (from restaurant setup)<br/>
                           • Phone: <span className="font-medium">{restaurantData.phone}</span> (from restaurant setup)<br/>
                           • You can change these later in admin settings
                         </p>
                       </div>
                     </div>
                   </div>
                 </motion.div>
               )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Choose Your Plan
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {subscriptionPlans.map((plan) => {
                        const isSelected = restaurantData.subscription_plan === plan.id;
                        const IconComponent = plan.icon;
                        
                        return (
                          <motion.div
                            key={plan.id}
                            onClick={() => handleRestaurantChange('subscription_plan', plan.id)}
                            className={`
                              relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                              ${isSelected 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl shadow-blue-500/20' 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                              }
                            `}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle size={20} className="text-white" />
                              </motion.div>
                            )}
                            
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                              <IconComponent size={24} className="text-white" />
                            </div>
                            
                            <h3 className="text-lg font-bold mb-2 text-gray-800">{plan.name}</h3>
                            <p className="text-2xl font-bold text-blue-600 mb-4">{plan.price}</p>
                            
                            <ul className="space-y-2">
                              {plan.features.slice(0, 4).map((feature, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-center text-sm text-gray-600"
                                >
                                  <CheckCircle size={14} className="text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200"
            >
              <motion.button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                  ${currentStep === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }
                `}
                whileHover={currentStep !== 1 ? { scale: 1.05 } : {}}
                whileTap={currentStep !== 1 ? { scale: 0.95 } : {}}
              >
                <ArrowLeft size={20} />
                Back
              </motion.button>

              <motion.button
                onClick={currentStep === 3 ? handleComplete : handleNext}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock size={20} />
                  </motion.div>
                ) : (
                  <>
                    {currentStep === 3 ? 'Complete Setup' : 'Next'}
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedOnboardingPage; 