-- ============================================================
-- 010_lms.sql — Learning Management System
-- Runs when: lms feature enabled (opt-in)
-- Tables: courses, course_modules, course_lessons,
--         enrollments, lesson_completions
-- ============================================================

-- ─── Courses ─────────────────────────────────────────────────
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  title         jsonb not null default '{"en":"","af":""}'::jsonb,
  slug          text not null unique,
  description   jsonb,
  price_cents   int not null default 0,
  difficulty    text not null default 'beginner'
                check (difficulty in ('beginner', 'intermediate', 'advanced')),
  image_url     text,
  is_published  boolean not null default false,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "courses: public read published"
  on public.courses for select
  to anon, authenticated
  using (
    (is_published = true and deleted_at is null)
    or public.is_admin()
  );

create policy "courses: admin write"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_courses_slug on public.courses (slug);
create index if not exists idx_courses_published
  on public.courses (created_at desc)
  where is_published = true and deleted_at is null;

-- ─── Course Modules ──────────────────────────────────────────
create table if not exists public.course_modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        jsonb not null default '{"en":"","af":""}'::jsonb,
  display_order int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.course_modules enable row level security;

create policy "course_modules: public read"
  on public.course_modules for select
  to anon, authenticated
  using (true);

create policy "course_modules: admin write"
  on public.course_modules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_course_modules_course
  on public.course_modules (course_id, display_order);

-- ─── Course Lessons ──────────────────────────────────────────
create table if not exists public.course_lessons (
  id              uuid primary key default gen_random_uuid(),
  module_id       uuid not null references public.course_modules(id) on delete cascade,
  title           jsonb not null default '{"en":"","af":""}'::jsonb,
  type            text not null default 'text'
                  check (type in ('text', 'video', 'quiz', 'assignment')),
  content         jsonb,
  duration_minutes int,
  is_preview      boolean not null default false,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.course_lessons enable row level security;

-- Public can read preview lessons; enrolled users read all (handled in app)
create policy "course_lessons: public read previews"
  on public.course_lessons for select
  to anon, authenticated
  using (is_preview = true or public.is_admin());

-- Enrolled users read all lessons (checked at app level via service role)
-- This allows authenticated users to read if they pass app-level checks
create policy "course_lessons: authenticated read"
  on public.course_lessons for select
  to authenticated
  using (true);

create policy "course_lessons: admin write"
  on public.course_lessons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_course_lessons_module
  on public.course_lessons (module_id, display_order);

-- ─── Enrollments ─────────────────────────────────────────────
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  progress     int not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "enrollments: users read own"
  on public.enrollments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "enrollments: users insert own"
  on public.enrollments for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "enrollments: users update own"
  on public.enrollments for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "enrollments: admin delete"
  on public.enrollments for delete
  to authenticated
  using (public.is_admin());

create index if not exists idx_enrollments_user on public.enrollments (user_id);
create index if not exists idx_enrollments_course on public.enrollments (course_id);

-- ─── Lesson Completions ──────────────────────────────────────
create table if not exists public.lesson_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  lesson_id    uuid not null references public.course_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_completions enable row level security;

create policy "lesson_completions: users read own"
  on public.lesson_completions for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "lesson_completions: users insert own"
  on public.lesson_completions for insert
  to authenticated
  with check (user_id = auth.uid());

create index if not exists idx_lesson_completions_user
  on public.lesson_completions (user_id, lesson_id);

-- Triggers
create trigger set_updated_at before update on public.courses
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.course_modules
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.course_lessons
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.enrollments
  for each row execute function public.handle_updated_at();
