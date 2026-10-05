# Database Seeding Guide

This document explains how to seed the STEAM Foundry Admin Dashboard with test data.

## Overview

The seeding script populates the Supabase database with sample data for:
- **Learning Paths**: 4 sample learning paths across different tiers (Primary, Secondary, Sixth Form)
- **Student Profiles**: 8 sample students with different tiers and roles
- **Competitions**: 3 active competitions with dates and descriptions
- **Submissions**: 8 sample submissions with various statuses (submitted, draft, under review)

This data enables you to see the dashboard with realistic statistics instead of all zeros.

## Prerequisites

1. Supabase project created and configured
2. Environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anonymous key
3. Node.js installed (v16 or higher)

## Running the Seed Script

From the `packages-admin` directory, run:

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed-data.js
```

## What Gets Seeded

### Learning Paths (4 records)
- Introduction to Robotics (Primary, Active)
- Advanced Arduino Programming (Secondary, Active)
- IoT & Smart Devices (Secondary, Active)
- Machine Learning Basics (Sixth Form, Active)

### Student Profiles (8 records)
- Alice Johnson, Bob Smith (Primary tier)
- Charlie Brown, Diana Prince, Frank Wilson (Secondary tier)
- Eve Taylor, Grace Lee (Sixth Form tier)
- Henry Davis (Primary tier)

### Competitions (3 records)
- APEN 2024 Regional Competition (Secondary, Active)
- Robotics Innovation Challenge (Sixth Form, Active)
- Primary School Coding Sprint (Primary, Active)

### Submissions (8 records)
- Various team submissions with statuses:
  - 6 submitted (with scores: 85, 92, 78, 88, 95, 81)
  - 1 draft (no score)
  - 1 under review (no score)

## Dashboard Metrics After Seeding

After running the seed script, the dashboard will show:
- **Active Levels**: 4
- **Enrolled Students**: 8
- **Running Competitions**: 3
- **Total Submissions**: 8

## Clearing Seed Data

To remove seed data and start fresh, delete records from each table in Supabase console:

```sql
-- Delete all seeded data
DELETE FROM submissions;
DELETE FROM competitions;
DELETE FROM profiles WHERE role = 'student';
DELETE FROM learning_paths;
```

Or use the Supabase dashboard to delete from each table.

## Customizing Seed Data

To add more or different test data, edit `scripts/seed-data.js` and modify the arrays:

```javascript
const learningPaths = [
  { title: 'Your Course', tier: 'Primary', status: 'active', order_index: 1 },
  // ... more paths
];

const students = [
  { email: 'name@school.com', name: 'Name', role: 'student', tier: 'Primary' },
  // ... more students
];

const competitions = [
  { title: 'Your Competition', status: 'active', /* ... */ },
  // ... more competitions
];

const submissions = [
  { title: 'Team Name - Project', description: '...', status: 'submitted', score: 90 },
  // ... more submissions
];
```

Then run `npm run seed` again to insert the new data.

## Troubleshooting

### Script fails with "Missing Supabase URL"
Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in your `.env.local` file.

### "Permission denied" errors
The Supabase key may not have sufficient permissions. Use a master key or a key with write access to these tables.

### Data already exists
The script attempts to insert new records. If you run it multiple times, duplicate data may be created. Clear the tables first or edit the script to check for existing data before inserting.

### Tables don't exist
Ensure your Supabase project has the required tables created. The tables must have the structure referenced in the `seed-data.js` script.

## Next Steps

After seeding, you can:
1. **View data in the dashboard** at http://localhost:3001/dashboard
2. **Navigate to module pages** to see the seeded data in different views
3. **Create real data** using the admin UI in the Store, Learning Lab, and Competition modules
4. **Add more seed data** by editing the script and running it again

---

**Note**: Seed data is for development/testing only. In production, use your actual student enrollment and competition data.
