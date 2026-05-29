# Sentinel Journal

## 2026-05-10 - XSS via document template variables
**Vulnerability:** `renderTemplate` in `src/lib/utils/document-generator.ts` substituted raw variable values (contact_name, deal_title, …) into HTML templates that are later rendered with `dangerouslySetInnerHTML` and `html2canvas` for PDF export.
**Learning:** When a template engine emits HTML, every interpolated value coming from user-controlled storage (zone contacts/deals/custom vars) MUST be HTML-escaped, even if the template itself is trusted.
**Prevention:** Always escape `{{var}}` substitutions at the engine level, never at the call site. Search for any other custom mustache-like substitutions before introducing `dangerouslySetInnerHTML`.
