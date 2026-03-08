const fs = require('fs');
const path = require('path');

const template = require('./src/index.js');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const outputPath = path.join(distDir, 'template.json');
fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));

console.log(`CloudFormation template generated at: ${outputPath}`);
