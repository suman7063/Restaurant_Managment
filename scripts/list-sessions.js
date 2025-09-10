const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSessions() {
  try {
    console.log('\n🔍 Listing all sessions:\n');

    // Get all sessions
    const { data: sessions, error } = await supabase
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

    if (error) {
      console.log('❌ Error fetching sessions:', error.message);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('❌ No sessions found in database');
      return;
    }

    console.log(`✅ Found ${sessions.length} sessions:\n`);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. OTP: ${session.session_otp}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Table: ${session.restaurant_tables?.table_number || 'Unknown'}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Total: ₹${(session.total_amount / 100).toFixed(2)}`);
      console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
      console.log('');
    });

    // Show available OTPs
    console.log('📋 Available OTPs:');
    sessions.forEach(session => {
      console.log(`   ${session.session_otp}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listSessions();
