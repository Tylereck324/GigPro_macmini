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
  - Payment Plans Due
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
- **Payment Plans**: dedicated tracker for installment plans (Affirm, Klarna, etc.) with progress monitoring.

#### 🎯 Goal Setting
- **Financial Goals**: Set Weekly or Monthly income targets.
- **Progress Tracking**: Visual progress bars showing real-time completion status.
- **Priority System**: Manage multiple goals with different priority levels.

#### 👤 Single User Experience
- **No Login Required**: Streamlined "Single User Mode" bypasses authentication for instant access.
- **Cloud Sync**: All data is securely stored in a Supabase cloud database, accessible from any device.
- **Persistent Settings**: App remembers your preferences automatically.

**⚠️ SECURITY NOTICE:** This application is designed for **SINGLE USER USE ONLY**. Row Level Security (RLS) is disabled by default. Anyone with access to your Supabase credentials can view and modify all data. **Do not share your Supabase URL or anon key publicly.** For production deployments, consider:
  - Enabling RLS and implementing authentication (see `sql/enable-rls.sql`)
  - Using environment variables to protect credentials
  - Restricting database access to trusted domains only

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
- **payment_plans**: Payment plan tracking.
- **payment_plan_payments**: Individual payment records.
- **goals**: Financial targets and progress.
- **app_settings**: User preferences (theme, capacity limits).

**Single User Mode Note:** If you see errors like `new row violates row-level security policy`, either disable RLS for the app tables (see `sql/disable-all-rls.sql`) or configure appropriate RLS policies for your setup.

### Security Considerations

**⚠️ IMPORTANT:** This application is configured for single-user use without authentication.

- **RLS Disabled:** Row Level Security is disabled by default for ease of use
- **Public Access Risk:** Anyone with your Supabase credentials can access your data
- **Credential Protection:** Never commit `.env.local` files or expose credentials in public repositories
- **Production Use:** For multi-user or public deployments, you MUST:
  1. Enable RLS policies (use `sql/enable-rls.sql` as a starting point)
  2. Implement proper authentication (Supabase Auth, OAuth, etc.)
  3. Add user-specific data filtering
  4. Use service role keys only in secure server environments

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - feel free to use and modify for your own needs.

---

Built with ❤️ for gig workers
