-- Update wallet_transactions to the new Q2 schema (gross/fee/net)
-- This ensures consistency between Edge Functions and Frontend Services

DO $$ 
BEGIN
    -- 1. Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'gross_amount') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN gross_amount numeric(15, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'fee_amount') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN fee_amount numeric(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'net_amount') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN net_amount numeric(15, 2);
    END IF;

    -- 2. Migrate data from old 'amount' column to 'gross_amount' and 'net_amount' if 'amount' exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'amount') THEN
        UPDATE public.wallet_transactions 
        SET gross_amount = amount, 
            net_amount = amount 
        WHERE gross_amount IS NULL;
        
        -- We keep 'amount' for backward compatibility for now, or drop it later
    END IF;

    -- 3. Update Check Constraint for 'type'
    -- Note: Drop and recreate is safer for check constraints
    ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
    ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
        CHECK (type IN ('deposit', 'withdrawal', 'fee', 'refund', 'payment', 'income'));

    -- 4. Ensure wallet_id has a non-unique index for performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wallet_transactions_wallet_id') THEN
        CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
    END IF;

END $$;
