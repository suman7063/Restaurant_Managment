# 🍕 Restaurant Management System

A modern, real-time restaurant management system built with Next.js, TypeScript, and Supabase. Features QR code-based customer access, real-time order tracking, and role-based dashboards for staff management.

## ✨ Features

- **QR Code Access System** - Customers scan QR codes to access their table's menu
- **Real-time Order Management** - Live order tracking and status updates
- **Role-based Dashboards** - Separate interfaces for customers, waiters, chefs, and admins
- **Menu Management** - Dynamic menu with categories, pricing, and preparation times
- **Table Management** - Real-time table status and waiter assignments
- **Supabase Integration** - Full database integration with Row Level Security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up here](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd restaurant_management_system
npm install
```

2. **Set up Supabase:**
```bash
npm run setup-supabase
```

3. **Configure environment variables:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your Project URL and Anon Key from Settings → API
   - Update the values in `.env.local`

4. **Set up the database:**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and run the contents of `supabase/schema.sql`

5. **Start the development server:**
```bash
npm run dev
```

6. **Test the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Use the test QR codes provided in the setup guide

## 🔑 Test QR Codes

After running the database schema, you can test with these QR codes:

- `QR001` - John Doe (Customer at Table 5)
- `QR002` - Jane Smith (Customer at Table 3)
- `QR003` - Bob Wilson (Customer at Table 7)
- `ADMIN001` - Mike Admin (Admin)
- `WAITER001` - Sarah Waiter (Waiter)
- `CHEF001` - Gordon Chef (Chef)

## 📱 User Interfaces

### Customer Interface
- Browse menu by categories
- Add items to cart
- Place orders
- View order status

### Waiter Dashboard
- View assigned tables
- Manage order statuses
- Update table information

### Chef Dashboard
- View order queue
- Update preparation status
- Kitchen management

### Admin Dashboard
- System overview
- All tables and orders
- Revenue tracking

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Icons:** Lucide React

## 📚 Documentation

- [Supabase Setup Guide](SUPABASE_SETUP.md) - Detailed setup instructions
- [Database Schema](supabase/schema.sql) - Complete database structure
- [API Documentation](src/lib/database.ts) - Database service layer

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Setup Supabase
npm run setup-supabase
```

## 🚀 Deployment

The application can be deployed to Vercel, Netlify, or any other Next.js-compatible platform. Make sure to:

1. Set up environment variables in your deployment platform
2. Configure Supabase for production
3. Update CORS settings if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [Supabase Setup Guide](SUPABASE_SETUP.md)
- Review the [Supabase Documentation](https://supabase.com/docs)
- Open an issue in this repository
