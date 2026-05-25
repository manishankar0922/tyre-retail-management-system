# Retail Operations ERP

A production-grade Retail ERP and Inventory Management System engineered for high-volume physical retail environments. Built with a focus on **data integrity, operational reliability, and multi-tab performance**.

## Project Overview

This repository demonstrates a fully hardened, production-ready ERP system designed to handle the chaotic operational environment of physical retail. It moves beyond standard CRUD implementations by focusing on strict transactional boundaries, hydration optimization, and edge-routed security.

## Features

- **Role-Based Access Control**: Secure, edge-enforced routing separating Owner and Accountant privileges.
- **Atomic Inventory Management**: Database-level constraints to prevent negative stock and handle concurrent checkout race conditions.
- **Cross-Tab Synchronization**: Real-time state syncing across multiple tabs using native `StorageEvent` APIs, eliminating unnecessary API polling.
- **Offline-Resilient Workflows**: Strict request locking to prevent duplicate invoicing during unstable network conditions.
- **High-Density Dashboard**: Keyboard-optimized UI for rapid data entry and operational efficiency.

## Tech Stack

- **Frontend Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Optimized for high-density tabular layouts)
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT via cookies)
- **Deployment**: Vercel

## System Architecture

The architecture leverages React Server Components (RSC) to minimize client-side payload, shifting layout rendering and heavy data fetching to the server. State synchronization between client tabs relies on lightweight native browser APIs, while critical mutations are guarded by database triggers to guarantee consistency.

## ERP Workflow

1. **Authentication**: Users authenticate via secure edge middleware which dictates access levels.
2. **Inventory Tracking**: Operators can view and manage real-time inventory counts.
3. **Invoicing**: Staff generates invoices with built-in validation preventing overselling.
4. **Automated Reconciliation**: Invoices automatically update inventory levels transactionally.
5. **Reporting**: Owners have access to real-time, consolidated analytics.

## Authentication & Security

- **Edge Middleware**: Next.js middleware is used to instantly protect routes and prevent client-side flash of unauthorized content.
- **JWT Session Management**: Tokens are securely stored in HTTP-only cookies and validated on the server.
- **Row Level Security (RLS)**: Database queries are strictly scoped to the authenticated user's permissions.

## Database Overview

The system uses a PostgreSQL relational model ensuring ACID compliance. Critical business logic, such as inventory deduction, is handled at the database level via triggers and `CHECK` constraints to ensure absolute data integrity regardless of frontend behavior.

## Performance Optimization Decisions

- **Reduced Client Payload**: Eliminated unnecessary client-side JavaScript by adopting Server Components.
- **Zero-Overhead Sync**: Implemented `StorageEvent` listeners for cross-tab updates instead of expensive WebSocket or polling connections.
- **Optimistic UI Updates**: Immediate UI feedback during network requests with robust error-rollback mechanisms.

## Engineering Challenges Solved

- **Race Conditions**: Solved concurrent checkout issues where two operators might bill the same physical item simultaneously.
- **Network Unreliability**: Addressed duplicate submission issues caused by operators clicking "Submit" multiple times during slow network conditions.
- **Resource Constraints**: Optimized database fetching to operate efficiently within strict connection pool limits.

## Folder Structure

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, Middleware)
├── components/           # Reusable UI Components (Organized by feature)
├── hooks/                # Custom React Hooks
├── lib/                  # Core Utilities (Supabase client, Auth logic)
├── services/             # API and Database interaction layers
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## Local Development Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Copy the environment variables: `cp .env.example .env.local`
4. Start the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with the following placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Deployment

This application is optimized for deployment on Vercel. 
- Ensure all environment variables are properly configured in the Vercel dashboard.
- The build process relies on Next.js optimizations and will automatically configure Edge Middleware.

## Security Considerations

- **Sanitized Outputs**: All user-facing data is sanitized to prevent XSS attacks.
- **Rate Limiting**: Implementation of rate limits on authentication endpoints to prevent brute-force attacks.
- **Environment Isolation**: Strict separation between development, staging, and production environments.

## Future Improvements

- **Audit Logging**: Implement a comprehensive system to track all inventory changes and user actions.
- **Advanced Analytics**: Integrate complex reporting for sales trends and forecasting.
- **Multi-Store Support**: Architect the database to support inventory tracking across multiple physical locations.

## Engineering Lessons

Building a system for physical retail requires a shift from "ideal scenario" programming to "defensive" programming. Assuming network unreliability, user error, and concurrency as the default states leads to a significantly more robust architectural design.

*Note: This repository is a sanitized, portfolio-safe version of a production operational system. Real business records, customer data, and sensitive infrastructure details have been structurally excluded.*
