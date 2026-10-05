/*
 * Builds a single-file version of the app (CSS + JS inlined) for hosting anywhere
 * that wants one file: dist/index.html (full document) and dist/artifact.html
 * (body-only fragment used when publishing as a claude.ai Artifact).
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="styles.css"\s*\/?>/, () => `<style>\n${read('styles.css')}\n</style>`);
for (const f of ['core.js', 'seed.js', 'app.js']) {
  html = html.replace(new RegExp(`<script src="${f}"></script>`), () => `<script>\n${read(f)}\n</script>`);
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);

// Fragment: everything from <title> through the end of body, no document wrapper.
const start = html.indexOf('<title>');
const end = html.lastIndexOf('</body>');
const fragment = html.slice(start, end).replace(/<\/head>\s*<body[^>]*>/, '');
fs.writeFileSync(path.join(root, 'dist/artifact.html'), fragment);
console.log('wrote dist/index.html (%d KB) and dist/artifact.html (%d KB)', Math.round(html.length / 1024), Math.round(fragment.length / 1024));
