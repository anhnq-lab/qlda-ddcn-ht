import fs from 'fs';
import path from 'path';

const sp = 'node_modules/@thatopen/fragments/dist/index.d.ts';
const fullPath = path.resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht', sp);

if (fs.existsSync(fullPath)) {
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Find "declare class FragmentsModel" and print lines around it
  const lines = content.split('\n');
  const index = lines.findIndex(line => line.includes('class FragmentsModel') || line.includes('interface FragmentsModel'));
  if (index !== -1) {
    console.log(`Found FragmentsModel at line ${index}`);
    console.log(lines.slice(index, index + 300).join('\n'));
  } else {
    console.log('FragmentsModel not found in index.d.ts');
  }
} else {
  console.log(`File not found: ${sp}`);
}
