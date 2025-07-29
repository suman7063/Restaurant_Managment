# 🍕 Menu Items Test Guide

## ✅ Test Menu Loading

1. **Open the application:** http://localhost:3003
2. **Login as customer:** Enter `QR001` and click "Access"
3. **Check menu items:** You should see 8 menu items displayed

## 🍽️ Expected Menu Items

You should see these items in the menu:

### Main Dishes:
- 🍕 Margherita Pizza - $5.99 (Popular)
- 🐟 Grilled Salmon - $8.99 (Popular)
- 🍚 Mushroom Risotto - $7.99

### Starters:
- 🥗 Caesar Salad - $3.99

### Desserts:
- 🍰 Chocolate Cake - $2.99
- 🍮 Tiramisu - $3.99 (Popular)

### Beverages:
- ☕ Espresso Coffee - $1.99
- 🧃 Fresh Juice - $2.49

## 🎯 Test Features

### ✅ Menu Functionality:
- **Category Filter:** Click "All", "Main", "Starter", "Dessert", "Beverage"
- **Add to Cart:** Click "Add to Cart" on any item
- **Cart Updates:** Items should appear in the cart on the right
- **Quantity Controls:** Use +/- buttons to adjust quantities

### 🔄 Expected Behavior:
1. **Loading State:** Brief loading spinner when page loads
2. **Menu Display:** All 8 items should be visible
3. **Categories:** 5 category buttons (All + 4 categories)
4. **Add to Cart:** Button changes to "✓ In Cart" after adding
5. **Cart Total:** Updates automatically

## 🐛 Troubleshooting

### If menu items don't appear:
1. **Check Console:** Open browser dev tools (F12) for errors
2. **Refresh Page:** Try refreshing the page
3. **Check Network:** Look for failed API calls

### If categories don't work:
1. **Click Categories:** Try clicking different category buttons
2. **Check Filtering:** Items should filter by category

## 🎉 Success Indicators

- ✅ 8 menu items displayed
- ✅ 5 category filter buttons
- ✅ "Add to Cart" buttons work
- ✅ Cart updates when items added
- ✅ Category filtering works
- ✅ Loading states work properly 