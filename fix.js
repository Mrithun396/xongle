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
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import { supabase } from '@/app/lib/supabase'")) {
    content = content.replace(
      "import { supabase } from '@/app/lib/supabase'",
      "import { createClient } from '@/app/lib/supabase'"
    );
    fs.writeFileSync(file, content);
    count++;
    console.log('Updated:', file);
  }
});

console.log('Done! Updated', count, 'files');