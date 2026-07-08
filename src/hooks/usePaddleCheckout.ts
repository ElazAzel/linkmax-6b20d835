import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/hooks/user/useAuth";
import { toast } from "sonner";
import { normalizeBillingPromoCode } from "@/domain/billing/recovery";

export interface OpenCheckoutOptions {
  priceId: "pro_monthly" | "pro_yearly";
  successUrl?: string;
  discountCode?: string | null;
}

export function usePaddleCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: OpenCheckoutOptions) => {
    if (!user) {
      toast.error("Войдите, чтобы оформить подписку");
      return;
    }
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);
      const discountCode = normalizeBillingPromoCode(options.discountCode);

      if (options.discountCode && !discountCode) {
        toast.error("Invalid promo code format");
        return;
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        ...(discountCode ? { discountCode } : {}),
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          userId: user.id,
          ...(discountCode ? { promoCode: discountCode } : {}),
        },
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/dashboard?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      console.error("Paddle checkout error:", e);
      toast.error("Не удалось открыть оплату");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
