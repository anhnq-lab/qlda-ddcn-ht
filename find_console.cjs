const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Personal\\.gemini\\antigravity\\brain\\8676b731-2621-4539-8691-ce6563871f0f\\.system_generated\\logs\\transcript.jsonl', 'utf8');
content.split('\n').forEach((line, i) => {
    if (line.trim()) {
        try {
            const data = JSON.parse(line);
            if (line.includes('AlignmentType') && data.type !== 'PLANNER_RESPONSE' && data.type !== 'MCP_TOOL') {
                console.log(`Step ${data.step_index} (${data.type}):`, line.substring(0, 1000));
            }
        } catch (e) {
            // ignore
        }
    }
});
