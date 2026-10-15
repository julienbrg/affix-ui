# Changelog

## Unreleased

### Added

- BOT Chain (chain ID 677) support: the dashboard, verify page, `verify-url` API and about page use the AffixFactory at `0x217e2225a623412A7e9F43Bc0207c1bD1ed4f9Dc` and the official AffixRegistry at `0x94E5E95128aA2684B0A51b5Ea30C601e6f72aeB7`, through `https://rpc.botchain.ai`, with links to `https://scan.botchain.ai`
- HTTP security headers on every route in `next.config.ts`: a Content-Security-Policy whose `connect-src` allows the BOT Chain RPC used by the affix contracts and the Optimism RPC used by the build verification, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security`
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

### Removed

- OP Mainnet, Sepolia and Filecoin Calibration network configs for the affix contracts

### Fixed

- Transactions from the dashboard rejected as underpriced on BOT Chain: with a base fee of 0, the signer now falls back to the gas price for the EIP-1559 fees instead of signing with a tip of 0
- Login on a device with no registered passkey opens the registration modal instead of the browser's cross-device QR code dialog
- "Remember Me" session detection, which looked for sessions in IndexedDB
- Corrupted tree diagram in `docs/CONTEXT.md`

### Security

- Next.js 16.4.0 fixes three critical remote code execution flaws
