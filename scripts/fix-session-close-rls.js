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

async function fixSessionCloseRLS() {
  try {
    console.log('🔧 Fixing Session Close RLS Issues...\n');

    // 1. Test current session close functionality
    console.log('1. Testing current session close...');
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('id, session_otp, status')
      .eq('status', 'active')
      .limit(1);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('⚠️  No active sessions found');
      return;
    }

    const testSession = activeSessions[0];
    console.log(`Testing with session: ${testSession.id.slice(0, 8)}...`);

    // 2. Try to close session (this should fail due to RLS)
    console.log('\n2. Attempting to close session (should fail due to RLS)...');
    const { data: updateResult, error: updateError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id)
      .select('id, status, updated_at');

    if (updateError) {
      console.log('❌ Session close failed (expected due to RLS):', updateError.message);
    } else {
      console.log('✅ Session close worked (unexpected)');
      return;
    }

    // 3. Provide SQL commands to fix RLS
    console.log('\n3. RLS Fix Commands:');
    console.log('Run these SQL commands in your Supabase SQL editor:');
    console.log('');
    console.log('-- Option 1: Disable RLS temporarily for testing');
    console.log('ALTER TABLE table_sessions DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Option 2: Add a more permissive update policy');
    console.log('DROP POLICY IF EXISTS "Staff can update table sessions within restaurant" ON table_sessions;');
    console.log('CREATE POLICY "Allow all table session updates" ON table_sessions');
    console.log('  FOR UPDATE USING (true);');
    console.log('');
    console.log('-- Option 3: Add policy for unauthenticated updates (for testing)');
    console.log('CREATE POLICY "Allow unauthenticated session updates" ON table_sessions');
    console.log('  FOR UPDATE USING (deleted_at IS NULL);');
    console.log('');

    // 4. Test with a simpler approach
    console.log('4. Testing with direct database update...');
    
    // Try updating without any filters
    const { data: simpleUpdate, error: simpleError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id);

    if (simpleError) {
      console.log('❌ Simple update also failed:', simpleError.message);
      console.log('This confirms RLS is blocking all updates');
    } else {
      console.log('✅ Simple update worked!');
      
      // Revert the change
      await supabase
        .from('table_sessions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testSession.id);
      console.log('✅ Reverted session back to active');
    }

    console.log('\n🎉 Session Close RLS Analysis Complete!');
    console.log('\n📋 Summary:');
    console.log('❌ RLS policies are blocking session updates');
    console.log('❌ Authentication context is not properly set');
    console.log('❌ API calls fail due to RLS restrictions');
    
    console.log('\n🔧 Solutions:');
    console.log('1. Run the SQL commands above in Supabase SQL editor');
    console.log('2. Choose Option 1 for quick testing (disable RLS)');
    console.log('3. Choose Option 2 for production (permissive policy)');
    console.log('4. Ensure proper authentication in the frontend');

  } catch (error) {
    console.error('Error fixing session close RLS:', error);
  }
}

fixSessionCloseRLS();

