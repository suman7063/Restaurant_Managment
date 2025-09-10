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

async function checkSessionDataSource() {
  try {
    console.log('🔍 Checking Session Data Source...\n');

    // 1. Get real sessions from database
    console.log('1. Real sessions in database:');
    const { data: realSessions, error: realError } = await supabase
      .from('table_sessions')
      .select(`
        id,
        session_otp,
        status,
        total_amount,
        created_at,
        restaurant_tables (
          table_number
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (realError) {
      console.error('❌ Error fetching real sessions:', realError);
      return;
    }

    console.log(`✅ Found ${realSessions?.length || 0} real sessions in database:`);
    realSessions?.forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: OTP ${session.session_otp}, Status: ${session.status}, ₹${session.total_amount || 0}, Table: ${session.restaurant_tables?.table_number || 'Unknown'}`);
    });

    // 2. Check what the admin API would return
    console.log('\n2. What admin API would return:');
    const { data: adminSessions, error: adminError } = await supabase
      .from('table_sessions')
      .select(`
        *,
        restaurant_tables (
          table_number,
          qr_code
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (adminError) {
      console.error('❌ Error fetching admin sessions:', adminError);
    } else {
      console.log(`✅ Admin API would return ${adminSessions?.length || 0} sessions`);
      
      const activeSessions = adminSessions?.filter(s => s.status === 'active') || [];
      const totalRevenue = adminSessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
      
      console.log(`- Active Sessions: ${activeSessions.length}`);
      console.log(`- Total Revenue: ₹${totalRevenue}`);
    }

    // 3. Check for mock data patterns
    console.log('\n3. Checking for mock data patterns:');
    const mockPatterns = [
      'session-1', 'session-2', 'session-3',
      'table-1', 'table-3', 'table-5',
      '123456', '789012', '345678'
    ];

    const hasMockData = realSessions?.some(session => 
      mockPatterns.some(pattern => 
        session.id === pattern || 
        session.session_otp === pattern ||
        session.restaurant_tables?.table_number === pattern
      )
    );

    if (hasMockData) {
      console.log('⚠️  Found mock data patterns in database!');
    } else {
      console.log('✅ No mock data patterns found - all data appears to be real');
    }

    // 4. Check session creation timestamps
    console.log('\n4. Session creation timestamps:');
    realSessions?.forEach(session => {
      const createdAt = new Date(session.created_at);
      const isRecent = Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours
      console.log(`- Session ${session.id.slice(0, 8)}...: Created ${createdAt.toLocaleString()} ${isRecent ? '(Recent)' : '(Older)'}`);
    });

    // 5. Check for realistic data
    console.log('\n5. Data realism check:');
    const realisticChecks = {
      hasValidOTPs: realSessions?.every(s => /^\d{6}$/.test(s.session_otp)) || false,
      hasValidStatuses: realSessions?.every(s => ['active', 'billed', 'cleared'].includes(s.status)) || false,
      hasValidAmounts: realSessions?.every(s => typeof s.total_amount === 'number' && s.total_amount >= 0) || false,
      hasValidTimestamps: realSessions?.every(s => !isNaN(new Date(s.created_at).getTime())) || false
    };

    console.log('Realistic data checks:');
    Object.entries(realisticChecks).forEach(([check, passed]) => {
      console.log(`- ${check}: ${passed ? '✅' : '❌'}`);
    });

    // 6. Conclusion
    console.log('\n6. Conclusion:');
    const isRealData = !hasMockData && 
                      realisticChecks.hasValidOTPs && 
                      realisticChecks.hasValidStatuses && 
                      realisticChecks.hasValidAmounts && 
                      realisticChecks.hasValidTimestamps;

    if (isRealData) {
      console.log('🎉 The sessions shown are REAL DATA from the database!');
      console.log('✅ All sessions are genuine customer-created sessions');
      console.log('✅ No mock/dummy data detected');
    } else {
      console.log('⚠️  The sessions shown contain MOCK/DUMMY DATA!');
      console.log('❌ Some sessions appear to be test data, not real customer sessions');
    }

    console.log('\n📊 Summary:');
    console.log(`- Total Sessions: ${realSessions?.length || 0}`);
    console.log(`- Active Sessions: ${realSessions?.filter(s => s.status === 'active').length || 0}`);
    console.log(`- Total Revenue: ₹${realSessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0}`);
    console.log(`- Data Type: ${isRealData ? 'REAL' : 'MOCK/DUMMY'}`);

  } catch (error) {
    console.error('Error checking session data source:', error);
  }
}

checkSessionDataSource();

