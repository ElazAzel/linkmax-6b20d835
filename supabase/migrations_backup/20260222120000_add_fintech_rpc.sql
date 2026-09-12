-- RPC function to record wallet income safely
CREATE OR REPLACE FUNCTION public.record_wallet_income(
  p_user_id UUID,
  p_amount DECIMAL(15, 2),
  p_description TEXT,
  p_related_entity_type VARCHAR(50) DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_internal_ref VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update wallets
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_tx_id UUID;
BEGIN
  -- 1. Check if this internal_ref was already processed to prevent double-crediting
  IF p_internal_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.wallet_transactions 
    WHERE metadata->>'internal_ref' = p_internal_ref AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction already processed');
  END IF;

  -- 2. Get the wallet ID
  SELECT id INTO v_wallet_id FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    -- Fallback: create wallet if missing (should not happen due to triggers)
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- 3. Update wallet balance
  UPDATE public.user_wallets
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  -- 4. Record the transaction
  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    status,
    description,
    related_entity_type,
    related_entity_id,
    metadata
  )
  VALUES (
    v_wallet_id,
    p_user_id,
    p_amount,
    'income',
    'completed',
    p_description,
    p_related_entity_type,
    p_related_entity_id,
    jsonb_build_object('internal_ref', p_internal_ref, 'confirmed_at', NOW())
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id, 
    'new_balance', (SELECT balance FROM public.user_wallets WHERE id = v_wallet_id)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to authenticated users to call this (logic inside checks user_id)
-- However, for security, usually only SERVICE ROLE should call this from Edge Functions
-- But since it's SECURITY DEFINER, we should be careful.
REVOKE ALL ON FUNCTION public.record_wallet_income FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_wallet_income TO service_role;
