-- Feedback submitted via the RunOwl website feedback form
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text not null check (type in ('general', 'bug', 'feature')),
  message     text not null check (char_length(message) between 10 and 2000),
  email       text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  page        text,
  user_agent  text
);

-- Enable Row Level Security
alter table public.feedback enable row level security;

-- Anyone can insert (anonymous submissions allowed)
create policy "Anyone can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated service role can read (no public read)
create policy "Service role can read feedback"
  on public.feedback
  for select
  to service_role
  using (true);

-- Index for dashboard queries
create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_type_idx on public.feedback (type);
