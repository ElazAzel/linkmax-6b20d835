import { useTranslation } from "react-i18next";
import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  const { t } = useTranslation();
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      {t("payment.test_mode_banner", "Все платежи в превью идут в тестовом режиме.")}{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        {t("payment.more_details", "Подробнее")}
      </a>
    </div>
  );
}
