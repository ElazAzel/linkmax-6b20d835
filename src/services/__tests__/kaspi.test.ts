import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KaspiService } from '../kaspi-service';

describe('KaspiService', () => {
    it('should generate QR link with correct format', async () => {
        const invoiceId = 'INV-123';
        const amount = 5000;
        
        const result = await KaspiService.generateQrLink(invoiceId, amount);
        
        expect(result.success).toBe(true);
        expect(result.qrUrl).toContain('kaspi.kz/pay/link');
        expect(result.qrUrl).toContain('amount=5000');
        expect(result.qrUrl).toContain('invoice_id=INV-123');
    });

    it('should prepare metadata correctly', () => {
        const invoice = { id: 'INV-456', amount: 10000 };
        const metadata = KaspiService.prepareMetadata(invoice);
        
        expect(metadata).toEqual({
            external_id: 'INV-456',
            amount: 10000,
            service_type: 'b2b_payment',
            region: 'KZ'
        });
    });
});
