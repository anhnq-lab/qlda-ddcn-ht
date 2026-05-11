const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Ks/Dm dự án.txt');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const samples = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split('\t');
  if (cols.length < 9) continue;
  
  const status = cols[8]?.trim();
  const projectName = cols[2]?.trim();
  const projectId = cols[1]?.trim();
  
  if (!samples[status]) {
    samples[status] = [];
  }
  if (samples[status].length < 2) {
    samples[status].push({ projectId, projectName });
  }
}

console.log(JSON.stringify(samples, null, 2));
