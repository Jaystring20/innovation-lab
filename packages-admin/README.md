# Admin Dashboard

Unified admin interface for STEAM Foundry's Learning Lab and APEN Competition platforms. Built with Next.js 14, Supabase, TanStack Query, and Tailwind CSS in a modular monolith architecture.

## Architecture Overview

### Modular Design
The admin dashboard is structured as a **modular monolith** where each major feature (Competition, Learning Lab) operates as an independent module within a shared shell:

```
packages/admin/
├── app/
│   ├── dashboard/           # Main dashboard shell
│   ├── modules/
│   │   ├── learning-lab/   # Learning Lab module (independent)
│   │   └── competition/    # Competition module (independent)
│   └── components/         # Shared UI components
├── lib/
│   ├── events.ts          # Event bus for module communication
│   ├── supabase.ts        # Supabase client
│   └── hooks.ts           # Shared hooks (TanStack Query)
└── types/                  # Shared TypeScript types
```

### Module Communication
Modules communicate via an **event bus** pattern (see `lib/events.ts`):

```typescript
// Learning Lab module publishes event
eventBus.emit('learning-lab:level-published', { levelId, levelName });

// Competition module listens for related events
eventBus.on('learning-lab:level-published', (data) => {
  // React to Learning Lab changes without direct import
});
```

This enables:
- **Loose coupling:** Modules don't import each other directly
- **Scalability:** New modules can be added without modifying existing ones
- **Testability:** Events can be mocked and tested independently
- **Independent deployment:** Modules can be versioned separately

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 | App Router, Server Components, Streaming |
| **Database** | Supabase (PostgreSQL) | Managed database with Auth & RLS |
| **State** | Zustand | Global state for UI (lightweight alternative to Redux) |
| **API Client** | TanStack Query v5 | Server state, caching, synchronization |
| **Forms** | React Hook Form + Zod | Type-safe form handling & validation |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with dark mode support |
| **Components** | shadcn/ui | Accessible, unstyled components |
| **Icons** | Phosphor | Modern, customizable icons |
| **Monorepo** | pnpm workspaces | Shared packages via `@repo/*` aliases |

## File Structure

### `app/` - Next.js App Router
- `layout.tsx` - Root layout with providers
- `globals.css` - Global Tailwind styles
- `page.tsx` - Root page (redirects to dashboard)
- `dashboard/` - Dashboard shell and main layout
- `components/` - Shared UI components (nav, sidebar, forms)
- `modules/` - Feature modules (learning-lab, competition)

### `lib/` - Shared Utilities
- `events.ts` - Event bus for module communication
- `supabase.ts` - Supabase client initialization & auth helpers
- `hooks.ts` - Shared React hooks (TanStack Query, Zustand)

### `types/` - TypeScript Definitions
- `learning-lab.ts` - Learning Lab types
- `competition.ts` - Competition types
- `common.ts` - Shared types

## Setup & Installation

### 1. Install Dependencies
```bash
cd packages/admin
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup
Ensure the Supabase database is initialized with:
- `002_lab_learning_track.sql` (schema)
- `003_seed_primary_stage2.sql` (sample data)
- `004_publish_primary_stage2.sql` (publish content)
- `005_add_asset_system.sql` (asset management)

### 4. Run Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000/dashboard`

## Usage Examples

### Adding a New Page
```typescript
// app/dashboard/[section]/page.tsx
export default function Page() {
  return <div>Page content</div>;
}
```

### Using TanStack Query
```typescript
// Fetch data with automatic caching
const { data, isLoading } = useQuery({
  queryKey: ['levels'],
  queryFn: () => supabase.from('levels').select('*'),
});
```

### Event Communication Between Modules
```typescript
// Learning Lab module
eventBus.emit('learning-lab:level-published', { levelId, levelName });

// Competition module
useEventBus('learning-lab:level-published', (data) => {
  console.log(`Level ${data.levelName} was published`);
});
```

### Forms with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

export function LevelForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
    </form>
  );
}
```

## Security & Access Control

### Row-Level Security (RLS)
All database tables enforce RLS policies. Users can only access content they have permission to:
- `super_admin` - Full access to all content
- `curriculum_editor` - Edit curriculum content
- `organizer` - Manage competition/events

### Authentication Flow
```typescript
import { getCurrentUser, isAdmin } from '@/lib/supabase';

// In a Server Component
const user = await getCurrentUser();
if (!isAdmin()) {
  redirect('/login');
}
```

## Development Workflow

### Creating a New Module
1. Create folder: `app/modules/new-module/`
2. Create main component: `new-module-module.tsx`
3. Wire into dashboard: Add to module tab switcher
4. Emit events for other modules to listen to

### Best Practices
- ✅ Keep modules independent - no cross-module imports
- ✅ Use event bus for communication between modules
- ✅ Implement optimistic UI updates with TanStack Query
- ✅ Use Zod for runtime validation
- ✅ Test modules in isolation first

## Performance Optimizations

### Code Splitting
- Server Components by default (no JavaScript sent to client)
- Client Components only where needed (interactive UI)
- Dynamic imports for heavy modules:
```typescript
const LevelEditor = dynamic(() => import('@/components/LevelEditor'));
```

### Data Fetching
- TanStack Query handles caching and deduplication
- Stale time: 5 minutes, GC time: 10 minutes
- Background revalidation on window focus
- Suspense for streaming data

### Asset Optimization
- WebP/AVIF images from Supabase Storage
- Image optimization via Next.js Image component
- Lazy loading for below-fold content

## Deployment

### Build for Production
```bash
pnpm build
pnpm start
```

### Environment Variables
Set in your deployment platform (Vercel, Netlify, etc.):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Monitoring
- Error tracking via Sentry (optional)
- Performance monitoring via Web Vitals
- Database query logging via Supabase

## Troubleshooting

### "Supabase environment variables missing"
Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### "RLS policy violation"
Check that:
1. User is authenticated
2. User has correct role in `admin_users` table
3. Table has appropriate RLS policies

### "Module communication not working"
Ensure the event name matches exactly:
```typescript
// Publisher
eventBus.emit('learning-lab:level-published', data);

// Subscriber - must match exactly
useEventBus('learning-lab:level-published', handler);
```

## Integration Checklist

- [ ] Supabase project created and configured
- [ ] `.env.local` file set up with Supabase credentials
- [ ] Database migrations applied (002-005)
- [ ] Admin user added to `admin_users` table
- [ ] RLS policies verified
- [ ] Development server running without errors
- [ ] Both Learning Lab and Competition modules accessible
- [ ] Event bus communication tested
- [ ] Forms validation working
- [ ] TanStack Query caching working
- [ ] Dark mode toggle functional
- [ ] Responsive design verified on mobile

## Next Steps

1. **Implement Learning Lab Editors** - Build full Level, Lesson, Assessment, Mission editors
2. **Implement Competition Managers** - Build Stage, Team, Submission, Scoring interfaces
3. **Add Analytics Dashboard** - Track student progress and engagement
4. **Integrate File Upload** - Supabase Storage for PDFs, videos, images
5. **Build Student Notifications** - Email/SMS alerts for important updates
6. **Set Up CI/CD** - GitHub Actions for automated testing and deployment

## Contributing

When adding features:
1. Keep modules independent
2. Use event bus for cross-module communication
3. Add TypeScript types in `types/`
4. Write tests for new hooks
5. Document new API contracts in README

## Support

For questions or issues:
- Check existing GitHub issues
- Review Supabase documentation
- Consult Next.js App Router guide
- Test event bus patterns in isolation
