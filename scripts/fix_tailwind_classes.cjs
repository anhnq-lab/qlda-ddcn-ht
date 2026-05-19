const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['components', 'features'];
const PROJECT_ROOT = path.resolve(__dirname, '..');

const rules = [
  {
    name: 'dark:bg-slate-8000 -> dark:bg-slate-800',
    regex: /dark:bg-slate-8000(?=[\s"'`}]|$)/g,
    replace: 'dark:bg-slate-800'
  },
  {
    name: 'dark:bg-slate- -> dark:bg-slate-800',
    regex: /dark:bg-slate-(?=[\s"'`}]|$)/g,
    replace: 'dark:bg-slate-800'
  },
  {
    name: 'bg-slate- -> bg-slate-50 (not preceded by dark:)',
    regex: /(?<!dark:)bg-slate-(?=[\s"'`}]|$)/g,
    replace: 'bg-slate-50'
  },
  {
    name: 'dark:hover:bg-slate- -> dark:hover:bg-slate-700',
    regex: /dark:hover:bg-slate-(?=[\s"'`}]|$)/g,
    replace: 'dark:hover:bg-slate-700'
  },
  {
    name: 'hover:bg-slate- -> hover:bg-slate-100 (not preceded by dark:)',
    regex: /(?<!dark:)hover:bg-slate-(?=[\s"'`}]|$)/g,
    replace: 'hover:bg-slate-100'
  },
  {
    name: 'dark:border-slate- -> dark:border-slate-700',
    regex: /dark:border-slate-(?=[\s"'`}]|$)/g,
    replace: 'dark:border-slate-700'
  },
  {
    name: 'border-slate- -> border-slate-200 (not preceded by dark:)',
    regex: /(?<!dark:)border-slate-(?=[\s"'`}]|$)/g,
    replace: 'border-slate-200'
  }
];

let totalFilesModified = 0;
let totalMatches = 0;

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileMatches = 0;

  for (const rule of rules) {
    const matches = content.match(rule.regex);
    if (matches) {
      fileMatches += matches.length;
      content = content.replace(rule.regex, rule.replace);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFilesModified++;
    totalMatches += fileMatches;
    console.log(`[MODIFIED] ${path.relative(PROJECT_ROOT, filePath)} (${fileMatches} replacements)`);
  }
}

function run() {
  console.log('Starting Tailwind CSS class standardization...');
  
  for (const dir of DIRECTORIES) {
    const fullDirPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullDirPath)) {
      console.log(`Scanning directory: ${dir}`);
      processDirectory(fullDirPath);
    }
  }

  console.log('\n--- Standardization Complete ---');
  console.log(`Total files modified: ${totalFilesModified}`);
  console.log(`Total replacements made: ${totalMatches}`);
}

run();
