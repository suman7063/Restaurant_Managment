# SessionChoiceModal Component Documentation

## Overview

The `SessionChoiceModal` component is a comprehensive modal that handles the session choice flow for OTP-based group ordering in the restaurant management system. It allows users to choose between joining an existing session or starting a new one when they scan a QR code.

## Features

### ✅ Core Functionality
- **Session Detection**: Automatically checks for active sessions on the table
- **Choice Options**: Join existing session vs. start new session
- **OTP Entry**: Advanced 6-digit OTP input with validation
- **Session Info Display**: Shows existing session details and participants
- **Flow Management**: Handles complete choice flow with proper state management

### ✅ UI/UX Features
- **Mobile-First Design**: Responsive layout for all screen sizes
- **Clear Options**: Distinct visual separation between choices
- **OTP Input**: User-friendly OTP entry with auto-advance and paste support
- **Loading States**: Visual feedback during operations
- **Error Handling**: Clear error messages and recovery options

### ✅ OTP Input Features
- **6 Separate Boxes**: Individual input boxes for each digit
- **Auto-advance**: Automatically moves to next field
- **Paste Support**: Handles pasted OTP codes
- **Keyboard Navigation**: Arrow keys and backspace support
- **Visual Feedback**: Success/error states with color coding
- **Real-time Validation**: Shows errors as user types

## Component Interface

```typescript
interface SessionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  restaurantId: string;
  onJoinSession: (otp: string, customerData: { name: string; phone: string }) => Promise<void>;
  onCreateSession: (customerData: { name: string; phone: string }) => Promise<void>;
  title?: string;
}
```

## Component States

The component handles these states:

1. **Loading**: Checking for existing session
2. **No Session**: Show option to create new session
3. **Has Session**: Show join vs. create new options
4. **OTP Entry**: Show OTP input for joining
5. **Processing**: During join/create operations
6. **Error**: Display error messages

## User Flow

### Flow 1: No Existing Session
1. Show "No active session found" message
2. Display "Start New Session" option prominently
3. User clicks → Opens customer registration for new session
4. After registration → Creates new session and joins

### Flow 2: Existing Session Found
1. Show existing session info (participants, orders, total)
2. Display two options:
   - **Join Existing Session** (with OTP entry)
   - **Start New Session** (creates new session)
3. If user chooses join → Show OTP input
4. Validate OTP and proceed with registration

## Usage Example

```tsx
import { SessionChoiceModal } from './components/SessionChoiceModal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoinSession = async (otp: string, customerData: { name: string; phone: string }) => {
    // Call API to join session
    const response = await fetch('/api/sessions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp,
        tableId: 'table-uuid',
        customerName: customerData.name,
        customerPhone: customerData.phone,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to join session');
    }
    
    // Handle successful join
  };

  const handleCreateSession = async (customerData: { name: string; phone: string }) => {
    // Create new session and join
    const createResponse = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'table-uuid',
        restaurantId: 'restaurant-uuid',
      }),
    });
    
    const sessionData = await createResponse.json();
    
    // Join the new session
    await handleJoinSession(sessionData.data.otp, customerData);
  };

  return (
    <SessionChoiceModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      tableId="table-uuid"
      restaurantId="restaurant-uuid"
      onJoinSession={handleJoinSession}
      onCreateSession={handleCreateSession}
    />
  );
};
```

## API Integration

The component integrates with these API endpoints:

### GET `/api/sessions/[tableId]/active`
- **Purpose**: Check for active session on table
- **Response**: Session details if active, 404 if none

### POST `/api/sessions/join`
- **Purpose**: Join existing session with OTP
- **Body**: `{ otp, tableId, customerName, customerPhone }`

### POST `/api/sessions`
- **Purpose**: Create new session
- **Body**: `{ tableId, restaurantId }`

## OTP Input Component

The `OTPInput` component provides:

### Features
- **6-digit numeric input**: Only allows numbers
- **Auto-advance**: Moves to next field automatically
- **Paste support**: Handles pasted 6-digit codes
- **Keyboard navigation**: Arrow keys and backspace
- **Visual feedback**: Color-coded states (success/error)
- **Accessibility**: Proper focus management

### Props
```typescript
interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}
```

## Session Info Display

The `SessionInfoDisplay` component shows:

- Session ID (truncated)
- Creation date
- Total amount (formatted as currency)
- Number of participants
- List of current participants (first 3 + count)
- Session status badge

## Error Handling

The component handles various error scenarios:

1. **Network errors**: Connection issues when checking sessions
2. **Invalid OTP**: Wrong or expired OTP codes
3. **Session conflicts**: Multiple active sessions
4. **Validation errors**: Invalid customer data
5. **API errors**: Server-side issues

## Styling

The component uses Tailwind CSS with:

- **Responsive design**: Mobile-first approach
- **Consistent spacing**: 4px grid system
- **Color scheme**: Blue primary, gray secondary, red error
- **Typography**: Clear hierarchy with proper font weights
- **Animations**: Smooth transitions and loading states

## Dependencies

- **React**: Core framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons (via Modal component)
- **CustomerRegistrationModal**: Customer data collection

## Testing

The component can be tested using the `SessionChoiceDemo` component:

```tsx
import { SessionChoiceDemo } from './components/SessionChoiceDemo';

// In your test page
<SessionChoiceDemo 
  tableId="test-table-uuid" 
  restaurantId="test-restaurant-uuid" 
/>
```

## Best Practices

1. **Error Boundaries**: Wrap in error boundary for production
2. **Loading States**: Always show loading during API calls
3. **Validation**: Validate inputs before API calls
4. **Accessibility**: Ensure keyboard navigation works
5. **Mobile UX**: Test on various screen sizes
6. **Error Messages**: Provide clear, actionable error messages

## Future Enhancements

- **Session expiration**: Show countdown for OTP expiration
- **QR code display**: Show QR code for session sharing
- **Offline support**: Handle offline scenarios gracefully
- **Analytics**: Track user interactions and session flows
- **Internationalization**: Support multiple languages
- **Dark mode**: Dark theme support 