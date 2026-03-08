const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const routePath = path.join(rootDir, 'apps/asha-web/app/api/chat/route.ts');
const lambdaPath = path.join(rootDir, 'infra/chat-orchestrator/index.js');

console.log('🔄 Syncing AI logic from Next.js route to Lambda Orchestrator...');

try {
    const routeContent = fs.readFileSync(routePath, 'utf8');

    // Extract the normalization logic and system prompt
    // We look for the block starting with normalization and ending with the system prompt
    // The regex captures everything from the comment to the line defining 'system'
    const normalizationRegex = /\/\/ Normalize messages for Vercel AI SDK CoreMessage format[\s\S]*?const system = [\s\S]*?;/;
    const match = routeContent.match(normalizationRegex);

    if (!match) {
        throw new Error('Could not find normalization logic block in route.ts. Ensure the comment "// Normalize messages..." and "const system = ...;" exist.');
    }

    let sharedLogic = match[0];

    // Clean up TypeScript types and extra whitespace for Lambda
    sharedLogic = sharedLogic.replace(/: any/g, '');
    sharedLogic = sharedLogic.replace(/: string/g, '');

    // Update the Lambda file
    let lambdaContent = fs.readFileSync(lambdaPath, 'utf8');

    // Match the sync block INCLUDING its potential indentation
    const syncRegex = /^([ \t]*)\/\/ AI_LOGIC_SYNC_START[\s\S]*?\/\/ AI_LOGIC_SYNC_END/m;
    const lambdaMatch = lambdaContent.match(syncRegex);

    if (!lambdaMatch) {
        throw new Error('Could not find AI_LOGIC_SYNC markers in Lambda index.js');
    }

    const indent = lambdaMatch[1];

    // Find the base indentation of the shared logic to remove it before applying Lambda's indentation
    const lines = sharedLogic.split('\n');
    const firstLineIndent = lines[0].match(/^[ \t]*/)[0];

    const indentedLogic = lines.map(line => {
        if (line.trim() === '') return '';
        // Remove the existing base indentation and apply the target indentation
        const cleanLine = line.startsWith(firstLineIndent) ? line.substring(firstLineIndent.length) : line.trimStart();
        return indent + cleanLine;
    }).join('\n');

    const newContent = `${indent}// AI_LOGIC_SYNC_START\n${indentedLogic}\n${indent}// AI_LOGIC_SYNC_END`;

    lambdaContent = lambdaContent.replace(syncRegex, newContent);

    fs.writeFileSync(lambdaPath, lambdaContent);
    console.log('✅ Logic synced and formatted successfully!');

} catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
}
