const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && !full.includes('node_modules')) {
      files = files.concat(getAllFiles(full));
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      files.push(full);
    }
  });
  return files;
}

const files = getAllFiles('./app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes("import { createClient } from '@/app/lib/supabase'") &&
      !content.includes("const supabase = createClient()")) {
    content = content.replace(
      /const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{/g,
      (match) => `${match}\n    const supabase = createClient();`
    );
    content = content.replace(
      /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
      (match) => `${match}\n  const supabase = createClient();`
    );
    fs.writeFileSync(file, content);
    changed = true;
    console.log('Updated:', file);
  }
});

console.log('Done!');