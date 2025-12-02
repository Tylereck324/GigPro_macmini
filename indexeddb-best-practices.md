# IndexedDB Best Practices and Advanced Patterns

## Introduction

IndexedDB is a powerful low-level API for client-side storage of significant amounts of structured data. For GigPro, a gig worker tracking application, IndexedDB provides the foundation for offline-first functionality, enabling users to track income, expenses, and work hours without requiring an internet connection. This document compiles current best practices, patterns, and advanced techniques for working with IndexedDB, particularly with Dexie.js in React applications.

## Core Concepts

### Asynchronous Operations

IndexedDB operations are asynchronous by default, ensuring resource-intensive tasks don't block the main thread. This is crucial for maintaining responsive UI in applications like GigPro where users may be adding multiple income entries or viewing large datasets.

**Key Pattern:**
```javascript
// Basic async pattern
const request = db.transaction(['income_entries'], 'readonly')
  .objectStore('income_entries')
  .getAll();

request.onsuccess = (event) => {
  const entries = event.target.result;
  // Process entries
};

request.onerror = (event) => {
  console.error('Error fetching entries:', event.target.error);
};
```

### Transactions

Transactions are atomic units that maintain data integrity by ensuring all operations succeed or fail together. Understanding transaction types and scope is critical for performance and data consistency.

**Transaction Types:**
- **readonly**: For read operations - multiple can run concurrently
- **readwrite**: For write operations - locks the store exclusively

**Best Practice:**
```javascript
// Use readonly when only reading
const readTx = db.transaction(['income_entries'], 'readonly');

// Use readwrite only when modifying
const writeTx = db.transaction(['income_entries', 'daily_data'], 'readwrite');
```

**Critical Rule:** IndexedDB will commit a transaction as soon as it isn't used within a tick. This means you MUST NOT call any other async API within a transaction scope. Breaking this rule will cause the transaction to auto-complete prematurely.

```javascript
// WRONG - async operation breaks transaction
const tx = db.transaction(['income_entries'], 'readwrite');
const store = tx.objectStore('income_entries');
const data = await fetch('/api/data'); // ❌ Transaction auto-commits here
store.add(data); // ❌ This will fail

// RIGHT - prepare data before transaction
const data = await fetch('/api/data'); // ✅ Async call before transaction
const tx = db.transaction(['income_entries'], 'readwrite');
const store = tx.objectStore('income_entries');
store.add(data); // ✅ Transaction remains active
```

## Data Type Best Practices

### Use Native Types

IndexedDB supports native JavaScript types. Using appropriate types ensures efficient storage, retrieval, and indexing.

**Recommended Type Usage:**
- **Dates**: Use `Date` objects, not strings or timestamps
- **Numbers**: Use actual numbers for calculations and comparisons
- **Structured Data**: Use objects and arrays for complex data
- **IDs**: Use strings or auto-incrementing numbers

**Example for GigPro:**
```javascript
// Good - uses proper types
const incomeEntry = {
  id: nanoid(),
  date: new Date('2024-11-30'), // Date object
  platform: 'AmazonFlex',
  startTime: new Date('2024-11-30T08:00:00'), // Date object
  endTime: new Date('2024-11-30T12:00:00'), // Date object
  amount: 88.50, // Number
  notes: 'Morning block downtown' // String
};

// Bad - uses strings for everything
const badEntry = {
  id: '123',
  date: '2024-11-30', // ❌ String instead of Date
  startTime: '08:00', // ❌ String instead of Date
  amount: '88.50', // ❌ String instead of Number
};
```

### Date Handling

For date-based queries (essential in GigPro's calendar functionality):

```javascript
// Efficient date range query
const startDate = new Date('2024-11-01');
const endDate = new Date('2024-11-30');

const entries = await db.income_entries
  .where('date')
  .between(startDate, endDate, true, true)
  .toArray();
```

## Index Optimization

### Creating Strategic Indexes

Indexes significantly enhance query performance. Analyze data access patterns and create indexes on frequently queried properties.

**For GigPro, Key Indexes:**
```javascript
// Database schema with strategic indexes
db.version(1).stores({
  income_entries: '++id, date, platform, [date+platform]', // Compound index
  daily_data: 'date', // Primary key is date
  fixed_expenses: '++id, category',
  variable_expenses: '++id, date, category',
  payment_plans: '++id, name',
  payment_plan_payments: '++id, planId, dueDate'
});
```

**Index Strategy:**
- Index on `date` for calendar queries
- Index on `platform` for filtering by gig service
- Compound index `[date+platform]` for combined queries
- Avoid over-indexing - each index adds storage overhead

### Using Indexes Effectively

```javascript
// Querying with indexes
// Fast - uses date index
const todayEntries = await db.income_entries
  .where('date').equals(new Date('2024-11-30'))
  .toArray();

// Fast - uses compound index
const amazonToday = await db.income_entries
  .where('[date+platform]')
  .equals([new Date('2024-11-30'), 'AmazonFlex'])
  .toArray();

// Slower - no index on notes
const withNotes = await db.income_entries
  .filter(entry => entry.notes.includes('downtown'))
  .toArray();
```

## Schema Versioning and Migration

### Version Management Pattern

IndexedDB uses version numbers to manage schema changes. When you increment the version, the `onupgradeneeded` event fires, allowing you to modify the schema.

**Common Migration Pattern:**
```javascript
const db = new Dexie('GigProDB');

// Version 1 - Initial schema
db.version(1).stores({
  income_entries: '++id, date, platform',
  daily_data: 'date'
});

// Version 2 - Add new fields
db.version(2).stores({
  income_entries: '++id, date, platform, [date+platform]', // Add compound index
  daily_data: 'date',
  fixed_expenses: '++id, category' // New table
});

// Version 3 - Migration with data transformation
db.version(3).stores({
  income_entries: '++id, date, platform, [date+platform]',
  daily_data: 'date',
  fixed_expenses: '++id, category',
  payment_plans: '++id, name'
}).upgrade(async tx => {
  // Transform existing data
  const entries = await tx.income_entries.toArray();
  const updates = entries.map(entry => ({
    ...entry,
    // Add new calculated field
    duration: entry.endTime - entry.startTime
  }));
  await tx.income_entries.bulkPut(updates);
});
```

### Migration Best Practices

**Incremental Upgrades:**
```javascript
db.version(3).stores({...}).upgrade(tx => {
  if (e.oldVersion < 1) {
    // Create v1 schema
  }
  if (e.oldVersion < 2) {
    // Upgrade v1 to v2
  }
  if (e.oldVersion < 3) {
    // Upgrade v2 to v3
  }
});
```

Since the if statements don't have elses, multiple blocks run if necessary. Upgrading from v1 to v3 is handled by running v1→v2, then v2→v3.

**Critical Rules:**
- All migration must be done in a single transaction
- Browser shutdown between upgrade events could result in data loss
- When changing keyPath, you must delete and recreate the object store
- Read and save data before restructuring stores

### Handling Multi-Tab Conflicts

When users have multiple tabs open, version conflicts can occur:

```javascript
db.on('versionchange', event => {
  // Database needs to be closed for upgrade in another tab
  db.close();
  alert('A new version is available. Please refresh the page.');
});

db.on('blocked', () => {
  // Other tabs are blocking the upgrade
  console.warn('Please close other tabs to enable database upgrade');
});
```

## Performance Optimization

### Connection Management

**Open and Close Strategically:**
```javascript
// Good - Dexie handles this automatically
const entries = await db.income_entries.toArray();
// Connection managed by Dexie

// Manual management (if needed)
const connection = await indexedDB.open('GigProDB');
// Use connection
connection.close(); // Close when done
```

### Batch Operations

For better performance when adding multiple records:

```javascript
// Bad - multiple transactions
for (const entry of entries) {
  await db.income_entries.add(entry); // Creates new transaction each time
}

// Good - single transaction with bulkAdd
await db.income_entries.bulkAdd(entries);

// Good - single transaction with bulkPut (upsert)
await db.income_entries.bulkPut(entries);
```

### Query Optimization

```javascript
// Inefficient - loads all data into memory
const allEntries = await db.income_entries.toArray();
const filtered = allEntries.filter(e => e.amount > 100);

// Efficient - filters in database
const highEarnings = await db.income_entries
  .where('amount').above(100)
  .toArray();

// Most efficient - use indexes
const novemberHighEarnings = await db.income_entries
  .where('date').between(startDate, endDate)
  .filter(e => e.amount > 100)
  .toArray();
```

### Pagination and Limiting

For large datasets (important for GigPro's calendar view):

```javascript
// Limit results
const recent = await db.income_entries
  .orderBy('date')
  .reverse()
  .limit(20)
  .toArray();

// Offset and limit (pagination)
const page = 2;
const pageSize = 10;
const entries = await db.income_entries
  .orderBy('date')
  .reverse()
  .offset((page - 1) * pageSize)
  .limit(pageSize)
  .toArray();
```

## Dexie.js with React Best Practices

### useLiveQuery Hook

The `useLiveQuery()` hook enables reactive database queries and automatically updates components when data changes.

**Basic Pattern:**
```javascript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

function IncomeList({ date }) {
  const entries = useLiveQuery(
    () => db.income_entries
      .where('date').equals(date)
      .toArray(),
    [date] // Dependency array
  );

  if (!entries) return <Loading />; // Handle loading state

  return (
    <div>
      {entries.map(entry => (
        <IncomeCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
```

### Best Practices for useLiveQuery

**1. Handle Loading States:**
```javascript
const data = useLiveQuery(() => db.table.toArray());

if (!data) {
  return <Skeleton />; // or null, or loading indicator
}
```

**2. Use Dependency Arrays:**
```javascript
// Dependencies ensure query re-runs when filters change
const entries = useLiveQuery(
  () => db.income_entries
    .where('platform').equals(selectedPlatform)
    .and(e => e.amount > minAmount)
    .toArray(),
  [selectedPlatform, minAmount] // Re-query when these change
);
```

**3. Avoid Heavy Computations in Query:**
```javascript
// Bad - computation in query function
const summary = useLiveQuery(() => {
  const entries = await db.income_entries.toArray();
  return entries.reduce((sum, e) => sum + e.amount, 0);
});

// Good - query data, compute in component
const entries = useLiveQuery(() => db.income_entries.toArray());
const summary = entries?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
```

**4. Cross-Tab Reactivity:**
The hook observes changes made using Dexie.js and reacts instantly to changes from service workers, web workers, or other tabs (Dexie 3.1+).

```javascript
// Changes in any tab automatically update all tabs
// Tab 1
await db.income_entries.add(newEntry);

// Tab 2 - component automatically re-renders with new data
const entries = useLiveQuery(() => db.income_entries.toArray());
```

### State Management Integration

**Using Dexie as Persistent State:**
```javascript
// Dexie can replace some Zustand state
// Before (RAM-based state)
const useStore = create((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries })
}));

// After (Persistent, RAM-sparse)
function Component() {
  // Data stays in IndexedDB, only query results in RAM
  const entries = useLiveQuery(() => db.income_entries.toArray());
}
```

**Hybrid Approach for GigPro:**
```javascript
// UI state in Zustand
const useUIStore = create((set) => ({
  selectedDate: new Date(),
  theme: 'dark',
  setDate: (date) => set({ selectedDate: date })
}));

// Persistent data in Dexie
function DayView() {
  const selectedDate = useUIStore(state => state.selectedDate);
  const entries = useLiveQuery(
    () => db.income_entries.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  );
}
```

## Storage Limitations and Quota Management

### Understanding Limits

IndexedDB storage limits vary by browser and available disk space:

- **Chrome/Edge**: ~60% of available disk space
- **Firefox**: ~10% of available disk space, max 2GB per origin
- **Safari**: ~1GB, prompts user for more

### Checking Available Storage

```javascript
async function checkStorageQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    console.log(`Using ${estimate.usage} bytes of ${estimate.quota} bytes (${percentUsed.toFixed(2)}%)`);

    if (percentUsed > 80) {
      console.warn('Storage is running low. Consider cleanup.');
    }
  }
}
```

### Requesting Persistent Storage

```javascript
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${isPersisted}`);
  }
}
```

### Cleanup Strategies

For GigPro, implement periodic cleanup:

```javascript
async function cleanupOldData() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Archive or delete old entries
  const oldEntries = await db.income_entries
    .where('date')
    .below(oneYearAgo)
    .toArray();

  // Export before deleting
  exportToJSON(oldEntries);

  // Delete old data
  await db.income_entries
    .where('date')
    .below(oneYearAgo)
    .delete();
}
```

## Error Handling and Recovery

### Comprehensive Error Handling

```javascript
async function safeAddEntry(entry) {
  try {
    const id = await db.income_entries.add(entry);
    return { success: true, id };
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      // Trigger cleanup or notify user
      return { success: false, error: 'QUOTA_EXCEEDED' };
    } else if (error.name === 'ConstraintError') {
      console.error('Constraint violation');
      return { success: false, error: 'CONSTRAINT_ERROR' };
    } else {
      console.error('Unknown error:', error);
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  }
}
```

### Transaction Error Recovery

```javascript
async function robustTransaction() {
  try {
    await db.transaction('rw', db.income_entries, db.daily_data, async () => {
      await db.income_entries.add(incomeEntry);
      await db.daily_data.put(dailyData);
      // Both succeed or both fail
    });
  } catch (error) {
    console.error('Transaction failed, rolling back:', error);
    // All changes are automatically rolled back
  }
}
```

## Advanced Patterns for GigPro

### Calculating Amazon Flex Hours

Efficiently calculate rolling 7-day hours:

```javascript
async function calculateAmazonFlexHours(targetDate) {
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const entries = await db.income_entries
    .where('date').between(sevenDaysAgo, targetDate, false, true)
    .and(entry => entry.platform === 'AmazonFlex')
    .toArray();

  const weeklyHours = entries.reduce((total, entry) => {
    const hours = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  const dailyHours = entries
    .filter(e => e.date.toDateString() === targetDate.toDateString())
    .reduce((total, entry) => {
      const hours = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

  return {
    daily: dailyHours,
    dailyRemaining: Math.max(0, 8 - dailyHours),
    weekly: weeklyHours,
    weeklyRemaining: Math.max(0, 40 - weeklyHours)
  };
}
```

### Monthly Calendar Profit Calculation

```javascript
async function getMonthProfits(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Get all income for the month
  const income = await db.income_entries
    .where('date').between(startDate, endDate, true, true)
    .toArray();

  // Get all expenses for the month
  const expenses = await db.daily_data
    .where('date').between(startDate, endDate, true, true)
    .toArray();

  // Build profit map
  const profitByDay = {};

  // Sum income by day
  income.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0];
    profitByDay[dateKey] = (profitByDay[dateKey] || 0) + entry.amount;
  });

  // Subtract expenses
  expenses.forEach(expense => {
    const dateKey = expense.date.toISOString().split('T')[0];
    profitByDay[dateKey] = (profitByDay[dateKey] || 0) - (expense.gasExpense || 0);
  });

  return profitByDay;
}
```

### Data Export/Import

```javascript
// Export entire database
async function exportDatabase() {
  const data = {
    version: db.verno,
    timestamp: new Date().toISOString(),
    income_entries: await db.income_entries.toArray(),
    daily_data: await db.daily_data.toArray(),
    fixed_expenses: await db.fixed_expenses.toArray(),
    variable_expenses: await db.variable_expenses.toArray(),
    payment_plans: await db.payment_plans.toArray(),
    payment_plan_payments: await db.payment_plan_payments.toArray(),
    settings: await db.settings.toArray()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  const fileName = `gigpro-backup-${new Date().toISOString()}.json`;
  saveAs(blob, fileName);
}

// Import database
async function importDatabase(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate data structure
  if (!data.version || !data.timestamp) {
    throw new Error('Invalid backup file');
  }

  // Clear existing data (optional)
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()));
  });

  // Import data
  await db.transaction('rw', db.tables, async () => {
    if (data.income_entries) {
      await db.income_entries.bulkAdd(data.income_entries);
    }
    if (data.daily_data) {
      await db.daily_data.bulkAdd(data.daily_data);
    }
    // ... import other tables
  });
}
```

## Testing IndexedDB

### Unit Testing with Fake IndexedDB

```javascript
import 'fake-indexeddb/auto';
import { db } from '@/lib/db';

describe('Income Entry Repository', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.income_entries.clear();
  });

  it('should add income entry', async () => {
    const entry = {
      date: new Date('2024-11-30'),
      platform: 'AmazonFlex',
      amount: 88.50
    };

    const id = await db.income_entries.add(entry);
    expect(id).toBeDefined();

    const retrieved = await db.income_entries.get(id);
    expect(retrieved.amount).toBe(88.50);
  });
});
```

## Key Takeaways

1. **Use Proper Types**: Dates as Date objects, numbers as numbers, structured data as objects/arrays
2. **Transaction Scope**: Never call async APIs within transaction scope; prepare data first
3. **Index Strategically**: Create indexes on frequently queried fields, avoid over-indexing
4. **Version Incrementally**: Use incremental version upgrades with conditional blocks
5. **Batch Operations**: Use bulkAdd/bulkPut for multiple records instead of loops
6. **Handle Loading**: Always handle loading states in useLiveQuery hooks
7. **Manage Quota**: Monitor storage usage and implement cleanup strategies
8. **Cross-Tab Sync**: Leverage Dexie's automatic cross-tab reactivity
9. **Error Recovery**: Implement comprehensive error handling with graceful degradation
10. **Export/Import**: Provide data portability for user peace of mind

## References

- [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Using the IndexedDB API with JS In 2025 - Potent Pages](https://potentpages.com/web-design/javascript/indexeddb-api-with-javascript)
- [IndexedDB Guide - Meticulous](https://www.meticulous.ai/blog/getting-started-with-indexeddb)
- [IndexedDB Tutorial - JavaScript.info](https://javascript.info/indexeddb)
- [Dexie.js Best Practices](https://dexie.org/docs/Tutorial/Best-Practices)
- [dexie-react-hooks Documentation](https://dexie.org/docs/libs/dexie-react-hooks)
- [Get started with Dexie in React](https://dexie.org/docs/Tutorial/React)
- [useLiveQuery() Documentation](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())
- [IndexedDB Data Migration - Stack Overflow](https://stackoverflow.com/questions/16563562/indexeddb-handle-data-migration-onupgradeneeded)
- [Handling IndexedDB Version Conflicts - DEV Community](https://dev.to/ivandotv/handling-indexeddb-upgrade-version-conflict-368a)
- [IndexedDB Max Storage Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
