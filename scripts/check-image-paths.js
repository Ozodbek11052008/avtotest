/**
 * Script to check for case sensitivity issues in image paths
 * Run this before deploying to identify potential issues
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'public', 'images');

function checkImageFiles(dir, basePath = '') {
    const issues = [];
    
    if (!fs.existsSync(dir)) {
        console.log('Images directory not found:', dir);
        return issues;
    }
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relativePath = path.join(basePath, file.name);
        
        if (file.isDirectory()) {
            // Recursively check subdirectories
            issues.push(...checkImageFiles(fullPath, relativePath));
        } else if (file.isFile()) {
            // Check if filename has uppercase letters (potential case sensitivity issue)
            if (file.name !== file.name.toLowerCase()) {
                issues.push({
                    path: relativePath,
                    issue: 'Filename contains uppercase letters',
                    suggestion: `Rename to: ${file.name.toLowerCase()}`
                });
            }
            
            // Check for spaces or special characters
            if (file.name.includes(' ') || /[^a-zA-Z0-9._-]/.test(file.name)) {
                issues.push({
                    path: relativePath,
                    issue: 'Filename contains spaces or special characters',
                    suggestion: 'Use only alphanumeric characters, dots, dashes, and underscores'
                });
            }
        }
    }
    
    return issues;
}

console.log('Checking image files for case sensitivity issues...\n');
const issues = checkImageFiles(imagesDir);

if (issues.length === 0) {
    console.log('✅ No case sensitivity issues found!');
} else {
    console.log(`⚠️  Found ${issues.length} potential issue(s):\n`);
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.path}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Suggestion: ${issue.suggestion}\n`);
    });
}

process.exit(issues.length > 0 ? 1 : 0);
