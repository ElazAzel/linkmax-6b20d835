---
name: changelog
description: Release notes, versioning, categorized changelog updates, and release communication.
---

# Changelog & Release Management

Use for generating release notes, tracking semantic versioning, categorizing platform improvements, and updating `docs/CHANGELOG.md`.

## When to Use
- Documenting new features, fixes, security hardening, or performance optimizations before releases.
- Formatting structured changelog entries adhering to Keep a Changelog standards.
- Incrementing version numbers across `package.json`, Capacitor configs, and documentation.

## Core Workflows

### 1. Formatting Changelog Entries
1. Open `docs/CHANGELOG.md`.
2. Add new release header with ISO date (e.g. `## [3.2.0] - 2026-08-26`).
3. Categorize changes under standard sections:
   - `### Added`: New user-facing features or developer capabilities.
   - `### Changed`: Changes in existing functionality.
   - `### Fixed`: Bug fixes and defect resolutions.
   - `### Security`: Vulnerability remediations and RLS hardening.
   - `### Performance`: Load time reductions and bundle optimizations.

### 2. Version Bumping
1. Update `"version"` in `package.json`.
2. Sync version in `android/app/build.gradle` (`versionCode`, `versionName`) and `ios/App/App.xcodeproj` if applicable.
3. Commit with semantic tag: `git tag v3.2.0`.

## Key Files
- **Changelog**: `docs/CHANGELOG.md`
- **Package Manifest**: `package.json`
- **Capacitor Config**: `capacitor.config.ts`

## Commands & Verification
```bash
npm run docs:check
```

## Best Practices & Guardrails
- **Honest Records**: Clearly distinguish completed implementations from upcoming roadmap items.
- **User-Centric**: Write changelog items in language that clearly conveys the user or business value.
