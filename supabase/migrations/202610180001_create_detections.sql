-- WildWatch detection records. Timestamps are stored as timestamptz (UTC).
create table if not exists public.detections (
  id uuid primary key default gen_random_uuid(),
  detected_at timestamptz not null,
  animal_class text,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  location_label text,
  warning_triggered boolean,
  warning_triggered_at timestamptz,
  image_url text,
  notes text,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists detections_detected_at_desc_idx
  on public.detections (detected_at desc);
create index if not exists detections_animal_class_idx
  on public.detections (animal_class);
create index if not exists detections_warning_triggered_idx
  on public.detections (warning_triggered);

alter table public.detections enable row level security;

-- Only signed-in team members can read records. Add ingestion through a trusted server
-- or Edge Function using a server-side secret; never ship a service-role key to Vite.
drop policy if exists "Public can read detections" on public.detections;
create policy "Authenticated users can read detections"
  on public.detections for select
  to authenticated
  using (true);

revoke select on public.detections from anon;
grant select on public.detections to authenticated;
