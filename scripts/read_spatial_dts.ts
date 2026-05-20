import fs from 'fs';
import path from 'path';

const sp = 'node_modules/@thatopen/fragments/dist/index.d.ts';
const fullPath = path.resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht', sp);

if (fs.existsSync(fullPath)) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const index = lines.findIndex(line => line.includes('interface SpatialTreeItem') || line.includes('type SpatialTreeItem'));
  if (index !== -1) {
    console.log(`Found SpatialTreeItem at line ${index}`);
    console.log(lines.slice(index, index + 30).join('\n'));
  } else {
    console.log('SpatialTreeItem not found in index.d.ts');
  }
} else {
  console.log(`File not found: ${sp}`);
}
