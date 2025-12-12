# Build Verification

This app implements W3PK build verification to provide users with guarantees that they're running an authentic, unmodified version of the W3PK library. This protects against supply chain attacks, compromised packages, and unauthorized modifications.

## Overview

The build verification system:

1. **Automatically verifies** the W3PK package on page load
2. **Displays verification status** in the UI with visual indicators (green checkmark or red cross)
3. **Logs results to console** for transparency
4. **Exposes verification functions** globally for manual user verification

## How It Works

### 1. Trusted Build Hash

The app hardcodes a trusted W3PK build hash in [src/components/BuildVerification.tsx](../src/components/BuildVerification.tsx):

```typescript
const TRUSTED_BUILD_HASH = 'bafkreibgdbouxvkqgh4d4omcbtq3mqs2nm4r2do367jetfdpfn43fbrmri'
```

This hash represents the verified W3PK release that has been audited and deemed safe.

**Future Enhancement:** In an upcoming version, the `TRUSTED_BUILD_HASH` will be DAO-maintained, allowing the community to govern which W3PK versions are trusted through decentralized consensus rather than hardcoded values. This will provide stronger security guarantees and reduce single points of trust.

### 2. Automatic Verification

When the settings page loads, the `BuildVerification` component:

- Imports W3PK functions: `getCurrentBuildHash()` and `verifyBuildHash()`
- Fetches the current build hash from the installed W3PK package
- Compares it against the trusted hash
- Displays the result in the UI

### 3. Visual Indicators

**Success (Green Checkmark ✅):**

- Build hash matches the trusted hash
- User sees "Verified W3PK Version" message
- Both hashes are displayed for transparency

**Failure (Red Cross ❌):**

- Build hash does NOT match the trusted hash
- User sees "Unverified W3PK Version" warning
- Could indicate compromised package, development version, or tampering

### 4. Console Access

The component exposes W3PK functions globally at `window.w3pk`, allowing users to independently verify the build:

```typescript
if (typeof window !== 'undefined') {
  window.w3pk = {
    getCurrentBuildHash,
    verifyBuildHash,
    TRUSTED_BUILD_HASH,
  }
}
```

## User Verification

### Critical Security Check

**If a user cannot run these commands in the browser console, the app should be considered suspicious:**

```javascript
await window.w3pk.getCurrentBuildHash()
await window.w3pk.verifyBuildHash(window.w3pk.TRUSTED_BUILD_HASH)
```

### Expected Behavior

1. Open browser developer console (F12)
2. Navigate to the settings page
3. You should see automatic verification logs:

```
🔐 W3PK Build Verification
══════════════════════════════════════════════════
Current build hash: bafkreibgdbouxvkqgh4d4omcbtq3mqs2nm4r2do367jetfdpfn43fbrmri
Trusted hash:      bafkreibgdbouxvkqgh4d4omcbtq3mqs2nm4r2do367jetfdpfn43fbrmri
Verification:      ✅ VERIFIED
══════════════════════════════════════════════════
Verify manually in console:

  await window.w3pk.getCurrentBuildHash()
  await window.w3pk.verifyBuildHash(window.w3pk.TRUSTED_BUILD_HASH)

══════════════════════════════════════════════════
```

4. Run manual verification:

```javascript
// Get current build hash
await window.w3pk.getCurrentBuildHash()
// Returns: 'bafkreibgdbouxvkqgh4d4omcbtq3mqs2nm4r2do367jetfdpfn43fbrmri'

// Verify against trusted hash
await window.w3pk.verifyBuildHash(window.w3pk.TRUSTED_BUILD_HASH)
// Returns: true (if verified) or false (if not verified)

// Check the trusted hash
window.w3pk.TRUSTED_BUILD_HASH
// Returns: 'bafkreibgdbouxvkqgh4d4omcbtq3mqs2nm4r2do367jetfdpfn43fbrmri'
```

## Implementation for Developers

### 1. Update the Trusted Hash

When a new verified W3PK version is released:

1. Verify the new W3PK release through official channels
2. Get the build hash for the new version
3. Update `TRUSTED_BUILD_HASH` in [src/components/BuildVerification.tsx](../src/components/BuildVerification.tsx)

```typescript
const TRUSTED_BUILD_HASH = 'YOUR_NEW_TRUSTED_HASH_HERE'
```

### 2. Where to Find the Official Hash

The official W3PK build hash can be found:

- In the [W3PK GitHub releases](https://github.com/w3hc/w3pk/releases)
- In the [W3PK documentation](https://github.com/w3hc/w3pk/blob/main/docs/BUILD_VERIFICATION.md)
- By running `pnpm build:hash` in the W3PK repository

### 3. Component Integration

The verification component is integrated in two places in the settings page:

**Non-authenticated section** ([src/app/settings/page.tsx:574](../src/app/settings/page.tsx#L574)):

```tsx
<BuildVerification />
```

**Authenticated section - Backup tab** ([src/app/settings/page.tsx:1267](../src/app/settings/page.tsx#L1267)):

```tsx
{
  /* W3PK Build Verification */
}
;<BuildVerification />
```

## Security Considerations

### Why This Matters

Build verification protects users from:

1. **Supply Chain Attacks**: Compromised npm packages or CDN tampering
2. **Package Substitution**: Malicious actors replacing legitimate packages
3. **Development Versions**: Accidentally running unaudited development code
4. **MITM Attacks**: Man-in-the-middle attacks during package installation

### Trust Model

The security of this system relies on:

1. **Trusted Hash Source**: The hash hardcoded in the app must be verified through official channels
2. **Code Integrity**: The verification code itself must not be tampered with
3. **W3PK Functions**: The `getCurrentBuildHash()` and `verifyBuildHash()` functions from W3PK are trusted

### Red Flags

Users should be suspicious if:

1. `window.w3pk` is undefined in the console
2. Verification functions return unexpected results
3. The UI shows "Unverified W3PK Version" on a production app
4. Console logs are missing or incomplete
5. Build hashes don't match the official release

## How W3PK Build Verification Works

W3PK's build verification system computes an IPFS CIDv1 hash from the concatenated main build artifacts:

1. Fetches `index.js`, `index.mjs`, and `index.d.ts` from the build
2. Concatenates them in order
3. Computes a SHA-256 hash of the concatenated data
4. Formats the hash as an IPFS CIDv1 (multihash + CIDv1 format + base32 encoding)

The resulting hash is deterministic and can be independently verified by anyone with access to the build files.

## Resources

- [W3PK Build Verification Documentation](https://github.com/w3hc/w3pk/blob/main/docs/BUILD_VERIFICATION.md)
- [W3PK GitHub Repository](https://github.com/w3hc/w3pk)
- [W3PK Security Documentation](https://github.com/w3hc/w3pk/blob/main/docs/SECURITY.md)

## Troubleshooting

### Verification Fails

If verification fails in a legitimate app:

1. Check if you're using a development version of W3PK
2. Verify you have the correct trusted hash for your W3PK version
3. Check your `package.json` for the W3PK version
4. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
5. Verify the hash from official W3PK sources

### Console Functions Unavailable

If `window.w3pk` is undefined:

1. Ensure you're on the settings page where `BuildVerification` component is loaded
2. Check browser console for any errors during component mount
3. Verify the component is properly imported and rendered
4. This could indicate the app has been tampered with - **be suspicious**

## FAQ

**Q: Can users trust the verification if the app itself might be compromised?**

A: Users can independently verify by:

- Checking the open-source code on GitHub
- Running verification using the unpkg CDN (see console instructions)
- Comparing hashes from multiple independent sources
- Verifying the app's code through the deployed source

**Q: What if I'm developing and the verification fails?**

A: During development with unreleased W3PK versions, verification will fail. This is expected. Update the trusted hash to match your development version, or disable verification during development.

**Q: How often should the trusted hash be updated?**

A: Update the trusted hash whenever you upgrade the W3PK package version in your app. Always verify the new hash through official channels before updating.

**Q: What should users do if verification fails?**

A: Users should:

1. Not enter any sensitive information
2. Check if they're using an official app deployment
3. Contact the app maintainers
4. Verify the app's source code
5. Consider it a security incident until resolved
