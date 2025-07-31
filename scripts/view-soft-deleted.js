const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function viewSoftDeletedRecords() {
  console.log('🔍 Viewing Soft-Deleted Records...\n');

  try {
    // View soft-deleted tables
    console.log('📋 Soft-Deleted Tables:');
    const { data: deletedTables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (tablesError) {
      console.error('Error fetching soft-deleted tables:', tablesError);
    } else {
      if (deletedTables && deletedTables.length > 0) {
        deletedTables.forEach(table => {
          console.log(`  - Table ${table.table_number} (ID: ${table.id})`);
          console.log(`    Deleted at: ${table.deleted_at}`);
          console.log(`    Status: ${table.status}`);
          console.log(`    QR Code: ${table.qr_code}`);
          console.log('');
        });
      } else {
        console.log('  No soft-deleted tables found');
      }
    }

    // View soft-deleted users
    console.log('👥 Soft-Deleted Users:');
    const { data: deletedUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching soft-deleted users:', usersError);
    } else {
      if (deletedUsers && deletedUsers.length > 0) {
        deletedUsers.forEach(user => {
          console.log(`  - ${user.name} (ID: ${user.id})`);
          console.log(`    Email: ${user.email}`);
          console.log(`    Role: ${user.role}`);
          console.log(`    Deleted at: ${user.deleted_at}`);
          console.log('');
        });
      } else {
        console.log('  No soft-deleted users found');
      }
    }

    // View soft-deleted menu items
    console.log('🍽️ Soft-Deleted Menu Items:');
    const { data: deletedMenuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (menuError) {
      console.error('Error fetching soft-deleted menu items:', menuError);
    } else {
      if (deletedMenuItems && deletedMenuItems.length > 0) {
        deletedMenuItems.forEach(item => {
          console.log(`  - ${item.name} (ID: ${item.id})`);
          console.log(`    Category: ${item.category}`);
          console.log(`    Price: ₹${item.price / 100}`);
          console.log(`    Deleted at: ${item.deleted_at}`);
          console.log('');
        });
      } else {
        console.log('  No soft-deleted menu items found');
      }
    }

    // View soft-deleted orders
    console.log('📦 Soft-Deleted Orders:');
    const { data: deletedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching soft-deleted orders:', ordersError);
    } else {
      if (deletedOrders && deletedOrders.length > 0) {
        deletedOrders.forEach(order => {
          console.log(`  - Order ${order.id}`);
          console.log(`    Customer: ${order.customer_name}`);
          console.log(`    Total: ₹${order.total / 100}`);
          console.log(`    Status: ${order.status}`);
          console.log(`    Deleted at: ${order.deleted_at}`);
          console.log('');
        });
      } else {
        console.log('  No soft-deleted orders found');
      }
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`  - Soft-deleted tables: ${deletedTables?.length || 0}`);
    console.log(`  - Soft-deleted users: ${deletedUsers?.length || 0}`);
    console.log(`  - Soft-deleted menu items: ${deletedMenuItems?.length || 0}`);
    console.log(`  - Soft-deleted orders: ${deletedOrders?.length || 0}`);

  } catch (error) {
    console.error('Error viewing soft-deleted records:', error);
  }
}

// Function to restore a specific table
async function restoreTable(tableId) {
  console.log(`🔄 Restoring table ${tableId}...`);
  
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ deleted_at: null })
      .eq('id', tableId);

    if (error) {
      console.error('Error restoring table:', error);
    } else {
      console.log('✅ Table restored successfully!');
    }
  } catch (error) {
    console.error('Error restoring table:', error);
  }
}

// Function to permanently delete a table
async function permanentlyDeleteTable(tableId) {
  console.log(`🗑️ Permanently deleting table ${tableId}...`);
  
  try {
    // First, update the record to bypass the trigger
    await supabase
      .from('restaurant_tables')
      .update({ deleted_at: null })
      .eq('id', tableId);

    // Then perform the actual delete
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      console.error('Error permanently deleting table:', error);
    } else {
      console.log('✅ Table permanently deleted!');
    }
  } catch (error) {
    console.error('Error permanently deleting table:', error);
  }
}

// Main execution
const command = process.argv[2];
const tableId = process.argv[3];

if (command === 'restore' && tableId) {
  restoreTable(tableId);
} else if (command === 'delete' && tableId) {
  permanentlyDeleteTable(tableId);
} else {
  viewSoftDeletedRecords();
}

module.exports = {
  viewSoftDeletedRecords,
  restoreTable,
  permanentlyDeleteTable
}; 