---
description: Build the project for production
---
# Build Command

This command compiles the frontend application for production deployment.

## Steps
1.  Run `npm run build`.

## Verification
-   Ensure the `dist/` directory is created and populated.
-   Check console output for no errors or unresolved unresolved imports.
-   *Note*: If `SENTRY_AUTH_TOKEN` is present in the environment, sourcemaps will be uploaded to Sentry automatically during this step.
