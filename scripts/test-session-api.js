const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  tableId: '550e8400-e29b-41d4-a716-446655440000', // Mock UUID
  restaurantId: '550e8400-e29b-41d4-a716-446655440001', // Mock UUID
  otp: '123456',
  customerName: 'John Doe',
  customerPhone: '1234567890'
};

async function testSessionAPI() {
  console.log('🧪 Testing Session API Endpoints\n');

  try {
    // Test 1: Create Session
    console.log('1. Testing POST /api/sessions/create');
    const createResponse = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testData.tableId,
        restaurantId: testData.restaurantId
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createResult, null, 2));
    
    if (createResult.success && createResult.data?.sessionId) {
      testData.sessionId = createResult.data.sessionId;
      testData.otp = createResult.data.otp;
    }
    console.log('');

    // Test 2: Join Session
    console.log('2. Testing POST /api/sessions/join');
    const joinResponse = await fetch(`${BASE_URL}/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: testData.otp,
        tableId: testData.tableId,
        customerName: testData.customerName,
        customerPhone: testData.customerPhone
      })
    });
    
    const joinResult = await joinResponse.json();
    console.log('Status:', joinResponse.status);
    console.log('Response:', JSON.stringify(joinResult, null, 2));
    console.log('');

    // Test 3: Get Active Session for Table
    console.log('3. Testing GET /api/sessions/[tableId]/active');
    const activeResponse = await fetch(`${BASE_URL}/sessions/${testData.tableId}/active`);
    const activeResult = await activeResponse.json();
    console.log('Status:', activeResponse.status);
    console.log('Response:', JSON.stringify(activeResult, null, 2));
    console.log('');

    // Test 4: Get Session Details
    if (testData.sessionId) {
      console.log('4. Testing GET /api/sessions/[sessionId]');
      const detailsResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}`);
      const detailsResult = await detailsResponse.json();
      console.log('Status:', detailsResponse.status);
      console.log('Response:', JSON.stringify(detailsResult, null, 2));
      console.log('');
    }

    // Test 5: Get Session Customers
    if (testData.sessionId) {
      console.log('5. Testing GET /api/sessions/[sessionId]/customers');
      const customersResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}/customers`);
      const customersResult = await customersResponse.json();
      console.log('Status:', customersResponse.status);
      console.log('Response:', JSON.stringify(customersResult, null, 2));
      console.log('');
    }

    // Test 6: Get Session Orders
    if (testData.sessionId) {
      console.log('6. Testing GET /api/sessions/[sessionId]/orders');
      const ordersResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}/orders`);
      const ordersResult = await ordersResponse.json();
      console.log('Status:', ordersResponse.status);
      console.log('Response:', JSON.stringify(ordersResult, null, 2));
      console.log('');
    }

    // Test 7: Regenerate OTP (requires auth - will likely fail without proper auth)
    if (testData.sessionId) {
      console.log('7. Testing POST /api/sessions/[sessionId]/regenerate-otp');
      const regenerateResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}/regenerate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const regenerateResult = await regenerateResponse.json();
      console.log('Status:', regenerateResponse.status);
      console.log('Response:', JSON.stringify(regenerateResult, null, 2));
      console.log('');
    }

    // Test 8: Close Session (requires auth - will likely fail without proper auth)
    if (testData.sessionId) {
      console.log('8. Testing PUT /api/sessions/[sessionId]/close');
      const closeResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const closeResult = await closeResponse.json();
      console.log('Status:', closeResponse.status);
      console.log('Response:', JSON.stringify(closeResult, null, 2));
      console.log('');
    }

    // Test 9: Delete Session (requires auth - will likely fail without proper auth)
    if (testData.sessionId) {
      console.log('9. Testing DELETE /api/sessions/[sessionId]');
      const deleteResponse = await fetch(`${BASE_URL}/sessions/${testData.sessionId}`, {
        method: 'DELETE'
      });
      const deleteResult = await deleteResponse.json();
      console.log('Status:', deleteResponse.status);
      console.log('Response:', JSON.stringify(deleteResult, null, 2));
      console.log('');
    }

    console.log('✅ Session API testing completed!');
    console.log('\n📝 Notes:');
    console.log('- Auth-protected endpoints (regenerate-otp, close, delete) will return 401/403 without proper authentication');
    console.log('- Some endpoints may return 404 if using mock UUIDs instead of real database IDs');
    console.log('- Check the responses above to verify the API structure and error handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSessionAPI(); 