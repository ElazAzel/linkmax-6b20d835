# Google and Apple Production Checklist

Production target: `https://lnkmx.my`

Supabase project ref: `pphdcfxucfndmwulpfwv`

This checklist is for Auth and Calendar only. Keep `lnkmx.my` on Hostinger DNS for this pass; the connected Cloudflare and Vercel accounts are not authoritative for this setup.

## Supabase Auth

Set the Auth Site URL:

```text
https://lnkmx.my
```

Set the redirect allow list:

```text
https://lnkmx.my/auth/callback**
http://localhost:8080/auth/callback**
http://127.0.0.1:8080/auth/callback**
```

Confirm providers:

- Google provider enabled.
- Apple provider enabled.
- Email provider enabled.
- Manual account linking enabled if the project uses explicit unlink/link operations from settings.

## Google Cloud

OAuth client authorized JavaScript origins:

```text
https://lnkmx.my
http://localhost:8080
http://127.0.0.1:8080
```

OAuth client authorized redirect URIs:

```text
https://pphdcfxucfndmwulpfwv.supabase.co/auth/v1/callback
https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/gcal-callback
```

OAuth consent scopes:

- Login: `openid`
- Login: `userinfo.email`
- Login: `userinfo.profile`
- Calendar sync: `https://www.googleapis.com/auth/calendar.events`

Supabase Edge Function secrets:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GCAL_STATE_SECRET
```

Use a dedicated random value for `GCAL_STATE_SECRET`. Do not reuse the Google client secret for OAuth state signing.

## Apple Developer

Primary App ID:

```text
com.lnkmx.app
```

Recommended Services ID:

```text
com.lnkmx.app.web
```

Required Apple setup:

- Enable Sign in with Apple for the primary App ID.
- Enable Sign in with Apple for the Services ID.
- Configure the web return URL:

```text
https://pphdcfxucfndmwulpfwv.supabase.co/auth/v1/callback
```

Supabase Apple provider values:

- Apple Team ID.
- Apple Services ID.
- Generated client secret from the `.p8` key.
- Apple Key ID that matches the `.p8` key.

Create a 6-month rotation reminder for the Apple client secret/key. Apple web client secrets are long-lived JWTs, but LinkMAX should rotate them on a predictable operational cadence.

## Manual Validation

- Google sign-in from `/auth?returnTo=/dashboard/settings` returns to `/dashboard/settings`.
- Apple sign-in from `/auth?returnTo=/dashboard/settings` returns to `/dashboard/settings`.
- Malicious `returnTo=//evil.com` falls back to `/dashboard`.
- Linking Google and Apple in settings updates the identity list and shows clean errors on failure.
- Google Calendar connect redirects back with `gcal_connected=true`; the settings status becomes connected.
- Google Calendar disconnect revokes best-effort at Google, deletes stored tokens, marks status disconnected, and disables `gcal_sync_enabled`.
- Booking creation with `gcalSyncEnabled` checks busy slots and creates an event when connected.
- The public ICS feed opens or subscribes in Apple Calendar and Google Calendar.
