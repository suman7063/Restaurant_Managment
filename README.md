# Restaurant Management System

A comprehensive B2B SaaS solution for fine dining and casual dining restaurants with QR code-based table ordering, real-time multi-kitchen workflow management, and multi-language support.

## Features

- **QR Code Table Ordering**: Customers scan QR codes to access menus
- **Multi-Language Support**: English, Hindi, and Kannada with auto-transliteration
- **Individual Item Delivery**: Items delivered as soon as they're ready
- **Real-time Notifications**: Live updates across all interfaces
- **Kitchen Management**: Multi-station workflow with language preferences
- **Admin Dashboard**: Comprehensive restaurant management tools

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

1. **Supabase Setup**:
   - Create a Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Copy your project URL and keys to `.env.local`

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Auto-Transliteration Feature

The system includes **automatic transliteration** from English to Hindi and Kannada scripts:

### How It Works

1. **Enter English Content**: Fill in menu item name and description in English
2. **Click Auto-Transliterate**: The purple "Auto-Transliterate" button converts text to local scripts
3. **Review Results**: Check Hindi and Kannada tabs for generated script
4. **Edit if Needed**: Manually adjust transliterations for accuracy
5. **Save**: All scripts are saved to the database



## Usage

### For Restaurant Admins

1. **Add Menu Items**: Use the auto-transliterate feature for quick multi-script setup
2. **Manage Staff**: Assign roles and language preferences
3. **Monitor Operations**: Real-time dashboard with analytics

### For Kitchen Staff

1. **View Orders**: See menu items and order details
2. **Update Status**: Mark items as prepared
3. **Track Progress**: Monitor order preparation times

### For Waiters

1. **Order Management**: Handle customer orders efficiently
2. **Item Delivery**: Deliver items as they become ready
3. **Customer Service**: Provide excellent customer experience

## API Endpoints

### Menu Management
- `GET /api/admin/menu-items` - Fetch menu items
- `POST /api/admin/menu-items` - Create menu item
- `PUT /api/admin/menu-items/[id]` - Update menu item
- `DELETE /api/admin/menu-items/[id]` - Delete menu item

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 