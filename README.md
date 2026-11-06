# WildWatch Dashboard

A shared wildlife crossing dashboard for the Team 11 project. The frontend is a React and TypeScript app, demo data is local and fictional, and authenticated team members can read shared records from Supabase. An optional local Python service runs NanoDetector on uploaded test images. There is no live camera driver, warning-light control, or continuous monitoring.

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

## Run NanoDetector locally

The AI Analysis tab runs the NanoDetector YOLOv5m checkpoint on a test image or short video using the local computer. On Windows with Python 3.12, run the setup script from PowerShell:

```powershell
cd ai-service
.\setup.ps1
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

In a second terminal at the repository root, run `npm run dev`, open **AI analysis**, and upload a JPEG, PNG, WebP, MP4, MOV, AVI, MKV, or WebM file. Videos must be at most 30 seconds and 100 MB; NanoDetector samples up to 30 frames (about one per second). The dashboard overlays detections at their sampled timestamps while the video plays. MP4 with H.264 is recommended for broad codec support. The setup script installs CUDA-enabled PyTorch 2.5.1 for local NVIDIA inference and the Python API dependencies. The first prediction downloads the approximately 169 MB weights file and pinned YOLOv5 code; later predictions reuse the local caches. Inference falls back to CPU if CUDA is unavailable. The confidence threshold defaults to the model publisher's 0.75 field setting and can be changed with `WILDLIFE_CONFIDENCE_THRESHOLD`.

This local test displays the predicted species, confidence, bounding boxes, device, and inference time or sampled video frames. It does not save uploaded media or predictions to Supabase. Configure `VITE_AI_SERVICE_URL` if the local inference service runs at a different URL. The adapter is selected by `WILDLIFE_MODEL=nanodetector`, allowing another model adapter to be added later without changing the dashboard response format.

### Use the hosted dashboard with a local service

The hosted HTTPS dashboard sends requests to `http://127.0.0.1:8000` on the computer viewing the page. Each user must install the Python service, start it, and keep its terminal open. In PowerShell, from the repository root, run:

```powershell
cd ai-service
$env:WILDLIFE_ALLOWED_ORIGINS = "https://your-branch.your-app-id.amplifyapp.com"
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Replace the example origin with the exact HTTPS origin in the browser address bar (scheme and hostname only; no path or trailing slash). If dependencies are not installed yet, run `cd ai-service; .\setup.ps1` once first. Check that `http://127.0.0.1:8000/health` returns a healthy response, then refresh the hosted AI Analysis page. Allow the browser's local-network access prompt if it appears. The app requests loopback access explicitly for browsers that require it.

## Interactive demo features

The Overview page is a static product preview with fictional wildlife examples. The high-risk indicator and virtual warning state represent the sample camera's 7:30 PM deer detection. System status is available in its own sidebar tab. There is no interactive wildlife simulator in this version. The preview does not control a real warning light or connect to a camera. Use the separate AI Analysis tab to run NanoDetector against a local image.

The camera preview is a static presentation mock showing three fictional animals at 7:30 PM with example confidence and risk labels. It is not a live camera feed or GPS display. Dashboard analytics use the selected sample or Supabase records.

The recent detections table and detection history remain available for reviewing records. The camera snapshot examples are illustrative and are not stored in Supabase.

The System status tab reports the configured database connection, local image-analysis path, and last successful data refresh. It does not indicate a live camera connection. In demo mode, the database status explicitly says it is displaying demo records.

In Detection history, **Export CSV** downloads every record matching the current search and filters (not only the visible page). In database mode, matching records are loaded from Supabase in pages before export. Demo records can also be exported.

## Shared database setup (Supabase)

1. One teammate creates a Supabase project and invites the rest of the group through the Supabase project access controls.
2. In the Supabase SQL Editor, run the migrations in timestamp order: [`202610180001_create_detections.sql`](supabase/migrations/202610180001_create_detections.sql), then [`202611060001_require_authenticated_detections.sql`](supabase/migrations/202611060001_require_authenticated_detections.sql). The first creates the table and indexes; the second restricts reads to signed-in users. Both leave database writes disabled from the browser.
3. In **Project Settings → API**, copy the project URL and the public anon/publishable key.
4. Copy `.env.example` to `.env.local` and fill in the two values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

5. Optional: in the SQL Editor, run [`supabase/seed.sql`](supabase/seed.sql) to add seven clearly labeled fictional presentation records. The seed can be rerun safely and skips rows already inserted by ID.
6. In **Authentication → Sign In / Providers**, enable Email. In **Authentication → Users**, create or invite an account for each teammate. Teammates sign in with those credentials in WildWatch; account creation is managed from Supabase rather than the public app.
7. Restart `npm run dev`. The app requires sign-in in **DATABASE** mode. In **DEMO DATA** mode (when Supabase environment values are blank), the fictional preview remains open without an account. Add approved detection records using the Supabase Table Editor. Seed rows are fictional; keep them clearly labeled or omit the seed for a production database.

The table uses UTC `timestamptz`, nullable animal class, confidence, location, warning details, image reference, notes, and status. Confidence must be between 0 and 1. Authenticated users have read-only access; anonymous users cannot read the table. For the future detection pipeline, send records through a trusted server or Supabase Edge Function. Keep any service-role key server-side; never expose it in this frontend. The dashboard does not upload or store image files.

## Publish with AWS Amplify and GitHub

Amplify Hosting serves the Vite frontend from the group's GitHub repository. The checked-in [`amplify.yml`](amplify.yml) builds `dist`; Amplify rebuilds the site when changes reach the connected branch.

1. In AWS Amplify, choose **Deploy an app → GitHub**, then connect `WarriorCats806/CSE4316-Wildwatch` and the `main` branch. Authorize the AWS Amplify GitHub App for this repository only.
2. Keep the detected build settings (`npm ci`, `npm run build`, output directory `dist`).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the Amplify app's environment variables and redeploy. These are public browser settings; never put a Supabase service-role key in the frontend.
4. After Amplify creates the HTTPS domain, add it to Supabase **Authentication → URL Configuration** as the Site URL and an allowed redirect URL. Use **Authentication → Users** to invite the team.
5. Share the Amplify app with teammates who need deploy access. GitHub branches can provide separate preview deployments.

The hosted site is the dashboard only. NanoDetector still runs on a team member's computer; each person who wants AI image/video analysis must start the local Python service. To allow the hosted page to call that local service, set `WILDLIFE_ALLOWED_ORIGINS` in its `.env` to the exact Amplify HTTPS domain. The model API and Raspberry Pi hardware are not deployed by Amplify.

Amplify charges for usage outside the applicable free tier (including build minutes, stored assets, and data transfer). Check the account's current Free Tier and billing before leaving the app deployed. The repository's origin is `https://github.com/WarriorCats806/CSE4316-Wildwatch.git`.

## Project structure

- `src/ui/` — dashboard, responsive styling, history filters, and record detail view
- `src/backend.ts` — demo/data-source switch and Supabase queries
- `src/auth.ts` — Supabase email/password session and token refresh
- `src/ui/Login.tsx` — team sign-in screen
- `src/simulator.ts` — risk and scenario domain helpers retained for future integration
- `src/export.ts` — filtered CSV report formatting and download
- `src/ui/DemoFeatures.tsx` — static product preview, virtual light, camera mock, and analytics
- `src/ui/AIAnalysis.tsx` — local image upload and NanoDetector results view
- `ai-service/app.py` — model adapter and local Python inference API
- `amplify.yml` — AWS Amplify Hosting build settings
- `src/ui/SystemStatus.tsx` — database and preview pipeline status tab
- `src/types.ts` — detection schema, validation, and demo filtering
- `src/data.ts` — clearly labeled local fictional sample records
- `supabase/migrations/` — database schema and read policy

## Data and behavior notes

- History search, date range, animal, warning, and confidence filters are applied to the selected data source; database mode filters in Supabase and paginates newest-first.
- Summary, recent records, and the seven-day chart are calculated from returned records. No counts are presented as live telemetry.
- Missing values display as “Not available.” No GPS, species claims beyond the stored class, video, map, or hardware integration is assumed.
- This iteration does not add record creation to the browser. This avoids allowing anonymous public writes; a future ingestion service should validate and insert records on the server.
