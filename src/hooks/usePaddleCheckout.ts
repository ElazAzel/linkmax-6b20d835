import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/hooks/user/useAuth";
import { toast } from "sonner";

export interface OpenCheckoutOptions {
  priceId: "pro_monthly" | "pro_yearly";
  successUrl?: string;
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

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
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
