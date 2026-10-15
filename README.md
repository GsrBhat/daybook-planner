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
