import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { calculateFintechFee } from '../_shared/fintech-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  userId: string;
  amount: number;
  currency?: string;
  source?: string;
  description?: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()

    if (!payload.userId || !payload.amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine user tier to calculate fee
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('is_premium, premium_tier')
      .eq('id', payload.userId)
      .single()

    // Calculate amounts using shared logic
    const { grossAmount, feeAmount, netAmount, rate } = calculateFintechFee({
        amount: Number(payload.amount),
        isPremium: !!profile?.is_premium,
        tier: (profile?.premium_tier as string) || undefined
    });

    // 1. Ensure user has a wallet
    let { data: wallet } = await supabaseClient
      .from('user_wallets')
      .select('id, balance')
      .eq('user_id', payload.userId)
      .eq('currency', payload.currency || 'KZT')
      .maybeSingle()

    if (!wallet) {
      const { data: newWallet, error: walletError } = await supabaseClient
        .from('user_wallets')
        .insert({ user_id: payload.userId, currency: payload.currency || 'KZT', balance: 0 })
        .select()
        .single()

      if (walletError) throw walletError;
      wallet = newWallet;
    }

    // 2. Create the transaction record
    const { data: transaction, error: txError } = await supabaseClient
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'deposit',
        status: 'completed',
        gross_amount: grossAmount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        currency: payload.currency || 'KZT',
        description: payload.description || `Payment via ${payload.source || 'Kaspi'}`,
        metadata: payload.metadata || {},
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (txError) throw txError;

    // 3. Update the wallet balance
    const newBalance = Number(wallet.balance) + netAmount;
    const { error: updateError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        new_balance: newBalance,
        fee_rate: rate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing transaction fee:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
