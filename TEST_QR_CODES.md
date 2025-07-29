# 🧪 QR Code Testing Guide

## ✅ Test the Access Button

1. **Open the application:** http://localhost:3000
2. **Enter a QR code:** Type `QR001` in the input field
3. **Click "Access":** The button should now work and log you in as John Doe

## 🔑 Test QR Codes

Try these QR codes in the input field:

### Customer QR Codes:
- `QR001` → John Doe (Customer at Table 5)
- `QR002` → Jane Smith (Customer at Table 3)
- `QR003` → Bob Wilson (Customer at Table 7)

### Staff QR Codes:
- `ADMIN001` → Mike Admin (Admin Dashboard)
- `WAITER001` → Sarah Waiter (Waiter Dashboard)
- `CHEF001` → Gordon Chef (Chef Dashboard)

## 🎯 Expected Behavior

### ✅ Working Features:
- **Input Validation:** Green checkmark appears when valid QR code is entered
- **Access Button:** Clicking "Access" should log you in
- **User Interface:** Should show the appropriate dashboard based on user role
- **Simulate QR:** "Scan QR" button should randomly select a valid QR code

### 🔄 What Happens:
1. Enter QR code → Green checkmark appears
2. Click "Access" → Loading animation
3. Welcome message appears
4. Redirected to appropriate dashboard

## 🐛 If Access Button Still Doesn't Work

1. **Check Console:** Open browser dev tools (F12) and check for errors
2. **Refresh Page:** Try refreshing the page
3. **Clear Input:** Make sure the QR code is entered correctly (case doesn't matter)

## 🎉 Success Indicators

- ✅ Green checkmark next to input field
- ✅ "Access" button becomes clickable
- ✅ Loading animation when clicked
- ✅ Welcome message appears
- ✅ Redirected to user dashboard 