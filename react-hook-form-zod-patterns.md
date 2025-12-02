# React Hook Form with Zod Validation Patterns

## Introduction

React Hook Form combined with Zod provides a powerful, type-safe solution for form validation in React applications. For GigPro, this combination enables robust form handling for income entries, expense tracking, and payment plans with minimal boilerplate, excellent performance, and comprehensive TypeScript support. This document compiles best practices, patterns, and advanced techniques for building forms with React Hook Form and Zod.

## Why React Hook Form + Zod?

### React Hook Form Benefits

- **Minimal Re-renders**: Subscription-based updates only re-render changed fields
- **Excellent Performance**: Uncontrolled components with minimal state management
- **Small Bundle Size**: ~9kB gzipped
- **Built-in Validation**: Supports multiple validation strategies
- **DevTools Integration**: React DevTools for debugging forms

### Zod Benefits

- **TypeScript-First**: Generate TypeScript types directly from schemas
- **Runtime Validation**: Ensure data integrity at runtime
- **Composable Schemas**: Build complex validations from simple pieces
- **Declarative Validation**: Clear, readable validation rules
- **Built-in Validators**: Common types (email, URL, UUID) included
- **Custom Error Messages**: Fully customizable validation feedback

### Combined Power

- **Single Source of Truth**: Schema defines both validation and types
- **Reusable Validation**: Share schemas between client and server
- **Type Safety**: End-to-end type safety from form to database
- **Better DX**: Autocomplete, type checking, refactoring support

## Basic Setup

### Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

### Basic Form Pattern

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Define schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
})

// Infer TypeScript type from schema
type FormData = z.infer<typeof formSchema>

export function BasicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
    },
  })

  const onSubmit = async (data: FormData) => {
    console.log(data) // Type-safe data
    // Process form
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('name')} placeholder="Name" />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input
          {...register('age', { valueAsNumber: true })}
          type="number"
          placeholder="Age"
        />
        {errors.age && <span>{errors.age.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

## Zod Schema Patterns

### Built-in Validations

Zod simplifies validating common string types with built-in validators:

```typescript
const schema = z.object({
  // String validations
  email: z.string().email('Invalid email'),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid UUID'),

  // Number validations
  age: z.number().int().positive().min(18).max(120),
  amount: z.number().positive().multipleOf(0.01), // Currency precision

  // Date validations
  birthDate: z.date().max(new Date(), 'Birth date cannot be in the future'),

  // Enum validations
  platform: z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark']),

  // Boolean validations
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept terms and conditions',
  }),

  // Optional and nullable
  notes: z.string().optional(),
  middleName: z.string().nullable(),

  // Default values
  status: z.enum(['active', 'inactive']).default('active'),
})
```

### Custom Error Messages

```typescript
const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})
```

### String Transformations

```typescript
const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().trim().min(1, 'Name is required'),
  phoneNumber: z.string().transform(val => val.replace(/\D/g, '')), // Remove non-digits
})
```

### Number Coercion

```typescript
const schema = z.object({
  // Coerce string input to number
  age: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
})

// Alternative: Handle in register
<input {...register('age', { valueAsNumber: true })} type="number" />
```

### Date Handling

```typescript
const schema = z.object({
  // Accept Date object
  date: z.date(),

  // Accept string, transform to Date
  dateString: z.string().pipe(z.coerce.date()),

  // Date range validation
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})
```

## Advanced Validation Patterns

### Cross-Field Validation with `.refine()`

The `.refine()` method enables validation across multiple fields:

```typescript
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Error appears on confirmPassword field
  })
```

**GigPro Example: Time Validation**
```typescript
const incomeSchema = z
  .object({
    startTime: z.date(),
    endTime: z.date(),
    blockLength: z.number().optional(),
  })
  .refine(
    data => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
```

### Multiple Refinements

```typescript
const schema = z
  .object({
    platform: z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark']),
    startTime: z.date(),
    endTime: z.date(),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    data => {
      // Amazon Flex: Max 8 hours per block
      if (data.platform === 'AmazonFlex') {
        const hours = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60)
        return hours <= 8
      }
      return true
    },
    {
      message: 'Amazon Flex blocks cannot exceed 8 hours',
      path: ['endTime'],
    }
  )
```

### Async Validation with `.refine()`

Refine supports asynchronous functions for server-side validation:

```typescript
const schema = z.object({
  username: z.string().min(3),
}).refine(
  async (data) => {
    const response = await fetch(`/api/check-username?username=${data.username}`)
    const { available } = await response.json()
    return available
  },
  {
    message: 'Username is already taken',
    path: ['username'],
  }
)
```

### SuperRefine for Complex Validation

SuperRefine provides greater flexibility, allowing multiple validation issues:

```typescript
const schema = z
  .object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    blockLength: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    const fieldsProvided = [
      data.startTime,
      data.endTime,
      data.blockLength,
    ].filter(Boolean).length

    if (fieldsProvided < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least 2 of 3 fields must be provided',
        path: ['startTime'],
      })
    }

    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)

      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['endTime'],
        })
      }
    }
  })
```

### Conditional Validation

```typescript
const schema = z
  .object({
    platform: z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark']),
    notes: z.string().optional(),
    tipAmount: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    // DoorDash requires tip amount
    if (data.platform === 'DoorDash' && data.tipAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tip amount is required for DoorDash',
        path: ['tipAmount'],
      })
    }
  })
```

## Schema Composition and Reusability

### Extending Schemas

```typescript
// Base schema
const baseIncomeSchema = z.object({
  date: z.date(),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

// Extended schema
const amazonFlexSchema = baseIncomeSchema.extend({
  platform: z.literal('AmazonFlex'),
  startTime: z.date(),
  endTime: z.date(),
  blockLength: z.number(),
})

// Omit fields
const publicSchema = baseIncomeSchema.omit({ notes: true })

// Pick specific fields
const summarySchema = baseIncomeSchema.pick({ date: true, amount: true })

// Partial (all fields optional)
const updateSchema = baseIncomeSchema.partial()

// Deep partial (nested objects optional)
const deepPartialSchema = baseIncomeSchema.deepPartial()
```

### Merging Schemas

```typescript
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
})

// Merge using .merge()
const userWithAddressSchema = userSchema.merge(addressSchema)

// Merge using .and()
const combinedSchema = userSchema.and(addressSchema)
```

### Union Types

```typescript
// Simple union
const platformSchema = z.union([
  z.literal('AmazonFlex'),
  z.literal('DoorDash'),
  z.literal('WalmartSpark'),
])

// Discriminated union (more efficient)
const incomeEntrySchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('AmazonFlex'),
    startTime: z.date(),
    endTime: z.date(),
    blockLength: z.number(),
    amount: z.number(),
  }),
  z.object({
    platform: z.literal('DoorDash'),
    startTime: z.date(),
    endTime: z.date(),
    tipAmount: z.number(),
    amount: z.number(),
  }),
  z.object({
    platform: z.literal('WalmartSpark'),
    tripCount: z.number(),
    amount: z.number(),
  }),
])
```

**Note**: There are discussions about deprecating `z.discriminatedUnion` in favor of a cleaner "switch" API in future versions.

### Transformations

```typescript
const schema = z.object({
  // Transform string to Date
  dateString: z.string().transform(str => new Date(str)),

  // Transform and validate
  email: z.string().email().transform(email => email.toLowerCase()),

  // Complex transformation
  timeRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .transform(({ start, end }) => ({
      startTime: new Date(start),
      endTime: new Date(end),
      duration: new Date(end).getTime() - new Date(start).getTime(),
    })),
})
```

## GigPro-Specific Schemas

### Income Entry Schema

```typescript
import { z } from 'zod'

export const incomeEntrySchema = z
  .object({
    id: z.string().optional(),
    date: z.date(),
    platform: z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    blockLength: z.number().optional(),
    amount: z.number().positive('Amount must be positive'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Require at least 2 of 3 time fields
    const timeFields = [data.startTime, data.endTime, data.blockLength].filter(Boolean)

    if (timeFields.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least 2 of: start time, end time, or block length',
        path: ['startTime'],
      })
    }

    // Validate time relationship
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)

      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['endTime'],
        })
      }

      // Amazon Flex: Max 8 hours
      if (data.platform === 'AmazonFlex') {
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        if (hours > 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Amazon Flex blocks cannot exceed 8 hours',
            path: ['endTime'],
          })
        }
      }
    }
  })

export type IncomeEntry = z.infer<typeof incomeEntrySchema>
```

### Daily Expenses Schema

```typescript
export const dailyExpensesSchema = z.object({
  date: z.date(),
  mileage: z.number().nonnegative('Mileage cannot be negative').optional(),
  gasExpense: z.number().nonnegative('Gas expense cannot be negative').optional(),
})

export type DailyExpenses = z.infer<typeof dailyExpensesSchema>
```

### Payment Plan Schema

```typescript
export const paymentPlanSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    totalAmount: z.number().positive('Total amount must be positive'),
    numberOfPayments: z.number().int().positive('Must have at least 1 payment'),
    paymentAmount: z.number().positive('Payment amount must be positive'),
    currentPayment: z.number().int().min(0).default(0),
    startDate: z.date(),
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  })
  .refine(
    data => {
      const expectedTotal = data.paymentAmount * data.numberOfPayments
      const tolerance = 0.01 // Allow 1 cent tolerance for rounding
      return Math.abs(expectedTotal - data.totalAmount) < tolerance
    },
    {
      message: 'Payment amount × number of payments must equal total amount',
      path: ['paymentAmount'],
    }
  )

export type PaymentPlan = z.infer<typeof paymentPlanSchema>
```

## React Hook Form Patterns

### Default Values Best Practice

Always provide defaultValues at the form level, not individual fields:

```typescript
// Good - form-level defaults
const form = useForm<IncomeEntry>({
  resolver: zodResolver(incomeEntrySchema),
  defaultValues: {
    date: new Date(),
    platform: 'AmazonFlex',
    amount: 0,
    notes: '',
  },
})

// Bad - field-level defaults
<input {...register('notes', { value: '' })} />
```

### Reset Form

```typescript
const form = useForm<IncomeEntry>({
  resolver: zodResolver(incomeEntrySchema),
  defaultValues: {
    date: new Date(),
    platform: 'AmazonFlex',
    amount: 0,
  },
})

// Reset to default values
form.reset()

// Reset to new values
form.reset({
  date: new Date('2024-12-01'),
  platform: 'DoorDash',
  amount: 50,
})
```

### Watch Field Values

```typescript
const { watch, register } = useForm<IncomeEntry>({
  resolver: zodResolver(incomeEntrySchema),
})

// Watch single field
const platform = watch('platform')

// Watch multiple fields
const [startTime, endTime] = watch(['startTime', 'endTime'])

// Watch all fields
const values = watch()

// Watch with callback
useEffect(() => {
  const subscription = watch((value, { name, type }) => {
    console.log(`Field ${name} changed:`, value)
  })
  return () => subscription.unsubscribe()
}, [watch])
```

### Conditional Fields

```typescript
export function IncomeForm() {
  const form = useForm<IncomeEntry>({
    resolver: zodResolver(incomeEntrySchema),
  })

  const platform = form.watch('platform')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <select {...form.register('platform')}>
        <option value="AmazonFlex">Amazon Flex</option>
        <option value="DoorDash">DoorDash</option>
        <option value="WalmartSpark">Walmart Spark</option>
      </select>

      {platform === 'AmazonFlex' && (
        <>
          <input {...form.register('startTime')} type="time" />
          <input {...form.register('endTime')} type="time" />
          <input
            {...form.register('blockLength', { valueAsNumber: true })}
            type="number"
          />
        </>
      )}

      {platform === 'DoorDash' && (
        <input
          {...form.register('tipAmount', { valueAsNumber: true })}
          type="number"
          placeholder="Tip Amount"
        />
      )}
    </form>
  )
}
```

### Controlled Components

For complex UI libraries (like date pickers):

```typescript
import { Controller } from 'react-hook-form'
import DatePicker from 'react-datepicker'

export function IncomeForm() {
  const { control, handleSubmit } = useForm<IncomeEntry>({
    resolver: zodResolver(incomeEntrySchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <DatePicker
            selected={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
    </form>
  )
}
```

### Field Arrays (Dynamic Forms)

useFieldArray is a custom hook for working with dynamic field arrays:

```typescript
import { useFieldArray } from 'react-hook-form'

const paymentSchema = z.object({
  payments: z.array(
    z.object({
      amount: z.number().positive(),
      dueDate: z.date(),
      paid: z.boolean().default(false),
    })
  ),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export function PaymentPlanForm() {
  const { control, register, handleSubmit } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payments: [{ amount: 0, dueDate: new Date(), paid: false }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}> {/* Use field.id, not index */}
          <input
            {...register(`payments.${index}.amount`, { valueAsNumber: true })}
            type="number"
          />
          <input
            {...register(`payments.${index}.dueDate`, { valueAsDate: true })}
            type="date"
          />
          <input {...register(`payments.${index}.paid`)} type="checkbox" />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ amount: 0, dueDate: new Date(), paid: false })}
      >
        Add Payment
      </button>
    </form>
  )
}
```

**Key Points for Field Arrays:**
- Use `field.id` for React key prop, not index
- All operations are memoized with `useCallback`
- Only relevant fields re-render on change

## Performance Optimization

### Subscription-Based Updates

React Hook Form uses subscription-based updates—only fields that change get re-rendered:

```typescript
// Only the email field re-renders when it changes
<input {...register('email')} />

// Only the password field re-renders when it changes
<input {...register('password')} type="password" />
```

### Selective Form State Subscription

Subscribe to form state only where needed:

```typescript
// Bad - subscribes to all form state in parent
const { errors, isSubmitting, isDirty } = useFormState()

// Good - subscribe in specific components
function ErrorMessage({ name }) {
  const { errors } = useFormState({ name }) // Only subscribes to this field
  return errors[name] && <span>{errors[name].message}</span>
}
```

### Avoid Triggering Validation on Arrays

```typescript
// Bad - triggers validation on entire array
const { trigger } = useForm()
trigger(['field1', 'field2', 'field3'])

// Good - let React Hook Form handle it
// Or trigger single field or entire form
trigger() // Entire form
trigger('field1') // Single field
```

### Virtualization for Large Forms

For 1000+ fields, consider virtualization:

```typescript
import { useVirtual } from 'react-virtual'

function LargeForm() {
  const { register } = useForm()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtual({
    size: 10000,
    parentRef,
    estimateSize: useCallback(() => 50, []),
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.totalSize}px` }}>
        {rowVirtualizer.virtualItems.map(virtualRow => (
          <div key={virtualRow.index}>
            <input {...register(`field${virtualRow.index}`)} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Debouncing Validation

For expensive validation (like async checks):

```typescript
import { useDebouncedCallback } from 'use-debounce'

const schema = z.object({
  username: z.string().min(3),
}).refine(
  async (data) => {
    // Debounced in the component, not here
    const response = await fetch(`/api/check-username?username=${data.username}`)
    const { available } = await response.json()
    return available
  },
  { message: 'Username taken' }
)

// In component
const { trigger } = useForm({ resolver: zodResolver(schema) })
const debouncedTrigger = useDebouncedCallback(() => trigger('username'), 500)

<input
  {...register('username')}
  onChange={(e) => {
    register('username').onChange(e)
    debouncedTrigger()
  }}
/>
```

## Error Handling Patterns

### Displaying Errors

```typescript
export function ErrorMessage({ name }: { name: string }) {
  const {
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  if (!error) return null

  return (
    <span className="text-red-500 text-sm mt-1">
      {error.message as string}
    </span>
  )
}

// Usage
<div>
  <input {...register('email')} />
  <ErrorMessage name="email" />
</div>
```

### Custom Error Component

```typescript
interface FieldProps {
  name: string
  label: string
  type?: string
  placeholder?: string
}

export function FormField({ name, label, type = 'text', placeholder }: FieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-3 py-2 border rounded-lg ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && (
        <span className="text-red-500 text-sm mt-1">
          {error.message as string}
        </span>
      )}
    </div>
  )
}

// Usage with FormProvider
<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="email" label="Email" type="email" />
    <FormField name="password" label="Password" type="password" />
  </form>
</FormProvider>
```

### Global Error Handling

```typescript
const onSubmit = async (data: FormData) => {
  try {
    await saveData(data)
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      error.errors.forEach(err => {
        form.setError(err.path[0] as any, {
          message: err.message,
        })
      })
    } else if (error instanceof Error) {
      // Handle other errors
      form.setError('root', {
        message: error.message,
      })
    }
  }
}

// Display root errors
{form.formState.errors.root && (
  <div className="bg-red-50 text-red-600 p-3 rounded">
    {form.formState.errors.root.message}
  </div>
)}
```

## Reusable Validation Between Client and Server

### Shared Schema

```typescript
// schemas/income-entry.ts (shared)
import { z } from 'zod'

export const incomeEntrySchema = z.object({
  date: z.date(),
  platform: z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark']),
  amount: z.number().positive(),
})

export type IncomeEntry = z.infer<typeof incomeEntrySchema>
```

### Client-Side Form

```typescript
// components/IncomeForm.tsx
import { incomeEntrySchema } from '@/schemas/income-entry'

export function IncomeForm() {
  const form = useForm({
    resolver: zodResolver(incomeEntrySchema),
  })

  // Use schema for validation
}
```

### Server-Side API Route (Next.js)

```typescript
// app/api/income/route.ts
import { incomeEntrySchema } from '@/schemas/income-entry'

export async function POST(request: Request) {
  const body = await request.json()

  // Validate with same schema
  const result = incomeEntrySchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { errors: result.error.errors },
      { status: 400 }
    )
  }

  // Type-safe data
  const data = result.data

  // Save to database
  await db.income_entries.add(data)

  return Response.json({ success: true })
}
```

### tRPC Integration (Optional)

```typescript
// server/routers/income.ts
import { incomeEntrySchema } from '@/schemas/income-entry'
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const incomeRouter = router({
  create: publicProcedure
    .input(incomeEntrySchema)
    .mutation(async ({ input, ctx }) => {
      // input is type-safe
      const entry = await ctx.db.income_entries.add(input)
      return entry
    }),

  list: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const entries = await ctx.db.income_entries
        .where('date')
        .between(input.startDate, input.endDate)
        .toArray()
      return entries
    }),
})
```

## Testing Forms with Zod

### Schema Testing

```typescript
import { describe, it, expect } from 'vitest'
import { incomeEntrySchema } from '@/schemas/income-entry'

describe('incomeEntrySchema', () => {
  it('should validate valid income entry', () => {
    const validEntry = {
      date: new Date(),
      platform: 'AmazonFlex' as const,
      amount: 88.50,
    }

    const result = incomeEntrySchema.safeParse(validEntry)
    expect(result.success).toBe(true)
  })

  it('should reject negative amount', () => {
    const invalidEntry = {
      date: new Date(),
      platform: 'AmazonFlex' as const,
      amount: -10,
    }

    const result = incomeEntrySchema.safeParse(invalidEntry)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('positive')
    }
  })

  it('should reject invalid platform', () => {
    const invalidEntry = {
      date: new Date(),
      platform: 'InvalidPlatform',
      amount: 50,
    }

    const result = incomeEntrySchema.safeParse(invalidEntry)
    expect(result.success).toBe(false)
  })
})
```

### Form Testing with React Testing Library

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IncomeForm } from './IncomeForm'

describe('IncomeForm', () => {
  it('should show validation errors for invalid data', async () => {
    render(<IncomeForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument()
    })
  })

  it('should submit valid form data', async () => {
    const onSubmit = vi.fn()
    render(<IncomeForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/amount/i), '88.50')
    await userEvent.selectOptions(screen.getByLabelText(/platform/i), 'AmazonFlex')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 88.50,
          platform: 'AmazonFlex',
        })
      )
    })
  })
})
```

## Key Takeaways

1. **TypeScript-First**: Use `z.infer` to generate types from schemas
2. **Single Source of Truth**: Define validation once, use everywhere
3. **Custom Errors**: Provide clear, actionable error messages
4. **Refine for Cross-Field**: Use `.refine()` for validation across multiple fields
5. **SuperRefine for Complex Cases**: Use `.superRefine()` when you need multiple issues
6. **Compose Schemas**: Build complex schemas from simple, reusable pieces
7. **Default Values**: Always provide defaults at form level, not field level
8. **Field Arrays**: Use `field.id` for keys, leverage memoization
9. **Performance**: Subscribe selectively, avoid array triggers, virtualize large forms
10. **Reusability**: Share schemas between client and server for consistency

## References

- [Learn Zod Validation with React Hook Form - Contentful](https://www.contentful.com/blog/react-hook-form-validation-zod/)
- [Building Advanced React Forms - Wasp Blog](https://wasp.sh/blog/2025/01/22/advanced-react-hook-form-zod-shadcn)
- [How to Validate Forms with Zod and React-Hook-Form - freeCodeCamp](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)
- [Building React Forms with Ease - Wasp Blog](https://wasp.sh/blog/2024/11/20/building-react-forms-with-ease-using-react-hook-form-and-zod)
- [React Hook Form Resolvers - GitHub](https://github.com/react-hook-form/resolvers)
- [useForm Documentation - React Hook Form](https://react-hook-form.com/docs/useform)
- [useFieldArray Documentation - React Hook Form](https://react-hook-form.com/docs/usefieldarray)
- [Optimizing Performance with React Hook Form](https://tillitsdone.com/blogs/react-hook-form-performance-guide/)
- [Zod GitHub Repository](https://github.com/colinhacks/zod)
- [Defining Schemas - Zod Documentation](https://zod.dev/api)
- [Zod Nested Discriminated Unions Tutorial](https://ryanschiang.com/zod-nested-discriminated-union)
