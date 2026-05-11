const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Ks/Dm dự án.txt');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const statusCounts = {};
const accountantCounts = {};
const boardCounts = {};
const levelCounts = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split('\t');
  if (cols.length < 9) continue;
  
  const status = cols[8]?.trim();
  const accountant = cols[3]?.trim();
  const board = cols[4]?.trim();
  const level = cols[5]?.trim();
  
  statusCounts[status] = (statusCounts[status] || 0) + 1;
  accountantCounts[accountant] = (accountantCounts[accountant] || 0) + 1;
  boardCounts[board] = (boardCounts[board] || 0) + 1;
  levelCounts[level] = (levelCounts[level] || 0) + 1;
}

console.log('--- STATUS COUNTS ---');
console.log(statusCounts);
console.log('--- ACCOUNTANT COUNTS ---');
console.log(accountantCounts);
console.log('--- BOARD COUNTS ---');
console.log(boardCounts);
console.log('--- LEVEL COUNTS ---');
console.log(levelCounts);
