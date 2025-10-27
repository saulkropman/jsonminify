// Node.js test script to verify optimization logic
const fs = require('fs');

// Read test file
const testData = JSON.parse(fs.readFileSync('test-example.json', 'utf8'));

// Token counting approximation (roughly 4 characters = 1 token)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Remove fields recursively
function removeFields(obj, fieldsToRemove) {
    if (Array.isArray(obj)) {
        return obj.map(item => removeFields(item, fieldsToRemove));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (!fieldsToRemove.includes(key)) {
                newObj[key] = removeFields(obj[key], fieldsToRemove);
            }
        }
        return newObj;
    }
    return obj;
}

// Replace imageUrl values recursively
function replaceImageUrls(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => replaceImageUrls(item));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (key === 'imageUrl' && typeof obj[key] === 'string') {
                newObj[key] = '[removed]';
            } else {
                newObj[key] = replaceImageUrls(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

// Deduplicate messages (system and assistant)
function deduplicateMessages(data) {
    if (!data.messages || !Array.isArray(data.messages)) {
        return data;
    }

    const systemContentMap = new Map();
    const assistantContentMap = new Map();
    let systemCounter = 0;
    let assistantCounter = 0;

    const optimizedMessages = data.messages.map(msg => {
        // Handle system message deduplication
        if (msg.role === 'system' && msg.content) {
            const content = msg.content;

            if (systemContentMap.has(content)) {
                // This is a duplicate, use reference
                return {
                    role: 'system',
                    contentRef: systemContentMap.get(content)
                };
            } else {
                // First occurrence, create ID
                const id = `sys_${systemCounter++}`;
                systemContentMap.set(content, id);
                return {
                    ...msg,
                    _id: id
                };
            }
        }

        // Handle assistant message deduplication
        if (msg.role === 'assistant' && msg.content) {
            const content = msg.content;

            if (assistantContentMap.has(content)) {
                // This is a duplicate, use reference
                return {
                    role: 'assistant',
                    contentRef: assistantContentMap.get(content)
                };
            } else {
                // First occurrence, create ID
                const id = `asst_${assistantCounter++}`;
                assistantContentMap.set(content, id);
                return {
                    ...msg,
                    _id: id
                };
            }
        }

        // Return other messages as-is
        return msg;
    });

    return {
        ...data,
        messages: optimizedMessages
    };
}

// Main optimization function
function optimizeJSON(data) {
    let optimized = { ...data };

    // Step 1: Remove chatStart field
    if ('chatStart' in optimized) {
        delete optimized.chatStart;
    }

    // Step 2: Strip image data
    optimized = replaceImageUrls(optimized);

    // Step 3: Deduplicate messages (system and assistant)
    optimized = deduplicateMessages(optimized);

    // Step 4: Remove id and sessionId fields (but preserve _id from deduplication)
    const fieldsToRemove = ['id', 'sessionId'];
    optimized = removeFields(optimized, fieldsToRemove);

    return optimized;
}

// Test the optimization
console.log('Original JSON:');
const originalJSON = JSON.stringify(testData, null, 2);
console.log(originalJSON);
console.log('\n' + '='.repeat(80) + '\n');

const optimized = optimizeJSON(testData);
const optimizedJSON = JSON.stringify(optimized);

console.log('Optimized JSON:');
console.log(optimizedJSON);
console.log('\n' + '='.repeat(80) + '\n');

// Pretty print for verification
console.log('Optimized JSON (pretty):');
console.log(JSON.stringify(optimized, null, 2));
console.log('\n' + '='.repeat(80) + '\n');

// Calculate token reduction
const originalTokens = estimateTokens(originalJSON);
const optimizedTokens = estimateTokens(optimizedJSON);
const reduction = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);

console.log('Statistics:');
console.log(`Original tokens: ${originalTokens}`);
console.log(`Optimized tokens: ${optimizedTokens}`);
console.log(`Reduction: ${reduction}%`);
