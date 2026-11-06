-- OPTIONAL presentation data for the WildWatch dashboard.
-- Every row below is fictional and must not be treated as a real detection.
-- Safe to re-run: fixed IDs are skipped if they already exist.
insert into public.detections (
  id, detected_at, animal_class, confidence, location_label,
  warning_triggered, warning_triggered_at, image_url, notes, status
) values
  ('10000000-0000-4000-8000-000000000001', now() - interval '24 minutes', 'White-tailed deer', 0.940, 'North approach', true, now() - interval '23 minutes', null, 'DEMO ONLY — fictional sample data', 'reviewed'),
  ('10000000-0000-4000-8000-000000000002', now() - interval '1 hour 42 minutes', 'Coyote', 0.870, 'Creek underpass', false, null, null, 'DEMO ONLY — fictional sample data', 'new'),
  ('10000000-0000-4000-8000-000000000003', now() - interval '5 hours', 'White-tailed deer', 0.910, 'South approach', true, now() - interval '4 hours 59 minutes', null, 'DEMO ONLY — fictional sample data', 'reviewed'),
  ('10000000-0000-4000-8000-000000000004', now() - interval '15 hours', 'Raccoon', 0.780, null, false, null, null, 'DEMO ONLY — fictional sample data', 'new'),
  ('10000000-0000-4000-8000-000000000005', now() - interval '28 hours', null, null, 'North approach', null, null, null, 'DEMO ONLY — unclassified fictional sample detection', 'needs review'),
  ('10000000-0000-4000-8000-000000000006', now() - interval '46 hours', 'White-tailed deer', 0.960, 'Creek underpass', true, now() - interval '45 hours 54 minutes', null, 'DEMO ONLY — fictional sample data', 'reviewed'),
  ('10000000-0000-4000-8000-000000000007', now() - interval '73 hours', 'Fox', 0.720, 'East fence', false, null, null, 'DEMO ONLY — fictional sample data', 'new')
on conflict (id) do nothing;
