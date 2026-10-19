# WildWatch Dashboard

A shared wildlife crossing detection dashboard for the Team 11 project. The frontend is a React and TypeScript app, demo data is local and fictional, and shared records can be read from a Supabase Postgres database. There is no AI detection model, camera driver, warning-light control, authentication flow, or real-time monitoring in this build.

## Quick start

Requirements: Node.js 18+ and npm. (Vite and the local test command are pinned to support Node 18, including WSL distributions that still ship it.)

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Without Supabase environment variables, the app starts in **DEMO DATA** mode and shows fictional records. They are not live detections and are not written to a database.

## Tests and production build

```bash
npm test
npm run build
npm run preview
```

`npm run preview` serves the production build locally after `npm run build`.

## Interactive demo features

The Overview page is a static product preview with fictional wildlife examples. The high-risk indicator and virtual warning state represent the sample camera's 7:30 PM deer detection. System status is available in its own sidebar tab. There is no interactive wildlife simulator in this version. The preview does not control a real warning light, connect to a camera, or run an AI model.

The camera preview is a static presentation mock showing three fictional animals at 7:30 PM with example confidence and risk labels. It is not a live camera feed or GPS display. Dashboard analytics use the selected sample or Supabase records.

The recent detections table and detection history remain available for reviewing records. The camera snapshot examples are illustrative and are not stored in Supabase.

The System status tab reports the configured database connection and last successful data refresh. Camera and AI entries always say **preview only** because this project does not connect to a camera or run an AI model. In demo mode, the database status explicitly says it is displaying demo records.

In Detection history, **Export CSV** downloads every record matching the current search and filters (not only the visible page). In database mode, matching records are loaded from Supabase in pages before export. Demo records can also be exported.

## Shared database setup (Supabase)

1. One teammate creates a Supabase project and invites the rest of the group through the Supabase project access controls.
2. In the Supabase SQL Editor, run [`supabase/migrations/202610180001_create_detections.sql`](supabase/migrations/202610180001_create_detections.sql). It creates the nullable detection fields, confidence validation, indexes, and read-only row-level security policy.
3. In **Project Settings → API**, copy the project URL and the public anon/publishable key.
4. Copy `.env.example` to `.env.local` and fill in the two values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

5. Restart `npm run dev`. The app will show **DATABASE** mode. Add test or project-approved records using the Supabase Table Editor. The dashboard is read-only and the migration grants public read access, so do not put private data or secrets in these rows.

The table uses UTC `timestamptz`, nullable animal class, confidence, location, warning details, image reference, notes, and status. Confidence must be between 0 and 1. For the future detection pipeline, send records through a trusted server or Supabase Edge Function. Keep any service-role key server-side; never expose it in this frontend. The dashboard does not upload or store image files.

## Publish with Vercel and GitHub

This stack keeps publishing simple: use the group’s GitHub repository as the source and Vercel for the static frontend.

1. Push this project to the group’s GitHub repository and have teammates work in branches and open pull requests.
2. In Vercel, import the GitHub repository. Keep the detected Vite defaults (`npm run build`, output directory `dist`).
3. In Vercel project settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Preview and Production, then redeploy.
4. Share the Vercel project with teammates who need deploy access. Preview deployments can be used to review pull requests.

The source repository currently has no initial commit and its configured `origin` is `https://github.com/WarriorCats806/CSE4316-Wildwatch.git`. The initial push and account invitations require GitHub/Vercel/Supabase access by a group member; the app itself is set up for those steps.

## Project structure

- `src/ui/` — dashboard, responsive styling, history filters, and record detail view
- `src/backend.ts` — demo/data-source switch and Supabase queries
- `src/simulator.ts` — risk and scenario domain helpers retained for future integration
- `src/export.ts` — filtered CSV report formatting and download
- `src/ui/DemoFeatures.tsx` — static product preview, virtual light, camera mock, and analytics
- `src/ui/SystemStatus.tsx` — database and preview pipeline status tab
- `src/types.ts` — detection schema, validation, and demo filtering
- `src/data.ts` — clearly labeled local fictional sample records
- `supabase/migrations/` — database schema and read policy

## Data and behavior notes

- History search, date range, animal, warning, and confidence filters are applied to the selected data source; database mode filters in Supabase and paginates newest-first.
- Summary, recent records, and the seven-day chart are calculated from returned records. No counts are presented as live telemetry.
- Missing values display as “Not available.” No GPS, species claims beyond the stored class, video, map, or hardware integration is assumed.
- This iteration does not add record creation to the browser. This avoids allowing anonymous public writes; a future ingestion service should validate and insert records on the server.
