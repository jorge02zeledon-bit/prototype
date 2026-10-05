/*
 * scripts/qa.js — scripted phone-width click-through with Playwright.
 * Usage: node scripts/qa.js [outDir]   (serves ./ on a random port itself)
 * Exits non-zero if any assertion fails or the page logs a console error.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const outDir = process.argv[2] || path.join(root, 'dist', 'qa');
fs.mkdirSync(outDir, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('nope'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

const failures = [];
function check(cond, msg) { if (cond) console.log('  ok   ' + msg); else { console.log('  FAIL ' + msg); failures.push(msg); } }

(async () => {
  const { srv, url } = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true }); };
  const text = async () => (await page.locator('#app').innerText()).replace(/\s+/g, ' ');

  console.log('Serving ' + url);
  await page.goto(url);
  await page.waitForSelector('.login');

  // Seeded week info from the page itself.
  const info = await page.evaluate(() => {
    const s = window.__staffSchedule.getState();
    return { weekStart: s.seededWeekStart, wed: s.assignments.find(a => a.teacherId === 't_maria' && a.area === 'elementary').date };
  });
  console.log('Seeded week starts ' + info.weekStart + '; Maria covers Elementary on ' + info.wed);

  // ---- Demo controls: pretend today is Wednesday
  console.log('\n[Login screen]');
  await shot('01-login');
  await page.locator('details.menu-card summary').click();
  await page.selectOption('#demo-today', info.wed);
  await page.waitForTimeout(200);
  check((await text()).includes('Hillside'), 'school name on login');

  // ---- Teacher login (Maria)
  console.log('\n[Teacher: Maria, Wednesday]');
  await page.locator('.person', { hasText: 'Maria Lopez' }).click();
  await page.fill('#pin', '1111');
  await page.locator('button[type=submit]', { hasText: 'Open my schedule' }).click();
  await page.waitForSelector('.today-card');
  await shot('02-maria-wed');
  let t = await text();
  check(t.includes('Good'), 'greeting shown');
  check(/Today: .*Butterfly Room at 7:30 AM, then Room 102 at 12:30 PM \(covering Elementary\)/.test(t), 'day summary line names both blocks');
  check(t.includes('Covering Elementary today'), 'cross-coverage band text present');
  check(t.includes('Room 102'), 'room shown');
  check(t.includes('Lead Teacher · covering for David Ortiz'), 'position + covering for');
  check(t.includes('With you: Priya Patel'), 'with-you line present');
  check(/Tomorrow: Butterfly Room, as usual/.test(t), 'tomorrow-as-usual line');
  check(/From Dana/i.test(t), 'note labeled with admin first name');
  check(/Rest of this week/i.test(t), 'week list titled Rest of this week');
  check(!t.includes('Draft'), 'teacher never sees draft markers');
  const cards = await page.locator('.today-card').count();
  check(cards === 2, 'two blocks today (got ' + cards + ')');
  const bandCount = await page.locator('.band-cross').count();
  check(bandCount === 1, 'exactly one solid cross band');
  // Horizontal overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(!overflow, 'no horizontal scroll at 390px');

  // Dark mode screenshot
  await ctx.close();
  const ctxDark = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', storageState: undefined });
  const pageDark = await ctxDark.newPage();
  await pageDark.goto(url);
  await pageDark.locator('details.menu-card summary').click();
  await pageDark.selectOption('#demo-today', info.wed);
  await pageDark.locator('.person', { hasText: 'Maria Lopez' }).click();
  await pageDark.fill('#pin', '1111');
  await pageDark.locator('button[type=submit]').click();
  await pageDark.waitForSelector('.today-card');
  await pageDark.screenshot({ path: path.join(outDir, '03-maria-wed-dark.png'), fullPage: true });
  await ctxDark.close();

  // ---- Fresh context: Sarah on Thursday (covering Preschool), then Keisha on Thursday (not scheduled)
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p2 = await ctx2.newPage();
  p2.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  p2.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  const text2 = async () => (await p2.locator('#app').innerText()).replace(/\s+/g, ' ');
  await p2.goto(url);
  const thu = await p2.evaluate((ws) => window.Core.addDays(ws, 3), info.weekStart);
  await p2.locator('details.menu-card summary').click();
  await p2.selectOption('#demo-today', thu);
  console.log('\n[Teacher: Sarah, Thursday]');
  await p2.locator('.person', { hasText: 'Sarah Kim' }).click();
  await p2.fill('#pin', '4444');
  await p2.locator('button[type=submit]').click();
  await p2.waitForSelector('.today-card');
  await p2.screenshot({ path: path.join(outDir, '04-sarah-thu.png'), fullPage: true });
  t = await text2();
  check(t.includes('Covering Preschool today'), 'Sarah sees Covering Preschool today');
  check(t.includes('Butterfly Room'), 'Butterfly Room shown');
  check(t.includes('Assistant · covering for Keisha Brown'), 'Assistant covering for Keisha');
  check(t.includes('With you: Maria Lopez'), 'with-you shows Maria');
  check(/Then at 11:30 AM: Room 101, as usual/.test(t), 'afternoon back to usual room');
  await p2.locator('button', { hasText: 'Log out' }).click();
  await p2.waitForSelector('.login');

  console.log('\n[Teacher: Keisha, Thursday (out sick, not scheduled)]');
  await p2.locator('.person', { hasText: 'Keisha Brown' }).click();
  await p2.fill('#pin', '3333');
  await p2.locator('button[type=submit]').click();
  await p2.waitForSelector('.empty-today');
  await p2.screenshot({ path: path.join(outDir, '05-keisha-thu-empty.png'), fullPage: true });
  t = await text2();
  check(t.includes('not on the schedule today'), 'empty-today message');
  check(/Next up/i.test(t), 'next-up card shown');
  check(/Earlier this week/.test(t), 'earlier days collapsed');
  await p2.locator('button', { hasText: 'Log out' }).click();

  // ---- Admin
  console.log('\n[Admin: Dana]');
  await p2.waitForSelector('.login');
  await p2.locator('.person', { hasText: 'Dana Reyes' }).click();
  await p2.fill('#pin', '0000');
  await p2.locator('button[type=submit]').click();
  await p2.waitForSelector('.day-tabs');
  await p2.screenshot({ path: path.join(outDir, '06-admin-week-thu.png'), fullPage: true });
  t = await text2();
  check(t.includes('not yet published'), 'status shows unpublished draft');
  check(/conflict/.test(t), 'conflict count shown');
  check(t.includes('Alex Rivera is double-booked'), 'conflict names Alex');
  const sheetCount = await p2.locator('.sheet').count();
  check(sheetCount === 0, 'no sheet open initially');

  // Fix the conflict: open the draft and remove it
  await p2.locator('.conflict-item .btn-outline').first().click();
  await p2.waitForSelector('.sheet');
  await p2.screenshot({ path: path.join(outDir, '07-admin-editor-conflict.png'), fullPage: true });
  t = (await p2.locator('.sheet').innerText()).replace(/\s+/g, ' ');
  check(t.includes('already booked then'), 'editor shows conflict warning');
  check(t.includes('What the teacher will see'), 'editor shows live preview');
  await p2.locator('.sheet button', { hasText: 'Remove this shift' }).click();
  await p2.waitForSelector('.dialog');
  await p2.locator('.dialog button', { hasText: 'Remove' }).click();
  await p2.waitForTimeout(200);
  t = await text2();
  check(!t.includes('double-booked'), 'conflict gone after removing the draft');

  // Add a new cross-coverage shift for Tom on Thursday afternoon in Room 101 and watch the preview
  console.log('\n[Admin: add a cross-coverage shift]');
  await p2.locator('button', { hasText: 'Add a shift on Thu' }).click();
  await p2.waitForSelector('#editor-form');
  await p2.selectOption('#f-teacher', 't_tom');
  await p2.waitForTimeout(100);
  const areaAfterPick = await p2.evaluate(() => (document.querySelector('#editor-form input[name=area]:checked') || {}).value);
  check(areaAfterPick === 'preschool', 'picking Tom pre-selects Preschool (got ' + areaAfterPick + ')');
  const posAfterPick = await p2.evaluate(() => document.querySelector('#f-position').value);
  check(posAfterPick === 'pos_lead_pre', 'picking Tom prefills his usual position');
  await p2.locator('.chip', { hasText: 'Afternoon' }).click();
  await p2.locator('label.seg-el').click();
  await p2.waitForTimeout(100);
  await p2.selectOption('#f-location', 'loc_101');
  await p2.selectOption('#f-position', 'pos_assist');
  await p2.selectOption('#f-covering', 't_priya');
  await p2.fill('#f-note', 'Helping in Room 101 while Priya is at training.');
  await p2.waitForTimeout(150);
  t = (await p2.locator('.sheet').innerText()).replace(/\s+/g, ' ');
  check(t.includes('This is cross-coverage for Tom'), 'area hint names cross-coverage');
  check(t.includes('Covering Elementary today'), 'preview band says Covering Elementary today');
  check(t.includes('Assistant · covering for Priya Patel'), 'preview shows covering-for');
  // Tom already works 7:30–3:30 in Sunflower on Thursday → should show conflict
  check(t.includes('Tom is already booked then'), 'overlap with Tom\'s regular shift is flagged');
  await p2.screenshot({ path: path.join(outDir, '08-admin-editor-preview.png'), fullPage: true });
  // Reassign to Keisha instead (she is out, so she is "free")... pick David? He is in Room 102. Use reassign UI on an existing shift later.
  await p2.locator('.sheet button[type=submit]', { hasText: 'Add shift' }).click();
  await p2.waitForTimeout(200);
  t = await text2();
  check(t.includes('Tom Nguyen'), 'new draft appears in Thursday list');
  check(t.includes('Draft'), 'new shift is a draft');

  // Reassign flow: open Tom's new draft, reassign to Keisha
  console.log('\n[Admin: reassign]');
  const tomRow = p2.locator('.arow', { hasText: 'Tom Nguyen' }).filter({ hasText: 'Draft' });
  await tomRow.click();
  await p2.waitForSelector('#editor-form');
  await p2.locator('button', { hasText: 'Reassign to someone else' }).click();
  await p2.waitForSelector('#reassign-list');
  t = (await p2.locator('#reassign-list').innerText()).replace(/\s+/g, ' ');
  check(/Keisha Brown Free then/.test(t), 'reassign list shows Keisha as free (got: ' + t.slice(0, 80) + '...)');
  check(/David Ortiz Busy/.test(t), 'reassign list shows David as busy');
  await p2.screenshot({ path: path.join(outDir, '09-admin-reassign.png'), fullPage: true });
  await p2.locator('#reassign-list .person', { hasText: 'Keisha Brown' }).click();
  await p2.waitForTimeout(150);
  const who = await p2.evaluate(() => document.querySelector('#f-teacher').value);
  check(who === 't_keisha', 'teacher switched to Keisha');
  const cf = await p2.evaluate(() => document.querySelector('#f-covering').value);
  check(cf === 't_tom', 'covering-for set to the original teacher');
  await p2.locator('.sheet button[type=submit]', { hasText: 'Save & publish now' }).click();
  await p2.waitForTimeout(200);
  t = await text2();
  check(t.includes('Keisha Brown'), 'Keisha now on Thursday');

  // Day board
  console.log('\n[Admin: day board, staff, publish]');
  await p2.locator('.tab', { hasText: 'Day board' }).click();
  await p2.waitForSelector('.board-loc');
  await p2.screenshot({ path: path.join(outDir, '10-admin-board.png'), fullPage: true });
  t = await text2();
  check(t.includes('Butterfly Room') && t.includes('Who is where'), 'board renders rooms');
  check(t.includes('No one assigned'), 'board shows an empty room');

  // Make a draft edit (Maria's Thursday note), then publish the week
  await p2.locator('.tab', { hasText: 'Week' }).click();
  await p2.waitForSelector('.day-tabs');
  t = await text2();
  check(t.includes('Everyone can see this week'), 'after Save & publish now nothing is pending');
  await p2.locator('.arow', { hasText: 'Maria Lopez' }).first().click();
  await p2.waitForSelector('#editor-form');
  await p2.fill('#f-note', 'Sarah is with you until 11:30 while Keisha is out. Breakfast carts arrive at 7:45.');
  await p2.locator('.sheet button[type=submit]', { hasText: 'Save' }).first().click();
  await p2.waitForTimeout(200);
  t = await text2();
  check(t.includes('1 not yet published'), 'edited shift counts as a pending change');
  check(t.includes('Changed · not published'), 'edited shift shows Changed state');
  const pubBtn = p2.locator('button', { hasText: 'Publish week' });
  check(await pubBtn.count() === 1, 'publish button present');
  await pubBtn.click();
  await p2.waitForSelector('.dialog');
  await p2.screenshot({ path: path.join(outDir, '11-admin-publish-confirm.png'), fullPage: true });
  await p2.locator('.dialog button', { hasText: 'Publish' }).last().click();
  await p2.waitForTimeout(200);
  t = await text2();
  check(t.includes('Everyone can see this week'), 'week shows as fully published');

  // Staff + View as
  await p2.locator('.tab', { hasText: 'Staff' }).click();
  await p2.waitForSelector('.staff-list');
  await p2.screenshot({ path: path.join(outDir, '12-admin-staff.png'), fullPage: true });
  await p2.locator('.staff-row', { hasText: 'Keisha Brown' }).locator('a', { hasText: 'View as' }).click();
  await p2.waitForSelector('.preview-banner');
  t = await text2();
  check(t.includes('Preview as Keisha Brown'), 'preview banner');
  check(t.includes('Covering Elementary today') && t.includes('Room 101'), 'Keisha now sees the reassigned covering shift');
  await p2.screenshot({ path: path.join(outDir, '13-admin-preview-keisha.png'), fullPage: true });

  // Teacher sees published shift (fresh login as Keisha)
  await p2.locator('a', { hasText: 'Back to admin' }).click();
  await p2.locator('.tab', { hasText: 'Menu' }).click();
  await p2.waitForSelector('form[data-form=settings]');
  await p2.screenshot({ path: path.join(outDir, '14-admin-menu.png'), fullPage: true });
  await p2.locator('button', { hasText: 'Log out' }).click();
  await p2.waitForSelector('.login');
  await p2.locator('.person', { hasText: 'Keisha Brown' }).click();
  await p2.fill('#pin', '3333');
  await p2.locator('button[type=submit]').click();
  await p2.waitForSelector('.today-card');
  t = await text2();
  check(t.includes('Covering Elementary today') && t.includes('covering for Tom Nguyen'), 'Keisha (teacher login) sees the published reassigned shift');
  await p2.screenshot({ path: path.join(outDir, '15-keisha-after-publish.png'), fullPage: true });

  // Wrong PIN
  await p2.locator('button', { hasText: 'Log out' }).click();
  await p2.locator('.person', { hasText: 'Maria Lopez' }).click();
  await p2.fill('#pin', '9999');
  await p2.locator('button[type=submit]').click();
  await p2.waitForTimeout(100);
  t = await text2();
  check(t.includes('does not match'), 'wrong PIN rejected');

  await ctx2.close();
  await browser.close();
  srv.close();

  console.log('\nConsole errors: ' + consoleErrors.length);
  consoleErrors.forEach((e) => console.log('  ' + e));
  // Resource loads blocked by the sandbox proxy (Google Fonts) are not app errors.
  const netErrors = consoleErrors.filter(e => /ERR_CERT_AUTHORITY_INVALID|ERR_NAME_NOT_RESOLVED|fonts\.g/.test(e));
  const realErrors = consoleErrors.filter(e => netErrors.indexOf(e) < 0);
  if (netErrors.length) console.log('  (' + netErrors.length + ' external resource load(s) blocked by the sandbox, ignored)');
  console.log('\nScreenshots in ' + outDir);
  if (failures.length || realErrors.length) { console.log('\n' + failures.length + ' failure(s)'); process.exit(1); }
  console.log('\nAll checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
