import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Public ICS feed endpoint for subscribing in Apple Calendar / Google Calendar.
 * URL: /calendar-feed?token=<zone_calendar_feed_token>
 * Returns a valid .ics VCALENDAR with all bookings for the zone.
 */
serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Find zone by feed token
  const { data: zone, error: zoneErr } = await supabaseAdmin
    .from("zones")
    .select("id, name")
    .eq("calendar_feed_token", token)
    .single();

  if (zoneErr || !zone) {
    return new Response("Invalid token", { status: 404 });
  }

  // Get all pages linked to this zone
  const { data: pages } = await supabaseAdmin
    .from("pages")
    .select("id")
    .eq("organization_id", zone.id);

  const pageIds = (pages || []).map((p: any) => p.id);

  if (pageIds.length === 0) {
    return new Response(generateEmptyCalendar(zone.name), {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }

  // Get bookings for those pages
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("page_id", pageIds)
    .neq("status", "cancelled")
    .order("slot_date", { ascending: true });

  const icsContent = generateICS(zone.name, bookings || []);

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${zone.name}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});

interface Booking {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_notes?: string;
  slot_date: string;
  slot_time: string;
  slot_end_time?: string;
  status: string;
  created_at: string;
}

function formatICSDate(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function generateICS(calendarName: string, bookings: Booking[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events = bookings.map((b) => {
    const start = formatICSDate(b.slot_date, b.slot_time);
    const end = b.slot_end_time
      ? formatICSDate(b.slot_date, b.slot_end_time)
      : formatICSDate(
          b.slot_date,
          // Default +1 hour
          (() => {
            const [h, m] = b.slot_time.split(":");
            return `${String(parseInt(h) + 1).padStart(2, "0")}:${m}:00`;
          })()
        );

    const description = [
      b.client_email && `Email: ${b.client_email}`,
      b.client_phone && `Phone: ${b.client_phone}`,
      b.client_notes && `Notes: ${b.client_notes}`,
    ]
      .filter(Boolean)
      .join("\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${b.id}@lnkmx.my`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICS(b.client_name)} — Booking`,
      `STATUS:${b.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
      description && `DESCRIPTION:${escapeICS(description)}`,
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//lnkmx.my//${escapeICS(calendarName)}//EN`,
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function generateEmptyCalendar(name: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//lnkmx.my//${escapeICS(name)}//EN`,
    `X-WR-CALNAME:${escapeICS(name)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "END:VCALENDAR",
  ].join("\r\n");
}
