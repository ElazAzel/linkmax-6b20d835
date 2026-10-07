# Domain Model (current vs target)

## Current
```text
page ─ blocks (jsonb + blocks table)
  ├─ leads (user_id = page owner; name/email/phone/source/metadata)
  ├─ bookings (owner_id, slot, staff_id, resource)
  ├─ events ─ event_registrations ─ event_tickets
  ├─ digital_products ─ digital_purchases
  ├─ offers ─ offer_subscriptions / orders
  └─ analytics (page_id, event_type, metadata)
zones (Business tier) ─ zone_contacts ─ zone_deals ─ zone_tasks ...
```

## Duplication
- A person exists separately in leads, bookings, event_registrations, digital_purchases, zone_contacts. No shared id.
- Sales objects split: offers vs digital_products vs events vs booking services.

## Target
```text
contact (per page owner, deduped by phone/email/telegram/whatsapp)
  ├─ leads.contact_id
  ├─ bookings.contact_id
  ├─ event_registrations.contact_id
  └─ digital_purchases.contact_id
timeline = analytics + leads + bookings + purchases + lead_interactions
```
