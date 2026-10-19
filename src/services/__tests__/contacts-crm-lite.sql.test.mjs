import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('contacts core + UTM propagation and get_contact_timeline work end-to-end', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '00000000-0000-0000-0000-000000000010'::uuid $$;
      CREATE TABLE public.leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        name text,
        email text,
        phone text,
        source text DEFAULT 'form',
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.bookings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL,
        client_name text,
        client_email text,
        client_phone text,
        slot_date date DEFAULT CURRENT_DATE,
        slot_time time DEFAULT '12:00',
        payment_amount numeric DEFAULT 0,
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title_i18n_json jsonb DEFAULT '{"ru":"Мастер-класс"}'::jsonb
      );
      CREATE TABLE public.event_registrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL,
        event_id uuid REFERENCES public.events(id),
        attendee_name text,
        attendee_email text,
        attendee_phone text,
        paid_amount numeric DEFAULT 0,
        currency text DEFAULT 'KZT',
        utm_json jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.digital_purchases (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL,
        buyer_email text,
        status text DEFAULT 'paid',
        amount numeric DEFAULT 0,
        currency text DEFAULT 'KZT',
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.blocks (
        id text,
        type text CONSTRAINT blocks_type_check CHECK (type IN ('profile', 'link'))
      );
    `);

    await db.exec(await readFile(new URL('../../../drizzle/migrations/0003_contacts_core.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../../drizzle/migrations/0004_contacts_link_and_timeline.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../../drizzle/migrations/0009_korner_card_tiles_and_contact_utm.sql', import.meta.url), 'utf8'));

    const ownerId = '00000000-0000-0000-0000-000000000010';
    const leadRes = await db.query(
      `INSERT INTO public.leads (user_id, name, email, phone, source, metadata)
       VALUES ($1, 'Алия', 'aliya@example.kz', '8 (701) 555-44-33', 'form', '{"utm_source":"instagram","utm_campaign":"october"}'::jsonb)
       RETURNING contact_id`,
      [ownerId],
    );
    const contactId = leadRes.rows[0].contact_id;
    assert.ok(contactId, 'lead should auto-link to a contact');

    const contactRow = (await db.query('SELECT * FROM public.contacts WHERE id = $1', [contactId])).rows[0];
    assert.equal(contactRow.phone_norm, '77015554433');
    assert.equal(contactRow.email_norm, 'aliya@example.kz');
    assert.equal(contactRow.utm.utm_source, 'instagram');
    assert.equal(contactRow.utm.utm_campaign, 'october');

    await db.query(
      `INSERT INTO public.bookings (owner_id, client_name, client_phone, payment_amount)
       VALUES ($1, 'Алия', '+7 701 555 44 33', 15000)`,
      [ownerId],
    );

    const timeline = (await db.query('SELECT * FROM public.get_contact_timeline($1)', [contactId])).rows;
    assert.equal(timeline.length, 2);
    const kinds = timeline.map(r => r.kind).sort();
    assert.deepEqual(kinds, ['booking', 'lead']);
  } finally {
    await db.close();
  }
});
