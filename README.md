# PlumbTrack

A responsive plumbing project-control workspace with project registers, a fourteen-stage workflow, records, reminders, team roles, audit history and company settings.

## Local preview

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` if you want to configure Supabase.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Without Supabase values the application runs with realistic in-memory preview data. Preview changes reset after a reload.

## Connect Supabase manually

1. Create a new Supabase project.
2. Open the SQL Editor and run `supabase/migrations/202608080001_plumbtrack.sql`.
3. Create the first user in Authentication.
4. Insert that user's UUID into `public.profiles` with the `administrator` role, using `supabase/seed.sql` as a guide.
5. Copy the project URL and anon key into `.env.local`.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it in client code or commit it.
7. The migration creates the private `project-records` storage bucket and its access policies.

## GitHub and Vercel

Create a GitHub repository and push this folder when ready. Import that repository into Vercel, add the same environment variables in Project Settings, and redeploy. Set `NEXT_PUBLIC_SITE_URL` to the final production URL.

## Quality checks

Run `npm run build` before deployment. The interface is optimized for a 1440px desktop dashboard and a 390px mobile layout.
