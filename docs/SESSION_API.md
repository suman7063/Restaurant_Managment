# Session API Documentation

This document describes the REST API endpoints for OTP-based group ordering session management in the restaurant management system.

## Base URL
```
http://localhost:3000/api/sessions
```

## Authentication
- **Public Endpoints**: Session creation and joining (no authentication required)
- **Protected Endpoints**: Session management operations require admin, waiter, or owner authentication

## Response Format
All endpoints return JSON responses with the following structure:
```json
{
  "success": boolean,
  "message": "string",
  "data": object | null,
  "errors": array | null
}
```

## Error Codes
- `400` - Bad Request (Invalid input data)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Session/table not found)
- `409` - Conflict (Customer already in session, active session exists)
- `422` - Unprocessable Entity (Invalid OTP)
- `500` - Internal Server Error (Server errors)

---

## Core Endpoints

### 1. Create Session
**POST** `/api/sessions`

Creates a new OTP-based session for a table.

#### Request Body
```json
{
  "tableId": "uuid",
  "restaurantId": "uuid"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "uuid",
    "tableId": "uuid",
    "restaurantId": "uuid",
    "otp": "123456",
    "status": "active",
    "totalAmount": 0,
    "createdAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2024-01-02T12:00:00Z"
  }
}
```

#### Error Response (409 Conflict)
```json
{
  "success": false,
  "message": "Failed to create session. Table may not exist, be inactive, or already have an active session."
}
```

---

### 2. Join Session
**POST** `/api/sessions/join`

Joins an existing session using OTP and customer information.

#### Request Body
```json
{
  "otp": "123456",
  "tableId": "uuid",
  "customerName": "John Doe",
  "customerPhone": "1234567890"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully joined session",
  "data": {
    "sessionId": "uuid",
    "tableId": "uuid",
    "restaurantId": "uuid",
    "status": "active",
    "totalAmount": 0,
    "customer": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "1234567890",
      "joinedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### Error Response (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Invalid OTP or session not found"
}
```

---

### 3. Get Active Session for Table
**GET** `/api/sessions/{tableId}/active`

Retrieves the active session for a specific table.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Active session found",
  "data": {
    "sessionId": "uuid",
    "tableId": "uuid",
    "restaurantId": "uuid",
    "otp": "123456",
    "status": "active",
    "totalAmount": 0,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2024-01-02T12:00:00Z"
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "No active session found for this table"
}
```

---

### 4. Get Session Details
**GET** `/api/sessions/{sessionId}`

Retrieves detailed information about a specific session.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session details retrieved successfully",
  "data": {
    "sessionId": "uuid",
    "tableId": "uuid",
    "restaurantId": "uuid",
    "otp": "123456",
    "status": "active",
    "totalAmount": 0,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2024-01-02T12:00:00Z"
  }
}
```

---

### 5. Get Session Customers
**GET** `/api/sessions/{sessionId}/customers`

Retrieves all customers participating in a session.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session customers retrieved successfully",
  "data": {
    "sessionId": "uuid",
    "customers": [
      {
        "id": "uuid",
        "name": "John Doe",
        "phone": "1234567890",
        "joinedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "totalCustomers": 1
  }
}
```

---

### 6. Get Session Orders
**GET** `/api/sessions/{sessionId}/orders`

Retrieves all orders associated with a session.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session orders retrieved successfully",
  "data": {
    "sessionId": "uuid",
    "orders": [
      {
        "id": "uuid",
        "table": 1,
        "customerName": "John Doe",
        "customerPhone": "1234567890",
        "items": [
          {
            "id": "uuid",
            "menuItem": {
              "id": "uuid",
              "name": "Burger",
              "price": 1200
            },
            "quantity": 2,
            "specialNotes": "No onions",
            "status": "preparing",
            "priceAtTime": 1200
          }
        ],
        "total": 2400,
        "timestamp": "2024-01-01T12:00:00Z",
        "estimatedTime": 15,
        "isJoinedOrder": true
      }
    ],
    "totalOrders": 1,
    "totalAmount": 2400
  }
}
```

---

## Management Endpoints (Protected)

### 7. Regenerate OTP
**POST** `/api/sessions/{sessionId}/regenerate-otp`

Generates a new OTP for an existing session. Requires admin, waiter, or owner authentication.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "OTP regenerated successfully",
  "data": {
    "sessionId": "uuid",
    "newOtp": "654321",
    "regeneratedBy": "Admin User",
    "regeneratedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

---

### 8. Close Session
**PUT** `/api/sessions/{sessionId}/close`

Marks a session as billed/closed. Requires admin, waiter, or owner authentication.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session closed successfully",
  "data": {
    "sessionId": "uuid",
    "closedBy": "Admin User",
    "closedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### 9. Delete Session
**DELETE** `/api/sessions/{sessionId}`

Clears/deletes a session. Requires admin, waiter, or owner authentication.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session cleared successfully"
}
```

---

## Validation Rules

### OTP Validation
- Must be exactly 6 digits
- Format: `^\d{6}$`

### Phone Number Validation
- Minimum 10 digits
- Maximum 15 digits
- Non-digits are automatically removed

### Name Validation
- Required field
- Maximum 100 characters
- Leading/trailing whitespace is trimmed

### UUID Validation
- All IDs must be valid UUID format
- Table ID and Restaurant ID validation

---

## Security Features

### Rate Limiting
- OTP generation and validation endpoints have rate limiting
- Prevents brute force attacks

### Input Sanitization
- Phone numbers are sanitized to remove non-digits
- Names are trimmed of whitespace
- All inputs are validated using Zod schemas

### Authentication
- Protected endpoints require valid session cookies
- Role-based access control (admin, waiter, owner)
- CSRF protection for state-changing operations

---

## Testing

Run the test script to verify all endpoints:
```bash
node scripts/test-session-api.js
```

The test script will:
1. Test all endpoints with mock data
2. Verify response formats
3. Check error handling
4. Validate authentication requirements

---

## Integration Notes

### Frontend Integration
- Use the session ID returned from create/join endpoints for subsequent requests
- Store OTP securely for customer sharing
- Handle authentication errors gracefully

### Database Integration
- All endpoints use the session service from `src/lib/database.ts`
- Real-time updates supported through Supabase subscriptions
- Soft delete functionality for data recovery

### Error Handling
- All endpoints return consistent error formats
- Development mode includes detailed error messages
- Production mode hides sensitive error details 