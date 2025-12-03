# Authentication Setup Guide

## What's Been Implemented ✅

### 1. Authentication System
- **AuthContext** (`src/contexts/AuthContext.tsx`) - Manages authentication state
- **Login Page** (`src/app/login/page.tsx`) - Simple password-only login
- **Protected Routes** (`src/components/ProtectedRoute.tsx`) - Wraps pages requiring auth
- **Auth Helper** (`src/lib/api/auth.ts`) - Server-side authentication for API routes

### 2. Updated Files
- ✅ `src/app/layout.tsx` - Added AuthProvider wrapper
- ✅ `src/lib/api/income.ts` - Updated to include Authorization headers
- ✅ API Routes - 7 routes updated with authentication checks

## Setup Steps

### Step 1: Create Your User in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **"Add User"** or **"Invite User"**
5. Create a user with:
   - **Email**: Choose an email (e.g., `me@gigpro.app` or your real email)
   - **Password**: Choose a secure password
   - **Email Confirm**: Set to confirmed
6. **Save the user ID** - you'll need it for data migration

### Step 2: Update the Login Page Email

Edit `src/app/login/page.tsx` and replace the email on line 20:

```typescript
// Change this line:
await signIn('your-email@example.com', password);

// To your actual email:
await signIn('me@gigpro.app', password);
```

### Step 3: Migrate Existing Data

If you have existing data in your database, assign it to your user:

```sql
-- In Supabase SQL Editor, run this (replace YOUR_USER_ID with the ID from Step 1):

UPDATE income_entries SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE daily_data SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE fixed_expenses SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE variable_expenses SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE payment_plans SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE payment_plan_payments SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE goals SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE app_settings SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
```

### Step 4: Update Remaining API Routes

Apply the authentication pattern to these 7 remaining API route files:

**Files to Update:**
1. `src/pages/api/expenses/fixed/[id].ts`
2. `src/pages/api/expenses/variable.ts`
3. `src/pages/api/expenses/variable/[id].ts`
4. `src/pages/api/expenses/paymentPlans.ts`
5. `src/pages/api/expenses/paymentPlans/[id].ts`
6. `src/pages/api/expenses/paymentPlanPayments.ts`
7. `src/pages/api/expenses/paymentPlanPayments/[id].ts`

**Pattern to Apply** (same as income.ts):

```typescript
// 1. Add import at top
import { getAuthenticatedUser } from '@/lib/api/auth';

// 2. Add at start of handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  // ... rest of handler
}

// 3. Add user_id to INSERT operations
const { data, error } = await supabase
  .from('table_name')
  .insert({
    user_id: user.id,  // Add this line
    // ... other fields
  })
  .select();
```

### Step 5: Update Remaining API Client Files

Apply the same pattern from `src/lib/api/income.ts` to:
- `src/lib/api/dailyData.ts` (if exists)
- `src/lib/api/goals.ts` (if exists)
- `src/lib/api/expenses.ts` (if exists)
- Any other API client files

**Pattern:**
```typescript
import { supabase } from '@/lib/supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// Then use in fetch calls:
const headers = await getAuthHeaders();
const res = await fetch(url, { headers, ...otherOptions });

// Handle 401 responses:
if (res.status === 401) {
  window.location.href = '/login';
  throw new Error('Unauthorized');
}
```

### Step 6: Protect Your Pages (Optional)

Wrap any page that needs authentication:

```typescript
// src/app/page.tsx (or any other page)
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function HomePage() {
  return (
    <ProtectedRoute>
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

### Step 7: Test the Authentication

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit your app** - you should be redirected to `/login`

3. **Enter your password** (the one you set in Step 1)

4. **You should be logged in** and see your app

5. **Test logout** by adding a logout button to your header:
   ```typescript
   import { useAuth } from '@/contexts/AuthContext';

   function Header() {
     const { signOut } = useAuth();

     return (
       <button onClick={signOut}>Logout</button>
     );
   }
   ```

## How It Works

### Authentication Flow

1. **User visits app** → AuthContext checks for session
2. **No session?** → Redirected to `/login`
3. **User enters password** → AuthContext calls Supabase auth
4. **Success** → Session stored, user redirected to `/`
5. **API calls** → Include Bearer token in Authorization header
6. **API validates token** → getAuthenticatedUser() checks token
7. **RLS enforces** → Database ensures user only sees their data

### Security Layers

1. **Frontend**: AuthContext + ProtectedRoute prevent unauthorized access
2. **API Layer**: getAuthenticatedUser() validates JWT tokens
3. **Database**: RLS policies enforce data isolation

## Common Issues & Solutions

### Issue: "Unauthorized" error when making API calls
**Solution**: Make sure you're logged in and the session hasn't expired. Check browser console for errors.

### Issue: Can't see my existing data after login
**Solution**: Run the data migration SQL from Step 3 to assign existing data to your user.

### Issue: Login page shows but app doesn't redirect
**Solution**: Check that AuthProvider is wrapping your app in `layout.tsx`

### Issue: RLS policy errors in console
**Solution**: Make sure all migrations have been applied to your Supabase database

## Adding More Users (Future)

If you want to add more users later:

1. Create users in Supabase Dashboard
2. Share the login URL and their password
3. Each user will only see their own data automatically (thanks to RLS!)

## Environment Variables

Make sure these are in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. Complete Step 4 (update remaining API routes)
2. Complete Step 5 (update remaining API clients)
3. Test authentication flow
4. Optionally protect specific pages with ProtectedRoute
5. Enjoy your secure, single-user app!

---

**Security Note**: This setup provides production-grade security with RLS policies and JWT authentication. Even though you're the only user, your data is protected from unauthorized access.
