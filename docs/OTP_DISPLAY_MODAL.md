# OTP Display Modal Component

## Overview

The `OTPDisplayModal` component is a comprehensive modal interface for displaying and managing OTP-based group ordering sessions. It provides a prominent OTP display, multiple sharing options, session information, and management capabilities.

## Features

### Core Functionality
- **Large OTP Display**: Prominent, easy-to-read 6-digit OTP with individual digit boxes
- **Copy to Clipboard**: One-tap copy functionality with visual feedback
- **Session Information**: Real-time display of session details and statistics
- **Share Options**: Multiple ways to share the OTP with group members
- **Session Management**: Options to regenerate OTP or close session

### UI/UX Features
- **Mobile-First Design**: Responsive layout for all screen sizes
- **Large Typography**: OTP displayed in 48px+ font size for easy reading
- **Visual Appeal**: Attractive gradient design with modern styling
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading States**: Visual feedback during operations

## Component Interface

```typescript
interface OTPDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  customers?: SessionCustomer[];
  orders?: Order[];
  restaurantName?: string;
  tableNumber?: number;
  onRegenerateOTP?: () => Promise<void>;
  onCloseSession?: () => Promise<void>;
  onStartOrdering?: () => void;
  isAdmin?: boolean;
}
```

## Props Description

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | () => void | Yes | Callback when modal is closed |
| `session` | Session | Yes | Session data object |
| `customers` | SessionCustomer[] | No | List of session participants |
| `orders` | Order[] | No | List of session orders |
| `restaurantName` | string | No | Restaurant name (default: 'Restaurant') |
| `tableNumber` | number | No | Table number (default: 0) |
| `onRegenerateOTP` | () => Promise<void> | No | Callback to regenerate OTP |
| `onCloseSession` | () => Promise<void> | No | Callback to close session |
| `onStartOrdering` | () => void | No | Callback to start ordering |
| `isAdmin` | boolean | No | Whether user has admin privileges |

## Usage Example

```tsx
import { OTPDisplayModal } from '../components/OTPDisplayModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [session, setSession] = useState(sampleSession);

  const handleRegenerateOTP = async () => {
    // Call API to regenerate OTP
    const response = await fetch(`/api/sessions/${session.id}/regenerate-otp`, {
      method: 'POST'
    });
    const data = await response.json();
    setSession(prev => ({ ...prev, session_otp: data.newOtp }));
  };

  const handleCloseSession = async () => {
    // Call API to close session
    await fetch(`/api/sessions/${session.id}/close`, {
      method: 'PUT'
    });
    setIsModalOpen(false);
  };

  return (
    <OTPDisplayModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      session={session}
      customers={customers}
      orders={orders}
      restaurantName="My Restaurant"
      tableNumber={5}
      onRegenerateOTP={handleRegenerateOTP}
      onCloseSession={handleCloseSession}
      onStartOrdering={() => router.push('/ordering')}
      isAdmin={true}
    />
  );
}
```

## Component Sections

### 1. OTP Display Section
- **Large digit boxes**: Each OTP digit displayed in individual styled containers
- **Copy button**: Prominent button with visual feedback
- **Responsive design**: Adapts to different screen sizes

### 2. Session Information
- **Basic info**: Restaurant name, table number, duration, status
- **Order summary**: Participant count, orders, items, total amount
- **Real-time updates**: Duration updates every minute

### 3. Participants List
- **Avatar display**: Initials in colored circles
- **Contact info**: Name and phone number
- **Grid layout**: Responsive grid for multiple participants

### 4. QR Code Section
- **Toggle display**: Show/hide QR code
- **Large format**: Easy to scan from distance
- **Fallback text**: OTP displayed as text in QR area

### 5. Share Options
- **Copy OTP**: Copy just the OTP code
- **Copy Details**: Copy full session information
- **QR Code**: Toggle QR code display
- **Text Message**: Open SMS with pre-filled message
- **Social Media**: Share on Twitter

### 6. Session Management
- **Start Ordering**: Begin the ordering process
- **Regenerate OTP**: Generate new OTP (admin only)
- **Close Session**: End session early (admin only)

## Sharing Features

### Copy Functionality
```typescript
const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};
```

### Share Options
- **Copy OTP**: `123456`
- **Copy Details**: Full session information with formatting
- **Text Message**: Pre-formatted SMS with restaurant and table info
- **Social Media**: Twitter share with session details

## Styling and Design

### Color Scheme
- **Primary**: Blue gradient (`from-blue-500 to-indigo-600`)
- **Success**: Green (`bg-green-500`)
- **Warning**: Orange (`bg-orange-600`)
- **Danger**: Red (`bg-red-600`)
- **Neutral**: Gray (`bg-gray-50`)

### Typography
- **OTP Digits**: 48px monospace font
- **Headings**: 18-24px semibold
- **Body**: 14-16px regular
- **Captions**: 12-14px small

### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: Two-column grid for info sections
- **Desktop**: Full layout with all features

## Accessibility Features

### ARIA Labels
- Proper button labels and descriptions
- Screen reader friendly content
- Keyboard navigation support

### Visual Feedback
- Loading states for async operations
- Success/error states for copy operations
- Hover and focus states for interactive elements

## Error Handling

### Clipboard API
- Fallback to `document.execCommand` for older browsers
- Error logging for failed copy operations
- User feedback for unsupported features

### API Operations
- Loading states during async operations
- Error handling for failed requests
- Graceful degradation for missing data

## Performance Considerations

### State Management
- Efficient state updates
- Debounced duration calculations
- Cleanup of intervals on unmount

### Rendering Optimization
- Conditional rendering for optional sections
- Memoized calculations for totals
- Efficient re-renders

## Testing

### Demo Component
A demo component (`OTPDisplayDemo`) is provided for testing:
- Sample data generation
- Interactive functionality
- Feature demonstration

### Test Page
Access the demo at `/test-otp-display` to see the component in action.

## Integration with API

### Required Endpoints
- `POST /api/sessions/{sessionId}/regenerate-otp` - Regenerate OTP
- `PUT /api/sessions/{sessionId}/close` - Close session
- `GET /api/sessions/{sessionId}/customers` - Get participants
- `GET /api/sessions/{sessionId}/orders` - Get orders

### Data Flow
1. Component receives session data
2. Displays current OTP and information
3. Handles user interactions
4. Calls appropriate API endpoints
5. Updates local state with results

## Future Enhancements

### Planned Features
- **Real-time updates**: WebSocket integration for live data
- **Advanced QR codes**: Custom QR code generation
- **More sharing options**: WhatsApp, email, etc.
- **Analytics**: Usage tracking and metrics
- **Customization**: Theme and branding options

### Potential Improvements
- **Offline support**: Service worker integration
- **Push notifications**: Real-time alerts
- **Voice sharing**: Voice-to-text for sharing
- **Multi-language**: Internationalization support 