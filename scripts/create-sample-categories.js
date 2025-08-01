require('dotenv').config({ path: '.env.local' });

async function createSampleCategories() {
  try {
    console.log('📋 Sample Menu Categories to Create:');
    console.log('=====================================\n');

    const sampleCategories = [
      {
        name: 'Appetizers',
        description: 'Starters and small plates to begin your meal',
        display_order: 1
      },
      {
        name: 'Main Course',
        description: 'Primary dishes and entrees',
        display_order: 2
      },
      {
        name: 'Biryani',
        description: 'Aromatic rice dishes with meat or vegetables',
        display_order: 3
      },
      {
        name: 'Breads',
        description: 'Fresh baked breads and rotis',
        display_order: 4
      },
      {
        name: 'Desserts',
        description: 'Sweet treats and traditional desserts',
        display_order: 5
      },
      {
        name: 'Beverages',
        description: 'Drinks, juices, and refreshments',
        display_order: 6
      },
      {
        name: 'Soups',
        description: 'Hot and cold soups',
        display_order: 7
      },
      {
        name: 'Salads',
        description: 'Fresh salads and healthy options',
        display_order: 8
      }
    ];

    sampleCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Display Order: ${category.display_order}`);
      console.log('');
    });

    console.log('📝 Instructions to create these categories:');
    console.log('===========================================');
    console.log('1. Go to your admin dashboard');
    console.log('2. Navigate to "Menu Categories" management');
    console.log('3. Click "Add Category" button');
    console.log('4. Add each category with the details above');
    console.log('5. Save each category');
    console.log('');
    console.log('🎯 Once categories are created, they will appear in the "Add Menu Item" dropdown!');
    console.log('');
    console.log('💡 Tip: You can also create categories through the API or directly in the database.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createSampleCategories()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 