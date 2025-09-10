# Session-Based Order Service Documentation

## Overview

The Session-Based Order Service is a comprehensive implementation for handling OTP-based group ordering in the restaurant management system. It enables multiple customers to join a table session using a 6-digit OTP and place orders that are tracked individually while being aggregated at the session level.

## Key Features

### 1. Session Management
- **OTP Generation**: Unique 6-digit OTPs for each active session
- **Session Validation**: Ensures sessions exist and are active before order creation
- **Customer Attribution**: Tracks which customer placed which items
- **Session Totals**: Automatic calculation and updates of session totals

### 2. Order Management
- **Session Linking**: Orders are linked to specific sessions
- **Customer Tracking**: Each order item is attributed to a specific customer
- **Status Management**: Comprehensive order status updates
- **Aggregation**: Multiple orders per session with individual customer tracking

### 3. API Endpoints
- **Order Creation**: `POST /api/orders` - Create session-based orders
- **Order Retrieval**: `GET /api/orders` - Get orders with various filters
- **Order Updates**: `PUT /api/orders/[orderId]` - Update order status or session
- **Order Removal**: `DELETE /api/orders/[orderId]` - Remove order from session

## Database Schema Updates

### Enhanced Order Interface
```typescript
export interface Order {
  id: string;
  table: number;
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  waiter_id?: string;
  waiter_name?: string;
  timestamp: Date;
  total: number;
  estimated_time: number;
  is_joined_order: boolean;
  parent_order_id?: string;
  // Session-based ordering additions
  session_id?: string; // UUID reference to table_sessions
  session_otp?: string; // Session OTP for quick reference
  customer_id?: string; // UUID reference to session_customers
  restaurant_id?: string; // UUID reference to restaurants
  is_session_order: boolean; // Whether this order is part of a session
}
```

### Enhanced OrderItem Interface
```typescript
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item: MenuItem;
  quantity: number;
  special_notes?: string;
  selected_customization?: MenuCustomization;
  selected_add_ons: MenuAddOn[];
  status: 'order_received' | 'preparing' | 'prepared' | 'delivered';
  kitchen_station: string;
  preparation_start_time?: Date;
  preparation_end_time?: Date;
  delivery_time?: Date;
  price_at_time: number;
  // Session-based ordering additions
  customer_id?: string; // UUID reference to session_customers
  customer_name?: string; // Customer name for quick reference
  customer_phone?: string; // Customer phone for quick reference
}
```

## Service Methods

### Core Order Service Methods

#### `createOrder(orderData)`
Creates a new order with session support and customer attribution.

**Parameters:**
```typescript
{
  tableNumber: number;
  customerName: string;
  items: CartItem[];
  waiterId?: string;
  sessionId?: string;
  customerId?: string;
  restaurantId?: string;
}
```

**Features:**
- Session validation before order creation
- Customer attribution for each order item
- Automatic session total updates
- Support for both session and non-session orders

#### `getSessionOrders(sessionId: string)`
Retrieves all orders for a specific session.

#### `getCustomerOrders(sessionId: string, customerId: string)`
Retrieves all orders for a specific customer within a session.

#### `updateSessionTotal(sessionId: string)`
Updates the total amount for a session based on all its orders.

#### `getOrdersByTable(tableId: string, sessionId?: string)`
Retrieves orders for a specific table, optionally filtered by session.

### Order Management Methods

#### `updateOrderStatus(orderId: string, status: string)`
Updates the status of an order.

#### `addOrderToSession(orderId: string, sessionId: string)`
Adds an existing order to a session.

#### `removeOrderFromSession(orderId: string)`
Removes an order from its current session.

## API Usage Examples

### Creating a Session-Based Order

```javascript
// Create a session-based order
const orderData = {
  tableNumber: 1,
  customerName: "John Doe",
  items: [
    {
      id: "menu-item-1",
      name: "Burger",
      price: 12.99,
      quantity: 2,
      prepTime: 15,
      kitchen_stations: ["Grill"],
      selected_add_ons: []
    }
  ],
  sessionId: "session-uuid",
  customerId: "customer-uuid",
  restaurantId: "restaurant-uuid"
};

const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});

const result = await response.json();
```

### Retrieving Session Orders

```javascript
// Get all orders for a session
const response = await fetch('/api/orders?sessionId=session-uuid');
const result = await response.json();

// Get customer orders within a session
const response = await fetch('/api/orders?sessionId=session-uuid&customerId=customer-uuid');
const result = await response.json();
```

### Updating Order Status

```javascript
// Update order status
const response = await fetch('/api/orders/order-uuid', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'completed' })
});
```

## Session Flow

### 1. Session Creation
1. Table is activated and session is created
2. Unique 6-digit OTP is generated
3. Session is marked as 'active'

### 2. Customer Joining
1. Customer enters OTP on table page
2. Customer provides name and phone number
3. Customer is added to session or existing customer is retrieved
4. Customer can now place orders

### 3. Order Placement
1. Customer selects menu items
2. Order is created with session and customer attribution
3. Session total is automatically updated
4. Order items are tracked by customer

### 4. Order Management
1. Kitchen staff can see orders by session
2. Individual customer orders are tracked
3. Order status can be updated
4. Session totals are maintained

### 5. Session Closure
1. All orders are completed
2. Session is marked as 'billed'
3. Session can be cleared for next use

## Error Handling

### Session Validation Errors
- Session not found
- Session not active
- OTP expired
- Invalid OTP format

### Order Creation Errors
- Invalid menu items
- Missing customer information
- Session validation failures
- Database connection issues

### Development Mode Fallbacks
- Mock data when Supabase is not configured
- Graceful degradation for testing
- Comprehensive error logging

## Security Considerations

### OTP Security
- 6-digit numeric OTPs
- 24-hour expiration
- Unique per table and session
- Rate limiting for OTP attempts

### Data Validation
- Input validation using Zod schemas
- UUID validation for all IDs
- Type checking for all parameters
- SQL injection prevention

### Access Control
- Session-based authentication
- Customer attribution validation
- Restaurant-level data isolation

## Performance Optimizations

### Database Queries
- Efficient joins for order retrieval
- Indexed queries on session_id and customer_id
- Batch operations for order items
- Soft delete support

### Caching Strategy
- Session data caching (disabled for consistency)
- Order aggregation caching
- Customer data caching

## Testing

### Test Coverage
- Session creation and validation
- Customer joining and attribution
- Order creation with session data
- Order retrieval and filtering
- Status updates and session management
- Error handling and edge cases

### Test Scripts
- `scripts/test-session-orders.js` - Comprehensive service testing
- API endpoint testing
- Database integration testing

## Integration Points

### Frontend Integration
- Table page with OTP entry
- Customer registration modal
- Order placement interface
- Session management dashboard

### Backend Integration
- Session service for OTP management
- Menu service for item retrieval
- Table service for table management
- Notification service for order updates

## Future Enhancements

### Planned Features
- Real-time order updates using WebSockets
- Advanced customer analytics
- Split bill functionality
- Order history and reordering
- Multi-language support for orders

### Scalability Considerations
- Database partitioning for large restaurants
- Microservice architecture for order processing
- Event-driven order updates
- Advanced caching strategies

## Conclusion

The Session-Based Order Service provides a robust foundation for OTP-based group ordering with comprehensive customer attribution, session management, and order tracking. The implementation follows best practices for security, performance, and maintainability while providing a seamless user experience for both customers and restaurant staff. 