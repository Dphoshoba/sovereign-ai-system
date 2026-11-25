const fs = require('fs');
const path = require('path');

const forbiddenPatterns = [
  { pattern: /Math\.random\(\)/, name: 'Math.random()' },
  { pattern: /Date\.now\(\)/, name: 'Date.now()' },
  { pattern: /new Date\(\)/, name: 'new Date()' },
  { pattern: /crypto\.randomUUID/, name: 'crypto.randomUUID' },
  { pattern: /localStorage/, name: 'localStorage' },
  { pattern: /sessionStorage/, name: 'sessionStorage' },
  { pattern: /window\./, name: 'window.' },
  { pattern: /document\./, name: 'document.' },
];

const dir = path.join(process.cwd(), 'lib', 'gamma');
const violations = new Map();

const files = fs.readdirSync(dir, { recursive: true });

files.forEach((file) => {
  if (typeof file !== 'string') return;
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;

  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileViolations = [];

  lines.forEach((line, lineNum) => {
    forbiddenPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        fileViolations.push(`Line ${lineNum + 1}: ${name} - ${line.trim()}`);
      }
    });
  });

  if (fileViolations.length > 0) {
    violations.set(filePath, fileViolations);
  }
});

console.log(`Found ${violations.size} files with violations:\n`);
violations.forEach((lines, file) => {
  console.log(`${file}:`);
  lines.forEach((l) => console.log(`  ${l}`));
  console.log('');
});
