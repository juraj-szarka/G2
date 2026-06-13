alter table public.manual_workouts
  add column if not exists icon_name text not null default 'Dumbbell',
  add column if not exists color text not null default '#059669';
