import { Navigate, useLocation } from 'react-router-dom';

export function CanonicalDemoRedirect() {
  const { search } = useLocation();

  return <Navigate to={{ pathname: '/demo-nails', search }} replace />;
}
