CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_internal_ref_uniq
  ON public.wallet_transactions ((metadata->>'internal_ref'))
  WHERE metadata->>'internal_ref' IS NOT NULL;

-- Adapted to the live wallet_transactions schema (gross/fee/net instead of amount).
-- Idempotency: insert first (unique internal_ref), credit balance only if the insert happened.
CREATE OR REPLACE FUNCTION public.record_wallet_income(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_internal_ref text DEFAULT NULL,
  p_wallet_id uuid DEFAULT NULL,
  p_type text DEFAULT 'income',
  p_gross_amount numeric DEFAULT NULL,
  p_fee_amount numeric DEFAULT 0,
  p_currency text DEFAULT 'KZT',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid := p_wallet_id;
  v_tx_id uuid;
  v_balance numeric;
BEGIN
  IF p_amount IS NULL OR p_amount < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id FROM public.user_wallets
    WHERE user_id = p_user_id AND currency = COALESCE(p_currency, 'KZT')
    ORDER BY created_at LIMIT 1;
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.user_wallets (user_id, balance, currency)
      VALUES (p_user_id, 0, COALESCE(p_currency, 'KZT'))
      RETURNING id INTO v_wallet_id;
    END IF;
  END IF;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, status, gross_amount, fee_amount, net_amount,
    currency, description, related_entity_type, related_entity_id, metadata, completed_at
  ) VALUES (
    v_wallet_id, p_user_id, COALESCE(p_type, 'income'), 'completed',
    COALESCE(p_gross_amount, p_amount), COALESCE(p_fee_amount, 0), p_amount,
    COALESCE(p_currency, 'KZT'), p_description, p_related_entity_type, p_related_entity_id,
    COALESCE(p_metadata, '{}'::jsonb)
      || CASE WHEN p_internal_ref IS NULL THEN '{}'::jsonb
              ELSE jsonb_build_object('internal_ref', p_internal_ref) END,
    now()
  )
  ON CONFLICT ((metadata->>'internal_ref')) WHERE metadata->>'internal_ref' IS NOT NULL DO NOTHING
  RETURNING id INTO v_tx_id;

  IF v_tx_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'duplicate', true, 'message', 'Transaction already processed');
  END IF;

  UPDATE public.user_wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_balance;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'wallet_id', v_wallet_id, 'new_balance', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.record_wallet_income(uuid, numeric, text, text, uuid, text, uuid, text, numeric, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_wallet_income(uuid, numeric, text, text, uuid, text, uuid, text, numeric, numeric, text, jsonb) TO service_role;