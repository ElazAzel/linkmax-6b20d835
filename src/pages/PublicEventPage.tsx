import { lazy } from 'react';

const PublicEventPage = lazy(() => import('@/components/screens/PublicEventPage'));
export default function EventPage() {
  return <PublicEventPage />;
}
