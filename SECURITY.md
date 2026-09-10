# Security Policy

## Supported versions

Security fixes are applied to the latest production release and to the current `main` branch.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository. Do not disclose credentials, exploit details, customer data, or proof-of-concept material in a public issue.

Include the affected route or component, reproducible steps, expected impact, and the smallest safe proof of concept. Maintainers will acknowledge a valid report, coordinate remediation and rotation, and publish an advisory when disclosure is safe.

## Repository controls

- Pull requests and strict required checks protect `main`.
- Force-pushes and branch deletion are blocked.
- Dependencies are monitored by Dependabot and CodeQL.
- Secret scanning and push protection are enabled at the repository level.
- Production deployment requires GitHub environment approval and never reads credentials from committed files.
