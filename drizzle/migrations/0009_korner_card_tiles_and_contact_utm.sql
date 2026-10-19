-- Korner-style "card" and "tiles" blocks + UTM propagation in leads_link_contact.
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type = ANY (ARRAY[
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video',
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download',
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator',
  'catalog', 'before_after', 'faq', 'countdown', 'pricing', 'shoutout',
  'booking', 'community', 'event', 'audio', 'card', 'tiles'
]));

-- Preserve UTM parameters from leads.metadata when linking/creating contacts
CREATE OR REPLACE FUNCTION public.leads_link_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_utm jsonb := '{}'::jsonb;
BEGIN
  IF NEW.contact_id IS NULL THEN
    IF NEW.metadata IS NOT NULL AND jsonb_typeof(NEW.metadata) = 'object' THEN
      v_utm := jsonb_strip_nulls(jsonb_build_object(
        'utm_source', NEW.metadata->'utm_source',
        'utm_medium', NEW.metadata->'utm_medium',
        'utm_campaign', NEW.metadata->'utm_campaign',
        'utm_content', NEW.metadata->'utm_content',
        'utm_term', NEW.metadata->'utm_term',
        'referrer', NEW.metadata->'referrer'
      ));
    END IF;
    NEW.contact_id := public.upsert_contact(NEW.user_id, NEW.name, NEW.email, NEW.phone, NEW.source::text, v_utm);
  END IF;
  RETURN NEW;
END $$;
