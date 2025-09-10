// Test script for Session Service
// Run with: node scripts/test-session-service.js

const { sessionService } = require('../src/lib/database.ts');

async function testSessionService() {
  console.log('🧪 Testing Session Service...\n');

  const tableId = 'test-table-123';
  const restaurantId = 'test-restaurant-456';
  const customerData = {
    name: 'John Doe',
    phone: '+1234567890'
  };

  try {
    // Test 1: Create Session
    console.log('1. Testing createSession...');
    const session = await sessionService.createSession(tableId, restaurantId);
    if (session) {
      console.log('✅ Session created successfully');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   OTP: ${session.session_otp}`);
      console.log(`   Status: ${session.status}\n`);
    } else {
      console.log('❌ Failed to create session\n');
      return;
    }

    // Test 2: Get Active Session
    console.log('2. Testing getActiveSession...');
    const activeSession = await sessionService.getActiveSession(tableId);
    if (activeSession) {
      console.log('✅ Active session retrieved successfully');
      console.log(`   Session ID: ${activeSession.id}\n`);
    } else {
      console.log('❌ Failed to get active session\n');
    }

    // Test 3: Join Session
    console.log('3. Testing joinSession...');
    const joinResult = await sessionService.joinSession(session.session_otp, tableId, customerData);
    if (joinResult) {
      console.log('✅ Session joined successfully');
      console.log(`   Customer ID: ${joinResult.customer.id}`);
      console.log(`   Customer Name: ${joinResult.customer.name}\n`);
    } else {
      console.log('❌ Failed to join session\n');
    }

    // Test 4: Get Session Customers
    console.log('4. Testing getSessionCustomers...');
    const customers = await sessionService.getSessionCustomers(session.id);
    console.log(`✅ Found ${customers.length} customers in session\n`);

    // Test 5: Regenerate OTP
    console.log('5. Testing regenerateOTP...');
    const newOtp = await sessionService.regenerateOTP(session.id);
    if (newOtp) {
      console.log(`✅ OTP regenerated successfully: ${newOtp}\n`);
    } else {
      console.log('❌ Failed to regenerate OTP\n');
    }

    // Test 6: Update Session Total
    console.log('6. Testing updateSessionTotal...');
    const totalUpdated = await sessionService.updateSessionTotal(session.id);
    if (totalUpdated) {
      console.log('✅ Session total updated successfully\n');
    } else {
      console.log('❌ Failed to update session total\n');
    }

    // Test 7: Close Session
    console.log('7. Testing closeSession...');
    const sessionClosed = await sessionService.closeSession(session.id);
    if (sessionClosed) {
      console.log('✅ Session closed successfully\n');
    } else {
      console.log('❌ Failed to close session\n');
    }

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSessionService();
}

module.exports = { testSessionService }; 