/**
 * Image Debug Script + Cloudinary Fetch
 * - Monitors all image loading attempts and logs to console
 * - Blocks "undefined" / invalid image src (fixes Vercel vs localhost)
 * - Transforms local image paths to Cloudinary URLs (fetch from cloud, not local)
 */

console.log('🔍 Image Debug Script Loaded');

// Cloudinary base URL - images fetched from here instead of local /images/
const CLOUDINARY_BASE = 'https://res.cloudinary.com/da51nlisj/image/upload/v1769705101/ml_default/';

// Track all image loading attempts
const imageLoadAttempts = [];
const imageLoadSuccess = [];
const imageLoadFailures = [];

/** Returns false if src is undefined, "undefined", empty, or contains "undefined" */
function isValidImageSrc(src) {
    if (src == null) return false;
    const s = String(src).trim();
    if (s === '' || s === 'undefined') return false;
    if (s.toLowerCase().includes('undefined')) return false;
    return true;
}

/** Extract filename from path: /images/10.png -> 10.png, images/10.png -> 10.png, 10.png -> 10.png */
function getImageFilename(path) {
    const s = String(path).trim();
    const parts = s.split(/[/\\]/);
    return parts[parts.length - 1] || s;
}

/** Transform local image path to Cloudinary URL. Full URLs and data URLs unchanged. Returns null if invalid. */
function normalizeImageSrc(src) {
    if (!isValidImageSrc(src)) return null;
    let s = String(src).trim();
    // Keep full URLs (http/https) and data URLs as-is
    if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
    // Transform local paths to Cloudinary: extract filename and prefix with Cloudinary base
    const filename = getImageFilename(s);
    if (!filename || filename === '.' || filename === '..') return null;
    return CLOUDINARY_BASE + filename;
}

/** Hide img and log when we block invalid src */
function blockInvalidSrc(img, raw) {
    img.style.display = 'none';
    img.setAttribute('data-image-fix-blocked', 'true');
    console.warn('🛑 Blocked invalid image src (Vercel fix):', raw);
}

// Override Image constructor to intercept image creation
const OriginalImage = window.Image;
window.Image = function(...args) {
    const img = new OriginalImage(...args);
    trackImage(img);
    return img;
};

// Track images created via createElement
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName, ...args) {
    const element = originalCreateElement(tagName, ...args);
    if (tagName.toLowerCase() === 'img') {
        trackImage(element);
    }
    return element;
};

// Function to track an image element
function trackImage(img) {
    if (img.nodeType !== 1 || !img.tagName || img.tagName.toLowerCase() !== 'img') return;
    if (img.getAttribute && img.getAttribute('data-image-tracked') === 'true') return;
    if (img.setAttribute) img.setAttribute('data-image-tracked', 'true');

    const imageInfo = {
        element: img,
        src: null,
        attemptedSrc: [],
        status: 'pending',
        error: null,
        timestamp: Date.now()
    };

    // Fix already-set src (e.g. from innerHTML) before we override
    const existing = (typeof img.src !== 'undefined' ? img.src : null) || img.getAttribute('src');
    if (existing && !isValidImageSrc(existing)) {
        img.removeAttribute('src');
        blockInvalidSrc(img, existing);
    }

    // Override src setter to track and fix; use native setAttribute to actually load
    const nativeSetAttribute = HTMLImageElement.prototype.setAttribute;
    let currentSrc = '';
    Object.defineProperty(img, 'src', {
        get: function() {
            return currentSrc;
        },
        set: function(newSrc) {
            const normalized = normalizeImageSrc(newSrc);
            if (normalized === null) {
                blockInvalidSrc(img, newSrc);
                return;
            }
            currentSrc = normalized;
            imageInfo.src = normalized;
            imageInfo.attemptedSrc.push(normalized);

            console.log('📸 Image src set:', normalized);
            imageLoadAttempts.push({
                path: normalized,
                timestamp: Date.now(),
                element: img
            });

            img.addEventListener('load', function onLoad() {
                img.removeEventListener('load', onLoad);
                imageInfo.status = 'success';
                imageLoadSuccess.push({
                    path: normalized,
                    timestamp: Date.now(),
                    element: img
                });
                console.log('✅ Image loaded successfully:', normalized);
            });

            img.addEventListener('error', function onError(error) {
                img.removeEventListener('error', onError);
                imageInfo.status = 'error';
                imageInfo.error = error;
                imageLoadFailures.push({
                    path: normalized,
                    timestamp: Date.now(),
                    element: img,
                    error: error
                });
                console.error('❌ Image failed to load:', normalized);
                console.error('   Full URL:', img.src || normalized);
                console.error('   Error details:', error);
            });

            // Actually load the image (bypass our override)
            nativeSetAttribute.call(img, 'src', normalized);
        }
    });

    const originalSetAttribute = img.setAttribute.bind(img);
    img.setAttribute = function(name, value) {
        if (name === 'src') {
            img.src = value;
            return; // we already load via nativeSetAttribute in setter, or we blocked
        }
        return originalSetAttribute(name, value);
    };
}

// Monitor innerHTML changes that might contain images
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Check if it's an img element
                    if (node.tagName && node.tagName.toLowerCase() === 'img') {
                        trackImage(node);
                    }
                    // Check for img elements inside
                    const images = node.querySelectorAll && node.querySelectorAll('img');
                    if (images) {
                        images.forEach(trackImage);
                    }
                }
            });
        }
    });
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
} else {
    startObserving();
}

function startObserving() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    console.log('👀 Started observing DOM for image changes');
}

// Monitor network requests for images
if ('PerformanceObserver' in window) {
    try {
        const perfObserver = new PerformanceObserver(function(list) {
            for (const entry of list.getEntries()) {
                if (entry.name && (entry.name.includes('.png') || entry.name.includes('.jpg') || entry.name.includes('.jpeg') || entry.name.includes('.gif'))) {
                    console.log('🌐 Network request:', {
                        url: entry.name,
                        type: entry.initiatorType,
                        duration: entry.duration + 'ms',
                        size: entry.transferSize ? (entry.transferSize / 1024).toFixed(2) + ' KB' : 'unknown'
                    });
                }
            }
        });
        perfObserver.observe({ entryTypes: ['resource'] });
        console.log('📡 Started monitoring network requests');
    } catch (e) {
        console.warn('Could not set up PerformanceObserver:', e);
    }
}

// Add global function to get debug info
window.getImageDebugInfo = function() {
    return {
        attempts: imageLoadAttempts.length,
        success: imageLoadSuccess.length,
        failures: imageLoadFailures.length,
        failedImages: imageLoadFailures.map(f => f.path),
        successfulImages: imageLoadSuccess.map(s => s.path),
        allAttempts: imageLoadAttempts.map(a => a.path)
    };
};

// Log summary every 5 seconds
setInterval(function() {
    const info = window.getImageDebugInfo();
    if (info.attempts > 0) {
        console.log('📊 Image Loading Summary:', {
            'Total Attempts': info.attempts,
            'Successful': info.success,
            'Failed': info.failures,
            'Success Rate': info.attempts > 0 ? ((info.success / info.attempts) * 100).toFixed(2) + '%' : '0%'
        });
        
        if (info.failures > 0) {
            console.warn('⚠️ Failed Images:', info.failedImages);
        }
    }
}, 5000);

// Export to window for easy access
window.imageDebug = {
    getInfo: window.getImageDebugInfo,
    attempts: () => imageLoadAttempts,
    success: () => imageLoadSuccess,
    failures: () => imageLoadFailures
};

console.log('✅ Image Debug Script Ready! Use window.getImageDebugInfo() to see stats');
