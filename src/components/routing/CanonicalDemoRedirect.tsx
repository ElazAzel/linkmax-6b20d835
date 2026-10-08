import { Navigate, useLocation } from '@/lib/router-compat';

export function CanonicalDemoRedirect() {
  const { search } = useLocation();

  return <Navigate to={`/demo-nails${search}`} replace />;
}
