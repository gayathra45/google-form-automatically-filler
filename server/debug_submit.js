const puppeteer = require('puppeteer-core');

async function debugSubmit() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform?usp=dialog', { waitUntil: 'networkidle2' });

  // Fill in required field: "Can you attend?" (Radio 1)
  await page.evaluate(() => {
    // 1. Name
    const nameInput = document.querySelector('input[name="entry.559352220"]');
    if (nameInput) {
      nameInput.value = 'John Developer';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2. Radio - click first radio
    const radio = document.querySelector('div[role="radio"]');
    if (radio) radio.click();

    // 3. Email
    const emailInput = document.querySelector('input[name="entry.443565211"]');
    if (emailInput) {
      emailInput.value = 'john@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Find Submit button and click it via puppeteer mouse or evaluate
  console.log('Clicking Submit button...');
  const submitBtn = await page.$('div.uArJ5e.Y5sE8d, div[role="button"][jsname="M2UYVd"], div[role="button"].Y5sE8d');
  if (submitBtn) {
    console.log('Found submit button handle, clicking with page mouse...');
    await submitBtn.click();
  } else {
    console.log('Submit button handle not found, clicking via evaluate...');
    await page.evaluate(() => {
      const btn = document.querySelector('div.uArJ5e.Y5sE8d, div[jsname="M2UYVd"], div[role="button"].Y5sE8d');
      if (btn) btn.click();
    });
  }

  // Wait 4 seconds
  await new Promise(r => setTimeout(r, 4000));

  console.log('Current URL after submit:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- Body Text After Submit ---');
  console.log(bodyText);

  await browser.close();
}

debugSubmit();
