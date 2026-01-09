# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaasConcour is a project management SaaS application built with React, TypeScript, Tailwind CSS, and Prisma ORM. The application supports role-based access control (RBAC) with three user roles: ADMIN, PROJECT_MANAGER, and USER. It manages projects, tasks, appointments, clients, and calendar events.

## Development Commands

### Frontend Development
```bash
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

### Backend Development
```bash
npm run server           # Start Express server (port 3001)
npm run dev:all          # Run both frontend and backend concurrently
```

### Database Commands
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database without migrations
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset and seed database
```

### Deployment
```bash
npm run vercel-build     # Build for Vercel (generates Prisma client + builds)
npm run deploy           # Deploy to GitHub Pages
```

## Architecture

### Frontend Structure

- **App.tsx**: Main routing setup with React Router v7. All routes except `/signin` and `/signup` are wrapped in `ProtectedRoute` and use `AppLayout`.
- **Layout System**: `AppLayout` provides the main shell with collapsible sidebar, header, and content area. Uses `SidebarProvider` context for sidebar state management.
- **Context Providers**:
  - `AuthContext`: Authentication state, user data, login/register/logout functions. User persisted in localStorage.
  - `ThemeContext`: Light/dark theme management
  - `SidebarContext`: Sidebar expansion/collapse state

### Backend Architecture

The project uses a **dual-backend approach**:

1. **Development**: Express server (`server/index.ts`) running on port 3001
2. **Production**: Vercel Serverless Functions in the `/api` directory

The `API_URL` in `src/config/api.ts` automatically switches between:
- Development: `http://localhost:3001/api`
- Production: `/api` (Vercel Functions)

All API routes follow the pattern `/api/{resource}` and are duplicated in both Express routes and Vercel Functions.

### Database Schema

Prisma schema defines 6 main models:
- **User**: Authentication and role management (ADMIN, PROJECT_MANAGER, USER)
- **Project**: Projects with status tracking (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
- **Task**: Tasks assigned to users with priority and status
- **Event**: Internal calendar events (MEETING, DEADLINE, REMINDER, OTHER)
- **Client**: Customer/client information
- **Appointment**: Client meetings linked to projects and users

Key relationships:
- Projects have a projectManager (User) and members (many-to-many User relation)
- Tasks belong to a Project and are assigned to a User
- Appointments can be linked to both a Client and a Project
- Events belong to a User

### Permission System

Located in `src/lib/permissions.ts`. Permission checks based on user roles:
- **ADMIN**: Full access to all operations
- **PROJECT_MANAGER**: Can manage their own projects and create tasks within them
- **USER**: Can view projects where they have assigned tasks and update their own task statuses

Key permission functions:
- `canManageProjects(user)`: ADMIN or PROJECT_MANAGER
- `canCreateProject(user)`: ADMIN only
- `canEditProject(user, projectManagerId)`: ADMIN or the project's manager
- `canViewProject(user, projectManagerId, hasAssignedTasks)`: Role-based visibility

### Authentication Flow

1. User submits credentials via `SignInForm` or `SignUpForm`
2. Frontend calls `/api/auth/login` or `/api/auth/register`
3. Backend validates credentials using bcryptjs
4. On success, user data (without password) is returned
5. Frontend stores user in `AuthContext` state and localStorage
6. `ProtectedRoute` checks authentication and redirects to `/signin` if not authenticated

No JWT tokens are used - authentication relies on localStorage persistence.

## Key Implementation Patterns

### API Route Structure (Vercel Functions)

All Vercel Function handlers follow this pattern:
```typescript
import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // ... more CORS headers

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Handle different HTTP methods
  if (req.method === "GET") { /* ... */ }
  if (req.method === "POST") { /* ... */ }
  // etc.
}
```

### Component Patterns

- UI components in `src/components/ui/`: Reusable components (Button, Modal, Badge, Table, etc.)
- Form components in `src/components/form/`: Input fields, checkboxes, text areas with consistent styling
- Page components in `src/pages/`: Full-page views that compose UI components
- Custom hooks in `src/hooks/`: Reusable logic (useProjects, useModal, useMessages, useGoBack)

### SVG Icons

SVGs are imported as React components using `vite-plugin-svgr`:
```typescript
import { ReactComponent as IconName } from './icons/icon-name.svg';
```

## Database Management

### Initial Setup
```bash
# 1. Configure DATABASE_URL in .env
# 2. Generate Prisma client
npm run db:generate
# 3. Push schema or run migrations
npm run db:push
# 4. Seed with sample data
npm run db:seed
```

### Sample Credentials (after seeding)
- Email: `admin@saasconcour.com`
- Password: `password123`

### Making Schema Changes
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (development) or `npm run db:migrate` (production)
3. Run `npm run db:generate` to update Prisma client
4. Restart dev server to pick up new types

## Common Workflows

### Adding a New API Endpoint

1. Create Vercel Function in `/api/{resource}/index.ts` or `/api/{resource}/[id].ts`
2. Add corresponding Express route in `server/routes/` (for local development)
3. Implement handler with CORS headers and method routing
4. Use Prisma client for database operations
5. Test locally with `npm run dev:all`

### Adding a New Page

1. Create page component in `src/pages/{PageName}.tsx`
2. Add route in `src/App.tsx` within the `AppLayout` Route
3. Update sidebar navigation in `src/layout/AppSidebar.tsx` if needed
4. Use `ProtectedRoute` for authenticated pages

### Working with Permissions

Always check permissions before rendering UI or making API calls:
```typescript
import { canCreateProject } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();
if (canCreateProject(user)) {
  // Show create project button
}
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string

The project uses Prisma with PostgreSQL. For local development, you can use a local PostgreSQL instance or a cloud provider.

## Deployment Notes

### Vercel Deployment
- Build command: `npm run build` (automatically runs `prisma generate`)
- Output directory: `dist`
- Environment variables must include `DATABASE_URL`
- API routes are automatically deployed as Serverless Functions
- `vercel.json` configures SPA routing (all non-API routes serve `index.html`)

### Important Vercel Configuration
The `vercel.json` rewrites ensure React Router works correctly:
```json
{
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

## Testing Approach

Currently no test framework is configured. When adding tests:
- Unit tests for utilities and hooks
- Integration tests for API endpoints with test database
- E2E tests for critical user flows (auth, project creation, task management)
