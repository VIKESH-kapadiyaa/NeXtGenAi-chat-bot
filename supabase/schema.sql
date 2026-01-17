-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create 'next_auth' schema for NextAuth adapter
create schema if not exists next_auth;

-- 1. NEXTAUTH TABLES (in next_auth schema) --

create table if not exists next_auth.users (
  id uuid not null default uuid_generate_v4() primary key,
  name text,
  email text unique,
  "emailVerified" timestamp with time zone,
  image text
);

create table if not exists next_auth.accounts (
  id uuid not null default uuid_generate_v4() primary key,
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  
  unique(provider, "providerAccountId")
);

create table if not exists next_auth.sessions (
  id uuid not null default uuid_generate_v4() primary key,
  "sessionToken" text not null unique,
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  expires timestamp with time zone not null
);

create table if not exists next_auth.verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamp with time zone not null,
  
  unique(identifier, token)
);

-- 2. APP TABLES (in public schema for application data) --

create table if not exists public.chats (
  id uuid not null default uuid_generate_v4() primary key,
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  title text not null,
  "createdAt" timestamp with time zone default now()
);

create table if not exists public.messages (
  id uuid not null default uuid_generate_v4() primary key,
  "chatId" uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  "createdAt" timestamp with time zone default now()
);

-- Enable Row Level Security on next_auth tables
alter table next_auth.users enable row level security;

-- Enable Row Level Security on public tables
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Users can view their own profile" on next_auth.users;
drop policy if exists "Users can update their own profile" on next_auth.users;
drop policy if exists "Users can view their own chats" on public.chats;
drop policy if exists "Users can create their own chats" on public.chats;
drop policy if exists "Users can delete their own chats" on public.chats;
drop policy if exists "Users can view messages in their chats" on public.messages;
drop policy if exists "Users can insert messages in their chats" on public.messages;

-- Policies for USERS (next_auth schema)
create policy "Users can view their own profile"
  on next_auth.users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on next_auth.users for update
  using ( auth.uid() = id );

-- Policies for CHATS (public schema)
create policy "Users can view their own chats"
  on public.chats for select
  using ( auth.uid() = "userId" );

create policy "Users can create their own chats"
  on public.chats for insert
  with check ( auth.uid() = "userId" );

create policy "Users can delete their own chats"
  on public.chats for delete
  using ( auth.uid() = "userId" );

-- Policies for MESSAGES (public schema)
create policy "Users can view messages in their chats"
  on public.messages for select
  using ( exists (
    select 1 from public.chats
    where public.chats.id = public.messages."chatId"
    and public.chats."userId" = auth.uid()
  ));

create policy "Users can insert messages in their chats"
  on public.messages for insert
  with check ( exists (
    select 1 from public.chats
    where public.chats.id = public.messages."chatId"
    and public.chats."userId" = auth.uid()
  ));

-- Grant access to service role for NextAuth adapter
grant usage on schema next_auth to service_role;
grant all on all tables in schema next_auth to service_role;
