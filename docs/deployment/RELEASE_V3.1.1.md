# LinkMAX v3.1.1 release runbook

**Release date:** 2026-09-01

**Production source of truth:** Cloudflare Worker + Static Assets

**Mirror/preview:** Lovable through the GitHub integration

## Preconditions

1. The repair PR is merged to `main` with every strict required check green.
2. The automatic `Deploy Staging` run succeeds against the isolated staging Supabase project and staging Worker.
3. The Lovable GitHub mirror reports success for the exact `main` commit; record its deployment identifier.
4. A recoverable Supabase production backup or PITR checkpoint is confirmed.
5. The production environment reviewer approves the release job.

## Production procedure

Dispatch `Release Production` with:

- `version`: `3.1.1`
- `commit_sha`: the full green SHA currently on `main`
- `backup_confirmed`: checked only after backup/PITR verification
- `lovable_deployment_id`: the successful mirror deployment identifier
- `lovable_preview_url`: the Lovable preview URL whose `X-Deployment-Id` header matches that identifier

The workflow checks out the exact SHA, builds once, creates the web archive/SBOM/checksums, uploads an immutable Cloudflare version, and smoke-tests its preview. It then records the Supabase migration checkpoint, pushes migrations, deploys functions, checks backend health, promotes the exact Worker version, and runs production smoke tests. Only after all gates pass does it create `v3.1.1` and the GitHub Release.

## Required smoke checks

- `/`, `/auth`, and `/pricing` return successful responses.
- `/demo-nails` includes `X-SSR-Rendered: true`.
- `/sitemap.xml` is reachable.
- `/.well-known/linkmax-release.json` matches version `3.1.1` and the exact release SHA.
- The Lovable mirror identifier is attached to the release artifacts.

## Failure and rollback

- A failure before publication creates no tag and no GitHub Release.
- A failed production smoke test automatically invokes `wrangler rollback`.
- Database migrations are never edited or rolled back destructively; recovery uses a reviewed forward migration.
- If GitHub Release publication fails after tag push, the workflow removes the orphaned remote tag.
- Record manual recovery steps and platform deployment identifiers in the repair PR.
