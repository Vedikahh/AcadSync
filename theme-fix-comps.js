const fs = require('fs');
const path = require('path');

const compsDir = path.join(__dirname, 'frontend', 'src', 'components');

function replaceColors(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace background: #fff / #ffffff with background: var(--bg-card)
  content = content.replace(/background(-color)?:\s*(#fff|#ffffff)/gi, 'background$1: var(--bg-card)');
  
  // Replace background: #F8FAFC with background: var(--bg-page)
  content = content.replace(/background(-color)?:\s*#F8FAFC/gi, 'background$1: var(--bg-page)');

  // Replace border-color: #E2E8F0 with border-color: var(--border)
  content = content.replace(/border(-color)?:\s*(.+?)?\s*#E2E8F0/gi, 'border$1: $2 var(--border)');

  // Replace color: #000 or similar with var(--text-primary)
  content = content.replace(/color:\s*#0F172A/gi, 'color: var(--text-primary)');
  content = content.replace(/color:\s*#475569/gi, 'color: var(--text-secondary)');
  content = content.replace(/color:\s*#94A3B8/gi, 'color: var(--text-muted)');

  fs.writeFileSync(file, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      replaceColors(fullPath);
      console.log(`Updated ${file}`);
    }
  }
}

console.log('Starting color fixes in components...');
walkDir(compsDir);
console.log('Done!');
