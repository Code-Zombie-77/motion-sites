import fs from 'node:fs';
import { BOOKS, PRICE, SAMPLE } from '../src/data/books';

// Read fonts or embed Google Fonts link / CSS + complete standalone vanilla HTML/CSS/JS
const booksJson = JSON.stringify(BOOKS, null, 2);
const priceJson = JSON.stringify(PRICE, null, 2);
const sampleJson = JSON.stringify(SAMPLE, null, 2);

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Wendland Bibliothek</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Playfair+Display:wght@900&display=block" rel="stylesheet" />
<style>
:root {
  --paper: #ECE8E0;
  --sheet: #F3F0EA;
  --ink: #141414;
  --muted: #6D6A63;
  --accent: #8B1E2D;
  --gold: #B08D3C;
  --rule: rgba(20, 20, 20, 0.9);
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --H: min(46vh, 30vw);
  --cy: 41%;
}
@media (max-width: 767px) {
  :root {
    --H: min(62vw, 38svh);
    --cy: 43%;
  }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%; height: 100%;
  background: var(--paper); color: var(--ink);
  overflow: hidden; user-select: none;
  -webkit-font-smoothing: antialiased;
  font-family: "Inter Tight", system-ui, sans-serif;
}
@media (pointer: fine) and (min-width: 768px) {
  html, body, a, button { cursor: none !important; }
}
.lbl {
  font-family: "Inter Tight", system-ui, sans-serif;
  font-weight: 600; font-size: 10.5px; line-height: 1;
  letter-spacing: 0.14em; text-transform: uppercase;
}
.box {
  display: inline-flex; align-items: center;
  height: 21px; padding: 0 8px;
  border: 1px solid var(--rule);
  background: transparent;
}
</style>
</head>
<body>
<script>
const BOOKS = ${booksJson};
const PRICE = ${priceJson};
const SAMPLE = ${sampleJson};
// Redirect or mount standalone archive if opened directly
if (window.location.pathname.endsWith('wendland-bibliothek.html')) {
  window.location.replace('/');
}
</script>
</body>
</html>`;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/wendland-bibliothek.html', html, 'utf8');
fs.writeFileSync('wendland-bibliothek.html', html, 'utf8');
console.log('Generated wendland-bibliothek.html');
