# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GigPro is a gig worker income/expense tracking application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase. The app uses a client-side architecture with Zustand for state management and direct Supabase database calls.

## Development Commands

### Development & Build
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm run analyze          # Build with bundle analyzer (opens in browser)
npm start                # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check without emitting files
```

### Testing
```bash
# Unit tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Generate coverage report

# E2E tests (Playwright)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:all         # Run both unit and E2E tests

# Run single test file
npx vitest src/components/income/__tests__/TimeCalculator.test.tsx
```

### Code Quality
```bash
npm run audit:orphans    # Check for unused/orphaned modules (custom script)
```

## Architecture & Key Patterns

### State Management Architecture

The application uses a **client-side state management pattern** with Zustand, organized into feature-based slices:

- **Store Structure**: All slices are combined in `src/store/index.ts` into a single `AppStore`
- **Slice Files**: `src/store/slices/` contains individual feature slices:
  - `incomeSlice.ts` - Income entry management
  - `dailyDataSlice.ts` - Daily mileage and gas tracking
  - `expenseSlice.ts` - Fixed expenses and payment plans
  - `themeSlice.ts` - Theme preferences (dark/light mode)
  - `goalSlice.ts` - Financial goals

**Important**: Components should use the slice-specific hooks exported from `src/store/index.ts` (e.g., `useIncomeStore()`, `useExpenseStore()`) rather than accessing the global store directly. This ensures proper state selection and prevents unnecessary re-renders.

### Data Flow Pattern

```
UI Component → Zustand Store Action → API Layer (src/lib/api) → Supabase → Response → Coercion → Store Update → UI Re-render
```

1. **UI Components** call store actions (e.g., `addIncomeEntry()`)
2. **Store Actions** (async functions in slices) call API layer functions
3. **API Layer** (`src/lib/api/`) performs Supabase operations
4. **Database Responses** are coerced using `src/lib/api/dbCoercion.ts` (important!)
5. **Store State** is updated, triggering UI re-renders via shallow comparison

### Database Coercion Pattern

**Critical**: Postgres returns `DECIMAL` types as strings. All numeric database fields MUST be coerced using helpers from `src/lib/api/dbCoercion.ts`:

- `coerceNumber(value, fallback)` - Convert to number with fallback
- `coerceNullableNumber(value)` - Convert to number or null
- `coerceInteger(value, fallback)` - Convert to integer with fallback
- `coerceNullableInteger(value)` - Convert to integer or null

Example from `src/lib/api/income.ts`:
```typescript
const mapIncomeEntry = (entry: any): IncomeEntry => ({
  amount: coerceNumber(entry.amount),  // Required!
  blockLength: coerceNullableInteger(entry.block_length),
  // ... other fields
});
```

### Single User Mode

The app operates in "single user mode" with no authentication:
- Supabase client uses anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Row Level Security (RLS) may be disabled (see `sql/disable-all-rls.sql`)
- If you encounter "row-level security policy" errors, RLS needs to be configured or disabled

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── day/[date]/         # Daily view page with income/expense entry
│   ├── expenses/           # Fixed expenses & payment plans management
│   ├── goals/              # Goal setting and tracking
│   ├── settings/           # App settings & theme
│   └── simulator/          # Income simulator tool
├── components/             # React components (organized by feature)
│   ├── calendar/           # Monthly calendar with profit indicators
│   ├── expenses/           # Expense-related components
│   ├── income/             # Income entry forms and lists
│   ├── stats/              # Statistical displays (profit cards, etc.)
│   └── ui/                 # Generic UI components (dialogs, cards, etc.)
├── lib/
│   ├── api/                # ALL database operations go here
│   │   ├── dbCoercion.ts   # Numeric type coercion utilities
│   │   ├── income.ts       # Income CRUD operations
│   │   ├── expenses.ts     # Expense CRUD operations
│   │   ├── dailyData.ts    # Daily mileage/gas CRUD
│   │   ├── goals.ts        # Goal CRUD operations
│   │   └── settings.ts     # Settings CRUD operations
│   ├── utils/              # Pure utility functions
│   │   ├── amazonFlexHours.ts      # Amazon Flex hour cap calculations
│   │   ├── dateHelpers.ts          # Date formatting and manipulation
│   │   ├── exportImport.ts         # Data export/import functionality
│   │   ├── goalCalculations.ts     # Goal progress calculations
│   │   ├── profitCalculations.ts   # Daily/monthly profit calculations
│   │   ├── simulatorCalculations.ts # Income simulator logic
│   │   ├── timeCalculations.ts     # Time duration calculations
│   │   └── trendsCalculations.ts   # Trend analysis
│   └── supabase.ts         # Supabase client initialization
├── store/                  # Zustand state management
│   ├── slices/             # Feature-based state slices
│   └── index.ts            # Store composition & slice hooks
├── types/                  # TypeScript types and Zod schemas
│   ├── validation/         # Zod validation schemas
│   ├── income.ts
│   ├── expense.ts
│   ├── dailyData.ts
│   ├── goal.ts
│   └── settings.ts
└── test/
    └── setup.ts            # Vitest test setup
```

## Database Schema

Tables are defined in `sql/supabase-schema.sql`:
- `income_entries` - Income records with platform, time tracking, and amounts
- `daily_data` - Daily mileage and gas expense tracking
- `fixed_expenses` - Recurring monthly bills
- `payment_plans` - Installment/payment plan tracking
- `payment_plan_payments` - Individual payment records for plans
- `goals` - Financial goals (weekly/monthly targets)
- `app_settings` - User preferences (theme, capacity settings)

**Naming Convention**: Database uses `snake_case`, TypeScript uses `camelCase`. API layer handles mapping.

## Styling & Theming

- **Tailwind CSS**: All styling uses utility classes
- **Custom Theme Colors**: Defined in `tailwind.config.ts` and mapped to CSS variables:
  - `primary`, `secondary` - Main brand colors (blue/teal palette)
  - Platform colors: `amazonFlex`, `doordash`, `walmartSpark`
  - Status colors: `success`, `warning`, `danger`
- **Dark Mode**: Uses `dark:` class strategy, toggled via `themeSlice`
- **Glassmorphism**: Design uses translucent backgrounds with backdrop blur

## Testing Conventions

### Unit Tests (Vitest)
- Test files: `**/*.test.{ts,tsx}` or `**/*.spec.{ts,tsx}`
- Setup file: `src/test/setup.ts` (configures jsdom, testing-library)
- Location: Co-located with source files in `__tests__/` subdirectories
- Run: `npm test` or `npx vitest path/to/file.test.tsx`

### E2E Tests (Playwright)
- Test directory: `e2e/`
- Configuration: `playwright.config.ts`
- Runs dev server automatically on `http://localhost:3000`
- Run: `npm run test:e2e`

## Common Development Tasks

### Adding a New Feature to the Store

1. Create or update the slice in `src/store/slices/featureSlice.ts`
2. Define the slice interface with state and actions
3. Add the slice to `AppStore` type in `src/store/index.ts`
4. Combine the slice in the store creation
5. Export a typed hook for the slice (e.g., `useFeatureStore`)

### Adding a New API Operation

1. Define types in `src/types/feature.ts`
2. Add Zod validation schemas in `src/types/validation/feature.validation.ts`
3. Create API functions in `src/lib/api/feature.ts`:
   - Map snake_case database fields to camelCase
   - Use `dbCoercion` helpers for numeric fields
4. Call API functions from store actions
5. Handle loading/error states in the store slice

### Working with Date Calculations

- Use utilities from `src/lib/utils/dateHelpers.ts`
- Dates are stored as `YYYY-MM-DD` strings in the database
- Use `date-fns` library for date manipulation (already imported in utils)

### Amazon Flex Hour Tracking

The app tracks Amazon Flex hour limits (8 hours/day, 40 hours/week rolling):
- Logic in `src/lib/utils/amazonFlexHours.ts`
- Returns progress percentages and warning states
- Used by income components to show capacity warnings

## Important Notes

- **No Authentication**: This is a single-user app with no login system
- **Client-Side Rendering**: Despite using App Router, most data fetching happens client-side
- **Numeric Coercion**: Always use `dbCoercion` helpers when reading numeric values from Supabase
- **State Updates**: Use shallow comparison for store selectors to avoid unnecessary re-renders
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required
- **Virtualization**: Previous attempts with `react-window` were removed due to instability; use standard `.map()` for lists
