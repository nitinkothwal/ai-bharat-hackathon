const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Load the compiled template definition
const template = require('./src/index');

// Write the template to dist/template.json
const outputPath = path.join(distDir, 'template.json');
fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));

console.log(`CloudFormation template compiled successfully to: ${outputPath}`);
