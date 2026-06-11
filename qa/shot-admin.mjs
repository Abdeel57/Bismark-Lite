import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = process.env.TEMP || '.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 920, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#email');
  await page.type('#email', 'demo@bismark.com');
  await page.type('#password', 'Demo1234!');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => location.pathname.startsWith('/panel'), { timeout: 15000 }).catch(() => {});
  await sleep(2500);

  await page.goto(`${BASE}/panel/admin/ordenes`, { waitUntil: 'networkidle2' });
  await sleep(2200);
  await page.screenshot({ path: `${OUT}\\bsk-admin-ordenes.png` });
  console.log('shot ordenes');

  await page.goto(`${BASE}/panel/admin/rifas`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.screenshot({ path: `${OUT}\\bsk-admin-rifas.png` });
  console.log('shot rifas');

  // Abrir "Más" (pestaña por estado, no ruta).
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('nav button')];
    const mas = btns.find((b) => b.textContent.trim() === 'Más');
    mas?.click();
  });
  await sleep(1200);
  await page.screenshot({ path: `${OUT}\\bsk-admin-mas.png` });
  console.log('shot mas');
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await browser.close();
}
