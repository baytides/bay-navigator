#!/bin/bash
# Icon generation script for BayNavigator
# Generates icons for iOS, Android, macOS, and web platforms

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXPORTS_DIR="/Users/steven/Downloads/Bay_Area_Discounts Exports"

# Source images from Apple exports
DEFAULT_ICON="$EXPORTS_DIR/Bay_Area_Discounts-iOS-Default-1024x1024@1x.png"
DARK_ICON="$EXPORTS_DIR/Bay_Area_Discounts-iOS-Dark-1024x1024@1x.png"
TINTED_ICON="$EXPORTS_DIR/Bay_Area_Discounts-iOS-TintedLight-1024x1024@1x.png"
TINTED_DARK_ICON="$EXPORTS_DIR/Bay_Area_Discounts-iOS-TintedDark-1024x1024@1x.png"

# Directories
IOS_ICONS="$PROJECT_ROOT/apps/ios/Runner/Assets.xcassets/AppIcon.appiconset"
ANDROID_ICONS="$PROJECT_ROOT/apps/android/app/src/main/res"
MACOS_ICONS="$PROJECT_ROOT/apps/macos/Runner/Assets.xcassets/AppIcon.appiconset"
WEB_ICONS="$PROJECT_ROOT/apps/assets/images/favicons"
ASSETS_DIR="$PROJECT_ROOT/apps/assets/images"

echo "=== BayNavigator Icon Generator ==="
echo ""

# Check source files exist
if [ ! -f "$DEFAULT_ICON" ]; then
    echo "Error: Default icon not found at $DEFAULT_ICON"
    exit 1
fi

# Function to resize using sips
resize_icon() {
    local src="$1"
    local dest="$2"
    local size="$3"

    cp "$src" "$dest"
    sips -z "$size" "$size" "$dest" --out "$dest" > /dev/null 2>&1
    echo "  Created: $(basename "$dest") ($size x $size)"
}

# ============================================
# iOS Icons
# ============================================
echo "Generating iOS icons..."

# 1024x1024 marketing icons
cp "$DEFAULT_ICON" "$IOS_ICONS/Icon-App-1024x1024@1x.png"
cp "$DARK_ICON" "$IOS_ICONS/Icon-App-1024x1024@1x-dark.png"
cp "$TINTED_ICON" "$IOS_ICONS/Icon-App-1024x1024@1x-tinted.png"

# Generate smaller sizes for default
for size in 20 29 40 60 76; do
    resize_icon "$DEFAULT_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@1x.png" "$size"
    resize_icon "$DEFAULT_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@2x.png" "$((size * 2))"
    resize_icon "$DEFAULT_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@3x.png" "$((size * 3))"

    resize_icon "$DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@1x-dark.png" "$size"
    resize_icon "$DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@2x-dark.png" "$((size * 2))"
    resize_icon "$DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@3x-dark.png" "$((size * 3))"

    resize_icon "$TINTED_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@1x-tinted.png" "$size"
    resize_icon "$TINTED_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@2x-tinted.png" "$((size * 2))"
    resize_icon "$TINTED_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@3x-tinted.png" "$((size * 3))"

    resize_icon "$TINTED_DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@1x-tinted-dark.png" "$size"
    resize_icon "$TINTED_DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@2x-tinted-dark.png" "$((size * 2))"
    resize_icon "$TINTED_DARK_ICON" "$IOS_ICONS/Icon-App-${size}x${size}@3x-tinted-dark.png" "$((size * 3))"
done

# 83.5@2x = 167
resize_icon "$DEFAULT_ICON" "$IOS_ICONS/Icon-App-83.5x83.5@2x.png" "167"
resize_icon "$DARK_ICON" "$IOS_ICONS/Icon-App-83.5x83.5@2x-dark.png" "167"
resize_icon "$TINTED_ICON" "$IOS_ICONS/Icon-App-83.5x83.5@2x-tinted.png" "167"
resize_icon "$TINTED_DARK_ICON" "$IOS_ICONS/Icon-App-83.5x83.5@2x-tinted-dark.png" "167"

echo "iOS icons complete!"
echo ""

# ============================================
# Android Icons
# ============================================
echo "Generating Android icons..."

# Android launcher icon sizes
# mipmap-mdpi: 48x48, mipmap-hdpi: 72x72, mipmap-xhdpi: 96x96
# mipmap-xxhdpi: 144x144, mipmap-xxxhdpi: 192x192
# Adaptive icon foreground sizes (108dp base): 108, 162, 216, 324, 432

generate_android_icons() {
    local density="$1"
    local size="$2"
    local adaptive_size="$3"
    local mipmap_dir="$ANDROID_ICONS/mipmap-$density"

    mkdir -p "$mipmap_dir"

    # Main launcher icon
    resize_icon "$DEFAULT_ICON" "$mipmap_dir/ic_launcher.png" "$size"

    # Foreground for adaptive icon
    resize_icon "$DEFAULT_ICON" "$mipmap_dir/ic_launcher_foreground.png" "$adaptive_size"

    # Monochrome for Android 13+
    resize_icon "$TINTED_DARK_ICON" "$mipmap_dir/ic_launcher_monochrome.png" "$adaptive_size"
}

generate_android_icons "mdpi" 48 108
generate_android_icons "hdpi" 72 162
generate_android_icons "xhdpi" 96 216
generate_android_icons "xxhdpi" 144 324
generate_android_icons "xxxhdpi" 192 432

echo "Android icons complete!"
echo ""

# ============================================
# macOS Icons
# ============================================
echo "Generating macOS icons..."

# macOS sizes: 16, 32, 128, 256, 512, 1024
for size in 16 32 128 256 512 1024; do
    resize_icon "$DEFAULT_ICON" "$MACOS_ICONS/app_icon_${size}.png" "$size"
    resize_icon "$DARK_ICON" "$MACOS_ICONS/app_icon_${size}_dark.png" "$size"
done

echo "macOS icons complete!"
echo ""

# ============================================
# Web / PWA Icons
# ============================================
echo "Generating web/PWA icons..."

# Favicon sizes
resize_icon "$DEFAULT_ICON" "$WEB_ICONS/favicon-96x96.png" "96"
resize_icon "$DEFAULT_ICON" "$WEB_ICONS/apple-touch-icon.png" "180"
resize_icon "$DEFAULT_ICON" "$WEB_ICONS/web-app-manifest-192x192.png" "192"
resize_icon "$DEFAULT_ICON" "$WEB_ICONS/web-app-manifest-512x512.png" "512"
resize_icon "$DEFAULT_ICON" "$WEB_ICONS/adaptive-icon-foreground.png" "432"
resize_icon "$TINTED_DARK_ICON" "$WEB_ICONS/adaptive-icon-monochrome.png" "432"

# Generate ICO file using ImageMagick
if command -v convert &> /dev/null; then
    # Create multi-size ICO
    convert "$DEFAULT_ICON" -resize 16x16 "$WEB_ICONS/favicon-16.png"
    convert "$DEFAULT_ICON" -resize 32x32 "$WEB_ICONS/favicon-32.png"
    convert "$DEFAULT_ICON" -resize 48x48 "$WEB_ICONS/favicon-48.png"
    convert "$WEB_ICONS/favicon-16.png" "$WEB_ICONS/favicon-32.png" "$WEB_ICONS/favicon-48.png" "$WEB_ICONS/favicon.ico"
    rm "$WEB_ICONS/favicon-16.png" "$WEB_ICONS/favicon-32.png" "$WEB_ICONS/favicon-48.png"
    echo "  Created: favicon.ico (multi-size)"
fi

echo "Web icons complete!"
echo ""

# ============================================
# Main app assets
# ============================================
echo "Updating main app assets..."
cp "$DEFAULT_ICON" "$ASSETS_DIR/app_icon.png"
cp "$DARK_ICON" "$ASSETS_DIR/app_icon_dark.png"
echo "  Updated: app_icon.png, app_icon_dark.png"

echo ""
echo "=== Icon generation complete! ==="
echo ""
echo "Generated icons for:"
echo "  - iOS (all sizes and variants)"
echo "  - Android (all densities)"
echo "  - macOS (all sizes)"
echo "  - Web/PWA (favicon, apple-touch-icon, manifest icons)"
