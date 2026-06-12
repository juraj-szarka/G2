alter table public.daily_logs
  add column if not exists manual_workout_points numeric(8,2) not null default 0
  check (manual_workout_points >= 0);

create or replace function public.score_daily_log()
returns trigger
language plpgsql
as $$
declare
  workout_ratio numeric;
  sleep_ratio numeric;
  calorie_score numeric;
  protein_score numeric;
  carbs_score numeric;
  fat_score numeric;
  macro_ratio numeric;
  manual_bonus_ex numeric;
  manual_bonus_health numeric;
begin
  workout_ratio := least(new.workout_minutes / new.workout_target_minutes, 1);
  sleep_ratio := least(new.sleep_minutes / new.sleep_target_minutes, 1);
  calorie_score := greatest(0, 1 - abs(new.calories - new.target_calories) / new.target_calories);
  protein_score := least(new.protein / new.target_protein, 1);
  carbs_score := least(new.carbs / new.target_carbs, 1);
  fat_score := least(new.fat / new.target_fat, 1);
  macro_ratio := (calorie_score + protein_score + carbs_score + fat_score) / 4;

  manual_bonus_ex := least(new.manual_workout_points, 20);
  manual_bonus_health := least(new.manual_workout_points / 2, 10);

  new.exercise_score := least(round(workout_ratio * 100 + manual_bonus_ex), 100)::integer;
  new.health_score := least(round((workout_ratio * 40) + (sleep_ratio * 40) + (macro_ratio * 20) + manual_bonus_health), 100)::integer;

  return new;
end;
$$;

create or replace function public.sync_manual_workout_points(p_user_id uuid, p_log_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points numeric;
begin
  select coalesce(sum(m.current_count * m.score_per_unit), 0)
  into v_points
  from public.manual_workouts m
  where m.user_id = p_user_id and m.log_date = p_log_date;

  insert into public.daily_logs (user_id, log_date, manual_workout_points)
  values (p_user_id, p_log_date, v_points)
  on conflict (user_id, log_date)
  do update set manual_workout_points = excluded.manual_workout_points;
end;
$$;
