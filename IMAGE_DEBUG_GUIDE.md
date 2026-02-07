# Image Debug Guide

## What I Added

I've added comprehensive debugging tools and **Vercel fixes** for "undefined" / invalid image src.

### Vercel fix (in image-debug.js)
- **Blocks invalid src**: `undefined`, `"undefined"`, empty, or paths containing `"undefined"` (fixes "some pictures undefined" on Vercel).
- **Normalizes paths**: Ensures `/images/` (lowercase), leading slash; `/Images/` → `/images/`.
- **Hides bad imgs**: Invalid src → img hidden, not requested; console: `🛑 Blocked invalid image src (Vercel fix): ...`

### Debug Scripts Added:

1. **`image-debug.js`** - Monitors all image loading attempts
2. **`image-error-handler.js`** - Catches and logs image errors
3. **`image-debug-panel.js`** - Visual debug panel on the page

## How to Use

### 1. Open Browser Console
- Press `F12` or right-click → "Inspect" → "Console" tab
- You'll see detailed logs for every image load attempt

### 2. Visual Debug Panel
- A debug panel appears in the top-right corner
- Press `F2` to toggle it on/off
- Shows:
  - Total image load attempts
  - Successful loads
  - Failed loads
  - List of all failed image paths

### 3. Console Commands

In the browser console, you can run:

```javascript
// Get summary of image loading
window.getImageDebugInfo()

// Get detailed info
window.imageDebug.getInfo()

// See all failed images
window.imageDebug.failures()

// See all successful images
window.imageDebug.success()
```

## What to Look For

When images fail, check the console for:

1. **Image paths** - Are they using `/images/` or `/Images/`?
2. **Case sensitivity** - Does the path match the actual filename exactly?
3. **File extensions** - Are they `.png`, `.jpg`, etc.?
4. **Full URLs** - Check if the full URL is correct

## Common Issues

### Issue 1: Case Sensitivity
- **Problem**: `/Images/1.png` vs `/images/1.png`
- **Solution**: The middleware should auto-redirect, but check console logs

### Issue 2: Wrong Path
- **Problem**: Image path doesn't match actual file location
- **Solution**: Check console logs to see what path is being requested

### Issue 3: Missing Files
- **Problem**: File doesn't exist in `public/images/`
- **Solution**: Verify file exists with correct name

## Next Steps

1. **Deploy to Vercel** with these debug scripts
2. **Open the site** and check the console
3. **Share the console output** with me so I can fix the specific issues
4. **Look at the debug panel** to see which images are failing

## What to Share With Me

When you see errors, please share:

1. **Console output** - Copy all the image-related logs
2. **Failed image paths** - From the debug panel or `window.imageDebug.failures()`
3. **Any error messages** - Especially 404 errors

This will help me identify the exact problem and fix it!
