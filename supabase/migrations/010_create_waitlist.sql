-- Create waitlist table for landing page email signups
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  locale text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Policy: Anyone can insert (signup)
create policy "Anyone can sign up for waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Policy: Only admins can read waitlist
create policy "Only admins can read waitlist"
  on public.waitlist
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Index for faster email lookups
create index if not exists waitlist_email_idx on public.waitlist(email);

-- Index for created_at for sorting
create index if not exists waitlist_created_at_idx on public.waitlist(created_at desc);
