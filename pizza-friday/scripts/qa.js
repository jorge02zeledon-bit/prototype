/*
 * scripts/qa.js — click-through of the Pizza Friday storefront with Playwright.
 * Usage: node scripts/qa.js [outDir]   (serves ./ on a random port itself)
 * Exits non-zero on a failed assertion or a console error.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const outDir = process.argv[2] || path.join(root, 'dist', 'qa');
fs.mkdirSync(outDir, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const file = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : req.url.split('?')[0]);
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  let failed = 0;
  const check = (cond, msg) => { if (cond) console.log('  ok  ', msg); else { failed++; console.log('  FAIL', msg); } };

  for (const [label, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
    const page = await browser.newPage({ viewport });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base, { waitUntil: 'networkidle' });
    console.log(`\n[${label}]`);
    check((await page.title()) === 'Pizza Friday', 'title is Pizza Friday');
    check((await page.locator('.card').count()) === 2, 'two menu items');
    check((await page.locator('.price').allTextContents()).every((t) => t.includes('$6.00')), 'both priced $6.00');
    await page.screenshot({ path: path.join(outDir, `${label}-1-home.png`), fullPage: label === 'phone', animations: 'disabled' });

    // Add 2 cheese, 3 pepperoni.
    await page.getByRole('button', { name: 'Add slice' }).first().click();
    await page.getByRole('button', { name: 'Add one Cheese slice' }).click();
    await page.getByRole('button', { name: 'Add slice' }).click(); // pepperoni
    await page.getByRole('button', { name: 'Add one Pepperoni slice' }).click();
    await page.getByRole('button', { name: 'Add one Pepperoni slice' }).click();
    check((await page.locator('#cart-count').textContent()) === '5', 'cart badge reads 5');

    await page.locator('#cart-btn').click();
    await page.locator('#cart:not([hidden])').waitFor();
    check((await page.locator('.grand').textContent()).includes('$30.00'), 'total is $30.00');
    await page.screenshot({ path: path.join(outDir, `${label}-2-cart.png`), animations: 'disabled' });

    await page.getByRole('button', { name: 'Check out' }).click();
    await page.getByRole('button', { name: /Place order/ }).click();
    check((await page.locator('.err').count()) === 3, 'empty form shows 3 errors');
    await page.fill('#f-name', 'Ana Ortiz');
    await page.fill('#f-phone', '(555) 123-4567');
    await page.selectOption('#f-slot', '12:00 PM');
    await page.screenshot({ path: path.join(outDir, `${label}-3-checkout.png`), animations: 'disabled' });
    await page.getByRole('button', { name: /Place order/ }).click();
    check(/PF-\d{4}/.test(await page.locator('.confirm .big').textContent()), 'order number shown');
    check((await page.locator('#cart-count').textContent()) === '0', 'cart emptied after order');
    await page.screenshot({ path: path.join(outDir, `${label}-4-confirm.png`), animations: 'disabled' });

    // Reload: cart stays empty, menu still renders.
    await page.reload({ waitUntil: 'networkidle' });
    check((await page.locator('#cart-count').textContent()) === '0', 'empty cart persists');
    await page.close();
  }

  await browser.close();
  srv.close();
  if (errors.length) { failed++; console.log('\nconsole errors:', errors); }
  console.log(`\n${failed ? 'FAILED' : 'passed'} · screenshots in ${outDir}`);
  process.exit(failed ? 1 : 0);
})();
