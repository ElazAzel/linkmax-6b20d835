import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookingDetailDrawer } from '@/components/dashboard-v2/revenue/BookingDetailDrawer';
import { useBookingOperations, useBookingRevenueDetail } from '@/hooks/revenue/useBookingOperations';
import type { OfficeBooking } from '@/domain/office/workspace';
import type { BookingPaymentMethod } from '@/services/booking-lifecycle';

export function OfficeBookingDetail({ booking, onClose }: { booking: OfficeBooking | null; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useBookingRevenueDetail(booking?.id);
  const operations = useBookingOperations({ pageId: booking?.page_id });
  const perform = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      toast.success(t('digitalOffice.updated', 'Запись обновлена'));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'request_failed';
      toast.error(t(`bookingDetail.errors.${code}`, t('digitalOffice.operationFailed', 'Не удалось обновить запись')));
    }
  };
  const base = query.data ? { bookingId: query.data.bookingId, expectedVersion: query.data.version } : null;
  return <BookingDetailDrawer open={Boolean(booking)} onOpenChange={(open) => { if (!open) onClose(); }}
    detail={query.data ?? null} loading={query.isPending} pending={operations.isPending}
    error={query.isError} onRetry={() => { void query.refetch(); }}
    onConfirmDeposit={(amount: string, paymentMethod: BookingPaymentMethod) => {
      if (base) return perform(() => operations.confirmDeposit({ ...base, amount, paymentMethod }));
    }}
    onComplete={(collectedAmount: string, paymentMethod: BookingPaymentMethod) => {
      if (base) return perform(() => operations.complete({ ...base, collectedAmount, paymentMethod }));
    }}
    onWaivePayment={() => { if (base) return perform(() => operations.waivePayment(base)); }}
    onCancel={() => { if (base) return perform(() => operations.cancel(base)); }}
    onNoShow={() => { if (base) return perform(() => operations.noShow(base)); }} />;
}
