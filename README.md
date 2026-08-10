# PlumbTrack

A responsive plumbing project-control workspace with project registers, a fourteen-stage workflow, records, reminders, team roles, audit history and company settings.

## Local preview

1. Install Node.js 24.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` if you want to configure Supabase.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.
6. Sign in with the Supabase Auth user that also has an `administrator` row in `public.profiles`.

Without Supabase values the application runs with realistic in-memory preview data. Preview changes reset after a reload.

## Connect Supabase manually

1. Create a new Supabase project.
2. Open the SQL Editor and run `supabase/migrations/202608080001_plumbtrack.sql`.
3. To enable the standalone Water Pump tracker, also run `supabase/migrations/202608100001_water_pump_tracker.sql`.
4. Create the first user in Authentication.
5. Insert that user's UUID into `public.profiles` with the `administrator` role, using `supabase/seed.sql` as a guide.
6. Copy the project URL and anon key into `.env.local`.
7. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it in client code or commit it.
8. The migration creates the private `project-records` storage bucket and its access policies.
9. The main PlumbTrack app reads and writes projects only after a Supabase Auth sign-in. If you can query `public.projects` in SQL but cannot see it in the app, sign in from the top Supabase bar first.

## Water Pump tracker

The sidebar Water Pump item opens a standalone Pump Tracker page at `/water-pump`. Set `NEXT_PUBLIC_WATER_PUMP_URL` if you want the sidebar to jump to a Vercel subdomain such as `https://pump.your-domain.com`.

The standalone Water Pump page uses `/api/water-pump`, so on Vercel it needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

After those variables are present and `202608100001_water_pump_tracker.sql` has been run in Supabase, the Water Pump page will read and save its projects, pump records, supplier quotations, and water tank details in Supabase.

## GitHub and Vercel

Import `qingyun428/Plumbtrack` into Vercel as a Next.js project. Vercel will run the Node.js build from `package.json`:

- Install command: `npm install`
- Build command: `npm run build`
- Development command: `npm run dev`
- Node.js version: `24.x`

Add the same Supabase environment variables in Vercel Project Settings, then redeploy. Set `NEXT_PUBLIC_SITE_URL` to the final production URL. Add `NEXT_PUBLIC_WATER_PUMP_URL` only if Water Pump should open on a separate subdomain instead of `/water-pump`.

## Quality checks

Run `npm run build` before deployment. The interface is optimized for a 1440px desktop dashboard and a 390px mobile layout.
