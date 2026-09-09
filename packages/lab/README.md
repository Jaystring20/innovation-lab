# STEAM Foundry Lab

Main deployment (innovation-lab-seven.vercel.app)

## Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview
pnpm preview

# Lint
pnpm lint
```

## Imports from Shared

```tsx
import { calculateTeamXP, getRoleColor } from '@steam-foundry/shared/lib'
import { useOfflineQueue, useAuth } from '@steam-foundry/shared/hooks'
import { supabaseClient } from '@steam-foundry/shared/api'
import type { School, Team, Stage } from '@steam-foundry/shared/types'
```

## Structure

- `src/pages/` — Route pages (Landing, Store, Login, Lab, Organizer, Judge)
- `src/components/` — Lab-specific components (navigation, dashboard, etc.)
- `src/App.tsx` — React Router setup
- `src/main.tsx` — Entry point
