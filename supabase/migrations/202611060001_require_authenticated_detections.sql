-- Require a Supabase Auth session to read shared detection records.
alter table public.detections enable row level security;

drop policy if exists "Public can read detections" on public.detections;
drop policy if exists "Authenticated users can read detections" on public.detections;
create policy "Authenticated users can read detections"
  on public.detections for select
  to authenticated
  using (true);

revoke select on public.detections from anon;
grant select on public.detections to authenticated;
