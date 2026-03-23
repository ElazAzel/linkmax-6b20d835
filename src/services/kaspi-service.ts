import { logger } from "@/lib/utils/logger";

/**
 * Service to handle Kaspi Pay (KZ) specific payment logic.
 * Part of the Regional Expansion initiative (Phase 6).
 */
export class KaspiService {
    /**
     * Generates a Kaspi Pay/QR link for a specific invoice.
     * This serves as a bridge for the upcoming Kaspi Merchant API integration.
     */
    static async generateQrLink(invoiceId: string, amount: number) {
        try {
            // Future: Call Edge Function 'generate-kaspi-qr'
            logger.debug(`[KaspiService] Requesting QR for Invoice ${invoiceId} (Amount: ${amount} KZT)`);

            // Realistic Kaspi deep link for merchant payments
            const merchantId = "inkmax_merchant"; // Fallback identifier
            const qrUrl = `https://kaspi.kz/pay/link?service_id=${merchantId}&amount=${amount}&invoice_id=${invoiceId}&region=KZ`;

            return {
                success: true,
                qrUrl,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };
        } catch (error) {
            console.error("[KaspiService] Error generating QR:", error);
            return { success: false, error };
        }
    }

    /**
     * Prepares payment metadata specifically for the Kaspi Business ecosystem.
     */
    static prepareMetadata(invoice: { id: string; amount: number }) {
        return {
            external_id: invoice.id,
            amount: invoice.amount,
            service_type: "b2b_payment",
            region: "KZ",
        };
    }
}
