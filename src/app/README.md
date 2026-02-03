# App (Frontend)

Next.js App Router frontend layer. Contains pages, layouts, and UI components.

## Responsibilities

- Render pages and handle client-side interactions
- Call API routes for server operations
- Manage client-side auth state via `@/server` (better-auth client)

## Child Subsystems

- **_components/** — Shared UI components
- **api/** — Next.js API routes (auth handlers)
- **contacts/** — Contacts management page and components 

## Constraints

- Only import from `@/server` for auth client utilities
- Only import from `@/lib` for shared types/utils
- Never import domains directly — go through API routes
