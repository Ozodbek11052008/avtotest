/**
 * Visual Debug Panel
 * Shows image loading status on the page itself
 */

console.log('📊 Image Debug Panel Loading...');

function createDebugPanel() {
    // Create panel container
    const panel = document.createElement('div');
    panel.id = 'image-debug-panel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        padding: 15px;
        border: 2px solid #0f0;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 99999;
        display: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 14px;';
    header.textContent = '🖼️ Image Debug Panel (Press F2 to toggle)';
    
    const stats = document.createElement('div');
    stats.id = 'image-debug-stats';
    stats.style.cssText = 'margin-bottom: 10px;';
    
    const failedList = document.createElement('div');
    failedList.id = 'image-debug-failed';
    failedList.style.cssText = 'max-height: 300px; overflow-y: auto;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'margin-top: 10px; padding: 5px 10px; cursor: pointer;';
    closeBtn.onclick = () => panel.style.display = 'none';
    
    panel.appendChild(header);
    panel.appendChild(stats);
    panel.appendChild(document.createElement('hr'));
    panel.appendChild(document.createElement('div')).textContent = 'Failed Images:';
    panel.appendChild(failedList);
    panel.appendChild(closeBtn);
    
    document.body.appendChild(panel);
    
    // Toggle with F2 key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F2') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // Update panel every second
    setInterval(updatePanel, 1000);
    
    // Show panel initially
    panel.style.display = 'block';
}

function updatePanel() {
    const statsDiv = document.getElementById('image-debug-stats');
    const failedDiv = document.getElementById('image-debug-failed');
    
    if (!statsDiv || !failedDiv) return;
    
    // Get debug info
    let info = { attempts: 0, success: 0, failures: 0, failedImages: [] };
    if (window.getImageDebugInfo) {
        info = window.getImageDebugInfo();
    } else if (window.imageDebug) {
        const failures = window.imageDebug.failures();
        const success = window.imageDebug.success();
        const attempts = window.imageDebug.attempts();
        info = {
            attempts: attempts.length,
            success: success.length,
            failures: failures.length,
            failedImages: failures.map(f => f.path)
        };
    }
    
    // Update stats
    const successRate = info.attempts > 0 ? ((info.success / info.attempts) * 100).toFixed(1) : '0';
    statsDiv.innerHTML = `
        <div>📊 Total Attempts: <strong>${info.attempts}</strong></div>
        <div style="color: #0f0;">✅ Successful: <strong>${info.success}</strong></div>
        <div style="color: #f00;">❌ Failed: <strong>${info.failures}</strong></div>
        <div>📈 Success Rate: <strong>${successRate}%</strong></div>
    `;
    
    // Update failed images list
    if (info.failedImages && info.failedImages.length > 0) {
        failedDiv.innerHTML = info.failedImages.map((path, index) => {
            return `<div style="margin: 5px 0; padding: 5px; background: rgba(255,0,0,0.2); border-left: 3px solid #f00;">
                ${index + 1}. ${path}
            </div>`;
        }).join('');
    } else {
        failedDiv.innerHTML = '<div style="color: #0f0;">✅ No failed images!</div>';
    }
}

// Create panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDebugPanel);
} else {
    createDebugPanel();
}

console.log('✅ Image Debug Panel Ready! Press F2 to toggle visibility');
