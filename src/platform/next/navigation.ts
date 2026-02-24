import { useNavigate, useParams as useRRParams, useLocation, useSearchParams as useRRSearchParams } from 'react-router-dom';
/**
 * next/navigation compatibility shim for Vite
 * Maps Next.js navigation APIs to react-router-dom equivalents
 */


export { useRRParams as useParams };

export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
};

export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

export const useSearchParams = () => {
  const [searchParams] = useRRSearchParams();
  return searchParams;
};
