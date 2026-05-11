const fs = require('fs');
const buf = fs.readFileSync('d:\\QuocAnh\\2026\\01.Project\\qlda-ddcn-ht\\Quyche_lamviec.md');
console.log('Total bytes:', buf.length);
console.log('First 100 bytes in hex:', buf.slice(0, 100).toString('hex'));
console.log('First 100 bytes as string UTF-16LE:', buf.slice(0, 100).toString('utf16le'));
console.log('First 100 bytes as string UTF-8:', buf.slice(0, 100).toString('utf8'));
