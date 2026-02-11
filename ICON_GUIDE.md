# MarkScribe Icon Creation Guide

## Quick Option: Use an Online Icon Generator

### Method 1: Figma/Canva (Free)

1. **Go to Figma** (https://figma.com) or **Canva** (https://canva.com)
2. **Create a new design**: 1024x1024px
3. **Design the icon**:
   - Background: Gradient from `#3B82F6` (blue) to `#8B5CF6` (purple)
   - Add a large white "M" letter (use a bold, modern font like "Inter Bold" or "SF Pro Display Bold")
   - Optional: Add a small pen/pencil icon in the corner
   - Keep it simple and clean!

4. **Export as PNG**: 1024x1024px

### Method 2: Use an AI Icon Generator

Visit one of these free icon generators:

- **IconKitchen**: https://icon.kitchen
- **AppIcon**: https://appicon.co
- **MakeAppIcon**: https://makeappicon.com

Upload your 1024x1024 PNG and they'll generate all required formats!

---

## Icon Design Specifications

### Design Concept

- **Style**: Modern, minimal, professional
- **Colors**: Blue to purple gradient (#3B82F6 → #8B5CF6)
- **Symbol**: Large "M" letter in white
- **Optional**: Small pen/writing element

### Required Sizes

- **macOS**: 1024x1024px PNG (will be converted to .icns)
- **Windows**: 256x256px PNG (will be converted to .ico)
- **Linux**: 512x512px PNG

---

## Installing Your Custom Icon

Once you have your 1024x1024 PNG icon:

### Step 1: Convert to Required Formats

**For macOS (.icns):**

```bash
# Install imagemagick if you don't have it
brew install imagemagick

# Convert PNG to ICNS
mkdir MyIcon.iconset
sips -z 16 16     icon.png --out MyIcon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out MyIcon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out MyIcon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out MyIcon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out MyIcon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out MyIcon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out MyIcon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out MyIcon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out MyIcon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out MyIcon.iconset/icon_512x512@2x.png
iconutil -c icns MyIcon.iconset
```

**For Windows (.ico):**

```bash
# Using imagemagick
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### Step 2: Replace Icons

Copy your generated icons to the build folder:

```bash
cp icon.icns build/icon.icns
cp icon.ico build/icon.ico
cp icon.png build/icon.png
```

### Step 3: Rebuild the App

```bash
rm -rf dist out
npm run build:mac
```

---

## Simple Alternative: Use Emoji/Text Icon

If you want something quick, I can create a simple text-based icon for you using the existing tools.

---

## Icon Design Tips

✅ **Do:**

- Keep it simple and recognizable
- Use high contrast
- Make sure it looks good at small sizes (16x16)
- Use a consistent color scheme

❌ **Don't:**

- Use too many details
- Use thin lines (they disappear at small sizes)
- Use more than 2-3 colors
- Make it too complex

---

## Need Help?

If you want me to create a simple icon using code/SVG, let me know!
