-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users primary key,
  email text not null,
  balance integer not null default 100,
  role text not null default 'user' check (role in ('user', 'modo'))
);

-- Markets
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.users(id),
  end_date timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  result text check (result in ('yes', 'no')),
  created_at timestamptz default now()
);

-- Bets
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  market_id uuid references public.markets(id),
  side text not null check (side in ('yes', 'no')),
  amount integer not null check (amount > 0),
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.markets enable row level security;
alter table public.bets enable row level security;

-- Users: anyone authenticated can read; only owner can update their own row
create policy "Users are viewable by authenticated users"
  on public.users for select to authenticated using (true);

create policy "Users can update own profile"
  on public.users for update to authenticated using (auth.uid() = id);

-- Markets: authenticated users can read and insert; no direct update/delete from client
create policy "Markets are viewable by authenticated users"
  on public.markets for select to authenticated using (true);

create policy "Authenticated users can create markets"
  on public.markets for insert to authenticated with check (auth.uid() = created_by);

-- Bets: authenticated users can read all bets; can only insert their own
create policy "Bets are viewable by authenticated users"
  on public.bets for select to authenticated using (true);

create policy "Authenticated users can place bets"
  on public.bets for insert to authenticated with check (auth.uid() = user_id);

create policy "Moderators can delete bets"
  on public.bets for delete to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'modo'
    )
  );

-- Enable Realtime for bets table
alter publication supabase_realtime add table public.bets;

-- Promote a user to moderator (run manually):
-- update public.users set role = 'modo' where email = 'your@email.com';
