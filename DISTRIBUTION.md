# MarkScribe Distribution Guide

## Current Status: Unsigned App ⚠️

Your app is currently **not code-signed**, which means users who download it will see a security warning on macOS.

## For Public Distribution (Recommended)

To distribute MarkScribe on your website without security warnings, you need to:

### 1. Get an Apple Developer Account

- **Cost**: $99/year
- **Sign up**: https://developer.apple.com/programs/

### 2. Get Your Developer Certificate

Once you have an Apple Developer account:

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority**
3. Enter your email and name, select "Saved to disk"
4. Log in to https://developer.apple.com/account/resources/certificates/list
5. Create a new **Developer ID Application** certificate
6. Download and install it (double-click to add to Keychain)

### 3. Configure Code Signing

Edit `electron-builder.yml` and uncomment these lines in the `mac` section:

```yaml
mac:
  identity: 'Developer ID Application: Your Name (TEAM_ID)'
  notarize:
    teamId: 'YOUR_TEAM_ID'
```

Replace:

- `Your Name (TEAM_ID)` with your actual certificate name (find it in Keychain Access)
- `YOUR_TEAM_ID` with your Apple Team ID (found at https://developer.apple.com/account)

### 4. Set Up App-Specific Password

For notarization, you need an app-specific password:

1. Go to https://appleid.apple.com/account/manage
2. Generate an app-specific password
3. Store it in your keychain:

```bash
xcrun notarytool store-credentials "AC_PASSWORD" \
  --apple-id "your-email@example.com" \
  --team-id "YOUR_TEAM_ID" \
  --password "your-app-specific-password"
```

### 5. Build Signed App

```bash
npm run build:mac
```

The app will now be:

- ✅ **Code-signed** with your Developer ID
- ✅ **Notarized** by Apple
- ✅ **Ready for distribution** - no security warnings!

---

## For Development/Testing Only

If you're just testing locally and don't want to pay for Apple Developer:

### Option 1: Remove Quarantine (Your Machine Only)

```bash
xattr -cr dist/mac-arm64/MarkScribe.app
open dist/mac-arm64/MarkScribe.app
```

### Option 2: Right-Click to Open

1. Right-click `MarkScribe.app`
2. Select "Open"
3. Click "Open" in the security dialog

### Option 3: Use Dev Mode

```bash
npm run dev
```

---

## Alternative: Web Version

If you don't want to deal with code signing, consider:

- Building a **web version** of MarkScribe
- Host it on your website as a web app
- No installation or security warnings needed!

---

## Cost Comparison

| Option           | Cost     | User Experience                    |
| ---------------- | -------- | ---------------------------------- |
| **Code Signing** | $99/year | ✅ Perfect - no warnings           |
| **Unsigned App** | Free     | ⚠️ Security warnings for all users |
| **Web App**      | Free     | ✅ Good - works in browser         |

---

## Questions?

- **Do I need code signing?** - Yes, if you want users to download and install without warnings
- **Can I skip this?** - Yes, but users will see scary security warnings
- **Is there a free alternative?** - Build a web version instead of a desktop app
