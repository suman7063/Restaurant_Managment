# Session Service Documentation

## Overview

The Session Service provides OTP-based group ordering functionality for the restaurant management system. It handles session creation, customer joining, and session management operations.

## Features

- **OTP Generation**: Secure 6-digit numeric OTPs with uniqueness validation
- **Session Management**: Create, join, and manage group ordering sessions
- **Customer Tracking**: Track participants in group sessions
- **Order Integration**: Link orders to sessions for group billing
- **Development Mode**: Mock functionality when Supabase is not configured

## Database Schema

### Table Sessions (`table_sessions`)
- `id`: UUID primary key
- `table_id`: Reference to restaurant table
- `restaurant_id`: Reference to restaurant
- `session_otp`: 6-digit OTP for joining
- `otp_expires_at`: Optional OTP expiration timestamp
- `status`: Session status ('active', 'billed', 'cleared')
- `total_amount`: Total session amount in cents
- `created_at`, `updated_at`, `deleted_at`: Timestamps

### Session Customers (`session_customers`)
- `id`: UUID primary key
- `session_id`: Reference to table session
- `name`: Customer name
- `phone`: Customer phone number
- `joined_at`: When customer joined session
- `deleted_at`: Soft delete timestamp

## API Reference

### Core Methods

#### `createSession(tableId: string, restaurantId: string): Promise<Session | null>`

Creates a new group ordering session for a table.

**Parameters:**
- `tableId`: UUID of the restaurant table
- `restaurantId`: UUID of the restaurant

**Returns:** Session object or null if creation fails

**Validation:**
- Checks if table exists and is active
- Verifies no active session exists for the table
- Generates unique 6-digit OTP
- Sets 24-hour OTP expiration

**Example:**
```typescript
const session = await sessionService.createSession('table-123', 'restaurant-456');
if (session) {
  console.log(`Session created with OTP: ${session.session_otp}`);
}
```

#### `joinSession(otp: string, tableId: string, customerData: {name: string, phone: string}): Promise<{session: Session, customer: SessionCustomer} | null>`

Joins a customer to an existing session using OTP.

**Parameters:**
- `otp`: 6-digit session OTP
- `tableId`: UUID of the restaurant table
- `customerData`: Customer information

**Returns:** Object containing session and customer data, or null if join fails

**Validation:**
- Validates OTP format (6 digits)
- Checks if session exists and is active
- Verifies OTP hasn't expired
- Prevents duplicate phone numbers in same session

**Example:**
```typescript
const result = await sessionService.joinSession('123456', 'table-123', {
  name: 'John Doe',
  phone: '+1234567890'
});
if (result) {
  console.log(`Customer ${result.customer.name} joined session`);
}
```

#### `getActiveSession(tableId: string): Promise<Session | null>`

Retrieves the active session for a table.

**Parameters:**
- `tableId`: UUID of the restaurant table

**Returns:** Active session or null if none exists

**Example:**
```typescript
const session = await sessionService.getActiveSession('table-123');
if (session) {
  console.log(`Active session OTP: ${session.session_otp}`);
}
```

#### `getSessionById(sessionId: string): Promise<Session | null>`

Retrieves a session by its ID.

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** Session object or null if not found

#### `getSessionCustomers(sessionId: string): Promise<SessionCustomer[]>`

Retrieves all customers in a session.

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** Array of session customers

**Example:**
```typescript
const customers = await sessionService.getSessionCustomers('session-123');
console.log(`Session has ${customers.length} customers`);
```

#### `getSessionOrders(sessionId: string): Promise<Order[]>`

Retrieves all orders associated with a session.

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** Array of orders with full item details

### Management Methods

#### `regenerateOTP(sessionId: string): Promise<string | null>`

Generates a new OTP for an existing session.

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** New 6-digit OTP or null if regeneration fails

**Features:**
- Ensures OTP uniqueness
- Resets 24-hour expiration
- Updates session timestamp

#### `clearSession(sessionId: string): Promise<boolean>`

Marks a session as cleared (ready for new session).

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** True if successful, false otherwise

#### `updateSessionTotal(sessionId: string): Promise<boolean>`

Recalculates and updates the total amount for a session.

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** True if successful, false otherwise

**Logic:**
- Sums all order totals in the session
- Updates session total_amount field

#### `closeSession(sessionId: string): Promise<boolean>`

Marks a session as billed (ready for payment).

**Parameters:**
- `sessionId`: UUID of the session

**Returns:** True if successful, false otherwise

## OTP Generation Algorithm

### Security Features
- **6-digit numeric**: Generates numbers 100000-999999
- **Uniqueness validation**: Ensures no duplicate OTPs per table
- **Retry logic**: Attempts up to 10 times for unique OTP
- **Expiration**: 24-hour automatic expiration
- **Collision handling**: Graceful fallback on generation failure

### Implementation
```typescript
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniqueOTP(tableId: string, maxRetries: number = 10): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const otp = generateOTP();
    if (await isOTPUnique(otp, tableId)) {
      return otp;
    }
  }
  return null;
}
```

## Error Handling

### Validation Errors
- **Invalid OTP format**: Must be exactly 6 digits
- **Table not found**: Table must exist and be active
- **Session not found**: OTP must match active session
- **OTP expired**: Session OTP must not be expired
- **Duplicate customer**: Phone number must be unique per session

### Database Errors
- **Connection failures**: Graceful fallback with error logging
- **Constraint violations**: Proper error messages for business logic
- **Transaction failures**: Rollback and retry mechanisms

### Development Mode
- **Mock data**: Provides realistic test data
- **Console warnings**: Clear indication of dev mode
- **API consistency**: Same interface as production

## Development Mode Support

When Supabase is not configured (`isSupabaseConfigured = false`):

### Mock Behavior
- `createSession`: Returns mock session with OTP '123456'
- `joinSession`: Returns mock session and customer data
- `getActiveSession`: Returns null (no active sessions)
- `regenerateOTP`: Returns mock OTP '654321'
- Management methods: Return success (true) without side effects

### Console Warnings
All methods log warnings when operating in development mode:
```
Supabase not configured, simulating session creation
```

## Type Definitions

### Session Interface
```typescript
interface Session {
  id: string;
  table_id: string;
  restaurant_id: string;
  session_otp: string;
  otp_expires_at?: Date;
  status: 'active' | 'billed' | 'cleared';
  total_amount: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### SessionCustomer Interface
```typescript
interface SessionCustomer {
  id: string;
  session_id: string;
  name: string;
  phone: string;
  joined_at: Date;
  deleted_at?: Date;
}
```

## Usage Examples

### Complete Session Workflow
```typescript
// 1. Create session (waiter/staff)
const session = await sessionService.createSession(tableId, restaurantId);
if (!session) {
  throw new Error('Failed to create session');
}

// 2. Customer joins session
const joinResult = await sessionService.joinSession(
  session.session_otp, 
  tableId, 
  { name: 'John Doe', phone: '+1234567890' }
);

// 3. Get session details
const customers = await sessionService.getSessionCustomers(session.id);
const orders = await sessionService.getSessionOrders(session.id);

// 4. Update session total after orders
await sessionService.updateSessionTotal(session.id);

// 5. Close session for billing
await sessionService.closeSession(session.id);
```

### Error Handling Example
```typescript
try {
  const result = await sessionService.joinSession('123456', tableId, customerData);
  if (!result) {
    console.error('Failed to join session - check OTP and table');
    return;
  }
  console.log(`Welcome ${result.customer.name}!`);
} catch (error) {
  console.error('Session join error:', error);
}
```

## Testing

### Test Script
Run the test script to verify functionality:
```bash
node scripts/test-session-service.js
```

### Test Coverage
- Session creation and validation
- OTP generation and uniqueness
- Customer joining and duplicate prevention
- Session management operations
- Error handling scenarios
- Development mode behavior

## Performance Considerations

### Database Optimization
- Indexed queries on `session_otp`, `table_id`, and `status`
- Efficient OTP uniqueness checks
- Batch operations for session totals

### Caching Strategy
- Session data cached in memory for active sessions
- OTP validation cached to reduce database hits
- Customer data cached during session lifetime

## Security Considerations

### OTP Security
- 6-digit numeric provides 900,000 possible combinations
- 24-hour expiration prevents long-term access
- Uniqueness per table prevents cross-table conflicts
- No sequential or predictable patterns

### Data Protection
- Phone numbers validated and sanitized
- Session data encrypted in transit
- Soft delete prevents data loss
- Row-level security policies enforced

## Future Enhancements

### Planned Features
- **QR Code Integration**: Generate QR codes with embedded OTPs
- **Push Notifications**: Real-time session updates
- **Analytics**: Session duration and customer behavior tracking
- **Multi-language Support**: Localized OTP messages
- **Advanced Expiration**: Configurable expiration policies

### Scalability Improvements
- **Redis Caching**: Distributed session caching
- **Database Sharding**: Horizontal scaling for large deployments
- **Microservice Architecture**: Dedicated session service
- **Event-driven Updates**: Real-time session synchronization 