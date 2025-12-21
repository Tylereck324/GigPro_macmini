# GigPro

## Project Overview

GigPro is a comprehensive web application designed for gig economy workers (Amazon Flex, DoorDash, Walmart Spark, etc.) to track their income, expenses, goals, and profitability. It is built as a Single Page Application (SPA) using Next.js 14's App Router but primarily leveraging client-side data fetching and state management.

### Tech Stack
*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand
*   **Database:** Supabase (PostgreSQL)
*   **Validation:** Zod
*   **Testing:** Vitest (Unit), Playwright (E2E)

### Architecture
The application follows a "Client-Side" architecture pattern:
*   **Data Access:** Direct calls to Supabase using the `@supabase/supabase-js` client. These are wrapped in API helper functions located in `src/lib/api`.
*   **State:** A global Zustand store (`src/store`) manages application state. It acts as the bridge between UI components and the API layer.
*   **UI:** React components are organized by feature (`src/components/income`, `src/components/expenses`, etc.) and used within App Router pages (`src/app`).

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Testing
```bash
# Run unit tests (Vitest)
npm test

# Run end-to-end tests (Playwright)
npm run test:e2e
```

### Code Quality
```bash
# Run linter
npm run lint

# Run type checker
npx tsc --noEmit
```

## Development Conventions

### File Structure
*   `src/app`: Next.js App Router pages and layouts.
*   `src/components`: Reusable UI components. Organized by feature (e.g., `calendar`, `income`) and generic UI (`ui`).
*   `src/lib/api`: Wrappers for Supabase data operations. **All database interaction should happen here.**
*   `src/lib/utils`: Pure utility functions (dates, math, formatting).
*   `src/store`: Zustand store slices. Each feature has its own slice (e.g., `incomeSlice.ts`).
*   `src/types`: TypeScript definitions and Zod validation schemas.
*   `sql`: Database schema definitions and RLS policies.

### State Management (Zustand)
*   The store is modularized into slices (`src/store/slices`).
*   Components should use the specific hook for the slice they need (e.g., `useIncomeStore`, `useExpenseStore`).
*   Async actions (data fetching) are defined within the store slices and call the API layer.

### Styling
*   Use Tailwind CSS utility classes for styling.
*   The `tailwind.config.ts` file defines custom colors (e.g., `primary`, `success`, `amazonFlex`) which map to CSS variables for theming support.
*   Dark mode is supported via the `dark` class strategy.

### Database & Security
*   The app currently supports a "Single User Mode" where RLS (Row Level Security) may need to be disabled or specifically configured for the anonymous key if no auth is present.
*   Database schemas are located in `sql/supabase-schema.sql`.
*   **Important:** When modifying database logic, ensure numeric values are correctly coerced from Postgres `DECIMAL` (which may be returned as strings) to JavaScript numbers using `src/lib/api/dbCoercion.ts`.

### Optimization
*   **Virtualization:** Lists with potentially many items (Income, Expenses) are rendered using standard `.map()` as previous attempts at virtualization (`react-window`) were unstable.
*   **Bundle Size:** `OPTIMIZATION_AUDIT.md` tracks performance improvements and removed dead code.
