const axios = require('axios');
const puppeteer = require('puppeteer');

async function testWithCookies() {
  console.log('\n--- Test 1: GET form and use Set-Cookie in POST ---');
  const viewUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform';
  const getRes = await axios.get(viewUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    }
  });

  const cookies = getRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  console.log('Cookies received:', cookies);

  // Extract fbzx from HTML
  const fbzxMatch = getRes.data.match(/name="fbzx"\s+value="([^"]+)"/);
  const fbzx = fbzxMatch ? fbzxMatch[1] : '';
  console.log('Extracted fbzx from GET:', fbzx);

  const postUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/formResponse';
  const formData = new URLSearchParams();
  formData.append('entry.559352220', 'John Test');
  formData.append('entry.877086558', "Yes,  I'll be there");
  formData.append('entry.924523986', '2');
  formData.append('entry.186230675', 'Mains');
  formData.append('entry.1751303409', 'None');
  formData.append('entry.443565211', 'test@example.com');
  formData.append('pageHistory', '0');
  if (fbzx) formData.append('fbzx', fbzx);

  try {
    const postRes = await axios.post(postUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookies,
        'Referer': viewUrl,
        'Origin': 'https://docs.google.com'
      }
    });
    console.log('HTTP POST status:', postRes.status);
    console.log('Response Recorded?:', postRes.data.includes('Your response has been recorded') || postRes.data.includes('response has been recorded') || postRes.data.includes('freebirdFormviewerViewResponseConfirmationMessage') || postRes.data.includes('vscqUb'));
  } catch (err) {
    console.log('HTTP POST error:', err.response?.status, err.message);
  }
}

async function testWithPuppeteer() {
  console.log('\n--- Test 2: Submitting via Puppeteer Browser ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform';
  await page.goto(formUrl, { waitUntil: 'networkidle2' });

  console.log('Page loaded:', await page.title());

  // Fill in inputs
  // 1. Name
  const textInputs = await page.$$('input[type="text"]');
  console.log('Found text inputs:', textInputs.length);
  if (textInputs.length >= 1) await textInputs[0].type('Puppeteer Auto Name');
  
  // 2. Radio - "Yes, I'll be there"
  const radios = await page.$$('div[role="radio"]');
  console.log('Found radios:', radios.length);
  if (radios.length >= 1) await radios[0].click();

  // 3. How many
  if (textInputs.length >= 2) await textInputs[1].type('2');

  // 4. Checkboxes
  const checkboxes = await page.$$('div[role="checkbox"]');
  console.log('Found checkboxes:', checkboxes.length);
  if (checkboxes.length >= 1) await checkboxes[0].click();

  // 5. Allergies
  if (textInputs.length >= 3) await textInputs[2].type('None');

  // 6. Email
  if (textInputs.length >= 4) await textInputs[3].type('puppet_test@example.com');

  // Click Submit
  console.log('Clicking Submit button...');
  const submitBtn = await page.$('div[role="button"][aria-label*="Submit"], div[role="button"][jsname="M2UYWe"], span.l4V7wb');
  
  // Wait for navigation or confirmation message
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    page.evaluate(() => {
      // Find submit button in DOM
      const btns = Array.from(document.querySelectorAll('div[role="button"], span'));
      const sub = btns.find(b => b.textContent && (b.textContent.includes('Submit') || b.textContent.includes('යවන්න')));
      if (sub) sub.click();
    })
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const pageContent = await page.content();
  const isConfirmed = pageContent.includes('Your response has been recorded') || 
                      pageContent.includes('response has been recorded') ||
                      pageContent.includes('ප්‍රතිචාරය සටහන්') ||
                      pageContent.includes('freebirdFormviewerViewResponseConfirmationMessage');

  console.log('Puppeteer submission confirmation recorded?:', isConfirmed);
  await browser.close();
}

async function run() {
  await testWithCookies();
  await testWithPuppeteer();
}

run();
