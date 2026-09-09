const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { buildSubmissionPayload } = require('./dataGenerator');

const BROWSER_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function getExecutablePath() {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

let sharedBrowser = null;

async function getBrowser(headless = 'new') {
  if (!sharedBrowser || !sharedBrowser.connected) {
    const execPath = getExecutablePath();
    sharedBrowser = await puppeteer.launch({
      executablePath: execPath,
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
  return sharedBrowser;
}

/**
 * Submits a Google Form through real Chromium browser automation.
 */
async function submitGoogleFormWithBrowser(formUrl, questions, rulesMap, index = 1, csvRow = null) {
  const startTime = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();

  const payload = buildSubmissionPayload(questions, rulesMap, index, csvRow);

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 850 });

    const viewUrl = formUrl.replace(/\/formResponse.*$/, '/viewform');
    console.log(`[Browser Engine #${index}] Navigating to:`, viewUrl);

    await page.goto(viewUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Execute filling script directly inside browser DOM
    const fillResult = await page.evaluate((payloadData, questionsData) => {
      let filledCount = 0;

      for (const q of questionsData) {
        const val = payloadData[q.id];
        if (val === undefined || val === null || val === '') continue;

        // Strategy 1: Direct input by entry name attribute (for Text & Paragraph)
        const textInput = document.querySelector(`input[name="${q.id}"], textarea[name="${q.id}"]`);
        if (textInput) {
          textInput.value = String(val);
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
          textInput.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
          continue;
        }

        // Strategy 2: Find question container
        const containers = Array.from(document.querySelectorAll('div[role="listitem"], .Qr7Oae, .geS5n'));
        const container = containers.find(c => {
          const heading = c.querySelector('[role="heading"], .M7eMe');
          return heading && heading.textContent && heading.textContent.includes(q.title);
        }) || containers[questionsData.indexOf(q)];

        if (!container) continue;

        if (q.type === 'radio' || q.type === 'scale') {
          const targetText = String(val).trim();
          const radios = Array.from(container.querySelectorAll('div[role="radio"], div[data-value], label'));
          const match = radios.find(r => {
            const text = (r.textContent || r.getAttribute('data-value') || '').trim();
            return text.includes(targetText) || targetText.includes(text);
          }) || (radios.length > 0 ? radios[0] : null);

          if (match) {
            match.click();
            filledCount++;
          }
        } else if (q.type === 'checkbox') {
          const targetList = Array.isArray(val) ? val : [val];
          const checkboxes = Array.from(container.querySelectorAll('div[role="checkbox"], div[data-answer-value], label'));
          for (const cb of checkboxes) {
            const text = (cb.textContent || cb.getAttribute('data-answer-value') || '').trim();
            const shouldCheck = targetList.some(t => text.includes(String(t).trim()) || String(t).trim().includes(text));
            const isChecked = cb.getAttribute('aria-checked') === 'true';
            if (shouldCheck && !isChecked) {
              cb.click();
              filledCount++;
            }
          }
        } else {
          // General text input fallback inside container
          const input = container.querySelector('input[type="text"], textarea, input:not([type="hidden"])');
          if (input) {
            input.value = String(val);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        }
      }

      return { filledCount };
    }, payload, questions);

    console.log(`[Browser Engine #${index}] Filled ${fillResult.filledCount} fields.`);

    // Give DOM a moment to register
    await new Promise(r => setTimeout(r, 600));

    // Submit the Form using specific Google Submit button selectors
    const submitted = await page.evaluate(() => {
      // Primary Submit button selectors in Google Forms
      const primarySubmitBtn = document.querySelector('div.uArJ5e.Y5sE8d, div[jsname="M2UYVd"], div[jsname="M2UYWe"], div[role="button"].Y5sE8d');
      if (primarySubmitBtn) {
        primarySubmitBtn.click();
        return true;
      }

      // Fallback: search all buttons for submit text in English or other languages
      const buttons = Array.from(document.querySelectorAll('div[role="button"], span.l4V7wb'));
      const submitBtn = buttons.find(b => {
        const t = (b.textContent || '').trim().toLowerCase();
        return t === 'submit' || t === 'send' || t.includes('සබිමිටි') || t.includes('යවන්න') || t.includes('submit');
      });

      if (submitBtn) {
        submitBtn.click();
        return true;
      }

      return false;
    });

    console.log(`[Browser Engine #${index}] Submit button clicked:`, submitted);

    // Wait for submission confirmation page
    await new Promise(r => setTimeout(r, 3000));

    const pageHtml = await page.content();
    const duration = Date.now() - startTime;

    const isSuccess = pageHtml.includes('freebirdFormviewerViewResponseConfirmationMessage') ||
      pageHtml.includes('Your response has been recorded') ||
      pageHtml.includes('response has been recorded') ||
      pageHtml.includes('ප්‍රතිචාරය සටහන්') ||
      pageHtml.includes('vscqUb') ||
      page.url().includes('formResponse');

    console.log(`[Browser Engine #${index}] Google confirmed response recorded:`, isSuccess);

    await page.close();

    return {
      success: isSuccess,
      status: isSuccess ? 200 : 400,
      durationMs: duration,
      payload,
      message: isSuccess ? 'Google Form response recorded successfully in Google Form!' : 'Submission unverified',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    try { await page.close(); } catch (e) {}

    console.error(`[Browser Engine #${index}] Error:`, error.message);
    return {
      success: false,
      status: 500,
      durationMs: duration,
      payload,
      message: 'Browser automation error: ' + error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch submission via real Chromium browser automation
 */
async function runBatchWithBrowser({
  formInfo,
  rulesMap,
  count = 1,
  delayMs = 1000,
  jitterMs = 200,
  csvRows = null,
  onProgress,
  isAborted
}) {
  const total = csvRows ? csvRows.length : count;
  const results = {
    total,
    successful: 0,
    failed: 0,
    startTime: new Date().toISOString(),
    logs: []
  };

  for (let i = 1; i <= total; i++) {
    if (isAborted && isAborted()) {
      onProgress?.({
        type: 'aborted',
        index: i,
        total,
        message: 'Batch submission aborted by user.'
      });
      break;
    }

    const csvRow = csvRows ? csvRows[i - 1] : null;

    onProgress?.({
      type: 'submitting',
      index: i,
      total
    });

    const result = await submitGoogleFormWithBrowser(
      formInfo.url,
      formInfo.questions,
      rulesMap,
      i,
      csvRow
    );

    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }

    const logEntry = {
      index: i,
      total,
      success: result.success,
      status: result.status,
      durationMs: result.durationMs,
      payload: result.payload,
      message: result.message,
      timestamp: result.timestamp
    };

    results.logs.push(logEntry);

    onProgress?.({
      type: 'completed_one',
      index: i,
      total,
      successful: results.successful,
      failed: results.failed,
      result: logEntry
    });

    if (i < total) {
      const actualDelay = Math.max(100, delayMs + (Math.random() * 2 - 1) * jitterMs);
      await new Promise(res => setTimeout(res, actualDelay));
    }
  }

  results.endTime = new Date().toISOString();
  onProgress?.({
    type: 'finished',
    summary: results
  });

  return results;
}

module.exports = {
  submitGoogleFormWithBrowser,
  runBatchWithBrowser
};
