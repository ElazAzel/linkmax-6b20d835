import { Link } from '@/lib/router-compat';
import type { PublicService } from '@/lib/seo/service-page';

export default function PublicServicePage({ page }: { page: PublicService }) {
  const { service, slug, displayName } = page;
  return <div className="min-h-screen bg-background">
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Навигация" className="text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:underline">LinkMAX</Link>{' › '}
        <Link to={`/${slug}`} className="hover:underline">{displayName}</Link>{' › '}
        <span>{service.name}</span>
      </nav>
      <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
      <p className="text-muted-foreground mb-4">Услуга от <Link to={`/${slug}`} className="text-primary hover:underline">{displayName}</Link></p>
      {service.description && <p className="text-foreground mb-6">{service.description}</p>}
      {service.price != null && service.price > 0 && <p className="text-2xl font-bold text-primary mb-6">{service.price} {service.currency}</p>}
      <Link to={`/${slug}`} className="text-primary hover:underline">← Все услуги и запись</Link>
    </main>
  </div>;
}
