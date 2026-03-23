import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { resolveServiceBySlug, type ServiceSlugsMap } from '@/lib/seo/service-resolver';

export default function PublicServicePage() {
  const { slug, serviceSlug } = useParams<{ slug: string; serviceSlug: string }>();

  const { data: page } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('pages')
        .select('id, slug, title, niche, city, profession, entity_type, service_slugs')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: pricingItems } = useQuery({
    queryKey: ['pricing-items', page?.id],
    queryFn: async () => {
      if (!page?.id) return [];
      const { data: blocks } = await supabase
        .from('blocks')
        .select('content')
        .eq('page_id', page.id)
        .eq('type', 'pricing');

      const items: Array<Record<string, unknown>> = [];
      for (const block of blocks || []) {
        const content = block.content as Record<string, unknown>;
        if (Array.isArray(content?.items)) {
          for (const item of content.items) {
            items.push(item as Record<string, unknown>);
          }
        }
      }
      return items;
    },
    enabled: !!page?.id,
  });

  const resolution = pricingItems
    ? resolveServiceBySlug(
        page?.service_slugs as unknown as ServiceSlugsMap | null,
        pricingItems,
        serviceSlug || ''
      )
    : null;

  // Loading
  if (!page || pricingItems === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Removed or orphan → redirect to parent
  if (resolution?.notFoundReason === 'removed' || resolution?.notFoundReason === 'item_missing') {
    return <Navigate to={`/${slug}`} replace />;
  }

  // Not found
  if (!resolution?.found) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Link to={`/${slug}`} className="text-primary underline">Back to profile</Link>
      </div>
    );
  }

  const service = resolution.pricingItem!;
  const displayName = page.title || '@' + slug;
  const isThin = resolution.state === 'thin';

  return (
    <>
      <Helmet>
        <title>{service.name} — {displayName} | LinkMAX</title>
        {service.description && <meta name="description" content={service.description.substring(0, 160)} />}
        <link rel="canonical" href={`https://lnkmx.my/${slug}/services/${serviceSlug}`} />
        {isThin && <meta name="robots" content="noindex, follow" />}
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:underline">LinkMAX</Link>
            {' › '}
            <Link to={`/${slug}`} className="hover:underline">{displayName}</Link>
            {' › '}
            <span>{service.name}</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
          <p className="text-muted-foreground mb-4">
            Service by <Link to={`/${slug}`} className="text-primary hover:underline">{displayName}</Link>
          </p>
          {service.description && <p className="text-foreground mb-6">{service.description}</p>}
          {service.price != null && service.price > 0 && (
            <p className="text-2xl font-bold text-primary mb-6">
              {service.price} {service.currency}
            </p>
          )}
          <Link to={`/${slug}`} className="text-primary hover:underline">← All services</Link>
        </div>
      </div>
    </>
  );
}
