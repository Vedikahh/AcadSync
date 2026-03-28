const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function fixLightColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds & Gradients
  content = content.replace(/background:\s*#EFF6FF/gi, 'background: var(--blue-50, #EFF6FF)');
  content = content.replace(/background(-color)?:\s*#DBEAFE/gi, 'background$1: var(--blue-100, #DBEAFE)');
  content = content.replace(/background(-color)?:\s*#F0FDF4/gi, 'background$1: var(--green-50, #F0FDF4)');
  content = content.replace(/background(-color)?:\s*#DCFCE7/gi, 'background$1: var(--green-100, #DCFCE7)');
  content = content.replace(/background(-color)?:\s*#FEF2F2/gi, 'background$1: var(--red-50, #FEF2F2)');
  content = content.replace(/background(-color)?:\s*#FEE2E2/gi, 'background$1: var(--red-100, #FEE2E2)');
  content = content.replace(/background(-color)?:\s*#FEF9C3/gi, 'background$1: var(--yellow-50, #FEF9C3)');
  content = content.replace(/background(-color)?:\s*#FFF7ED/gi, 'background$1: var(--orange-50, #FFF7ED)');
  content = content.replace(/background(-color)?:\s*#E0E7FF/gi, 'background$1: var(--indigo-50, #E0E7FF)');
  content = content.replace(/background(-color)?:\s*#F1F5F9/gi, 'background$1: var(--bg-page)');
  content = content.replace(/background(-color)?:\s*#E2E8F0/gi, 'background$1: var(--border-light)');
  content = content.replace(/background:\s*linear-gradient\(180deg,\s*#fff,\s*#F8FAFC\)/gi, 'background: var(--bg-card)');

  content = content.replace(/background:\s*#EFF6FF\s*!important/gi, 'background: var(--blue-50) !important');
  content = content.replace(/background:\s*#E8F2FF\s*!important/gi, 'background: var(--blue-100) !important');

  // Borders
  content = content.replace(/border(-color|-top|-bottom|-left|-right)?:\s*(.*?)(#E2E8F0|#CBD5E1|#F1F5F9)/gi, 'border$1: $2var(--border)');
  content = content.replace(/border-(color|top|bottom|-left|-right)?:\s*#DBEAFE/gi, 'border-$1: var(--blue-100)');
  content = content.replace(/border-(color|top|bottom|-left|-right)?:\s*#FEE2E2/gi, 'border-$1: var(--red-100)');
  
  // Specific components colors
  content = content.replace(/color:\s*#CBD5E1/g, 'color: var(--text-muted)');
  content = content.replace(/color:\s*#64748B/g, 'color: var(--text-secondary)');
  content = content.replace(/background:\s*linear-gradient\(130deg,\s*#FFFFFF\s*0%,\s*#F8FAFC\s*100%\)/g, 'background: var(--bg-card)');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      fixLightColors(fullPath);
    }
  }
}

console.log('Starting secondary color fixes...');
walkDir(srcDir);
console.log('Done!');
