const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'page1.png' });
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'page2.png' });
  await browser.close();
  console.log('Done');
})();
