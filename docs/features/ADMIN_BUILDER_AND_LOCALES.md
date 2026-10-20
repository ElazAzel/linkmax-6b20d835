# Page-builder administration and localization

The cabinet centers on building and publishing pages. Administration groups page,
template, user and search operations together. Analytics and operational tools are
collapsed; business tools follow the existing business feature flag. Administrator
authentication and database write policies remain required.

## Translation sources

- Bundled JSON supplies SSR, initial hydration and offline defaults.
- With a configured Supabase project, the browser loads `i18n_translations` after
  the bundled locale and applies saved nonempty overrides. No opt-in flag is needed;
  `VITE_ENABLE_REMOTE_TRANSLATIONS=false` explicitly disables remote overrides.
- Older `languages.translations` records are a fallback only when no canonical
  record exists. A missing legacy table does not prevent canonical reads.
- The translation screen supports all bundled UI locales and distinguishes saved
  values, empty stored values and bundled fallbacks. A failed database read blocks
  writes, preventing an unavailable remote record from being replaced with defaults.
- Editing one key changes that saved override without copying unrelated bundled
  strings into the database. Manual file imports use the canonical table, normalize
  a legacy `translation` wrapper and validate values before writing.
- There is no automatic translation or automatic upload of bundled content.

## Deterministic page creation

The onboarding wizard and template personalization both call `buildSmartPage`.
It composes current block schemas from supplied content, contact details, prices
and media using niche recipes and deterministic art direction. It does not call an
AI model or consume model tokens. Missing evidence, prices and verification claims
are omitted. Business-only blocks become showcases when business tools are off.

Starter templates preserve business recipes but normalize obsolete block fields,
remove fabricated proof and prevent sample contacts from contacting an unrelated
person. Photos in `public/demo/` are illustrative stock media; provenance is in
`public/demo/sources.json`. Templates stored remotely are not rewritten by this work.

## Mobile editing and examples

The mobile block inspector uses the visible viewport, including keyboard resizing
and safe-area insets. Header, tabs and actions stay fixed while fields scroll in
one content area. Desktop behavior remains separate. Image cropping opens above
the inspector.

Landing examples render public card, tile and carousel components with local
photos. Selecting or exploring an example stops automatic page switching; reduced
motion disables autoplay. `/dev/editor?template=barber` uses the same feature-aware
template recipe as the gallery and saves nothing.
