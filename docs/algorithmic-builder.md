# Local page builder

Page creation is a deterministic client-side pipeline. The wizard, gallery smart
match, template personalization and legacy `ai-builder` entry use `buildSmartPage`.
None calls a model, an edge generator, an AI quota or a token reward. The separately
named title/copy/SEO tools retain their existing behavior.

The pipeline extracts supplied services, quoted prices, contacts and media; chooses
a niche recipe; creates native blocks; and resolves one coordinated palette,
typographic pair and composition. Users can choose auto, bold, editorial or soft.
Without photographs, it uses bundled abstract SVG covers created with code.
These graphics contain no invented person, work sample or business claim.

The returned theme travels with the blocks through completion and template
selection. Applying it uses one page-state update. Existing real portraits,
profile IDs and covers are retained when the new design only supplies a sample or
abstract fallback. Templates additionally keep the owner's existing name and bio.
The ordinary onboarding path retains existing content blocks. Generation previews
use the same theme scope as the public renderer.

Explicit palette colors are used only while their base canvas and text match the
theme's authoritative fields. Choosing an existing preset or resetting those
fields therefore cannot leave stale generated palette tokens behind. Theme
export/import preserves whitelisted palette colors.

The 20 filled built-in templates use bundled generated editorial photographs and
native content blocks. They identify themselves as examples, omit fabricated
credentials and do not guess contact destinations. The blank template stays
blank. Curated built-ins remain in the gallery when database templates exist;
custom entries remain available. Business-only blocks still respect the business
feature flag and turn into showcase cards when that flag is off.

Useful checks:

```sh
npm run typecheck:strict
npm test -- --maxWorkers=4
```

`smart-design.test.ts` covers every niche, contrast, reproducibility, supplied
media, existing identity, preset switching and theme transfer. The legacy-entry
and dashboard-hook tests guard against AI quota or reward calls. Template tests
check schema validity, meaningful local media and the business feature boundary.

For an in-memory visual check, use `/dev/editor?template=beauty` or another built-in
template ID in a development build. This renders the actual editor and never
saves or publishes data. Production builds return 404 for this route.
