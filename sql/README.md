# SQL Files Documentation

This directory contains PostgreSQL schema and configuration files for the GigPro Supabase database.

## Core Schema

- **`supabase-schema.sql`** - Main database schema with all tables, indexes, triggers, and functions. Run this first when setting up the database.

## Index Optimization

- **`recommended-indexes.sql`** - Additional indexes for performance optimization on common query patterns.

## Row-Level Security (RLS)

GigPro is currently a **single-user application** with RLS disabled. These files are for future multi-user support:

- **`enable-rls.sql`** - Enable RLS policies for all tables (when authentication is added)
- **`disable-all-rls.sql`** - Disable RLS on all tables (current single-user mode)
- **`disable-rls-settings.sql`** - Disable RLS specifically for app_settings table
- **`disable-rls-payment-plan-payments.sql`** - Disable RLS for payment_plan_payments table

## Migration Files

- **`add-payment-plans-due-day.sql`** - Migration to add due_day column to payment_plans

## Setup Order

1. Run `supabase-schema.sql` to create tables
2. Run `recommended-indexes.sql` for performance
3. RLS is disabled by default for single-user mode
