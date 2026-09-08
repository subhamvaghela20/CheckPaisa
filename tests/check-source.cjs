const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
const files = ['App.js', ...walk('src')].filter((file) => file.endsWith('.js'));
for (const file of files) parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
console.log(`Parsed ${files.length} JavaScript / JSX files.`);
