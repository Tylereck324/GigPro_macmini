# GigPro - Quick Start Guide

## 🚀 Running the App

```bash
# Start the development server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## 🎯 Try It Out

### 1. View the Calendar
- You'll see the current month with a calendar grid
- Click the sun/moon icon in the header to toggle dark mode

### 2. Add Your First Income Entry
1. Click on today's date (or any day) on the calendar
2. You'll be taken to the day detail page
3. Fill out the income entry form:
   - **Platform**: Select Amazon Flex, DoorDash, or Walmart Spark
   - **Time**: Enter any 2 of these 3 fields:
     - Start time (e.g., 9:00 AM)
     - End time (e.g., 1:00 PM)
     - Length in minutes (e.g., 240)
   - **Amount**: How much you earned (e.g., 150.00)
   - **Notes**: Optional notes about the block
4. Click "Add Entry"

### 3. Track Daily Expenses
1. On the same day detail page, scroll to "Daily Expenses"
2. Enter:
   - **Mileage**: Miles driven (e.g., 100)
   - **Gas Expense**: How much you spent on gas (e.g., 30.00)
3. Click "Save Expenses"

### 4. View Your Profit
The "Daily Summary" card on the right shows:
- **Total Income**: Sum of all income for the day
- **Gas Expense**: Your gas costs
- **Profit**: Income minus gas (green if positive, red if negative)
- **Earnings Per Mile**: How much you made per mile driven

### 5. Amazon Flex Hours Tracking
If you add any Amazon Flex entries, you'll see the hours tracker showing:
- Daily hours (out of 8)
- Weekly hours (out of 40, rolling 7 days)
- Color-coded remaining hours (green, yellow, or red)

### 6. Go Back to Calendar
Click "Back to Calendar" to see your profit for the day displayed on the calendar in green (profit) or red (loss).

## ✨ Pro Tips

### Smart Time Calculator
You only need to fill in 2 of the 3 time fields:
- Enter **start** and **end** → length is calculated
- Enter **start** and **length** → end time is calculated
- Enter **end** and **length** → start time is calculated

Auto-calculated fields show a green checkmark!

### Multiple Entries Per Day
You can add multiple income entries for the same day. Each platform's income is summarized separately.

### Edit & Delete
- Click the pencil icon to edit an entry
- Click the trash icon to delete an entry

### Dark Mode
Your theme preference is saved automatically, so it will remember your choice next time you visit.

## 📱 Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- IndexedDB support (built into all modern browsers)

## 🔒 Privacy

All your data is stored **locally in your browser** using IndexedDB. Nothing is sent to any server. Your data is completely private and stays on your device.

## 🎨 Color Indicators

- **Green**: Profit or success
- **Red**: Loss or danger
- **Orange**: Amazon Flex
- **Red**: DoorDash
- **Blue**: Walmart Spark
- **Sky Blue**: Primary actions

## 📊 What You Can Track

### Currently Available:
✅ Daily income by platform
✅ Block times and durations
✅ Amazon Flex hours limits
✅ Daily mileage
✅ Gas expenses
✅ Profit calculations
✅ Earnings per mile
✅ Income summaries
✅ Monthly calendar overview

### Coming Soon:
🚧 Monthly fixed expenses
🚧 Variable monthly expenses
🚧 Payment plan tracking
🚧 Data export/import
🚧 PWA mobile installation
🚧 Offline support

## 🆘 Troubleshooting

**Data not saving?**
- Make sure you're using a modern browser
- Check that JavaScript is enabled
- Try refreshing the page

**Calendar not showing?**
- Clear your browser cache
- Make sure JavaScript is enabled
- Try a different browser

**Theme not switching?**
- Check browser console for errors
- Try clearing localStorage
- Refresh the page

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

**Enjoy tracking your gig income with GigPro!** 🎉
