# Supabase Integration Setup Guide

This guide will help you set up Supabase for your Restaurant Management System.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your restaurant management system project

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `restaurant-management-system`
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon public key

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Replace the placeholder values with your actual Supabase credentials

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste it into the SQL Editor and click "Run"

This will create:
- Users table (for customers, staff, and admins)
- Menu items table
- Restaurant tables table
- Orders table
- Order items table (junction table)
- Notifications table
- All necessary indexes and Row Level Security policies

## Step 5: Verify the Setup

1. Start your development server:
```bash
npm run dev
```

2. Open your application and test the QR code scanning
3. Try accessing different user roles (customer, waiter, chef, admin)

## Database Schema Overview

### Tables Created:

1. **users** - Stores all users (customers, staff, admins)
   - QR codes for customer access
   - Role-based permissions
   - Table assignments for customers

2. **menu_items** - Restaurant menu
   - Pricing, categories, preparation times
   - Popular items flag
   - Availability status

3. **restaurant_tables** - Physical tables in the restaurant
   - Status tracking (available, occupied, cleaning)
   - Waiter assignments
   - Guest count and revenue

4. **orders** - Customer orders
   - Table and customer information
   - Status tracking (pending, preparing, ready, served)
   - Total amount and estimated completion time

5. **order_items** - Individual items in each order
   - Links orders to menu items
   - Quantity and price at time of order

6. **notifications** - System notifications
   - User-specific notifications
   - Read/unread status

### Row Level Security (RLS)

The schema includes comprehensive RLS policies:
- Customers can only see their own orders and table information
- Staff can see orders for their assigned tables
- Admins have full access to all data
- Menu items are publicly readable

## Testing the Integration

### Test QR Codes (after running the schema):
- `QR001` - John Doe (Customer at Table 5)
- `QR002` - Jane Smith (Customer at Table 3)
- `QR003` - Bob Wilson (Customer at Table 7)
- `ADMIN001` - Mike Admin (Admin)
- `WAITER001` - Sarah Waiter (Waiter)
- `CHEF001` - Gordon Chef (Chef)

### Test Scenarios:

1. **Customer Flow:**
   - Scan QR001, QR002, or QR003
   - Browse menu items
   - Add items to cart
   - Place order

2. **Waiter Flow:**
   - Scan WAITER001
   - View assigned tables
   - Update order statuses
   - Manage table status

3. **Chef Flow:**
   - Scan CHEF001
   - View order queue
   - Update order preparation status

4. **Admin Flow:**
   - Scan ADMIN001
   - View all tables and orders
   - Access system overview

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading:**
   - Ensure `.env.local` is in the project root
   - Restart your development server
   - Check that variable names start with `NEXT_PUBLIC_`

2. **Database Connection Errors:**
   - Verify your Supabase URL and key are correct
   - Check that your IP is not blocked by Supabase
   - Ensure the database schema has been created

3. **RLS Policy Issues:**
   - Check that all tables have RLS enabled
   - Verify policies are correctly applied
   - Test with different user roles

### Getting Help:

- Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the database logs in your Supabase dashboard
- Check the browser console for JavaScript errors

## Next Steps

After successful setup, you can:

1. **Customize the Menu:** Add your restaurant's actual menu items
2. **Add Real Users:** Create QR codes for your actual customers and staff
3. **Customize UI:** Modify the interface to match your brand
4. **Add Features:** Implement additional features like payment processing, inventory management, etc.

## Security Notes

- Never commit your `.env.local` file to version control
- Regularly rotate your Supabase API keys
- Monitor your database usage and costs
- Set up proper backup strategies for your data 