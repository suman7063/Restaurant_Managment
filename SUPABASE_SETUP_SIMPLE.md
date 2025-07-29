# 🚀 Simple Supabase Setup (No Dummy Data)

## ✅ Step-by-Step Setup

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and click "New Project"
3. Name: `restaurant-management-system`
4. Set a strong database password
5. Choose your region
6. Click "Create new project"

### **Step 2: Get Your Credentials**
1. In Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)

### **Step 3: Create Environment File**
Create `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Step 4: Set Up Database**
1. In Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/schema.sql`
4. Paste and click "Run"

### **Step 5: Restart Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🎯 What Gets Created

### **Tables:**
- `users` - Customers and staff
- `menu_items` - Restaurant menu
- `orders` - Customer orders
- `order_items` - Order details
- `restaurant_tables` - Table management
- `notifications` - System messages

### **Sample Data:**
- 6 users (3 customers, 3 staff)
- 8 menu items
- 2 sample orders
- 8 restaurant tables

### **Security:**
- Row Level Security (RLS) enabled
- Proper access controls for each role

## 🔑 Test QR Codes (After Setup)

- `QR001` - John Doe (Customer)
- `QR002` - Jane Smith (Customer)
- `QR003` - Bob Wilson (Customer)
- `ADMIN001` - Mike Admin (Admin)
- `WAITER001` - Sarah Waiter (Waiter)
- `CHEF001` - Gordon Chef (Chef)

## ✅ Success Indicators

1. **No console warnings** about Supabase credentials
2. **Menu items load** from database
3. **Orders persist** between sessions
4. **Real-time updates** work
5. **User authentication** works properly

## 🐛 Common Issues

### **"Permission denied" errors:**
- ✅ **Fixed**: Removed the problematic JWT secret line
- The schema should now run without errors

### **"Supabase not configured":**
- Check `.env.local` file exists
- Verify URL and key are correct
- Restart development server

### **"No menu items":**
- Check SQL Editor for errors
- Verify schema ran successfully
- Check browser console for errors

## 🎉 You're Ready!

Once setup is complete, your app will use real Supabase data instead of dummy data. All features will work with persistent, real-time data storage. 