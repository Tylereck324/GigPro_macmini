# API Routes Update Guide

This document outlines the changes needed to update all remaining API routes to include authentication.

## Pattern to Apply

For each API route file, add the following:

1. **Import the auth helper:**
```typescript
import { getAuthenticatedUser } from '@/lib/api/auth';
```

2. **Add authentication check at the start of the handler:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  // Rest of the handler code...
}
```

3. **Add user_id to all INSERT operations:**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert({
    user_id: user.id,  // Add this line
    // ... other fields
  })
  .select();
```

## Files to Update

### Completed
- ✅ src/pages/api/income.ts
- ✅ src/pages/api/income/[id].ts
- ✅ src/pages/api/dailyData.ts

### Remaining Files

1. **src/pages/api/goals.ts** - Add user_id to INSERT
2. **src/pages/api/goals/[id].ts** - Add auth check
3. **src/pages/api/expenses/fixed.ts** - Add auth check and user_id
4. **src/pages/api/expenses/fixed/[id].ts** - Add auth check
5. **src/pages/api/expenses/variable.ts** - Add auth check and user_id
6. **src/pages/api/expenses/variable/[id].ts** - Add auth check
7. **src/pages/api/expenses/paymentPlans.ts** - Add auth check and user_id
8. **src/pages/api/expenses/paymentPlans/[id].ts** - Add auth check
9. **src/pages/api/expenses/paymentPlanPayments.ts** - Add auth check and user_id
10. **src/pages/api/expenses/paymentPlanPayments/[id].ts** - Add auth check
11. **src/pages/api/settings.ts** - Add auth check and user_id

## Notes

- RLS policies will automatically filter queries by user_id
- For GET requests, no additional filtering is needed
- For UPDATE/DELETE requests, RLS ensures users can only modify their own data
- The auth helper returns null and sends a 401 response if authentication fails
