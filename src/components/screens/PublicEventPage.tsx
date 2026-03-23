import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicEventPage() {
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>();

  const { data: page } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('pages')
        .select('id, slug, title, entity_type')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!page?.id) return null;
      const { data } = await supabase
        .from('events')
        .select('id, title_i18n_json, description_i18n_json, start_at, end_at, location_value, location_type, price_amount, currency, is_paid')
        .eq('page_id', page.id)
        .eq('id', eventId!)
        .single();
      return data;
    },
    enabled: !!page?.id && !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to={`/${slug}`} className="text-primary underline">Back to profile</Link>
      </div>
    );
  }

  const displayName = page.title || '@' + slug;
  const titleI18n = (event.title_i18n_json || {}) as Record<string, string>;
  const descI18n = (event.description_i18n_json || {}) as Record<string, string>;
  const eventTitle = titleI18n.ru || titleI18n.en || 'Event';
  const eventDesc = descI18n.ru || descI18n.en || '';
  const dateStr = event.start_at ? format(new Date(event.start_at), 'dd.MM.yyyy HH:mm') : '';

  return (
    <>
      <Helmet>
        <title>{eventTitle} — {displayName} | LinkMAX</title>
        {eventDesc && <meta name="description" content={eventDesc.substring(0, 160)} />}
        <link rel="canonical" href={`https://lnkmx.my/${slug}/events/${eventId}`} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:underline">LinkMAX</Link>
            {' › '}
            <Link to={`/${slug}`} className="hover:underline">{displayName}</Link>
            {' › '}
            <span>{eventTitle}</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2">{eventTitle}</h1>
          {dateStr && <p className="text-muted-foreground mb-2">📅 {dateStr}</p>}
          {event.location_value && <p className="text-muted-foreground mb-4">📍 {event.location_value}</p>}
          {eventDesc && <p className="text-foreground mb-6">{eventDesc}</p>}
          {event.is_paid && event.price_amount && (
            <p className="text-2xl font-bold text-primary mb-6">
              {event.price_amount} {event.currency || 'KZT'}
            </p>
          )}
          <Link to={`/${slug}`} className="text-primary hover:underline">← Back to profile</Link>
        </div>
      </div>
    </>
  );
}
