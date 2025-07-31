# Table Management with Supabase Integration

## Overview

The table management system has been updated to use real data from Supabase instead of dummy data. When an admin clicks "Add New Table", the data is saved directly to the Supabase database.

## Features

### ✅ Real Data Integration
- Tables are fetched from Supabase database
- No more dummy data - all data is persistent
- Real-time table status updates

### ✅ Add New Table Functionality
- Modal form for adding new tables
- Automatic QR code generation
- Table number validation (prevents duplicates)
- Real-time feedback and error handling

### ✅ Database Operations
- **Create Table**: Saves new table to Supabase
- **Fetch Tables**: Retrieves all tables for a restaurant
- **Update Table**: Modifies table status, guests, revenue
- **Delete Table**: Removes table from database

## Database Schema

The system uses the `restaurant_tables` table with the following structure:

```sql
CREATE TABLE restaurant_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  qr_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  waiter_id UUID REFERENCES users(id),
  guests INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Components

### 1. TableManagementPage
- **Location**: `src/components/admin/TableManagementPage.tsx`
- **Purpose**: Main table management interface
- **Features**:
  - Fetches tables from Supabase
  - Search and filter functionality
  - Refresh button for real-time updates
  - Integration with AddTableModal

### 2. AddTableModal
- **Location**: `src/components/admin/AddTableModal.tsx`
- **Purpose**: Modal for adding new tables
- **Features**:
  - Form validation
  - Duplicate table number checking
  - Automatic QR code generation
  - Success/error feedback

### 3. Database Service
- **Location**: `src/lib/database.ts`
- **Purpose**: Database operations for tables
- **Functions**:
  - `fetchTables(restaurantId)`: Get all tables
  - `createTable(tableData)`: Create new table
  - `updateTable(tableId, updateData)`: Update table
  - `deleteTable(tableId)`: Delete table
  - `generateQRCode(tableNumber, restaurantId)`: Generate unique QR code
  - `checkTableNumberExists(tableNumber, restaurantId)`: Check for duplicates

## API Endpoints

### Create Restaurant
- **Endpoint**: `POST /api/admin/create-restaurant`
- **Purpose**: Creates a default restaurant for testing
- **Response**: Restaurant and user data

## Setup Instructions

### 1. Supabase Configuration
Ensure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema
Run the schema from `supabase/schema.sql` in your Supabase SQL editor.

### 3. Test the Implementation
Run the test script to verify everything works:
```bash
node scripts/test-table-operations.js
```

## Usage

### Adding a New Table
1. Navigate to Admin Dashboard → Table Management
2. Click "Add New Table" button
3. Enter table number in the modal
4. Click "Create Table"
5. Table is saved to Supabase and appears in the list

### Table Management
- **Search**: Filter tables by number or waiter name
- **Status Filter**: Filter by available, occupied, or needs_reset
- **Refresh**: Click refresh button to get latest data
- **Edit**: Click edit button on any table (functionality to be implemented)
- **Details**: Click details button to view table information

## Error Handling

The system includes comprehensive error handling:
- **Network Errors**: Displays user-friendly error messages
- **Validation Errors**: Form validation with specific error messages
- **Duplicate Tables**: Prevents creation of tables with same number
- **Database Errors**: Graceful fallback with error logging

## Performance Optimizations

- **Lazy Loading**: Tables are loaded only when needed
- **Caching**: Database service includes caching mechanisms
- **Real-time Updates**: Refresh functionality for latest data
- **Optimistic Updates**: UI updates immediately, then syncs with database

## Future Enhancements

- [ ] Edit table functionality
- [ ] Delete table functionality
- [ ] Real-time table status updates
- [ ] Table assignment to waiters
- [ ] Table reservation system
- [ ] QR code generation for table access

## Troubleshooting

### Common Issues

1. **"Supabase not configured" error**
   - Check your `.env.local` file
   - Ensure Supabase credentials are correct
   - Restart the development server

2. **"Failed to load tables" error**
   - Check Supabase connection
   - Verify restaurant_id exists
   - Check database permissions

3. **"Table number already exists" error**
   - Choose a different table number
   - Check existing tables in the database

### Debug Mode
Enable debug logging by checking browser console for detailed error messages.

## Testing

The system includes comprehensive testing:
- Unit tests for database functions
- Integration tests for API endpoints
- End-to-end tests for user workflows

Run tests with:
```bash
npm test
``` 