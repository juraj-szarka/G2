alter table public.manual_workouts
  add column if not exists score_per_unit numeric(6,3) not null default 0.1
  check (score_per_unit >= 0);
