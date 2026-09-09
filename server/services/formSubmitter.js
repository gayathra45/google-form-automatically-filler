const axios = require('axios');
const { buildSubmissionPayload } = require('./dataGenerator');
let puppeteerSubmitter = null;

try {
  puppeteerSubmitter = require('./puppeteerSubmitter');
} catch (e) {
  console.warn('Puppeteer not yet loaded');
}

/**
 * Submits single Google Form response via direct HTTP POST or Puppeteer Browser.
 */
async function submitGoogleForm(formInfo, rulesMap, index = 1, csvRow = null, engine = 'auto') {
  const startTime = Date.now();
  const responseUrl = formInfo.responseUrl || `${formInfo.url.replace(/\/viewform.*$/, '')}/formResponse`;
  const formUrl = responseUrl.replace(/\/viewform.*$/, '/formResponse');

  const payload = buildSubmissionPayload(formInfo.questions, rulesMap, index, csvRow);

  // If engine explicitly requested browser
  if (engine === 'browser') {
    if (!puppeteerSubmitter) {
      puppeteerSubmitter = require('./puppeteerSubmitter');
    }
    return await puppeteerSubmitter.submitGoogleFormWithBrowser(
      formInfo.url,
      formInfo.questions,
      rulesMap,
      index,
      csvRow
    );
  }

  // If this is a demo sample or localhost test URL
  if (formUrl.includes('sample') || formUrl.includes('Sample_Event') || formUrl.includes('demo') || formUrl.includes('localhost')) {
    await new Promise(res => setTimeout(res, 120 + Math.random() * 150));
    const duration = Date.now() - startTime;
    return {
      success: true,
      status: 200,
      durationMs: duration,
      payload,
      message: 'Demo Sandbox: Response recorded successfully',
      timestamp: new Date().toISOString()
    };
  }

  const formData = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  }

  if (formInfo.pageHistory) formData.append('pageHistory', formInfo.pageHistory);
  if (formInfo.fbzx) formData.append('fbzx', formInfo.fbzx);
  formData.append('fvv', '1');
  formData.append('submit', 'Submit');

  try {
    const response = await axios.post(formUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': formUrl.replace('/formResponse', '/viewform'),
        'Origin': 'https://docs.google.com'
      },
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: status => status >= 200 && status < 400
    });

    const duration = Date.now() - startTime;
    const bodyText = typeof response.data === 'string' ? response.data : '';

    // Check if HTTP was successful (200 OK / redirect without 401 signin error)
    const isError = bodyText.includes('ServiceLogin') ||
      bodyText.includes('Sign in to continue') ||
      bodyText.includes('දිගටම කරගෙන යාමට පුරන්න') ||
      bodyText.includes('freebirdFormviewerViewResponseError');

    if (response.status === 200 && !isError) {
      return {
        success: true,
        status: 200,
        durationMs: duration,
        payload,
        message: 'Response recorded successfully in Google Form!',
        timestamp: new Date().toISOString()
      };
    }

    // If Google returned signin / auth barrier on HTTP, try Puppeteer only if auto
    if (isError && engine === 'auto') {
      console.log(`HTTP POST requires signin. Falling back to Browser Engine for item #${index}...`);
      if (!puppeteerSubmitter) {
        puppeteerSubmitter = require('./puppeteerSubmitter');
      }
      return await puppeteerSubmitter.submitGoogleFormWithBrowser(
        formInfo.url,
        formInfo.questions,
        rulesMap,
        index,
        csvRow
      );
    }

    return {
      success: false,
      status: response.status,
      durationMs: duration,
      payload,
      message: 'Form submission failed: Form requires Google sign-in',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (engine === 'auto') {
      console.log(`HTTP POST threw error (${error.message}). Trying Browser Engine...`);
      try {
        if (!puppeteerSubmitter) {
          puppeteerSubmitter = require('./puppeteerSubmitter');
        }
        return await puppeteerSubmitter.submitGoogleFormWithBrowser(
          formInfo.url,
          formInfo.questions,
          rulesMap,
          index,
          csvRow
        );
      } catch (browserErr) {
        return {
          success: false,
          status: error.response?.status || 500,
          durationMs: duration,
          payload,
          message: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return {
      success: false,
      status: error.response?.status || 500,
      durationMs: duration,
      payload,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Runs batch submissions strictly for total count and streams progress via SSE callback.
 */
async function runBatchSubmissions({
  formInfo,
  rulesMap,
  count = 1,
  delayMs = 1000,
  jitterMs = 200,
  csvRows = null,
  engine = 'auto',
  onProgress,
  isAborted
}) {
  const targetCount = Math.max(1, parseInt(count, 10) || 1);
  const total = csvRows ? Math.min(csvRows.length, targetCount) : targetCount;

  console.log(`[Batch Engine] Starting batch of EXACTLY ${total} submissions...`);

  const results = {
    total,
    successful: 0,
    failed: 0,
    startTime: new Date().toISOString(),
    logs: []
  };

  for (let i = 1; i <= total; i++) {
    if (isAborted && isAborted()) {
      console.log(`[Batch Engine] Aborting batch at item #${i}...`);
      onProgress?.({
        type: 'aborted',
        index: i,
        total,
        message: 'Batch submission stopped by user.'
      });
      break;
    }

    const csvRow = csvRows ? csvRows[i - 1] : null;

    onProgress?.({
      type: 'submitting',
      index: i,
      total
    });

    const result = await submitGoogleForm(formInfo, rulesMap, i, csvRow, engine);

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

    // Wait between requests if not the last item
    if (i < total) {
      const safeDelay = Math.max(50, parseInt(delayMs, 10) || 1000);
      const safeJitter = Math.max(0, parseInt(jitterMs, 10) || 0);
      const actualDelay = Math.max(50, safeDelay + (Math.random() * 2 - 1) * safeJitter);
      await new Promise(res => setTimeout(res, actualDelay));
    }
  }

  results.endTime = new Date().toISOString();
  console.log(`[Batch Engine] Completed batch of ${results.successful}/${total} successful.`);

  onProgress?.({
    type: 'finished',
    summary: results
  });

  return results;
}

module.exports = {
  submitGoogleForm,
  runBatchSubmissions
};
