# Database Schema Guide

> **Objective:** Document the data model, including schemaless JSON fields.

## 1. Core Entities (ERD)

```mermaid
erDiagram
    users ||--o{ pages : owns
    pages ||--o{ blocks : contains
    pages ||--o{ leads : captures
    pages ||--o{ bookings : schedules
    pages ||--|{ analytics : tracks

    users {
        uuid id PK
        string email
        string full_name
        jsonb raw_user_meta_data
    }

    pages {
        uuid id PK
        uuid user_id FK
        string slug "Unique, Indexed"
        boolean is_published
        jsonb theme_settings
        jsonb seo_meta
    }

    blocks {
        uuid id PK
        uuid page_id FK
        string type "Enum: text, image, etc."
        int position
        jsonb content "Flexible Data"
        jsonb style "Visual Config"
    }

    leads {
        uuid id PK
        uuid page_id FK
        jsonb data "Form Submission"
        string status "Enum: new, contacted, etc."
    }
```

---

## 2. JSON Field Structures

Supabase allows flexible JSONB columns. We enforce structure via Zod schemas in the code, but the DB allows flexibility.

### 2.1 `pages.theme_settings`
Configures the global look of the page.
```json
{
  "font": "Inter",
  "background": {
    "type": "gradient",
    "value": "linear-gradient(to right, #ff0000, #0000ff)"
  },
  "buttons": {
    "radius": "full",
    "style": "outline"
  }
}
```

### 2.2 `blocks.content`
Varies by `block.type`.

**Type: `link`**
```json
{
  "url": "https://example.com",
  "label": "My Website",
  "icon": "globe"
}
```

**Type: `image`**
```json
{
  "url": "https://supabase.../image.jpg",
  "alt": "Profile Photo",
  "aspectRatio": "1/1"
}
```

**Type: `form`**
```json
{
  "fields": [
    { "id": "name", "type": "text", "label": "Your Name" },
    { "id": "email", "type": "email", "label": "Your Email" }
  ],
  "submitLabel": "Send Message"
}
```

---

## 3. Critical Tables Reference

| Table | RLS | Description |
|---|---|---|
| `users` | Owner | Extends Supabase `auth.users`. Stores profile info. |
| `pages` | Public/Owner | Main entity. Row per landing page. |
| `blocks` | Public/Owner | Content units. Ordered by `position`. |
| `leads` | Owner | Form submissions. Encrypted/Protected heavily. |
| `analytics` | Public (Append) | Event log (page_view, click). High write volume. |

## 4. Migrations & Changes

- Migrations are stored in `supabase/migrations/`.
- **Naming:** `YYYYMMDDHHMMSS_description.sql`.
- **Apply:** `supabase db push` (Local) / `supabase db reset` (Wipe & Re-apply).
- **Production:** Applied via CI/CD pipeline.
