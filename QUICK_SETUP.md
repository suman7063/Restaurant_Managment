# 🚀 Quick Setup Guide

Your restaurant management system is now ready to run! Here's how to get started:

## ✅ Setup Required

The application requires Supabase setup to work. Follow these steps:

### Step 1: Set up Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your Project URL and Anon Key from Settings → API
3. Create `.env.local` file with your credentials

### Step 2: Set up the database
1. Go to Supabase dashboard → SQL Editor
2. Run the contents of `supabase/schema.sql`
3. This creates all necessary tables

### Step 3: Start the application
```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Complete onboarding
1. Go through the onboarding process
2. Create your restaurant and admin account
3. Use the generated QR codes to access the system

## 🔧 Full Supabase Setup (Optional)

To use real database functionality:

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project
   - Get your Project URL and Anon Key from Settings → API

2. **Create `.env.local` file:**
   ```bash
   # In your project root, create .env.local with:
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```

3. **Set up the database:**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and run the contents of `supabase/schema.sql`

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

## 🎯 What Works Now

### ✅ Working Features:
- QR code scanning and user authentication
- Menu browsing and cart management
- Order placement and status updates
- All dashboard interfaces (Customer, Waiter, Chef, Admin)
- Real-time order tracking
- Table management

### 🔄 Real Data Only:
- **All data** comes from Supabase database
- **No dummy data** - everything is real and persistent
- **Requires proper setup** before use

## 🐛 Troubleshooting

### If you see console warnings:
- Check that your Supabase credentials are properly configured
- Ensure the database schema has been run
- Verify your `.env.local` file exists with correct values

### If you see 500 errors:
- Run the database migration scripts
- Check that all tables exist in your Supabase project
- Verify RLS policies are properly configured
- The app will automatically switch to database mode
- All data will be persistent and real-time

## 🎉 You're Ready!

Your restaurant management system is fully functional! Start exploring the different user interfaces and features. 