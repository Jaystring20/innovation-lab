# Admin Dashboard Components

Production-grade React components for managing STEAM Foundry Learning Lab curriculum.

## 📦 What's Included

- **types.ts** — TypeScript interfaces for all data models
- **hooks.ts** — Reusable React hooks for data operations
- **LevelEditor.tsx** — Create/edit level metadata
- **LessonBuilder.tsx** — Add lesson content (not created yet, use as template)
- **QuizBuilder.tsx** — Drag-drop question editor for assessments
- **MissionBuilder.tsx** — Create/edit lab missions with TinkerCAD, hints, etc.
- **AssetUploader.tsx** — Upload files or paste URLs (YouTube, Google Docs, PDFs)
- **PublishingQueue.tsx** — Review & publish content workflow

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js react-hook-form
```

### 2. Copy Files to Your Project

```bash
# Copy to your Next.js app structure
cp -r admin-dashboard/* apps/your-app/app/admin/
```

Suggested structure:
```
app/
├── admin/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard page (create this)
│   ├── types.ts
│   ├── hooks.ts
│   └── components/
│       ├── LevelEditor.tsx
│       ├── QuizBuilder.tsx
│       ├── MissionBuilder.tsx
│       ├── AssetUploader.tsx
│       └── PublishingQueue.tsx
```

### 3. Set Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. Create Dashboard Page

```typescript
// app/admin/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import { LevelEditor } from '../components/LevelEditor';
import { QuizBuilder } from '../components/QuizBuilder';
import { MissionBuilder } from '../components/MissionBuilder';
import { AssetUploader } from '../components/AssetUploader';
import { PublishingQueue } from '../components/PublishingQueue';
import { useLevels } from '../hooks';

export default function AdminDashboard() {
  const [selectedView, setSelectedView] = useState<'queue' | 'editor'>('queue');
  const [selectedTier, setSelectedTier] = useState('primary');
  const { levels, fetchLevels } = useLevels(selectedTier);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage curriculum, publish content</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedView('queue')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                selectedView === 'queue'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Publishing Queue
            </button>
            <button
              onClick={() => setSelectedView('editor')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                selectedView === 'editor'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Content Editor
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedView === 'queue' && <PublishingQueue tierId={selectedTier} />}

        {selectedView === 'editor' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="primary">Primary (Ages 7-12)</option>
                <option value="secondary">Secondary (Ages 13-16)</option>
                <option value="sixth_form">Sixth Form (Ages 16-18)</option>
              </select>
            </div>

            {/* Level list here */}
            <p className="text-gray-600">
              Select a level to edit (integration continues...)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 📚 Component Usage

### LevelEditor
```tsx
<LevelEditor
  level={selectedLevel}
  onSave={(updated) => {
    console.log('Saved:', updated);
    fetchLevels();
  }}
  onCancel={() => setSelectedLevel(null)}
/>
```

### QuizBuilder
```tsx
<QuizBuilder
  assessment={selectedAssessment}
  onSave={(updated) => {
    console.log('Assessment saved:', updated);
  }}
  onCancel={() => setSelectedAssessment(null)}
/>
```

### MissionBuilder
```tsx
<MissionBuilder
  mission={selectedMission}
  onSave={(updated) => {
    console.log('Mission saved:', updated);
  }}
  onCancel={() => setSelectedMission(null)}
/>
```

### AssetUploader
```tsx
<AssetUploader
  documentId={level.document_id}
  onAssetAdded={(asset) => {
    console.log('Asset added:', asset);
    // Add to lesson supplementary_assets array
  }}
/>
```

### PublishingQueue
```tsx
<PublishingQueue tierId={selectedTier} />
```

## 🔐 Security Notes

- ✅ Row-level security (RLS) policies protect data
- ✅ Only authenticated admins with `curriculum_editor` role can edit
- ✅ Students can only see published content
- ✅ Draft/published separation prevents accidental exposure
- ✅ Asset uploads go to Supabase Storage with signed URLs

## 🎨 Styling

Components use Tailwind CSS (assumed installed in your Next.js project).

Customize by:
1. Changing color classes (e.g., `bg-blue-600` → `bg-green-600`)
2. Overriding in a global CSS file
3. Using CSS variables for theming

## 🔄 Workflow

1. **Create/Edit** — Use editors to build content
2. **Add Assets** — Attach files, videos, docs
3. **Review** — Check PublishingQueue
4. **Publish** — Go live for students
5. **Track** — Monitor student progress (dashboard integration needed)

## 📋 Checklist for Full Integration

- [ ] Copy all files to your Next.js app
- [ ] Install dependencies
- [ ] Set Supabase environment variables
- [ ] Create `/admin/dashboard` page
- [ ] Add authentication check (check for `admin_users` role)
- [ ] Create level browser/selector UI
- [ ] Wire up lesson/assessment/mission selection
- [ ] Add student progress tracking view
- [ ] Deploy to production
- [ ] Test publish workflow end-to-end

## 🆘 Common Issues

**"Supabase client not initialized"**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

**"Assets not uploading"**
- Ensure Supabase Storage bucket `lab-assets` exists
- Check RLS policies allow authenticated users to upload

**"Can't edit published content"**
- This is by design! Publish creates a separate row
- To edit published content, organizers create a new draft

## 🚀 Next Steps

1. Integrate these components into your dashboard
2. Add student progress tracking view
3. Create bulk publish actions (publish all levels at once)
4. Add version history/rollback UI
5. Build analytics dashboard (tracking student XP, completion rates)

---

**Need help?** Check the individual component files for more details.
