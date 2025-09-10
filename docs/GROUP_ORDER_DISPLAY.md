# Group Order Display Component Documentation

## Overview

The `GroupOrderDisplay` component is a comprehensive React component designed to display all orders within a session for OTP-based group ordering in the restaurant management system. It provides a complete view of session information, customer attributions, and order details with interactive features.

## Key Features

### 1. Session Overview
- **Session OTP Display**: Prominently shows the 6-digit OTP for session identification
- **Session Duration**: Real-time calculation of how long the session has been active
- **Session Status**: Visual indicator showing active, billed, or cleared status
- **Real-time Refresh**: Manual refresh capability to update session data

### 2. Session Statistics
- **Total Participants**: Count of all customers in the session
- **Total Orders**: Number of orders placed across all customers
- **Total Amount**: Sum of all order amounts in the session
- **Average Order**: Calculated average amount per order

### 3. Customer Order Management
- **Customer Attribution**: Clear identification of who ordered what
- **Order Grouping**: Orders grouped by customer with individual summaries
- **Expandable Details**: Click to expand/collapse detailed order information
- **Current User Highlighting**: Special visual indication for the current user
- **Order Status Tracking**: Real-time status updates for each order item

### 4. Interactive Features
- **Request Bill**: Initiate billing process for the session
- **Regenerate OTP**: Generate new OTP for session access
- **Close Session**: End the current session
- **Refresh Data**: Update all session information

## Component Interface

### Props

```typescript
interface GroupOrderDisplayProps {
  sessionId: string;                    // Required: UUID of the session
  currentCustomerId?: string;           // Optional: ID of current user
  onRefresh?: () => void;               // Optional: Refresh callback
  onRequestBill?: () => void;           // Optional: Bill request callback
  onRegenerateOTP?: () => void;         // Optional: OTP regeneration callback
  onCloseSession?: () => void;          // Optional: Session close callback
  className?: string;                   // Optional: Additional CSS classes
}
```

### Data Structures

#### CustomerOrderSummary
```typescript
interface CustomerOrderSummary {
  customer: SessionCustomer;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  items: Array<{
    item: any;
    quantity: number;
    price: number;
    status: string;
    customerName: string;
  }>;
}
```

#### SessionStatistics
```typescript
interface SessionStatistics {
  totalParticipants: number;
  totalOrders: number;
  totalAmount: number;
  averageOrder: number;
  sessionDuration: string;
}
```

## Usage Examples

### Basic Usage
```tsx
import { GroupOrderDisplay } from '../components/GroupOrderDisplay';

function MyComponent() {
  return (
    <GroupOrderDisplay
      sessionId="session-123"
      currentCustomerId="customer-456"
    />
  );
}
```

### With All Callbacks
```tsx
function MyComponent() {
  const handleRefresh = () => {
    console.log('Refreshing session data...');
  };

  const handleRequestBill = () => {
    console.log('Requesting bill...');
  };

  const handleRegenerateOTP = () => {
    console.log('Regenerating OTP...');
  };

  const handleCloseSession = () => {
    console.log('Closing session...');
  };

  return (
    <GroupOrderDisplay
      sessionId="session-123"
      currentCustomerId="customer-456"
      onRefresh={handleRefresh}
      onRequestBill={handleRequestBill}
      onRegenerateOTP={handleRegenerateOTP}
      onCloseSession={handleCloseSession}
    />
  );
}
```

## Data Integration

### Required Services
The component integrates with the following services from `src/lib/database.ts`:

- `sessionService.getSessionById(sessionId)` - Get session details
- `sessionService.getSessionCustomers(sessionId)` - Get session participants
- `orderService.getSessionOrders(sessionId)` - Get session orders

### Data Flow
1. **Initial Load**: Component loads session, customers, and orders in parallel
2. **Data Processing**: Processes customer order summaries and calculates statistics
3. **State Management**: Manages loading states, errors, and UI interactions
4. **Real-time Updates**: Supports manual refresh for updated data

## UI/UX Features

### Responsive Design
- **Mobile-First**: Optimized for mobile devices with responsive breakpoints
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large touch targets for mobile interaction

### Visual Hierarchy
- **Gradient Header**: Eye-catching session overview with gradient background
- **Statistics Grid**: Clear presentation of session statistics
- **Customer Cards**: Individual cards for each customer with order summaries
- **Status Indicators**: Color-coded status badges for orders and session

### Interactive Elements
- **Expandable Sections**: Click to expand/collapse customer order details
- **Hover Effects**: Visual feedback on interactive elements
- **Loading States**: Spinner animations during data loading
- **Error Handling**: User-friendly error messages with retry options

## Styling and Theming

### Color Scheme
- **Primary**: Blue gradient for header and primary actions
- **Success**: Green for completed orders and positive actions
- **Warning**: Yellow/Orange for pending items and warnings
- **Error**: Red for errors and destructive actions
- **Neutral**: Gray scale for text and borders

### Typography
- **Headings**: Bold, large text for section headers
- **Body Text**: Regular weight for content
- **Monospace**: For OTP display and technical information
- **Status Text**: Small, colored text for status indicators

### Spacing and Layout
- **Consistent Padding**: 6 units (1.5rem) for main sections
- **Card Spacing**: 4 units (1rem) between customer cards
- **Grid Layout**: Responsive grid for statistics display
- **Border Radius**: 8px (lg) for cards and buttons

## Error Handling

### Loading States
- **Initial Load**: Full-screen loading spinner with message
- **Refresh**: Button-level loading state with spinner
- **Data Processing**: Graceful handling of empty states

### Error States
- **Session Not Found**: Clear error message with retry option
- **Network Errors**: User-friendly error messages
- **Data Validation**: Proper handling of missing or invalid data

### Empty States
- **No Orders**: Helpful message when no orders exist
- **No Customers**: Appropriate messaging for empty sessions
- **No Items**: Clear indication when customers haven't ordered

## Performance Considerations

### Data Loading
- **Parallel Requests**: Load session, customers, and orders simultaneously
- **Efficient Processing**: Process data once and cache results
- **Minimal Re-renders**: Optimized state management

### Memory Management
- **Cleanup**: Proper cleanup of timeouts and event listeners
- **State Optimization**: Efficient state structure and updates
- **Component Lifecycle**: Proper handling of component mounting/unmounting

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through interactive elements
- **Focus Indicators**: Clear focus states for all interactive elements
- **Keyboard Shortcuts**: Support for common keyboard interactions

### Screen Reader Support
- **Semantic HTML**: Proper use of headings, lists, and landmarks
- **ARIA Labels**: Descriptive labels for interactive elements
- **Status Announcements**: Screen reader announcements for status changes

### Visual Accessibility
- **Color Contrast**: High contrast ratios for text and backgrounds
- **Text Sizing**: Scalable text that works with browser zoom
- **Focus Indicators**: Clear visual indicators for keyboard focus

## Testing

### Component Testing
- **Unit Tests**: Test individual component functions
- **Integration Tests**: Test data loading and state management
- **User Interaction Tests**: Test expand/collapse and button interactions

### Visual Testing
- **Responsive Testing**: Test across different screen sizes
- **Accessibility Testing**: Test with screen readers and keyboard navigation
- **Cross-browser Testing**: Test in different browsers

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Filtering**: Filter orders by status, customer, or date
- **Export Functionality**: Export session data to PDF or CSV
- **Print Support**: Print-friendly version of session display

### Performance Improvements
- **Virtual Scrolling**: For sessions with many customers/orders
- **Lazy Loading**: Load customer details on demand
- **Caching**: Implement client-side caching for better performance

## Troubleshooting

### Common Issues

#### Session Not Loading
- Verify session ID is valid and exists in database
- Check network connectivity and API endpoints
- Ensure proper authentication and permissions

#### Orders Not Displaying
- Verify orders are properly linked to session
- Check customer attribution in order data
- Ensure order service is functioning correctly

#### UI Not Responsive
- Check CSS classes and Tailwind configuration
- Verify responsive breakpoints are properly set
- Test on different devices and screen sizes

### Debug Information
- **Console Logs**: Check browser console for error messages
- **Network Tab**: Monitor API requests and responses
- **React DevTools**: Inspect component state and props

## Related Components

- **SessionChoiceModal**: For joining sessions
- **OTPDisplayModal**: For displaying session OTP
- **NotificationToast**: For user feedback
- **CustomerInterface**: For customer ordering interface

## Dependencies

### External Libraries
- **React**: Core React library
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling framework

### Internal Dependencies
- **types.ts**: TypeScript type definitions
- **database.ts**: Database service functions
- **ui/index.ts**: UI component library

## Version History

### v1.0.0 (Current)
- Initial implementation with core features
- Session overview and statistics
- Customer order attribution
- Interactive features and responsive design
- Comprehensive error handling and accessibility 