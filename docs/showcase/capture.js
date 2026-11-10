const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost/2026/array-architects';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

async function go(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1600);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const desktop = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktop.newPage();

  await go(page, BASE + '/');
  await page.screenshot({ path: path.join(OUT, 'home-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'home-full.png'), fullPage: true });
  console.log('home');

  await go(page, BASE + '/about.html');
  await page.screenshot({ path: path.join(OUT, 'about-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'about-full.png'), fullPage: true });
  console.log('about');

  await go(page, BASE + '/services.html');
  await page.screenshot({ path: path.join(OUT, 'services-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'services-full.png'), fullPage: true });
  console.log('services');

  await go(page, BASE + '/projects.html');
  await page.screenshot({ path: path.join(OUT, 'projects-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'projects-full.png'), fullPage: true });
  console.log('projects');

  await go(page, BASE + '/contact.html');
  await page.screenshot({ path: path.join(OUT, 'contact-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'contact-full.png'), fullPage: true });
  console.log('contact');

  await go(page, BASE + '/careers.html');
  await page.screenshot({ path: path.join(OUT, 'careers-hero.png') });
  await page.screenshot({ path: path.join(OUT, 'careers-full.png'), fullPage: true });
  console.log('careers');

  await go(page, BASE + '/admin/login.html');
  await page.screenshot({ path: path.join(OUT, 'admin-login.png') });
  await page.evaluate(async () => {
    await fetch('../api/index.php?r=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ateliernova.demo', password: 'Admin@123' }),
    });
  });
  await go(page, BASE + '/admin/index.html');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'admin-dashboard.png') });
  await page.goto(BASE + '/admin/index.html#/services', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT, 'admin-services.png') });
  const edit = page.locator('button:has-text("Edit")').first();
  if (await edit.count()) {
    await edit.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'admin-editor.png') });
  }
  console.log('admin');

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await go(m, BASE + '/');
  await m.screenshot({ path: path.join(OUT, 'mobile-home.png') });
  await m.screenshot({ path: path.join(OUT, 'mobile-full.png'), fullPage: true });
  console.log('mobile');

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
