# Session Management for Group Ordering

## Overview

The session management system enables OTP-based group ordering where multiple customers at the same table can join a shared ordering session using a 6-digit OTP. This allows for collaborative ordering while maintaining individual order tracking.

## Database Schema

### Table Sessions (`table_sessions`)

Manages group ordering sessions with OTP-based access.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `table_id` | UUID | Foreign key to `restaurant_tables` |
| `restaurant_id` | UUID | Foreign key to `restaurants` |
| `session_otp` | VARCHAR(6) | 6-digit OTP for joining |
| `otp_expires_at` | TIMESTAMP | Optional OTP expiration |
| `status` | VARCHAR(20) | Session status: 'active', 'billed', 'cleared' |
| `total_amount` | INTEGER | Total session amount in cents |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |

### Session Customers (`session_customers`)

Tracks participants in each group ordering session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key to `table_sessions` |
| `name` | VARCHAR(255) | Customer name |
| `phone` | VARCHAR(20) | Customer phone number |
| `joined_at` | TIMESTAMP | When customer joined |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |

### Modified Orders Table

The `orders` table has been extended with session support:

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | UUID | Foreign key to `table_sessions` (nullable) |
| `customer_session_id` | UUID | Foreign key to `session_customers` (nullable) |

## Key Features

### 1. OTP Generation
- 6-digit numeric OTP for session access
- Optional expiration time
- Unique per table session

### 2. Session Lifecycle
- **Active**: Session is open for ordering
- **Billed**: Session has been billed but not cleared
- **Cleared**: Session is complete and cleared

### 3. Individual vs Group Orders
- Individual orders: `session_id` and `customer_session_id` are NULL
- Group orders: Linked to session and session customer

## Database Indexes

### Performance Optimizations
```sql
-- Session lookup by table and status
CREATE INDEX idx_table_sessions_table_id_status ON table_sessions(table_id, status);

-- OTP validation
CREATE INDEX idx_table_sessions_session_otp ON table_sessions(session_otp);

-- Session customer lookup
CREATE INDEX idx_session_customers_session_id ON session_customers(session_id);

-- Order session lookup
CREATE INDEX idx_orders_session_id ON orders(session_id);
```

## Row Level Security (RLS)

### Table Sessions Policies
- **Read**: Public within restaurant context
- **Insert**: Staff (waiter, admin, owner) within restaurant
- **Update**: Staff within restaurant

### Session Customers Policies
- **Read**: Within session context
- **Insert**: Anyone (for joining sessions)
- **Update**: Staff within restaurant

## API Usage Examples

### Create a New Session
```sql
INSERT INTO table_sessions (
  table_id, 
  restaurant_id, 
  session_otp, 
  otp_expires_at
) VALUES (
  'table-uuid', 
  'restaurant-uuid', 
  '123456', 
  NOW() + INTERVAL '1 hour'
);
```

### Join a Session
```sql
-- First, validate OTP
SELECT * FROM table_sessions 
WHERE session_otp = '123456' 
  AND status = 'active' 
  AND (otp_expires_at IS NULL OR otp_expires_at > NOW())
  AND deleted_at IS NULL;

-- Then, add customer to session
INSERT INTO session_customers (session_id, name, phone) 
VALUES ('session-uuid', 'John Doe', '+1234567890');
```

### Create Order in Session
```sql
INSERT INTO orders (
  customer_id,
  table_id,
  session_id,
  customer_session_id,
  restaurant_id,
  total
) VALUES (
  'customer-uuid',
  'table-uuid',
  'session-uuid',
  'session-customer-uuid',
  'restaurant-uuid',
  2500
);
```

### Get Session Summary
```sql
SELECT 
  ts.id,
  ts.session_otp,
  ts.status,
  ts.total_amount,
  COUNT(sc.id) as participant_count,
  COUNT(o.id) as order_count
FROM table_sessions ts
LEFT JOIN session_customers sc ON ts.id = sc.session_id AND sc.deleted_at IS NULL
LEFT JOIN orders o ON ts.id = o.session_id AND o.deleted_at IS NULL
WHERE ts.id = 'session-uuid' AND ts.deleted_at IS NULL
GROUP BY ts.id, ts.session_otp, ts.status, ts.total_amount;
```

## Migration

To apply the session management tables to an existing database:

```bash
# Apply the migration
psql -d your_database -f supabase/migration_session_management.sql
```

## Implementation Notes

### Backward Compatibility
- Existing individual orders continue to work unchanged
- New session fields are nullable in orders table
- No breaking changes to existing functionality

### Data Integrity
- Foreign key constraints ensure referential integrity
- Soft delete support for all tables
- Cascade deletes for session cleanup

### Performance Considerations
- Indexes optimized for common query patterns
- Soft delete filtering in all indexes
- Efficient session lookup by OTP

## Future Enhancements

1. **Session Analytics**: Track session duration, order patterns
2. **Split Bills**: Automatic bill splitting among participants
3. **Session Limits**: Maximum participants per session
4. **Real-time Updates**: WebSocket integration for live session updates
5. **Session History**: Archive completed sessions for reporting

## Security Considerations

1. **OTP Security**: OTPs should be cryptographically secure
2. **Session Validation**: Always validate session status before operations
3. **Access Control**: RLS policies enforce restaurant-level access
4. **Data Privacy**: Customer data is scoped to restaurant context 