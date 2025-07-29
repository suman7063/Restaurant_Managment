import { User, MenuItem, Order, Table, KitchenStation, Restaurant, SubscriptionPlan, MenuCustomization, MenuAddOn } from './types';

// Subscription Plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 99,
    max_tables: 20,
    max_menu_items: 100,
    max_kitchen_stations: 1,
    max_languages: 2,
    features: [
      'QR code ordering',
      'Individual item delivery',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: 199,
    max_tables: 50,
    max_menu_items: -1, // Unlimited
    max_kitchen_stations: 5,
    max_languages: 3,
    features: [
      'Advanced menu management',
      'Multiple kitchen stations',
      'Real-time notifications',
      'Detailed analytics',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 399,
    max_tables: -1, // Unlimited
    max_menu_items: -1, // Unlimited
    max_kitchen_stations: -1, // Unlimited
    max_languages: -1, // Unlimited
    features: [
      'Multi-location support',
      'Advanced analytics',
      'API access',
      'Dedicated account manager',
      'Phone support'
    ]
  }
];

// Sample Restaurant
export const sampleRestaurant: Restaurant = {
  id: 1,
  name: 'Spice Garden Restaurant',
  address: '123 Main Street, Bangalore, Karnataka',
  contact_number: '+91 98765 43210',
  email: 'info@spicegarden.com',
  subscription_plan: 'professional',
  enabled_languages: ['en', 'hi', 'kn'],
  max_tables: 50,
  max_menu_items: 200,
  max_kitchen_stations: 5,
  created_at: new Date(),
  updated_at: new Date()
};

// Kitchen Stations
export const kitchenStations: KitchenStation[] = [
  {
    id: 1,
    name: 'Main Kitchen',
    name_hi: 'मुख्य रसोई',
    name_kn: 'ಮುಖ್ಯ ಅಡುಗೆಮನೆ',
    cuisine_types: ['Indian', 'Continental'],
    assigned_staff: ['chef1', 'chef2'],
    is_active: true
  },
  {
    id: 2,
    name: 'Tandoor Station',
    name_hi: 'तंदूर स्टेशन',
    name_kn: 'ತಂದೂರ್ ಸ್ಟೇಷನ್',
    cuisine_types: ['Indian', 'Tandoor'],
    assigned_staff: ['chef3'],
    is_active: true
  },
  {
    id: 3,
    name: 'Dessert Station',
    name_hi: 'मिठाई स्टेशन',
    name_kn: 'ಅಡುಗೆ ಸ್ಟೇಷನ್',
    cuisine_types: ['Desserts', 'Beverages'],
    assigned_staff: ['chef4'],
    is_active: true
  }
];

// Menu Customizations
export const menuCustomizations: MenuCustomization[] = [
  {
    id: 1,
    name: 'Small (250gm)',
    name_hi: 'छोटा (250 ग्राम)',
    name_kn: 'ಚಿಕ್ಕದು (250 ಗ್ರಾಂ)',
    price_variation: 0,
    type: 'size'
  },
  {
    id: 2,
    name: 'Large (500gm)',
    name_hi: 'बड़ा (500 ग्राम)',
    name_kn: 'ದೊಡ್ಡದು (500 ಗ್ರಾಂ)',
    price_variation: 300,
    type: 'size'
  },
  {
    id: 3,
    name: 'Extra Spicy',
    name_hi: 'बहुत तीखा',
    name_kn: 'ಹೆಚ್ಚು ಮಸಾಲೆ',
    price_variation: 50,
    type: 'preparation'
  },
  {
    id: 4,
    name: 'Mild',
    name_hi: 'हल्का',
    name_kn: 'ಸೌಮ್ಯ',
    price_variation: 0,
    type: 'preparation'
  }
];

// Menu Add-ons
export const menuAddOns: MenuAddOn[] = [
  {
    id: 1,
    menu_item_id: 1,
    name: 'Extra Cheese',
    name_hi: 'अतिरिक्त पनीर',
    name_kn: 'ಹೆಚ್ಚುವರಿ ಚೀಸ್',
    price: 50,
    available: true
  },
  {
    id: 2,
    menu_item_id: 1,
    name: 'Extra Sauce',
    name_hi: 'अतिरिक्त सॉस',
    name_kn: 'ಹೆಚ್ಚುವರಿ ಸಾಸ್',
    price: 30,
    available: true
  },
  {
    id: 3,
    menu_item_id: 2,
    name: 'Double Portion',
    name_hi: 'दोहरा हिस्सा',
    name_kn: 'ದ್ವಿಗುಣ ಭಾಗ',
    price: 200,
    available: true
  }
];

// Menu Items with Multi-language Support
export const dummyMenu: MenuItem[] = [
  {
    id: 1,
    name: 'Butter Chicken',
    name_hi: 'मक्खन चिकन',
    name_kn: 'ಬೆಣ್ಣೆ ಕೋಳಿ',
    description: 'Creamy tomato-based curry with tender chicken',
    description_hi: 'मुलायम चिकन के साथ क्रीमी टमाटर आधारित करी',
    description_kn: 'ಮೃದುವಾದ ಕೋಳಿಮಾಂಸದೊಂದಿಗೆ ಕೆನೆ ಟೊಮೇಟೊ ಆಧಾರಿತ ಕರಿ',
    price: 499,
    category: 'Main Course',
    prepTime: 20,
    rating: 4.8,
    image: '/images/butter-chicken.jpg',
    popular: true,
    available: true,
    kitchen_stations: ['Main Kitchen'],
    is_veg: false,
    cuisine_type: 'Indian',
    customizations: [menuCustomizations[0], menuCustomizations[1], menuCustomizations[2], menuCustomizations[3]],
    add_ons: [menuAddOns[0], menuAddOns[1]]
  },
  {
    id: 2,
    name: 'Paneer Tikka',
    name_hi: 'पनीर टिक्का',
    name_kn: 'ಪನೀರ್ ಟಿಕ್ಕಾ',
    description: 'Marinated cottage cheese grilled to perfection',
    description_hi: 'मसालेदार पनीर को परफेक्शन तक ग्रिल किया गया',
    description_kn: 'ಮಸಾಲೆ ಪನೀರ್ ಪರಿಪೂರ್ಣತೆಗೆ ಗ್ರಿಲ್ ಮಾಡಲಾಗಿದೆ',
    price: 399,
    category: 'Appetizer',
    prepTime: 15,
    rating: 4.6,
    image: '/images/paneer-tikka.jpg',
    popular: true,
    available: true,
    kitchen_stations: ['Tandoor Station'],
    is_veg: true,
    cuisine_type: 'Indian',
    customizations: [menuCustomizations[2], menuCustomizations[3]],
    add_ons: [menuAddOns[1]]
  },
  {
    id: 3,
    name: 'Biryani',
    name_hi: 'बिरयानी',
    name_kn: 'ಬಿರಿಯಾನಿ',
    description: 'Aromatic rice dish with tender meat and spices',
    description_hi: 'मुलायम मांस और मसालों के साथ सुगंधित चावल का व्यंजन',
    description_kn: 'ಮೃದುವಾದ ಮಾಂಸ ಮತ್ತು ಮಸಾಲೆಗಳೊಂದಿಗೆ ಸುಗಂಧಿತ ಅಕ್ಕಿ ಖಾದ್ಯ',
    price: 599,
    category: 'Main Course',
    prepTime: 25,
    rating: 4.9,
    image: '/images/biryani.jpg',
    popular: true,
    available: true,
    kitchen_stations: ['Main Kitchen'],
    is_veg: false,
    cuisine_type: 'Indian',
    customizations: [menuCustomizations[0], menuCustomizations[1], menuCustomizations[2], menuCustomizations[3]],
    add_ons: [menuAddOns[2]]
  },
  {
    id: 4,
    name: 'Gulab Jamun',
    name_hi: 'गुलाब जामुन',
    name_kn: 'ಗುಲಾಬ್ ಜಾಮೂನ್',
    description: 'Sweet milk solids soaked in rose-flavored syrup',
    description_hi: 'गुलाब के स्वाद वाले सिरप में भिगोए गए मीठे दूध के ठोस',
    description_kn: 'ಗುಲಾಬಿ ರುಚಿಯ ಸಿರಪ್ನಲ್ಲಿ ನೆನೆಸಿದ ಸಿಹಿ ಹಾಲಿನ ಘನ',
    price: 199,
    category: 'Dessert',
    prepTime: 10,
    rating: 4.5,
    image: '/images/gulab-jamun.jpg',
    popular: false,
    available: true,
    kitchen_stations: ['Dessert Station'],
    is_veg: true,
    cuisine_type: 'Indian',
    customizations: [menuCustomizations[0], menuCustomizations[1]],
    add_ons: []
  },
  {
    id: 5,
    name: 'Masala Dosa',
    name_hi: 'मसाला दोसा',
    name_kn: 'ಮಸಾಲೆ ದೋಸೆ',
    description: 'Crispy rice crepe filled with spiced potato mixture',
    description_hi: 'मसालेदार आलू के मिश्रण से भरी कुरकुरी चावल की क्रेप',
    description_kn: 'ಮಸಾಲೆ ಆಲೂಗಡ್ಡೆ ಮಿಶ್ರಣದಿಂದ ತುಂಬಿದ ಕ್ರಿಸ್ಪಿ ಅಕ್ಕಿ ಕ್ರೆಪ್',
    price: 299,
    category: 'Breakfast',
    prepTime: 12,
    rating: 4.7,
    image: '/images/masala-dosa.jpg',
    popular: true,
    available: true,
    kitchen_stations: ['Main Kitchen'],
    is_veg: true,
    cuisine_type: 'South Indian',
    customizations: [menuCustomizations[2], menuCustomizations[3]],
    add_ons: [menuAddOns[1]]
  }
];

// Users with QR codes and roles
export const dummyUsers: Record<string, User> = {
  'TABLE001': {
    id: 1,
    name: 'Table 1',
    table: 1,
    role: 'customer',
    qr_code: 'TABLE001',
    language: 'en'
  },
  'TABLE002': {
    id: 2,
    name: 'Table 2',
    table: 2,
    role: 'customer',
    qr_code: 'TABLE002',
    language: 'hi'
  },
  'TABLE003': {
    id: 3,
    name: 'Table 3',
    table: 3,
    role: 'customer',
    qr_code: 'TABLE003',
    language: 'kn'
  },
  'ADMIN001': {
    id: 4,
    name: 'Restaurant Admin',
    role: 'admin',
    qr_code: 'ADMIN001',
    language: 'en'
  },
  'WAITER001': {
    id: 5,
    name: 'Sarah Waiter',
    role: 'waiter',
    qr_code: 'WAITER001',
    language: 'en'
  },
  'WAITER002': {
    id: 6,
    name: 'Priya Waiter',
    role: 'waiter',
    qr_code: 'WAITER002',
    language: 'hi'
  },
  'CHEF001': {
    id: 7,
    name: 'Chef Rajesh',
    role: 'chef',
    qr_code: 'CHEF001',
    language: 'hi',
    kitchen_station: 'Main Kitchen'
  },
  'CHEF002': {
    id: 8,
    name: 'Chef Maria',
    role: 'chef',
    qr_code: 'CHEF002',
    language: 'en',
    kitchen_station: 'Tandoor Station'
  },
  'CHEF003': {
    id: 9,
    name: 'Chef Lakshmi',
    role: 'chef',
    qr_code: 'CHEF003',
    language: 'kn',
    kitchen_station: 'Dessert Station'
  }
};

// Sample Tables
export const initialTables: Table[] = [
  {
    id: 1,
    table_number: 1,
    status: 'available',
    waiter_id: undefined,
    waiter_name: undefined,
    guests: 0,
    revenue: 0,
    qr_code: 'TABLE001',
    current_orders: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    table_number: 2,
    status: 'occupied',
    waiter_id: 'WAITER001',
    waiter_name: 'Sarah Waiter',
    guests: 4,
    revenue: 0,
    qr_code: 'TABLE002',
    current_orders: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    table_number: 3,
    status: 'needs_reset',
    waiter_id: 'WAITER002',
    waiter_name: 'Priya Waiter',
    guests: 0,
    revenue: 0,
    qr_code: 'TABLE003',
    current_orders: [],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Sample Orders with Individual Item Tracking
export const initialOrders: Order[] = [
  { 
    id: 1, 
    table: 2,
    customer_name: 'John Doe',
    customer_phone: '+91 98765 43210',
    items: [
      {
        id: 1,
        order_id: 1,
        menu_item: dummyMenu[0], // Butter Chicken
        quantity: 2,
        special_notes: 'Less spicy, extra sauce on side',
        selected_customization: menuCustomizations[1], // Large
        selected_add_ons: [menuAddOns[1]], // Extra Sauce
    status: 'preparing', 
        kitchen_station: 'Main Kitchen',
        preparation_start_time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        price_at_time: 799
  },
  { 
    id: 2, 
        order_id: 1,
        menu_item: dummyMenu[1], // Paneer Tikka
        quantity: 1,
        special_notes: 'Well done',
        selected_customization: undefined,
        selected_add_ons: [],
        status: 'prepared',
        kitchen_station: 'Tandoor Station',
        preparation_start_time: new Date(Date.now() - 8 * 60 * 1000),
        preparation_end_time: new Date(Date.now() - 2 * 60 * 1000),
        price_at_time: 399
      }
    ],
    status: 'active',
    waiter_id: 'WAITER001',
    waiter_name: 'Sarah Waiter',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    total: 1997,
    estimated_time: 25,
    is_joined_order: false
  }
];

// Language translations for common UI elements
export const translations = {
  en: {
    // Common
    'order_received': 'Order Received',
    'preparing': 'Preparing',
    'prepared': 'Ready for Delivery',
    'delivered': 'Delivered',
    'add_to_cart': 'Add to Cart',
    'place_order': 'Place Order',
    'total': 'Total',
    'quantity': 'Quantity',
    'special_notes': 'Special Notes',
    'customize': 'Customize',
    'add_ons': 'Add-ons',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'back': 'Back',
    'next': 'Next',
    'save': 'Save',
    'edit': 'Edit',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'warning': 'Warning',
    'info': 'Info',
    
    // Menu Categories
    'appetizer': 'Appetizer',
    'main_course': 'Main Course',
    'dessert': 'Dessert',
    'beverage': 'Beverage',
    'breakfast': 'Breakfast',
    
    // Status Messages
    'order_placed': 'Order placed successfully!',
    'item_added': 'Item added to cart!',
    'item_removed': 'Item removed from cart',
    'order_updated': 'Order status updated',
    'table_reset': 'Table reset successfully',
    
    // Kitchen Messages
    'new_order_received': 'New order received',
    'item_ready': 'Item ready for delivery',
    'order_complete': 'Order complete',
    
    // Waiter Messages
    'item_to_deliver': 'Item ready for delivery',
    'delivery_complete': 'Delivery completed',
    
    // Customer Messages
    'welcome': 'Welcome to Spice Garden',
    'scan_qr': 'Scan QR code to order',
    'join_order': 'Join existing order',
    'start_new_order': 'Start new order',
    'track_order': 'Track your order',
    'order_status': 'Order Status'
  },
  hi: {
    // Common
    'order_received': 'ऑर्डर प्राप्त',
    'preparing': 'तैयार हो रहा है',
    'prepared': 'डिलीवरी के लिए तैयार',
    'delivered': 'डिलीवर किया गया',
    'add_to_cart': 'कार्ट में जोड़ें',
    'place_order': 'ऑर्डर करें',
    'total': 'कुल',
    'quantity': 'मात्रा',
    'special_notes': 'विशेष नोट्स',
    'customize': 'कस्टमाइज़ करें',
    'add_ons': 'अतिरिक्त आइटम',
    'submit': 'सबमिट करें',
    'cancel': 'रद्द करें',
    'back': 'वापस',
    'next': 'अगला',
    'save': 'सहेजें',
    'edit': 'संपादित करें',
    'delete': 'हटाएं',
    'confirm': 'पुष्टि करें',
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफलता',
    'warning': 'चेतावनी',
    'info': 'जानकारी',
    
    // Menu Categories
    'appetizer': 'शुरुआती',
    'main_course': 'मुख्य पाठ्यक्रम',
    'dessert': 'मिठाई',
    'beverage': 'पेय',
    'breakfast': 'नाश्ता',
    
    // Status Messages
    'order_placed': 'ऑर्डर सफलतापूर्वक रखा गया!',
    'item_added': 'आइटम कार्ट में जोड़ा गया!',
    'item_removed': 'आइटम कार्ट से हटा दिया गया',
    'order_updated': 'ऑर्डर स्थिति अपडेट की गई',
    'table_reset': 'टेबल सफलतापूर्वक रीसेट किया गया',
    
    // Kitchen Messages
    'new_order_received': 'नया ऑर्डर प्राप्त हुआ',
    'item_ready': 'आइटम डिलीवरी के लिए तैयार',
    'order_complete': 'ऑर्डर पूरा हुआ',
    
    // Waiter Messages
    'item_to_deliver': 'डिलीवरी के लिए आइटम तैयार',
    'delivery_complete': 'डिलीवरी पूरी हुई',
    
    // Customer Messages
    'welcome': 'स्पाइस गार्डन में आपका स्वागत है',
    'scan_qr': 'ऑर्डर करने के लिए QR कोड स्कैन करें',
    'join_order': 'मौजूदा ऑर्डर में शामिल हों',
    'start_new_order': 'नया ऑर्डर शुरू करें',
    'track_order': 'अपना ऑर्डर ट्रैक करें',
    'order_status': 'ऑर्डर स्थिति'
  },
  kn: {
    // Common
    'order_received': 'ಆರ್ಡರ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    'preparing': 'ತಯಾರಾಗುತ್ತಿದೆ',
    'prepared': 'ವಿತರಣೆಗೆ ಸಿದ್ಧ',
    'delivered': 'ವಿತರಿಸಲಾಗಿದೆ',
    'add_to_cart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    'place_order': 'ಆರ್ಡರ್ ಮಾಡಿ',
    'total': 'ಒಟ್ಟು',
    'quantity': 'ಪರಿಮಾಣ',
    'special_notes': 'ವಿಶೇಷ ಟಿಪ್ಪಣಿಗಳು',
    'customize': 'ಕಸ್ಟಮೈಸ್ ಮಾಡಿ',
    'add_ons': 'ಹೆಚ್ಚುವರಿ ವಸ್ತುಗಳು',
    'submit': 'ಸಲ್ಲಿಸಿ',
    'cancel': 'ರದ್ದುಮಾಡಿ',
    'back': 'ಹಿಂದೆ',
    'next': 'ಮುಂದೆ',
    'save': 'ಉಳಿಸಿ',
    'edit': 'ಸಂಪಾದಿಸಿ',
    'delete': 'ಅಳಿಸಿ',
    'confirm': 'ದೃಢೀಕರಿಸಿ',
    'loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'error': 'ದೋಷ',
    'success': 'ಯಶಸ್ವಿ',
    'warning': 'ಎಚ್ಚರಿಕೆ',
    'info': 'ಮಾಹಿತಿ',
    
    // Menu Categories
    'appetizer': 'ಆರಂಭಿಕ',
    'main_course': 'ಮುಖ್ಯ ಕೋರ್ಸ್',
    'dessert': 'ಅಡುಗೆ',
    'beverage': 'ಪಾನೀಯ',
    'breakfast': 'ಅಲ್ಪಾಹಾರ',
    
    // Status Messages
    'order_placed': 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಇಡಲಾಗಿದೆ!',
    'item_added': 'ಐಟಂ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!',
    'item_removed': 'ಐಟಂ ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
    'order_updated': 'ಆರ್ಡರ್ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ',
    'table_reset': 'ಟೇಬಲ್ ಯಶಸ್ವಿಯಾಗಿ ರೀಸೆಟ್ ಮಾಡಲಾಗಿದೆ',
    
    // Kitchen Messages
    'new_order_received': 'ಹೊಸ ಆರ್ಡರ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    'item_ready': 'ವಿತರಣೆಗೆ ಐಟಂ ಸಿದ್ಧ',
    'order_complete': 'ಆರ್ಡರ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
    
    // Waiter Messages
    'item_to_deliver': 'ವಿತರಣೆಗೆ ಐಟಂ ಸಿದ್ಧ',
    'delivery_complete': 'ವಿತರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    
    // Customer Messages
    'welcome': 'ಸ್ಪೈಸ್ ಗಾರ್ಡನ್‌ಗೆ ಸುಸ್ವಾಗತ',
    'scan_qr': 'ಆರ್ಡರ್ ಮಾಡಲು QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    'join_order': 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಆರ್ಡರ್‌ಗೆ ಸೇರಿ',
    'start_new_order': 'ಹೊಸ ಆರ್ಡರ್ ಪ್ರಾರಂಭಿಸಿ',
    'track_order': 'ನಿಮ್ಮ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    'order_status': 'ಆರ್ಡರ್ ಸ್ಥಿತಿ'
  }
}; 