import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const rbcPath = 'd:\\QuocAnh\\2026\\01.Project\\qlda-ddcn-ht\\node_modules\\react-big-calendar';
if (fs.existsSync(rbcPath)) {
  walkDir(rbcPath, (filePath) => {
    if (filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('weeknumber') || content.toLowerCase().includes('week-number')) {
        console.log('Found week number reference in:', filePath);
      }
    }
  });
} else {
  console.log('react-big-calendar path does not exist');
}
