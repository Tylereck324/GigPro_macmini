# GigPro - Gig Worker Tracking App

A comprehensive, modern web application for gig workers to track income, expenses, and profits across multiple platforms.

## Features

### ✅ Core Features

#### 📅 Calendar & Dashboard
- **Interactive Calendar**: Monthly view with daily profit/loss indicators (Green for profit, Red for loss).
- **Smart Navigation**: Click any day to manage that date's entries.
- **Monthly Summaries**: Real-time breakdown of:
  - Total Income
  - Fixed Expenses (Bills)
  - Variable Expenses
  - Net Profit
  - **Miles Driven** (New!)
  - Goal Progress

#### 💰 Income Tracking
- **Platform Support**: Built-in support for Amazon Flex, DoorDash, and Walmart Spark.
- **Smart Time Calculator**: Automatically calculates duration based on start/end times (or vice-versa).
- **Amazon Flex Hours Tracker**:
  - Monitors 8-hour daily caps.
  - Tracks 40-hour rolling 7-day limits.
  - Visual progress bars with warning colors.

#### 📉 Comprehensive Expense Management
- **Daily Expenses**: Track mileage and gas costs per day.
- **Fixed Expenses**: Manage recurring monthly bills (Rent, Insurance, etc.).
- **Variable Expenses**: Track fluctuating costs like groceries or utilities.
- **Payment Plans**: dedicated tracker for installment plans (Affirm, Klarna, etc.) with progress monitoring.

#### 🎯 Goal Setting
- **Financial Goals**: Set Weekly or Monthly income targets.
- **Progress Tracking**: Visual progress bars showing real-time completion status.
- **Priority System**: Manage multiple goals with different priority levels.

#### 👤 Single User Experience
- **No Login Required**: Streamlined "Single User Mode" bypasses authentication for instant access.
- **Cloud Sync**: All data is securely stored in a Supabase cloud database, accessible from any device.
- **Persistent Settings**: App remembers your preferences automatically.

#### 🎨 Modern UI/UX
- **Glassmorphism Design**: Sleek, translucent cards with blurred backgrounds.
- **Dynamic Theming**:
  - **Blue & Teal Palette**: A modern, professional color scheme.
  - **Dark/Light Mode**: Fully supported with instant toggling.
  - **Responsive Layout**: Optimized for both desktop and mobile devices.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Icons**: Heroicons
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

### 1. Dashboard & Calendar
The home screen shows your monthly calendar.
- **Green dots** indicate profitable days.
- **Red dots** indicate a loss.
- The **Sidebar** shows your monthly totals, miles driven, and active goal progress.

### 2. Adding Daily Data
Click on any day in the calendar to:
- Add income from different platforms.
- Log daily mileage and gas costs.
- See your daily net profit and earnings per mile.

### 3. Managing Expenses
Navigate to the **Expenses** tab to manage:
- **Fixed Expenses**: Recurring bills.
- **Variable Expenses**: One-off costs for the month.
- **Payment Plans**: Track debt payoffs or installment plans.

### 4. Goals
Navigate to the **Goals** tab to set financial targets. The app will automatically track your progress based on your income entries.

### 5. Settings & Theme
- Toggle Dark/Light mode using the icon in the header.
- Settings are automatically saved to your profile in the cloud.

## Database Schema

### Tables

- **income_entries**: Income records with platform, time, amount, and notes.
- **daily_data**: Mileage and gas expenses per day.
- **fixed_expenses**: Recurring monthly bills.
- **variable_expenses**: One-time or varying monthly expenses.
- **payment_plans**: Payment plan tracking.
- **payment_plan_payments**: Individual payment records.
- **goals**: Financial targets and progress.
- **app_settings**: User preferences (theme, capacity limits).

**Note:** Row Level Security (RLS) is disabled to support Single User Mode.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - feel free to use and modify for your own needs.

---

Built with ❤️ for gig workers