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

async function testOrderCreation() {
  try {
    console.log('1. Looking for table with number: 1');
    const { data: tableData, error: tableError } = await supabase
      .from('restaurant_tables')
      .select('id, restaurant_id')
      .eq('table_number', 1)
      .is('deleted_at', null)
      .single();

    if (tableError || !tableData) {
      console.error('Table not found:', tableError);
      return;
    }
    console.log('2. Found table:', tableData);

    console.log('3. Looking for existing customer: API Test Customer');
    const { data: existingCustomer } = await supabase
      .from('users')
      .select('id')
      .eq('name', 'API Test Customer')
      .eq('role', 'customer')
      .eq('restaurant_id', tableData.restaurant_id)
      .is('deleted_at', null)
      .single();

    let customerId;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('4. Found existing customer:', customerId);
    } else {
      console.log('5. Creating new customer: API Test Customer');
      const { data: newCustomer, error: customerError } = await supabase
        .from('users')
        .insert({
          name: 'API Test Customer',
          role: 'customer',
          restaurant_id: tableData.restaurant_id,
          phone: 'API Test Customer'
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Failed to create customer:', customerError);
        return;
      }
      customerId = newCustomer.id;
      console.log('6. Created new customer:', customerId);
    }

    const total = 29;
    const estimatedTime = 15;

    console.log('7. Creating order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: tableData.id,
        customer_id: customerId,
        waiter_id: null,
        session_id: null,
        restaurant_id: tableData.restaurant_id,
        is_joined_order: false,
        total,
        estimated_time: estimatedTime
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation failed:', orderError);
      return;
    }
    console.log('8. Order created:', order.id);

    console.log('9. Creating order items...');
    const orderItems = [{
      order_id: order.id,
      menu_item_id: '5fe27e7e-b5e7-4192-8c8b-6bc1e48ff32c',
      quantity: 1,
      price_at_time: 29,
      special_notes: '',
      selected_add_ons: []
    }];

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation failed:', itemsError);
      return;
    }

    console.log('10. Order items created successfully!');
    console.log('🎉 Order placement test completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

testOrderCreation();
