# 🚀 Quick Setup Guide

Your restaurant management system is now ready to run! Here's how to get started:

## ✅ Immediate Setup (Development Mode)

The application will work immediately with dummy data. Just run:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Test QR Codes (Work immediately):
- `QR001` - John Doe (Customer at Table 5)
- `QR002` - Jane Smith (Customer at Table 3)  
- `QR003` - Bob Wilson (Customer at Table 7)
- `ADMIN001` - Mike Admin (Admin)
- `WAITER001` - Sarah Waiter (Waiter)
- `CHEF001` - Gordon Chef (Chef)

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

### 🔄 Development vs Production Mode:
- **Development Mode**: Uses dummy data, works immediately
- **Production Mode**: Uses Supabase database, requires setup

## 🐛 Troubleshooting

### If you see console warnings:
- The app is running in development mode with dummy data
- This is normal and expected without Supabase setup
- All features will work with simulated data

### If you want to use real database:
- Follow the Supabase setup steps above
- The app will automatically switch to database mode
- All data will be persistent and real-time

## 🎉 You're Ready!

Your restaurant management system is fully functional! Start exploring the different user interfaces and features. 