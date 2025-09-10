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

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Test restaurant_tables
    console.log('\n1. Checking restaurant_tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .limit(5);

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Tables found:', tables?.length || 0);
      if (tables && tables.length > 0) {
        console.log('Sample table:', tables[0]);
      }
    }

    // Test users
    console.log('\n2. Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Users found:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('Sample user:', users[0]);
      }
    }

    // Test menu_items
    console.log('\n3. Checking menu_items...');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5);

    if (menuError) {
      console.error('Error fetching menu items:', menuError);
    } else {
      console.log('Menu items found:', menuItems?.length || 0);
      if (menuItems && menuItems.length > 0) {
        console.log('Sample menu item:', menuItems[0]);
      }
    }

    // Test orders
    console.log('\n4. Checking orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    } else {
      console.log('Orders found:', orders?.length || 0);
      if (orders && orders.length > 0) {
        console.log('Sample order:', orders[0]);
      }
    }

  } catch (error) {
    console.error('Error testing database:', error);
  }
}

testDatabase();
