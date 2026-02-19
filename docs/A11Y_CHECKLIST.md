# Accessibility (A11y) Checklist

> **Objective:** Ensure lnkmx is usable by everyone, including people with disabilities. A11y is a legal requirement in many jurisdictions and improves SEO.

## 1. Keyboard Navigation

- [ ] **Tab Order**: Ensure logical flow (Top -> Bottom, Left -> Right).
- [ ] **Focus Visible**: Never remove `outline` without providing a custom `:focus` style.
- [ ] **No Traps**: Ensure keyboard users don't get stuck in a modal or widget (use `radix-ui/dialog` which handles this).
- [ ] **Skip Links**: "Skip to Content" link for main content areas.

## 2. Screen Readers (ARIA)

- [ ] **Semantic HTML**: Use `<button>`, `<a>`, `<nav>`, `<main>` instead of `<div>` with handlers.
- [ ] **ARIA Labels**: Add `aria-label="Action Name"` to buttons with icons only (e.g., "Delete Block").
- [ ] **State Announcements**: Use `aria-expanded` for accordions/dropdowns.
- [ ] **Live Regions**: Use `aria-live` for dynamic updates (like "Saving..." toasts).

## 3. Images & Media

- [ ] **Alt Text**: All `<img>` tags must have `alt`.
    - Decorative images: `alt=""`.
    - Informative images: `alt="Description of image content"`.
- [ ] **Captions**: Videos must have captions.

## 4. Forms

- [ ] **Labels**: All inputs must have a visible `<label>` or `aria-label`. `placeholder` is not a label.
- [ ] **Error Messages**: Connect errors to inputs using `aria-describedby`.
- [ ] **Autocomplete**: Use correct `autocomplete` attributes (email, name, tel) to help autofill.

## 5. Visual Design

- [ ] **Color Contrast**: Text vs Background must be at least 4.5:1 (WCAG AA).
- [ ] **Zoom**: Site must work at 200% browser zoom without breaking layout.
- [ ] **Motion**: Respect `prefers-reduced-motion` media query for heavy animations.

## 6. Testing Tools

- **Lighthouse**: Built-in Chrome DevTools audit.
- **axe DevTools**: Browser extension for deeper analysis.
- **Keyboard**: Try using your site without a mouse (Tab, Enter, Space, Esc).
