# GigPro - Gig Worker Tracking App

A comprehensive web application for gig workers to track income, expenses, and profits across multiple platforms.

## Features

### ✅ Implemented

#### 📅 Calendar Interface
- **Monthly Calendar View**: Navigate through months with an interactive calendar
- **Profit Indicators**: Each day shows profit/loss in green (profit) or red (loss)
- **Click to Navigate**: Click any day to view detailed information
- **Current Day Highlighting**: Today's date is highlighted with a blue ring

#### 💰 Income Tracking
- **Multiple Platforms**: Track income from Amazon Flex, DoorDash, and Walmart Spark
- **Smart Time Calculator**: Enter any 2 of 3 fields (start time, end time, block length) and the 3rd is auto-calculated
- **Amazon Flex Hours Tracker**:
  - Rolling 7-day weekly limit (40 hours)
  - Daily limit (8 hours)
  - Color-coded warnings (green, yellow, red)
  - Real-time progress bars
- **Income Summary**: View income breakdown by platform
- **Add/Edit/Delete**: Full CRUD operations for income entries
- **Notes Field**: Add custom notes to each entry

#### 📊 Daily Expenses & Profit
- **Mileage Tracking**: Record daily mileage
- **Gas Expenses**: Track fuel costs
- **Profit Calculation**: Automatic calculation (income - gas expense)
- **Earnings Per Mile**: Shows how much you earned per mile driven
- **Daily Summary Card**: Overview of income, expenses, and profit

#### 🎨 Theme System
- **Dark Mode**: Full dark theme support
- **Light Mode**: Clean, bright interface
- **Theme Toggle**: Switch themes with one click
- **Persistent Preference**: Theme choice saved to local storage
- **Vibrant Colors**: Custom color palettes optimized for each theme
- **Platform Colors**: Distinct colors for Amazon (orange), DoorDash (red), Walmart (blue)

#### 💾 Data Storage
- **IndexedDB**: All data stored locally in browser
- **Privacy First**: No backend, all data stays on your device
- **Fast & Offline**: Works without internet connection
- **Persistent**: Data survives browser restarts

### 🚧 Coming Soon

#### Monthly Expenses Module
- Fixed monthly expenses (rent, insurance, etc.)
- Variable expenses (groceries, utilities)
- Payment plan tracking (Affirm, Klarna, PayPal Pay in 4)
- Payment completion tracking

#### Data Management
- Export data to JSON
- Import data from JSON
- Backup and restore functionality

#### PWA Features
- Installable on mobile devices
- Offline support with service worker
- App-like experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: IndexedDB (via Dexie.js)
- **Date Handling**: date-fns
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Adding Income

1. Navigate to any day on the calendar by clicking it
2. Fill in the income entry form:
   - Select gig platform (Amazon Flex, DoorDash, or Walmart Spark)
   - Enter any 2 of: start time, end time, or block length
   - Enter the amount earned
   - Optionally add notes
3. Click "Add Entry"

### Tracking Amazon Flex Hours

- The hours tracker automatically appears when you have Amazon Flex entries
- Shows your daily hours (out of 8) and weekly hours (out of 40, rolling 7 days)
- Color indicators:
  - **Green**: More than 3 hours remaining
  - **Yellow**: 1-3 hours remaining
  - **Red**: Less than 1 hour remaining

### Recording Expenses

1. On the day detail page, scroll to "Daily Expenses"
2. Enter mileage and gas expense
3. The profit and earnings per mile are calculated automatically
4. Click "Save Expenses" to store the data

### Using Dark Mode

- Click the sun/moon icon in the header to toggle between light and dark themes
- Your preference is saved automatically

## Project Structure

```
GigPro/
├── public/              # Static files
├── src/
│   ├── app/            # Next.js app routes
│   │   ├── day/[date]/ # Day detail page
│   │   ├── expenses/   # Monthly expenses (coming soon)
│   │   ├── settings/   # Settings (coming soon)
│   │   └── page.tsx    # Home (calendar)
│   ├── components/     # React components
│   │   ├── calendar/   # Calendar components
│   │   ├── income/     # Income tracking components
│   │   ├── expenses/   # Expense components
│   │   ├── stats/      # Statistics & summary components
│   │   ├── ui/         # Reusable UI components
│   │   └── layout/     # Layout components
│   ├── lib/            # Utilities & database
│   │   ├── db/         # IndexedDB setup & repositories
│   │   ├── utils/      # Utility functions
│   │   └── constants/  # Constants
│   ├── store/          # Zustand state management
│   ├── styles/         # Theme definitions
│   └── types/          # TypeScript types
```

## Database Schema

### Tables

- **income_entries**: Income records with platform, time, amount, and notes
- **daily_data**: Mileage and gas expenses per day
- **fixed_expenses**: Recurring monthly bills
- **variable_expenses**: One-time or varying monthly expenses
- **payment_plans**: Payment plan tracking
- **payment_plan_payments**: Individual payment records
- **settings**: App settings including theme

## Color Scheme

### Light Mode
- Primary: Sky Blue (#0EA5E9)
- Success: Emerald Green (#10B981)
- Danger: Red (#EF4444)
- Amazon Flex: Orange (#FF9900)
- DoorDash: Red (#FF3008)
- Walmart Spark: Blue (#0071CE)

### Dark Mode
- Optimized versions of light mode colors for better contrast
- Darker backgrounds with lighter text
- Adjusted platform colors for visibility

## Key Features Explained

### Smart Time Calculator

The time calculator is intelligent - you only need to provide 2 out of 3 fields:

- **Start + End** → Calculates Length
- **Start + Length** → Calculates End
- **End + Length** → Calculates Start

Auto-calculated fields show a green checkmark for clarity.

### Rolling Amazon Flex Hours

Amazon Flex has two limits:
1. **Daily**: 8 hours per day
2. **Weekly**: 40 hours in any rolling 7-day window

The tracker calculates both limits in real-time, showing how many hours you have left to work.

### Profit Calculation

```
Profit = Total Income - Gas Expense
Earnings Per Mile = Total Income / Mileage
```

These are calculated automatically and displayed with color coding:
- Green for profit
- Red for loss
- Blue for earnings per mile

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

IndexedDB is required, which is supported in all modern browsers.

## Privacy & Security

- **No Server**: All data stays on your device
- **No Tracking**: No analytics or third-party scripts
- **No Account**: No sign-up or login required
- **Local Storage**: IndexedDB for persistent, private storage

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - feel free to use and modify for your own needs.

## Roadmap

- [ ] Monthly expenses tracking
- [ ] Payment plan management
- [ ] Data export/import
- [ ] PWA installation support
- [ ] Offline mode with service worker
- [ ] Weekly/monthly summary reports
- [ ] Charts and graphs
- [ ] Tax estimation tools
- [ ] Multi-device sync (optional)

## Support

For issues or questions, please create an issue on GitHub.

---

Built with ❤️ for gig workers
