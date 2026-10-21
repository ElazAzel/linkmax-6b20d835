# Existing profile maintenance

`refresh-profile-pages.mjs` prepares reviewable SQL; it does not connect to a database.
Use an owner-authorized export containing `slug`, `page`, active `blocks` ordered by
position, and the current `draft`. Keep raw exports and generated plans out of Git.

```sh
node scripts/refresh-profile-pages.mjs --input pages-before.json --output-dir plan --personal-assets scripts/fixtures/elazart
```

The demo allowlist comes from the original 28 seed fixtures, including the renamed
`demo_nails` account. SQL also checks the exact seeded owner email, page ownership,
publication status, original block content and current revisions. Dirty demo drafts
require review before generating a plan. Personal content changes are limited to
`elazart`; its current photos, project destinations and contact details are retained.

Run each generated SQL batch in the project's authenticated Cloud SQL editor and
inspect its result before continuing. Existing published pages use the canonical
draft save/publish functions, retaining history and block IDs. Unpublished pages
receive private drafts only. A changed page aborts the transaction; export its
current state and review a new plan rather than removing conflict checks.

Before changing anything, SQL saves full page, block and draft before-images in
`profile_refresh_internal.page_backups`, inaccessible to public API roles. A run key
and page ID make re-execution a no-op. For a later intentional refresh, review a
new plan with a new run key. Recovery should restore the authorized snapshot
through the same canonical draft functions after comparing current revisions.

Run `scripts/sql/normalize-profile-avatars.sql` after content refreshes. It changes
only profile/avatar geometry, retains images and unrelated settings, locks rows
before recording backups, updates publication versions once, and preserves dirty
draft status. Before-images are in the private `avatar_backups` table. Re-running
the repair makes no further changes. Existing demo seeding now preserves accounts;
it must not be used to rebuild or delete an existing page.

Verification:

```sh
node --test scripts/__tests__/profile-refresh.test.mjs scripts/__tests__/profile-avatar-data.test.mjs src/services/__tests__/page-drafts.sql.test.mjs
```
