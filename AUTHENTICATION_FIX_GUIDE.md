# 🔐 Authentication Fix Guide

## ❌ **Problem Identified**

The "Add Table" functionality is failing with a **401 Unauthorized** error because the Supabase client is not authenticated. The system uses a custom authentication system with session tokens, but the database operations were trying to use the unauthenticated Supabase client.

## ✅ **Solution Implemented**

I've created **server-side API routes** that handle authentication properly:

### **New API Routes:**
- **`/api/admin/tables`** (GET) - Fetch tables for a restaurant
- **`/api/admin/tables`** (POST) - Create a new table

### **Updated Database Functions:**
- **`fetchTables()`** - Now uses API route instead of direct Supabase calls
- **`createTable()`** - Now uses API route instead of direct Supabase calls
- **`checkTableNumberExists()`** - Now uses API route instead of direct Supabase calls

## 🚀 **How to Test the Fix**

### **Option 1: Manual Testing**
1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Admin Dashboard:**
   - Go to `http://localhost:3002/admin/dashboard`
   - Login with admin credentials

3. **Test Add Table:**
   - Click on "Table Management"
   - Click "Add New Table"
   - Enter a table number (e.g., "1")
   - Click "Create Table"
   - Should work without 401 errors!

### **Option 2: Automated Testing**
```bash
# Run the API test script
node scripts/test-api-routes.js
```

## 🔧 **Technical Details**

### **What Changed:**

1. **API Routes Created:**
   ```typescript
   // /api/admin/tables
   - GET: Fetches tables with authentication
   - POST: Creates tables with authentication
   ```

2. **Database Functions Updated:**
   ```typescript
   // Before: Direct Supabase calls (unauthenticated)
   const { data } = await supabase.from('restaurant_tables')...
   
   // After: API route calls (authenticated)
   const response = await fetch('/api/admin/tables', {
     credentials: 'include' // Sends cookies
   });
   ```

3. **Authentication Flow:**
   ```
   Browser → API Route → Auth Check → Supabase (Server-side)
   ```

### **Security Features:**
- ✅ **Session Validation**: Checks auth_session cookie
- ✅ **Role Verification**: Only admin/owner can create tables
- ✅ **Restaurant Scoping**: Users can only access their restaurant
- ✅ **Input Validation**: Validates all required fields
- ✅ **Duplicate Prevention**: Checks for existing table numbers

## 🧪 **Testing Commands**

### **Test API Routes:**
```bash
node scripts/test-api-routes.js
```

### **Test Table Operations:**
```bash
node scripts/test-add-table.js
```

### **Manual Testing:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to add a table
4. Check for 200 status codes (not 401)

## 🔍 **Troubleshooting**

### **If Still Getting 401 Errors:**

1. **Check Authentication:**
   ```bash
   curl -X GET http://localhost:3002/api/auth/me
   ```
   Should return user data, not "Not authenticated"

2. **Check Session Cookie:**
   - Open browser DevTools
   - Go to Application/Storage tab
   - Look for `auth_session` cookie
   - Should exist and not be expired

3. **Check User Role:**
   - Ensure user has 'admin' or 'owner' role
   - Check in Supabase dashboard

4. **Check Restaurant ID:**
   - Ensure user has a valid `restaurant_id`
   - Check in Supabase dashboard

### **If Getting 403 Errors:**
- User doesn't have admin/owner role
- User doesn't have access to the restaurant

### **If Getting 409 Errors:**
- Table number already exists
- Try a different table number

## 📝 **Next Steps**

Once the authentication is working:

1. **Test the Add Table functionality**
2. **Verify tables are saved to Supabase**
3. **Check that tables appear in the list**
4. **Test duplicate prevention**

## ✅ **Expected Results**

After the fix:
- ✅ **No more 401 errors**
- ✅ **Tables can be created successfully**
- ✅ **Tables are saved to Supabase**
- ✅ **Tables appear in the management interface**
- ✅ **Duplicate table numbers are prevented**
- ✅ **Proper error messages for validation**

The Add Table functionality should now work perfectly! 🎉 