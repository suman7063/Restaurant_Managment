# QR Code Feature for Restaurant Management System

## Overview
The QR code feature allows restaurant staff to generate, view, and download QR codes for each table. Customers can scan these QR codes to access the restaurant's menu and place orders directly from their mobile devices.

## Features

### For Restaurant Staff (Admin)
1. **Automatic QR Code Generation**: When a new table is created, a unique QR code is automatically generated
2. **QR Code Viewing**: Staff can view QR codes for any table through the table management interface
3. **QR Code Download**: QR codes can be downloaded as PNG images for printing
4. **QR Code Copying**: QR codes can be copied to clipboard for sharing
5. **Table Information Display**: Shows table number, status, and QR code details

### For Customers
1. **Menu Access**: Scanning a QR code takes customers to a dedicated menu page for that table
2. **Order Placement**: Customers can browse menu items, customize orders, and place them directly
3. **Real-time Updates**: Orders are sent to the restaurant's system in real-time

## How It Works

### QR Code Generation
- Each table gets a unique QR code when created
- QR codes contain a URL that points to `/table/{qrCode}` 
- The QR code is stored in the database with the table information

### Customer Experience
1. Customer scans QR code with their phone's camera
2. QR code opens the restaurant's menu page in their browser
3. Customer can browse menu items by category
4. Customer can add items to cart with customizations
5. Customer places order, which is sent to the restaurant's system
6. Restaurant staff receives the order in real-time

### Technical Implementation

#### Components
- `QRCodeModal.tsx`: Modal for viewing and downloading QR codes
- `AddTableModal.tsx`: Updated to show QR code after table creation
- `TableManagementPage.tsx`: Updated with QR code viewing buttons
- `table/[qrCode]/page.tsx`: Customer-facing page for menu and ordering

#### API Routes
- `/api/table/[qrCode]`: Validates QR codes and returns table information

#### Database
- QR codes are stored in the `restaurant_tables` table
- Each QR code is unique and linked to a specific table

## Usage Instructions

### For Restaurant Staff

#### Creating a Table with QR Code
1. Go to Table Management in the admin dashboard
2. Click "Add New Table"
3. Enter the table number
4. Click "Create Table"
5. The QR code modal will automatically open
6. Download or copy the QR code
7. Print and place the QR code on the table

#### Viewing QR Codes for Existing Tables
1. Go to Table Management
2. Find the table in the list
3. Click the "QR Code" button
4. View, download, or copy the QR code

#### Alternative: Click QR Code ID
- In the table list, click on the QR code ID (shown as truncated text)
- This will also open the QR code modal

### For Customers
1. Open your phone's camera app
2. Point it at the QR code on the table
3. Tap the notification that appears
4. Browse the menu and place your order

## QR Code Format
QR codes contain URLs in the format:
```
https://your-restaurant-domain.com/table/{unique-qr-code}
```

## Security Features
- QR codes are validated against the database
- Only active tables can be accessed
- Tables marked as "cleaning" or "reserved" are not accessible
- Each QR code is unique and tied to a specific table

## Technical Requirements
- QR code generation uses the `qrcode` library
- QR codes are generated as PNG images
- Customer interface uses the existing `CustomerInterface` component
- All data is stored in Supabase database

## Future Enhancements
- QR code customization with restaurant branding
- Analytics for QR code usage
- Dynamic QR codes that update based on table status
- Integration with payment systems
- Multi-language support for QR code pages 