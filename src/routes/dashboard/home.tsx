import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/DashboardV2";
import i18n from '@/i18n/config';

export const Route = createFileRoute("/dashboard/home")({
  ssr: false,
  head: () => ({ meta: [
    { title: `${i18n.t('dashboard.home.title')} · LinkMAX` },
    { name: 'description', content: i18n.t('dashboard.home.subtitle') },
    { property: 'og:title', content: `${i18n.t('dashboard.home.title')} · LinkMAX` },
    { property: 'og:description', content: i18n.t('dashboard.home.subtitle') },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Dashboard,
});
