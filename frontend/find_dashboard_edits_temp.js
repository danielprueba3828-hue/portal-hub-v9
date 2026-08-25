import fs from 'fs';
import readline from 'readline';

const logFile = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\4bb4a167-137f-41f6-9ea5-a43c5dd91cbe\\.system_generated\\logs\\transcript_full.jsonl';

const fileStream = fs.createReadStream(logFile);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

for await (const line of rl) {
  const step = JSON.parse(line);
  if (step.tool_calls) {
    for (const tool of step.tool_calls) {
      if (tool.name === 'replace_file_content' || tool.name === 'multi_replace_file_content' || tool.name === 'write_to_file') {
        const file = tool.args.TargetFile || '';
        if (file.includes('Dashboard.jsx')) {
          console.log(`\n==================================================`);
          console.log(`STEP ${step.step_index} | TYPE: ${tool.name}`);
          console.log(`==================================================`);
          console.log(JSON.stringify(tool.args, null, 2));
        }
      }
    }
  }
}
process.exit(0);
