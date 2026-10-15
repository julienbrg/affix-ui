# Changelog

## Unreleased

### Added

- HTTP security headers on every route in `next.config.ts`: a Content-Security-Policy whose `connect-src` allows the Optimism, Filecoin Calibration and Sepolia RPCs used by the affix contracts, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security`
- Backup step after registration, on Safari only, when the browser can wipe the wallet
- `pnpm.overrides` forcing patched transitive dependencies, and `pnpm-workspace.yaml` with a 3-day `minimumReleaseAge`
- Translations for the Settings page, header, backup step and password modal in all 10 languages
- "Already registered?" link in the registration dialog, pointing to the backup restore in Settings
- `templateVersion` in `package.json`, recording the genji release this project is synced with, and a CI step that warns when a newer one is tagged

### Changed

- Synced with genji 3.2.0
- Bumped `w3pk` to 0.10.3, which keeps the wallet, sessions and backups in localStorage instead of IndexedDB
- Updated dependencies: `next` / `eslint-config-next` 16.4.0, `react` / `react-dom` 19.3.0, `@chakra-ui/react` 3.37.0, `typescript` 6.0.3, `prettier` 3.9.10, among others
- The Settings page, W3PK context and chassis components follow genji 3.2.0

### Fixed

- Login on a device with no registered passkey opens the registration modal instead of the browser's cross-device QR code dialog
- "Remember Me" session detection, which looked for sessions in IndexedDB
- Corrupted tree diagram in `docs/CONTEXT.md`

### Security

- Next.js 16.4.0 fixes three critical remote code execution flaws
