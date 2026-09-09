const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function inspectButtons() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform?usp=dialog', { waitUntil: 'networkidle2' });

  const buttons = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('div[role="button"], span, button, [role="button"]'));
    return list.map(el => ({
      tagName: el.tagName,
      role: el.getAttribute('role'),
      jsname: el.getAttribute('jsname'),
      ariaLabel: el.getAttribute('aria-label'),
      className: el.className,
      text: (el.textContent || '').trim().substring(0, 50)
    })).filter(b => b.text.length > 0 && b.text.length < 40);
  });

  console.log('Buttons & spans found:', JSON.stringify(buttons.slice(0, 20), null, 2));
  await browser.close();
}

inspectButtons();
