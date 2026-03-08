import { lazy } from 'react';

const PublicServicePage = lazy(() => import('@/components/screens/PublicServicePage'));
export default function ServicePage() {
  return <PublicServicePage />;
}
