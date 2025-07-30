"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  User, 
  CreditCard, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Globe,
  Users,
  Settings
} from 'lucide-react';
import { Restaurant, User as UserType, SubscriptionPlan } from './types';
import { userService, restaurantService, testSupabaseConnection, testUsersTable } from '../lib/database';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [adminQRCode, setAdminQRCode] = useState('');
  
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

  const handleRestaurantChange = (field: string, value: string | string[]) => {
    console.log(`Restaurant field ${field} changed to:`, value);
    setRestaurantData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdminChange = (field: string, value: string) => {
    console.log(`Admin field ${field} changed to:`, value);
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (language: string) => {
    setRestaurantData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(
          restaurantData.name && restaurantData.address && restaurantData.phone && restaurantData.email &&
          adminData.name && adminData.password && adminData.password === adminData.confirmPassword
        );
      case 2:
        return Boolean(restaurantData.subscription_plan);
      case 3:
        return true; // Review step
      default:
        return true;
    }
  };

  const handleNext = () => {
    console.log('Current step:', currentStep);
    console.log('Restaurant data:', restaurantData);
    console.log('Admin data:', adminData);
    console.log('Step validation:', validateStep(currentStep));
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      console.log('Starting restaurant creation...');
      console.log('Restaurant data to save:', restaurantData);
      
      // Create restaurant first
      const newRestaurantData = {
        name: restaurantData.name,
        address: restaurantData.address,
        city: restaurantData.city,
        state: restaurantData.state,
        phone: restaurantData.phone,
        email: restaurantData.email,
        cuisine_type: restaurantData.cuisine_type,
        languages: restaurantData.languages,
        subscription_plan: restaurantData.subscription_plan,
        subscription_status: 'active' as const
      };

      console.log('Calling restaurantService.createRestaurant...');
      const createdRestaurant = await restaurantService.createRestaurant(newRestaurantData);
      console.log('Restaurant creation result:', createdRestaurant);
      
      if (createdRestaurant) {
        console.log('Restaurant created successfully, creating admin user...');
        // Create admin user
        const adminUser: Omit<UserType, 'id'> & { password: string } = {
          name: adminData.name,
          email: restaurantData.email,
          phone: restaurantData.phone,
          role: 'admin',
          qr_code: `ADMIN_${Date.now()}`,
          language: restaurantData.languages[0] as 'en' | 'hi' | 'kn',
          kitchen_station: undefined,
          table: undefined,
          password: adminData.password
        };

        console.log('Admin user data to create:', adminUser);
        console.log('Validating admin user data...');
        
        // Validate required fields
        if (!adminUser.name || !adminUser.email || !adminUser.phone || !adminUser.qr_code) {
          console.error('Missing required admin user fields:', {
            name: !!adminUser.name,
            email: !!adminUser.email,
            phone: !!adminUser.phone,
            qr_code: !!adminUser.qr_code
          });
          throw new Error('Missing required admin user fields');
        }

        console.log('Calling userService.createUser...');
        const createdUser = await userService.createUser(adminUser);
        console.log('User creation result:', createdUser);
        
        if (createdUser) {
          console.log('Both restaurant and user created successfully!');
          setAdminQRCode(createdUser.qr_code);
          setIsComplete(true);
          // Redirect to admin login page after a short delay to show success message
          setTimeout(() => {
            router.push('/admin/login');
          }, 3000);
        } else {
          throw new Error('Failed to create admin user');
        }
      } else {
        throw new Error('Failed to create restaurant');
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      alert(`Error creating restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    console.log('Testing Supabase connection...');
    const result = await testSupabaseConnection();
    console.log('Connection test result:', result);
    alert(result.success ? 'Supabase connection successful!' : `Connection failed: ${result.error}`);
  };

  const handleTestUsersTable = async () => {
    console.log('Testing users table...');
    const result = await testUsersTable();
    console.log('Users table test result:', result);
    alert(result.success ? 'Users table accessible!' : `Users table error: ${result.error}`);
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Restaurant Information Section */}
      <div className="space-y-6">
        <div className="text-center">
          <Building2 className="mx-auto w-12 h-12 text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Restaurant & Admin Setup</h2>
          <p className="text-gray-600 mt-2">Configure your restaurant and admin account</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
              <input
                type="text"
                required
                value={restaurantData.name}
                onChange={(e) => handleRestaurantChange('name', e.target.value)}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter restaurant name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
              <select
                value={restaurantData.cuisine_type}
                onChange={(e) => handleRestaurantChange('cuisine_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="American">American</option>
                <option value="Thai">Thai</option>
                <option value="Japanese">Japanese</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                value={restaurantData.address}
                onChange={(e) => handleRestaurantChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={restaurantData.city}
                onChange={(e) => handleRestaurantChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={restaurantData.state}
                onChange={(e) => handleRestaurantChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter state"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={restaurantData.phone}
                onChange={(e) => handleRestaurantChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={restaurantData.email}
                onChange={(e) => handleRestaurantChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', name: 'English' },
                { code: 'hi', name: 'Hindi' },
                { code: 'kn', name: 'Kannada' }
              ].map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageToggle(lang.code)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    restaurantData.languages.includes(lang.code)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">English is required and will be used as the default language</p>
          </div>
        </div>

        {/* Admin Account Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h3>
          <p className="text-sm text-gray-600 mb-4">The admin account will use the same contact information as the restaurant.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => handleAdminChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => handleAdminChange('password', e.target.value)}
                className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Create a password"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={adminData.confirmPassword}
                onChange={(e) => handleAdminChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm your password"
              />
              {adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );



  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="mx-auto w-12 h-12 text-indigo-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select the plan that best fits your restaurant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              restaurantData.subscription_plan === plan.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleRestaurantChange('subscription_plan', plan.id)}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-indigo-600">{plan.price}</p>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto w-12 h-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Ready to Get Started!</h2>
        <p className="text-gray-600 mt-2">Review your information and complete setup</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="text-black">
          <h3 className="font-semibold text-gray-900 mb-2">Restaurant Details</h3>
          <p><strong>Name:</strong> {restaurantData.name}</p>
          <p><strong>Address:</strong> {restaurantData.address}</p>
          <p><strong>Phone:</strong> {restaurantData.phone}</p>
          <p><strong>Email:</strong> {restaurantData.email}</p>
          <p><strong>Cuisine:</strong> {restaurantData.cuisine_type}</p>
          <p><strong>Languages:</strong> {restaurantData.languages.map(l => l.toUpperCase()).join(', ')}</p>
        </div>

        <div className="text-black">
          <h3 className="font-semibold text-gray-900 mb-2">Admin Account</h3>
          <p><strong>Name:</strong> {adminData.name}</p>
          <p><strong>Email:</strong> {restaurantData.email}</p>
          <p><strong>Phone:</strong> {restaurantData.phone}</p>
        </div>

        <div className="text-black">
          <h3 className="font-semibold text-gray-900 mb-2">Subscription Plan</h3>
          <p><strong>Plan:</strong> {subscriptionPlans.find(p => p.id === restaurantData.subscription_plan)?.name}</p>
          <p><strong>Price:</strong> {subscriptionPlans.find(p => p.id === restaurantData.subscription_plan)?.price}</p>
        </div>
      </div>
    </div>
  );

  const renderSuccessScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Setup Complete!</h2>
        <p className="text-gray-600 mb-6">
          Your restaurant has been successfully configured. You can now access the system using your admin QR code.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Your Admin QR Code:</p>
          <p className="text-lg font-mono text-gray-900 bg-white p-2 rounded border">{adminQRCode}</p>
        </div>
        
        <div className="space-y-3 text-sm text-gray-600">
          <p>✅ Restaurant profile created</p>
          <p>✅ Admin account configured</p>
          <p>✅ Subscription plan activated</p>
          <p>✅ System ready for use</p>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Next:</strong> You&apos;ll be redirected to the main system where you can scan QR codes to access different interfaces.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep3(); // Subscription plan selection
      case 3:
        return renderStep4(); // Review step
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isComplete ? (
        renderSuccessScreen()
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Progress indicator */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Step {currentStep} of 3</p>
            </div>
          </div>

          {/* Step content */}
          <div className="max-w-2xl mx-auto">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          <div className="max-w-2xl mx-auto mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading || !validateStep(currentStep)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage; 