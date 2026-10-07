# Decisions

- No stack change, no big-bang rewrite: evolve the current app in small verifiable slices.
- Contact is the central entity for solo creators; Business Zones keep their own zone_contacts.
- Contact linking is additive: nullable `contact_id` columns, old data never rewritten.
- Public AI chat runs locally (no token spend); AI with tools builds on the MCP tool set.
- Business Zones only for Business tier; gamification and wallet stay hidden.
- New schema objects ship with GRANT + RLS in the same migration.
