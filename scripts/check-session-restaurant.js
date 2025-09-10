const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSessionRestaurant() {
  try {
    console.log('🔍 Checking Session Restaurant IDs...\n');

    // Get all sessions with their restaurant_id
    const { data: sessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('id, session_otp, status, restaurant_id, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions:`);
    sessions?.forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: OTP ${session.session_otp}, Status: ${session.status}, Restaurant: ${session.restaurant_id}`);
    });

    // Get unique restaurant IDs
    const restaurantIds = [...new Set(sessions?.map(s => s.restaurant_id) || [])];
    console.log('\n📋 Unique Restaurant IDs:');
    restaurantIds.forEach(id => {
      const sessionCount = sessions?.filter(s => s.restaurant_id === id).length || 0;
      console.log(`- ${id}: ${sessionCount} sessions`);
    });

    // Test admin sessions API with the actual restaurant ID
    if (restaurantIds.length > 0) {
      const actualRestaurantId = restaurantIds[0];
      console.log(`\n🧪 Testing admin sessions API with restaurant ID: ${actualRestaurantId}`);
      
      const { data: testSessions, error: testError } = await supabase
        .from('table_sessions')
        .select(`
          *,
          restaurant_tables (
            table_number,
            qr_code
          )
        `)
        .eq('restaurant_id', actualRestaurantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (testError) {
        console.error('❌ Error testing with actual restaurant ID:', testError);
      } else {
        console.log(`✅ Found ${testSessions?.length || 0} sessions for restaurant ${actualRestaurantId}`);
        testSessions?.forEach(session => {
          console.log(`- Session ${session.id.slice(0, 8)}...: OTP ${session.session_otp}, Status: ${session.status}`);
        });
      }
    }

    console.log('\n🎉 Session Restaurant ID Check Complete!');
    console.log('\n📋 Summary:');
    console.log(`- Total Sessions: ${sessions?.length || 0}`);
    console.log(`- Unique Restaurants: ${restaurantIds.length}`);
    console.log(`- Restaurant IDs: ${restaurantIds.join(', ')}`);

  } catch (error) {
    console.error('Error checking session restaurant:', error);
  }
}

checkSessionRestaurant();

