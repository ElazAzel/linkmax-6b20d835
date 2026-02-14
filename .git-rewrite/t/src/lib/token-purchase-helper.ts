/**
 * Token purchase helper - handles token-based purchases and WhatsApp redirect for insufficient balance
 */
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';

// WhatsApp number for purchasing tokens
const WHATSAPP_NUMBER = '+77001234567'; // Replace with actual number

/**
 * Check if user has sufficient token balance
 */
export async function checkTokenBalance(userId: string, requiredAmount: number): Promise<{ 
  hasBalance: boolean; 
  currentBalance: number;
}> {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { hasBalance: false, currentBalance: 0 };
  }

  return {
    hasBalance: data.balance >= requiredAmount,
    currentBalance: data.balance,
  };
}

/**
 * Redirect to WhatsApp to purchase tokens
 */
export function redirectToTokenPurchase(tokenAmount: number, itemName?: string): void {
  const message = encodeURIComponent(
    `Здравствуйте! Хочу купить ${tokenAmount} Linkkon токенов${itemName ? ` для покупки "${itemName}"` : ''}. Как можно оплатить?`
  );
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Attempt token purchase with automatic WhatsApp redirect if insufficient balance
 */
export async function attemptTokenPurchase(
  userId: string | undefined,
  requiredTokens: number,
  itemName?: string,
  onPurchaseConfirmed?: () => Promise<boolean>
): Promise<{ success: boolean; redirected: boolean }> {
  if (!userId) {
    toast.error('Необходима авторизация');
    return { success: false, redirected: false };
  }

  // Check balance
  const { hasBalance, currentBalance } = await checkTokenBalance(userId, requiredTokens);

  if (!hasBalance) {
    const deficit = requiredTokens - currentBalance;
    toast.info(`Недостаточно токенов. Нужно еще ${deficit.toFixed(2)} Linkkon.`);
    
    // Redirect to WhatsApp
    redirectToTokenPurchase(deficit, itemName);
    return { success: false, redirected: true };
  }

  // Process purchase if callback provided
  if (onPurchaseConfirmed) {
    const purchaseSuccess = await onPurchaseConfirmed();
    return { success: purchaseSuccess, redirected: false };
  }

  return { success: true, redirected: false };
}

/**
 * Format token price display
 */
export function formatTokenPrice(tokens: number): string {
  return `${tokens.toFixed(2)} Linkkon`;
}
