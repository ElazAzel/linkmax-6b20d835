import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resolvePageGrowthLink } from '@/services/viral-growth';
import { rememberGrowthReferralCode } from '@/lib/growth/visitor';

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true });
      return;
    }
    rememberGrowthReferralCode(code);
    void resolvePageGrowthLink(code).then((link) => {
      if (!link) {
        navigate('/', { replace: true });
        return;
      }
      const target = new URL(`/${link.slug}`, window.location.origin);
      target.searchParams.set('ref', link.code);
      navigate(`${target.pathname}${target.search}`, { replace: true });
    });
  }, [code, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Открываем страницу…</p>
    </main>
  );
}
