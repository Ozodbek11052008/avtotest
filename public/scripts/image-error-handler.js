/**
 * Image Error Handler
 * This script adds global error handlers for images and logs all failures
 */

console.log('🛡️ Image Error Handler Loaded');

// Global error handler for images
window.addEventListener('error', function(event) {
    if (event.target && event.target.tagName === 'IMG') {
        const img = event.target;
        const src = img.src || img.getAttribute('src');
        
        console.error('🚨 IMAGE ERROR DETECTED:', {
            'Image Source': src,
            'Full URL': img.src,
            'Current Location': window.location.href,
            'Image Element': img,
            'Error Event': event
        });
        
        // Try to find the image in public/images
        if (src) {
            const imagePath = src.split('/images/')[1] || src.split('/Images/')[1];
            if (imagePath) {
                console.error('   📁 Image path:', imagePath);
                console.error('   💡 Try accessing: /images/' + imagePath);
            }
        }
    }
}, true); // Use capture phase

// Monitor all img tags on the page
function monitorAllImages() {
    const images = document.querySelectorAll('img');
    console.log('🔍 Found', images.length, 'image elements on page');
    
    images.forEach(function(img, index) {
        const src = img.src || img.getAttribute('src');
        console.log(`   Image ${index + 1}:`, src);
        
        // Add error handler to each image
        img.addEventListener('error', function(e) {
            console.error(`❌ Image ${index + 1} failed:`, {
                src: src,
                fullSrc: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete
            });
        });
        
        // Log when image loads
        img.addEventListener('load', function() {
            console.log(`✅ Image ${index + 1} loaded:`, src);
        });
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorAllImages);
} else {
    monitorAllImages();
}

// Also monitor dynamically added images
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.tagName === 'IMG') {
                const src = node.src || node.getAttribute('src');
                console.log('🆕 New image added:', src);
                
                node.addEventListener('error', function(e) {
                    console.error('❌ New image failed:', {
                        src: src,
                        fullSrc: node.src
                    });
                });
                
                node.addEventListener('load', function() {
                    console.log('✅ New image loaded:', src);
                });
            }
        });
    });
});

if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} else {
    document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

console.log('✅ Image Error Handler Ready!');
