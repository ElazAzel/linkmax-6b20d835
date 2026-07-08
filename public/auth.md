# LinkMax — Agent Authentication

This document describes how AI agents can register and authenticate with LinkMax APIs.

## Overview

LinkMax is a link-in-bio / micro-site platform. Most content (public profile pages, sitemap, llms.txt) is openly accessible without authentication. Authenticated APIs use OAuth 2.0 / OpenID Connect.

## Discovery endpoints

- OAuth Protected Resource Metadata: `/.well-known/oauth-protected-resource`
- OAuth Authorization Server Metadata: `/.well-known/oauth-authorization-server`
- API Catalog (RFC 9727): `/.well-known/api-catalog`
- Content usage preferences: `/robots.txt` (Content-Signal directives)
- LLM-friendly content map: `/llms.txt`, `/llms-full.txt`

## Agent registration

To register an agent for programmatic access:

1. Contact `support@lnkmx.my` with your agent name, purpose, contact, and required scopes.
2. After approval you will receive OAuth client credentials.
3. Use the Authorization Code or Client Credentials flow as documented at the discovery endpoints above.

## Identity & credential types

- **Identity**: `service_account` (machine), `delegated_user` (acting on behalf of a LinkMax user).
- **Credentials**: `client_secret_basic`, `client_secret_post`.

## Supported scopes

- `read:profile` — read a user's profile and pages
- `read:analytics` — read aggregated analytics
- `write:pages` — create or update pages (requires user delegation)
- `read:leads` — read CRM leads (requires user delegation)

## Revocation

Tokens can be revoked at `https://lnkmx.my/api/oauth/revoke` (when available). Contact support to revoke client credentials.

## Contact

- Email: `support@lnkmx.my`
- Site: `https://lnkmx.my`
