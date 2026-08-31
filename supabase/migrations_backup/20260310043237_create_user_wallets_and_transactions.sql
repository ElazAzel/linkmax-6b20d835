-- Create user_wallets table
create table if not exists public.user_wallets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    balance numeric(10, 2) default 0.00 not null,
    currency text default 'KZT' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, currency)
);

-- Create wallet_transactions table
create table if not exists public.wallet_transactions (
    id uuid default gen_random_uuid() primary key,
    wallet_id uuid references public.user_wallets(id) on delete cascade not null,
    type text not null check (type in ('deposit', 'withdrawal', 'fee', 'refund', 'payment')),
    status text not null check (status in ('pending', 'completed', 'failed', 'cancelled')),
    gross_amount numeric(10, 2) not null,
    fee_amount numeric(10, 2) default 0.00 not null,
    net_amount numeric(10, 2) not null,
    currency text default 'KZT' not null,
    description text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

-- Enable RLS
alter table public.user_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

-- Policies for user_wallets
create policy "Users can view their own wallets" on public.user_wallets
    for select using (auth.uid() = user_id);

-- Policies for wallet_transactions
create policy "Users can view their own transactions" on public.wallet_transactions
    for select using (
        wallet_id in (select id from public.user_wallets where user_id = auth.uid())
    );

-- Trigger for updated_at
create extension if not exists moddatetime schema extensions;

drop trigger if exists handle_updated_at on public.user_wallets;
create trigger handle_updated_at before update on public.user_wallets
    for each row execute procedure moddatetime (updated_at);
