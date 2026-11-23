# Creating the first organizer account

Roles live in `public.profiles`. New signups default to `teacher` (least
privilege), so the first organizer has to be promoted deliberately — there is
no way to self-promote through the app, by design.

## 1. Create the user

Supabase dashboard → **Authentication → Users → Add user**.
Use a real email, set a strong password, and tick **Auto Confirm User**.

## 2. Promote them to organizer

Dashboard → **SQL Editor**, replacing the email:

```sql
update public.profiles
set role = 'organizer', full_name = 'Their Name'
where email = 'you@example.com';
```

## 3. Confirm it worked

```sql
select email, role from public.profiles order by created_at;
```

Then sign in at `/organizer/login`. A non-organizer who signs in with valid
credentials is signed straight back out with an explanatory message, so if you
land back on the login screen, step 2 did not apply.

## Adding judges and teachers later

Same flow, with `role = 'judge'` or left as the `teacher` default. Neither can
read orders, schools, or payment proofs — only organizers can.
