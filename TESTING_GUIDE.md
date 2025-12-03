# Testing Guide for GigPro

This guide explains how to implement and run automated tests for the GigPro application.

## Testing Stack

- **Vitest**: Fast unit test runner for TypeScript/JavaScript
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end (E2E) testing framework
- **jsdom**: Browser environment simulation for unit tests

## Test Scripts

```bash
# Run unit tests (watch mode)
npm test

# Run unit tests (single run)
npm test -- --run

# Run tests with UI
npm test:ui

# Run tests with coverage report
npm test:coverage

# Run E2E tests
npm test:e2e

# Run E2E tests with UI
npm test:e2e:ui

# Run all tests (unit + E2E)
npm test:all
```

## Project Structure

```
GigPro/
├── src/
│   ├── components/
│   │   └── income/
│   │       └── __tests__/
│   │           └── TimeCalculator.test.tsx
│   ├── lib/
│   │   ├── api/
│   │   └── utils/
│   │       └── __tests__/
│   │           └── exportImport.test.ts
│   ├── pages/
│   │   └── api/
│   │       └── income/
│   │           └── __tests__/
│   │               └── income.test.ts
│   ├── store/
│   │   └── slices/
│   │       └── __tests__/
│   │           └── incomeSlice.test.ts
│   └── test/
│       ├── setup.ts          # Global test setup
│       └── utils.tsx          # Test utilities and mocks
├── e2e/
│   └── income.spec.ts         # E2E tests
├── vitest.config.ts           # Vitest configuration
└── playwright.config.ts       # Playwright configuration
```

## Writing Tests

### 1. Unit Tests (Vitest)

Unit tests focus on individual functions and modules in isolation.

**Example: Testing a utility function**

```typescript
// src/lib/utils/__tests__/myUtil.test.ts
import { describe, it, expect } from 'vitest';
import { myUtil } from '../myUtil';

describe('myUtil', () => {
  it('should do something', () => {
    const result = myUtil('input');
    expect(result).toBe('expected output');
  });
});
```

### 2. Component Tests (React Testing Library)

Component tests verify UI components render and behave correctly.

**Example: Testing a React component**

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### 3. API Route Tests

API route tests verify server-side endpoints work correctly.

**Example: See** `src/pages/api/income/__tests__/income.test.ts`

Key features:
- Mock Supabase client
- Test validation logic
- Test error handling
- Test response formatting (snake_case → camelCase)

### 4. Zustand Store Tests

Store tests verify state management logic, especially:
- Optimistic updates
- Rollback on errors
- API integration

**Example: See** `src/store/slices/__tests__/incomeSlice.test.ts`

Critical tests include:
- Testing rollback logic captures original state BEFORE optimistic update
- Verifying API responses are used instead of optimistic updates
- Error handling and state consistency

### 5. E2E Tests (Playwright)

E2E tests verify complete user flows in a real browser.

**Example: See** `e2e/income.spec.ts`

To run E2E tests:
```bash
npm test:e2e
```

To run E2E tests with visual UI:
```bash
npm test:e2e:ui
```

## Critical Tests for Bug Fixes

The following tests verify the bugs we fixed during the Supabase migration:

### 1. Rollback Logic Test

**File:** `src/store/slices/__tests__/incomeSlice.test.ts`

**Test:** "should rollback on API error (CRITICAL BUG FIX TEST)"

**What it tests:** When an API update fails, the state should rollback to the ORIGINAL value, not the optimistically updated value.

**Bug fixed:** The original code captured the state AFTER the optimistic update, making rollback ineffective.

### 2. Time Input Interruption Test

**File:** `src/components/income/__tests__/TimeCalculator.test.tsx`

**Test:** "should allow typing time without interruption (BUG FIX TEST)"

**What it tests:** Users can type time values like "12:30 PM" without the input jumping to auto-formatted values mid-typing.

**Bug fixed:** useEffect was updating inputs during active typing, causing "12:3" → "12:03 AM" jumps.

### 3. Import Error Handling Test

**File:** `src/lib/utils/__tests__/exportImport.test.ts`

**Test:** "should handle partial import failures (CRITICAL BUG FIX TEST)"

**What it tests:** If one table import fails, the function should throw an error and not continue importing other tables.

**Bug fixed:** Missing error checking allowed partial imports, leaving database in inconsistent state.

## Mocking Supabase

All tests mock the Supabase client to avoid hitting the real database.

**Global mock** (in `src/test/setup.ts`):
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      // ... other methods
    })),
  },
}));
```

**Per-test mocking**:
```typescript
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockResolvedValue({
    data: [mockData],
    error: null
  }),
} as any);
```

## Test Database Setup (Optional)

For integration tests with real Supabase:

1. Create a separate test database in Supabase
2. Set up test environment variables:
   ```bash
   # .env.test.local
   NEXT_PUBLIC_SUPABASE_URL=your-test-instance-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   ```
3. Run migrations on test database
4. Write integration tests that use real Supabase client

## Coverage Reports

Generate coverage reports to see which code is tested:

```bash
npm test:coverage
```

Coverage reports will be generated in:
- Terminal: Text summary
- `coverage/index.html`: Interactive HTML report

Open the HTML report:
```bash
open coverage/index.html
```

## Best Practices

### 1. Test File Naming
- Unit tests: `myFile.test.ts`
- Component tests: `MyComponent.test.tsx`
- E2E tests: `feature.spec.ts`

### 2. Test Organization
- Group related tests with `describe()`
- Use clear, descriptive test names with `it()`
- Put tests in `__tests__` directories next to source files

### 3. What to Test

**High Priority:**
- Critical business logic (income calculations, payment tracking)
- Bug fixes (add regression tests)
- API routes (validation, error handling)
- Complex state management (optimistic updates, rollbacks)
- User-facing features (forms, navigation)

**Lower Priority:**
- Simple getters/setters
- Pure UI components with no logic
- Third-party library wrappers

### 4. Mock Dependencies
- Always mock external services (Supabase, APIs)
- Mock complex dependencies to isolate tests
- Use real implementations for simple utilities

### 5. Test User Behavior
- Test from the user's perspective
- Use `userEvent` instead of `fireEvent` for realistic interactions
- Test accessibility (screen reader text, keyboard navigation)

## Continuous Integration (CI)

To run tests in CI/CD (GitHub Actions, etc.):

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test:all
```

## Debugging Tests

### Vitest UI
```bash
npm test:ui
```

Opens a browser UI where you can:
- See test results visually
- Debug failing tests
- Re-run specific tests

### Playwright UI
```bash
npm test:e2e:ui
```

Opens Playwright UI where you can:
- Watch tests run in real browser
- Step through tests
- Inspect DOM at each step

### VS Code Debugging

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## Common Issues

### 1. File mock not working
**Problem:** Mock in `setup.ts` not applying

**Solution:** Ensure mock is defined BEFORE the import:
```typescript
vi.mock('@/lib/supabase'); // Must be before imports
import { myFunction } from './myFile';
```

### 2. Async test timeout
**Problem:** Test hangs and times out

**Solution:**
- Ensure all promises are awaited
- Increase timeout: `{ timeout: 10000 }`
- Check for infinite loops

### 3. DOM not updating
**Problem:** State changes don't reflect in DOM

**Solution:** Use `waitFor()`:
```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 4. E2E test flakiness
**Problem:** E2E tests fail inconsistently

**Solution:**
- Use Playwright's auto-waiting
- Avoid `page.waitForTimeout()`, use `page.waitForSelector()` instead
- Increase retries in CI: `retries: 2`

## Next Steps

1. **Write more tests** for critical paths:
   - Expense management CRUD
   - Goal tracking
   - Payment plan calculations

2. **Add test data factories** for easier test setup:
   ```typescript
   // src/test/factories.ts
   export const createTestIncome = (overrides = {}) => ({
     id: nanoid(),
     date: '2025-12-01',
     platform: 'amazon_flex',
     amount: 100,
     ...overrides,
   });
   ```

3. **Set up CI/CD** to run tests automatically on every commit

4. **Add visual regression tests** with Playwright:
   ```typescript
   await expect(page).toHaveScreenshot('income-page.png');
   ```

5. **Monitor test coverage** and aim for >80% on critical modules

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
