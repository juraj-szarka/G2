alter table public.profiles
  add column if not exists workout_points_goal integer not null default 10
  check (workout_points_goal > 0);
