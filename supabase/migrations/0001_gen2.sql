create extension if not exists pgcrypto;

do $$
begin
  create type public.friendship_status as enum ('pending', 'accepted', 'blocked');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Gen2 athlete',
  handle text unique,
  avatar_url text,
  bio text,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  share_metrics boolean not null default true,
  target_workout_minutes integer not null default 45 check (target_workout_minutes > 0),
  target_sleep_minutes integer not null default 480 check (target_sleep_minutes > 0),
  target_calories integer not null default 2200 check (target_calories > 0),
  target_protein integer not null default 150 check (target_protein > 0),
  target_carbs integer not null default 220 check (target_carbs > 0),
  target_fat integer not null default 70 check (target_fat > 0),
  current_health_score integer not null default 0 check (current_health_score between 0 and 100),
  current_exercise_score integer not null default 0 check (current_exercise_score between 0 and 100),
  streak_days integer not null default 0 check (streak_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair_idx
  on public.friendships (
    (case when requester_id < addressee_id then requester_id else addressee_id end),
    (case when requester_id < addressee_id then addressee_id else requester_id end)
  );

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  workout_minutes numeric(8, 2) not null default 0 check (workout_minutes >= 0),
  workout_target_minutes numeric(8, 2) not null default 45 check (workout_target_minutes > 0),
  sleep_minutes numeric(8, 2) not null default 0 check (sleep_minutes >= 0),
  sleep_target_minutes numeric(8, 2) not null default 480 check (sleep_target_minutes > 0),
  sleep_quality numeric(4, 2) check (sleep_quality is null or sleep_quality between 0 and 1),
  calories numeric(8, 2) not null default 0 check (calories >= 0),
  protein numeric(8, 2) not null default 0 check (protein >= 0),
  carbs numeric(8, 2) not null default 0 check (carbs >= 0),
  fat numeric(8, 2) not null default 0 check (fat >= 0),
  target_calories numeric(8, 2) not null default 2200 check (target_calories > 0),
  target_protein numeric(8, 2) not null default 150 check (target_protein > 0),
  target_carbs numeric(8, 2) not null default 220 check (target_carbs > 0),
  target_fat numeric(8, 2) not null default 70 check (target_fat > 0),
  health_score integer not null default 0 check (health_score between 0 and 100),
  exercise_score integer not null default 0 check (exercise_score between 0 and 100),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.manual_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  name text not null default 'Push-ups',
  unit text not null default 'reps',
  target_count integer not null default 200 check (target_count > 0),
  increment_step integer not null default 10 check (increment_step > 0),
  current_count integer not null default 0 check (current_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, name)
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  meal_name text,
  image_path text,
  calories numeric(8, 2) not null check (calories >= 0),
  protein numeric(8, 2) not null check (protein >= 0),
  carbs numeric(8, 2) not null check (carbs >= 0),
  fat numeric(8, 2) not null check (fat >= 0),
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_logs enable row level security;
alter table public.manual_workouts enable row level security;
alter table public.nutrition_logs enable row level security;

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = user_a and f.addressee_id = user_b)
        or
        (f.requester_id = user_b and f.addressee_id = user_a)
      )
  );
$$;

create policy "Profiles are visible to owners and accepted friends"
on public.profiles
for select
using (
  id = auth.uid()
  or (share_metrics = true and public.are_friends(auth.uid(), id))
);

create policy "Users can update their own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (id = auth.uid());

create policy "Friendship participants can read requests"
on public.friendships
for select
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users can request friendships"
on public.friendships
for insert
with check (requester_id = auth.uid() and status = 'pending');

create policy "Addressees can accept or block pending requests"
on public.friendships
for update
using (addressee_id = auth.uid() and status = 'pending')
with check (addressee_id = auth.uid() and status in ('accepted', 'blocked'));

create policy "Participants can delete friendships"
on public.friendships
for delete
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users can read their daily logs"
on public.daily_logs
for select
using (user_id = auth.uid());

create policy "Users can insert their daily logs"
on public.daily_logs
for insert
with check (user_id = auth.uid());

create policy "Users can update their daily logs"
on public.daily_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their daily logs"
on public.daily_logs
for delete
using (user_id = auth.uid());

create policy "Users can read their manual workouts"
on public.manual_workouts
for select
using (user_id = auth.uid());

create policy "Users can insert their manual workouts"
on public.manual_workouts
for insert
with check (user_id = auth.uid());

create policy "Users can update their manual workouts"
on public.manual_workouts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their manual workouts"
on public.manual_workouts
for delete
using (user_id = auth.uid());

create policy "Users can read their nutrition logs"
on public.nutrition_logs
for select
using (user_id = auth.uid());

create policy "Users can insert their nutrition logs"
on public.nutrition_logs
for insert
with check (user_id = auth.uid());

create policy "Users can update their nutrition logs"
on public.nutrition_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their nutrition logs"
on public.nutrition_logs
for delete
using (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger touch_friendships_updated_at
before update on public.friendships
for each row execute function public.touch_updated_at();

create trigger touch_daily_logs_updated_at
before update on public.daily_logs
for each row execute function public.touch_updated_at();

create trigger touch_manual_workouts_updated_at
before update on public.manual_workouts
for each row execute function public.touch_updated_at();

create trigger touch_nutrition_logs_updated_at
before update on public.nutrition_logs
for each row execute function public.touch_updated_at();

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
begin
  workout_ratio := least(new.workout_minutes / new.workout_target_minutes, 1);
  sleep_ratio := least(new.sleep_minutes / new.sleep_target_minutes, 1);
  calorie_score := greatest(0, 1 - abs(new.calories - new.target_calories) / new.target_calories);
  protein_score := least(new.protein / new.target_protein, 1);
  carbs_score := least(new.carbs / new.target_carbs, 1);
  fat_score := least(new.fat / new.target_fat, 1);
  macro_ratio := (calorie_score + protein_score + carbs_score + fat_score) / 4;

  new.exercise_score := round(workout_ratio * 100)::integer;
  new.health_score := round((workout_ratio * 40) + (sleep_ratio * 40) + (macro_ratio * 20))::integer;

  return new;
end;
$$;

create trigger score_daily_log_before_write
before insert or update on public.daily_logs
for each row execute function public.score_daily_log();

create or replace function public.calculate_current_streak(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  v_date date := current_date;
  v_streak integer := 0;
  v_hit boolean;
begin
  loop
    select exists (
      select 1
      from public.daily_logs
      where user_id = p_user_id
        and log_date = v_date
        and health_score >= 70
    ) into v_hit;

    exit when not v_hit;
    v_streak := v_streak + 1;
    v_date := v_date - 1;
  end loop;

  return v_streak;
end;
$$;

create or replace function public.sync_profile_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles p
  set
    current_health_score = coalesce((
      select health_score
      from public.daily_logs
      where user_id = v_user_id and log_date = current_date
      limit 1
    ), 0),
    current_exercise_score = coalesce((
      select exercise_score
      from public.daily_logs
      where user_id = v_user_id and log_date = current_date
      limit 1
    ), 0),
    streak_days = public.calculate_current_streak(v_user_id),
    updated_at = now()
  where p.id = v_user_id;

  return coalesce(new, old);
end;
$$;

create trigger sync_profile_scores_after_daily_log
after insert or update or delete on public.daily_logs
for each row execute function public.sync_profile_scores();

create or replace function public.recalculate_daily_nutrition(p_user_id uuid, p_log_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile
  from public.profiles
  where id = p_user_id;

  insert into public.daily_logs (
    user_id,
    log_date,
    calories,
    protein,
    carbs,
    fat,
    target_calories,
    target_protein,
    target_carbs,
    target_fat
  )
  select
    p_user_id,
    p_log_date,
    coalesce(sum(calories), 0),
    coalesce(sum(protein), 0),
    coalesce(sum(carbs), 0),
    coalesce(sum(fat), 0),
    coalesce(v_profile.target_calories, 2200),
    coalesce(v_profile.target_protein, 150),
    coalesce(v_profile.target_carbs, 220),
    coalesce(v_profile.target_fat, 70)
  from public.nutrition_logs
  where user_id = p_user_id and log_date = p_log_date
  on conflict (user_id, log_date)
  do update set
    calories = excluded.calories,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    target_calories = excluded.target_calories,
    target_protein = excluded.target_protein,
    target_carbs = excluded.target_carbs,
    target_fat = excluded.target_fat,
    updated_at = now();
end;
$$;

create or replace function public.sync_nutrition_to_daily_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_daily_nutrition(old.user_id, old.log_date);
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.user_id <> new.user_id or old.log_date <> new.log_date) then
    perform public.recalculate_daily_nutrition(old.user_id, old.log_date);
  end if;

  perform public.recalculate_daily_nutrition(new.user_id, new.log_date);
  return new;
end;
$$;

create trigger sync_nutrition_to_daily_log_after_write
after insert or update or delete on public.nutrition_logs
for each row execute function public.sync_nutrition_to_daily_log();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_handle text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    nullif(split_part(new.email, '@', 1), ''),
    'Gen2 athlete'
  );

  v_handle := lower(regexp_replace(v_name, '[^a-zA-Z0-9_]+', '', 'g'));
  if length(v_handle) < 3 then
    v_handle := 'gen2';
  end if;

  v_handle := left(v_handle, 20) || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, display_name, handle)
  values (new.id, v_name, v_handle)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_friendship_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester uuid := auth.uid();
  v_addressee uuid;
  v_existing uuid;
begin
  if v_requester is null then
    raise exception 'Authentication required';
  end if;

  select id into v_addressee
  from public.profiles
  where upper(invite_code) = upper(trim(p_invite_code));

  if v_addressee is null then
    raise exception 'Invite code not found';
  end if;

  if v_requester = v_addressee then
    raise exception 'You cannot add yourself';
  end if;

  select id into v_existing
  from public.friendships
  where
    (requester_id = v_requester and addressee_id = v_addressee)
    or
    (requester_id = v_addressee and addressee_id = v_requester)
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_requester, v_addressee, 'pending')
  returning id into v_existing;

  return v_existing;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-images',
  'meal-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their meal images"
on storage.objects
for select
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their meal images"
on storage.objects
for insert
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their meal images"
on storage.objects
for update
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their meal images"
on storage.objects
for delete
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

