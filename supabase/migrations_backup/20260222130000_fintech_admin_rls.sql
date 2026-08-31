-- Add Admin Policies for Fintech Tables
-- This allows users with 'admin' role to view and manage financial data

-- 1. user_wallets: Admins can view all wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
CREATE POLICY "Admins can view all wallets"
  ON public.user_wallets
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. wallet_transactions: Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. payout_requests: Admins can view and update all requests
DROP POLICY IF EXISTS "Admins can manage all payout requests" ON public.payout_requests;
CREATE POLICY "Admins can manage all payout requests"
  ON public.payout_requests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
