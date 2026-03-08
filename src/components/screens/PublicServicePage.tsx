import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

export default function PublicServicePage() {
  const { slug, serviceSlug } = useParams<{ slug: string; serviceSlug: string }>();

  const { data: page } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('pages')
        .select('id, slug, title, niche, city, profession, entity_type')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', slug, serviceSlug],
    queryFn: async () => {
      if (!page?.id) return null;
      const { data: blocks } = await supabase
        .from('blocks')
        .select('content')
        .eq('page_id', page.id)
        .eq('type', 'pricing');

      for (const block of blocks || []) {
        const content = block.content as Record<string, unknown>;
        const items = content?.items;
        if (Array.isArray(items)) {
          for (const item of items) {
            const name = String((item as Record<string, unknown>).name || '');
            const itemSlug = name.toLowerCase().replace(/[^a-zа-яёәіңғүұқөһ0-9]+/gi, '-').replace(/^-|-$/g, '').substring(0, 60);
            if (itemSlug === serviceSlug) {
              return {
                name,
                description: (item as Record<string, unknown>).description ? String((item as Record<string, unknown>).description) : undefined,
                price: (item as Record<string, unknown>).price ? Number((item as Record<string, unknown>).price) : undefined,
                currency: (item as Record<string, unknown>).currency ? String((item as Record<string, unknown>).currency) : 'KZT',
              };
            }
          }
        }
      }
      return null;
    },
    enabled: !!page?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!service || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Link to={`/${slug}`} className="text-primary underline">Back to profile</Link>
      </div>
    );
  }

  const displayName = page.title || '@' + slug;

  return (
    <>
      <Helmet>
        <title>{service.name} — {displayName} | LinkMAX</title>
        {service.description && <meta name="description" content={service.description.substring(0, 160)} />}
        <link rel="canonical" href={`https://lnkmx.my/${slug}/services/${serviceSlug}`} />
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
          {service.price && (
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
