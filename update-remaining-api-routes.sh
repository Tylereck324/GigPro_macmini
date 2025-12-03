#!/bin/bash

# Script to add authentication to remaining API routes

echo "Updating remaining API route files with authentication..."

# List of files to update (excluding already updated ones)
files=(
  "src/pages/api/expenses/fixed/[id].ts"
  "src/pages/api/expenses/variable.ts"
  "src/pages/api/expenses/variable/[id].ts"
  "src/pages/api/expenses/paymentPlans.ts"
  "src/pages/api/expenses/paymentPlans/[id].ts"
  "src/pages/api/expenses/paymentPlanPayments.ts"
  "src/pages/api/expenses/paymentPlanPayments/[id].ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if already has the import
    if ! grep -q "import { getAuthenticatedUser }" "$file"; then
      # Add import after the last existing import
      sed -i '' "/^import.*from.*;$/a\\
import { getAuthenticatedUser } from '@/lib/api/auth';
" "$file"
      echo "  - Added import"
    fi

    # Add authentication check (this is a simplified example)
    echo "  - Manual review needed for auth check placement"
    echo "  - Manual review needed for user_id insertion"
  else
    echo "File not found: $file"
  fi
done

echo "Script complete. Please manually review and add:"
echo "1. Auth check: const user = await getAuthenticatedUser(req, res); if (!user) return;"
echo "2. user_id in INSERT operations: user_id: user.id,"
