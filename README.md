# Daybook — Personal Planner PWA

A lightweight, responsive planner built with HTML, CSS, and vanilla JavaScript.

## Features
- Daily dashboard with completion, planned-focus, and habit summaries
- Editable daily time blocks
- Weekly timetable view
- Tasks with due dates, priorities, notes, and categories
- Habit tracking with date-specific check-ins
- Light/dark theme
- LocalStorage persistence (data stays in this browser on this device)
- Installable PWA manifest and service-worker cache for offline use

## Run locally
Service workers require `localhost` or HTTPS. From this folder, run a local server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Install / deploy
- For local testing, use the local server above.
- To deploy, upload the files to a static HTTPS host such as GitHub Pages.
- Once opened on HTTPS, use your browser's install option to install the PWA.

## Important notes
- Your planner data is stored in this browser's LocalStorage. It does not automatically sync between devices.
- Clearing browser data may remove saved planner data. Export/backup is not yet included.
- The Google Fonts import is optional; the app still works offline with system fallbacks.

## Enable cloud sync between your devices (Supabase)

1. In Supabase, open **SQL Editor → New query**, paste the SQL below, and click **Run**. This adds a private per-user snapshot table used to sync the planner data.

```sql
create table if not exists public.daybook_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.daybook_snapshots enable row level security;
drop policy if exists "Users manage their own Daybook snapshot" on public.daybook_snapshots;
create policy "Users manage their own Daybook snapshot"
  on public.daybook_snapshots for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.daybook_snapshots to authenticated;
```

2. In this folder, open `config.js` in a text editor. Replace the two placeholder strings with your **Project URL** and **Publishable key** from Supabase project settings. Keep the quotes. Do not use a `service_role` key or any secret key.
3. Upload all files, including `config.js`, to the root of your existing GitHub repository (`GsrBhat/daybook-planner`), replacing the old versions. The app is a static website, so `config.js` contains the public publishable key only; database access is protected by Row Level Security.
4. Open `https://gsrbhat.github.io/daybook-planner/`, refresh, choose **Sign in / Create account**, and create an account. If Supabase asks you to confirm your email, follow that email link, then sign in.
5. On the first successful sign-in, the current device's existing planner data is uploaded if your cloud snapshot is empty. On later devices, the cloud snapshot is loaded into that device. Use the same account on both devices. After edits, changes are saved locally and synced shortly afterward; use **Sync now** if you want to trigger a manual save.

### Important sync behavior
- Your planner remains usable in device-only mode until `config.js` is filled in.
- The initial device that signs in first seeds an empty cloud snapshot with its current data. If you already have different unsynced data on multiple devices, back up/copy that data before signing in on each device; this simple snapshot sync is not a conflict-merging system.
- Supabase's default email-confirmation setting may require confirming your email before your first sign-in.
- Never publish a Supabase secret/service-role key. Only the Publishable key belongs in the browser configuration.
