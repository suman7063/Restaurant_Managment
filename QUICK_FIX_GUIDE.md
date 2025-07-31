# 🚀 Quick Fix for Add Table Functionality

## ❌ **Current Issue**
The Add Table functionality is failing with 401 Unauthorized errors because there's no authentication setup.

## ✅ **Quick Solution**

### **Step 1: Set Up Environment Variables**

Create a `.env.local` file in your project root with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jjotkjcpckrvpkwudtpw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**To get your anon key:**
1. Go to your Supabase dashboard
2. Settings → API
3. Copy the "anon public" key

### **Step 2: Create Test User**

Run this command to create a test admin user:

```bash
node scripts/create-test-admin.js
```

### **Step 3: Test the Login**

1. **Go to test login page:**
   ```
   http://localhost:3002/test-login
   ```

2. **Use these credentials:**
   - Email: `admin@test.com`
   - Password: `admin123`

3. **Login and test Add Table:**
   - Click "Sign in"
   - You'll be redirected to admin dashboard
   - Go to "Table Management"
   - Click "Add New Table"
   - Enter table number (e.g., "1")
   - Click "Create Table"

## 🔧 **Alternative: Manual Database Setup**

If the script doesn't work, manually create a test user in Supabase:

### **1. Create Restaurant:**
```sql
INSERT INTO restaurants (
  name, address, city, state, phone, email, 
  cuisine_type, languages, subscription_plan, subscription_status
) VALUES (
  'Test Restaurant', '123 Test St', 'Test City', 'Test State',
  '+1234567890', 'test@restaurant.com', 'Indian', 
  ARRAY['en'], 'starter', 'active'
);
```

### **2. Create Admin User:**
```sql
INSERT INTO users (
  name, email, phone, role, restaurant_id, language, password_hash
) VALUES (
  'Test Admin', 'admin@test.com', '+1234567890', 'admin',
  (SELECT id FROM restaurants LIMIT 1), 'en',
  '$2a$12$test.hash.for.testing.purposes.only'
);
```

### **3. Create Session:**
```sql
INSERT INTO auth_sessions (
  id, user_id, restaurant_id, session_token, expires_at, created_at, last_activity
) VALUES (
  'test-session-123', 
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  (SELECT id FROM restaurants LIMIT 1),
  'test-session-123',
  NOW() + INTERVAL '8 hours',
  NOW(),
  NOW()
);
```

## 🧪 **Testing Commands**

### **Test API Routes:**
```bash
node scripts/test-api-routes.js
```

### **Test Table Operations:**
```bash
node scripts/test-add-table.js
```

## 🔍 **Troubleshooting**

### **If still getting 401 errors:**

1. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **Check browser cookies:**
   - Open DevTools (F12)
   - Application tab → Cookies
   - Look for `auth_session` cookie

4. **Test authentication endpoint:**
   ```bash
   curl -X GET http://localhost:3002/api/auth/me
   ```

### **If getting 403 errors:**
- User doesn't have admin role
- User doesn't have restaurant_id

### **If getting 409 errors:**
- Table number already exists
- Try a different table number

## ✅ **Expected Results**

After following these steps:
- ✅ **No more 401 errors**
- ✅ **Login works with test credentials**
- ✅ **Add Table functionality works**
- ✅ **Tables are saved to Supabase**
- ✅ **Tables appear in the management interface**

## 🎯 **Next Steps**

Once Add Table is working:
1. **Test creating multiple tables**
2. **Test duplicate prevention**
3. **Test table management features**
4. **Implement edit/delete table functionality**

The Add Table functionality should work perfectly after following these steps! 🎉 