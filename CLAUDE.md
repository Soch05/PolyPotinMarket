# CLAUDE.md — Student Prediction Market (Polymarket MVP)

## Project Overview

A prediction market platform for students with virtual currency.
Users can create Yes/No questions, bet tokens, and moderators can distribute daily tokens.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database + Auth + Realtime**: Supabase
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Project Structure

```
/app
  /page.tsx                  # Homepage — list of open markets
  /auth
    /login/page.tsx          # Login page
    /register/page.tsx       # Register page (with invite code)
  /markets
    /page.tsx                # All markets list
    /[id]/page.tsx           # Single market — place bets, see probabilities
    /create/page.tsx         # Create a new market
  /dashboard
    /page.tsx                # My bets, my balance
  /admin
    /page.tsx                # Modo panel — distribute tokens, resolve markets
  /api
    /markets/route.ts        # GET all markets, POST create market
    /markets/[id]/route.ts   # GET single market
    /bets/route.ts           # POST place a bet
    /admin/distribute/route.ts  # POST give tokens to all users
    /admin/resolve/route.ts     # POST resolve a market (yes/no winner)

/lib
  /supabase.ts               # Supabase client (browser)
  /supabase-server.ts        # Supabase client (server-side)
  /utils.ts                  # Helpers (probability calc, token math)

/types
  /index.ts                  # TypeScript types for User, Market, Bet
```

---

## Database Schema (Supabase SQL)

```sql
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
```

---

## Core Business Logic

### Probability Calculation
```ts
// Simple linear probability
const probability = (totalYes / (totalYes + totalNo)) * 100
// Default 50/50 when no bets
```

### Bet Resolution (when modo closes a market)
```
Winners = all bets on the correct side
Losers pool = sum of all losing bets
Each winner receives: their_bet + (their_bet / total_winning_bets) * losers_pool
```

### Token Distribution (modo action)
```
Every user receives +10 tokens
Can only be triggered by a user with role = 'modo'
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INVITE_CODE=your_secret_invite_code
```

---

## Auth Flow

1. User goes to `/auth/register`
2. Enters email + password + invite code
3. Invite code is checked against `INVITE_CODE` env var
4. If valid → Supabase creates auth user → insert row in `public.users` with balance=100
5. Redirect to homepage

---

## Key Rules & Constraints

- A user cannot bet more tokens than their current balance
- A user cannot bet on a closed market
- Only `modo` role can resolve markets and distribute tokens
- Probabilities update in realtime via Supabase Realtime subscriptions
- Minimum bet: 1 token

---

## Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

---

## Setup Steps

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema above in the Supabase SQL editor
3. Copy your Supabase keys into `.env.local`
4. Set your `INVITE_CODE` in `.env.local`
5. Run `npm install && npm run dev`
6. Push to GitHub → import on Vercel → add env vars → deploy

---

## To Make a User a Moderator

Run this SQL directly in Supabase:
```sql
update public.users set role = 'modo' where email = 'your@email.com';
```

---

## Out of Scope for MVP

- OAuth (Google, Discord login)
- Advanced market making (AMM)
- Notifications
- Leaderboard
- Mobile app
