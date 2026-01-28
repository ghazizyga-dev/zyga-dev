# AI Boilerplate

A [T3 Stack](https://create.t3.gg/) boilerplate configured for AI-assisted development with enforced architecture constraints.

## Stack

- **[Next.js](https://nextjs.org)** - React framework
- **[Drizzle](https://orm.drizzle.team)** - TypeScript ORM
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS
- **[Better Auth](https://www.better-auth.com)** - Authentication

Created with `create-t3-app` (without tRPC).

## Architecture

This boilerplate enforces two complementary architectural patterns:

### Subsystem Architecture

Code is organized into **subsystems** - directories with clear boundaries, declared dependencies, and public APIs. This keeps the codebase navigable as it grows.

- Enforced by [`subsystems-architecture`](https://github.com/Diplow/subsystems-architecture) submodule
- Run `pnpm check:architecture` to validate
- Run `pnpm subsystem-tree` to visualize

### Domain-Driven Design

Business logic lives in isolated **domains** under `src/lib/domains/`. Each domain has services (entry points), objects (types/entities), actions (pure logic), and repositories (data access).

See [`src/lib/domains/README.md`](src/lib/domains/README.md) for details.

## AI-Assisted Development

The `CLAUDE.md` file provides instructions for AI assistants (Claude Code, Cursor, etc.):

- **Rule of 6** - Consistent limits on complexity (max 6 children, 6 functions per file, etc.)
- **Subsystem constraints** - How to declare and respect boundaries
- **DDD patterns** - How to structure features across layers
- **Planning workflow** - Commands like `/plan-subsystem` and `/plan-feature`

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm check:architecture` | Validate subsystem boundaries |
| `pnpm check:ruleof6` | Check complexity limits |
| `pnpm subsystem-tree` | Display subsystem hierarchy |
