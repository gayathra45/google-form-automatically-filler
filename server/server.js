const express = require('express');
const cors = require('cors');
const { parseGoogleForm } = require('./services/formParser');
const { submitGoogleForm, runBatchSubmissions } = require('./services/formSubmitter');
const { buildSubmissionPayload } = require('./services/dataGenerator');
const { parse: parseCsvSync } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Parse Google Form
app.post('/api/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Form URL is required' });
    }

    const formInfo = await parseGoogleForm(url);
    res.json({ success: true, form: formInfo });
  } catch (error) {
    console.error('Error parsing form:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse Google Form. Ensure the form is public and the link is valid.'
    });
  }
});

// 2. Submit a Single Form Response
app.post('/api/submit-single', async (req, res) => {
  try {
    const { formInfo, rulesMap, index = 1, csvRow, engine = 'auto' } = req.body;
    if (!formInfo || !formInfo.url || !formInfo.questions) {
      return res.status(400).json({ error: 'Invalid formInfo provided' });
    }

    const result = await submitGoogleForm(formInfo, rulesMap || {}, index, csvRow, engine);
    res.json(result);
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keep track of active batch jobs to allow abort
const activeBatchJobs = new Map();

// 3. Batch Submit with Server-Sent Events (SSE)
app.post('/api/batch-submit-sse', async (req, res) => {
  const { formInfo, rulesMap, count = 5, delayMs = 1000, jitterMs = 200, csvRows, engine = 'auto' } = req.body;

  if (!formInfo || !formInfo.url) {
    return res.status(400).json({ error: 'Form info missing' });
  }

  // Ensure strict integer parsing
  const exactCount = Math.max(1, parseInt(count, 10) || 1);
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let isAborted = false;

  activeBatchJobs.set(jobId, () => {
    isAborted = true;
  });

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('init', { jobId, total: csvRows ? Math.min(csvRows.length, exactCount) : exactCount });

  // Handle client disconnect ONLY if response stream terminates prematurely
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
    activeBatchJobs.delete(jobId);
  });

  try {
    await runBatchSubmissions({
      formInfo,
      rulesMap: rulesMap || {},
      count: exactCount,
      delayMs: Number(delayMs),
      jitterMs: Number(jitterMs),
      csvRows: Array.isArray(csvRows) && csvRows.length > 0 ? csvRows : null,
      engine,
      onProgress: (progressData) => {
        sendEvent(progressData.type, progressData);
      },
      isAborted: () => isAborted
    });
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    activeBatchJobs.delete(jobId);
    if (!res.writableEnded) {
      res.end();
    }
  }
});

// 4. Abort Batch Job
app.post('/api/abort-batch', (req, res) => {
  const { jobId } = req.body;
  if (jobId && activeBatchJobs.has(jobId)) {
    const abortFn = activeBatchJobs.get(jobId);
    abortFn();
    activeBatchJobs.delete(jobId);
    return res.json({ success: true, message: 'Batch job abort requested' });
  }
  for (const [id, abortFn] of activeBatchJobs.entries()) {
    abortFn();
    activeBatchJobs.delete(id);
  }
  res.json({ success: true, message: 'All active jobs stopped' });
});

// 5. Parse CSV raw text or data
app.post('/api/parse-csv', (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }

    const records = parseCsvSync(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    res.json({
      success: true,
      totalRows: records.length,
      headers,
      preview: records.slice(0, 5),
      records
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to parse CSV: ' + error.message });
  }
});

// 6. Generate 1-Click Bookmarklet Code
app.post('/api/generate-tools', (req, res) => {
  const { formInfo, rulesMap } = req.body;
  if (!formInfo) {
    return res.status(400).json({ error: 'formInfo required' });
  }

  // Pre-filled URL Generator
  const queryParams = new URLSearchParams();
  const samplePayload = buildSubmissionPayload(formInfo.questions, rulesMap || {}, 1);
  for (const [key, value] of Object.entries(samplePayload)) {
    if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v));
    } else if (value) {
      queryParams.append(key, value);
    }
  }
  const prefilledUrl = `${formInfo.url.replace(/\/edit.*$/, '/viewform')}?usp=pp_url&${queryParams.toString()}`;

  // Generate Bookmarklet JavaScript snippet
  const scriptBody = `(function(){
    const rules = ${JSON.stringify(samplePayload)};
    let filled = 0;
    for (const [key, val] of Object.entries(rules)) {
      if (Array.isArray(val)) {
        val.forEach(v => {
          const el = document.querySelector(\`input[name="\${key}"][value="\${v}"]\`);
          if (el) { el.click(); filled++; }
        });
      } else {
        const textEl = document.querySelector(\`input[name="\${key}"], textarea[name="\${key}"]\`);
        if (textEl) {
          textEl.value = val;
          textEl.dispatchEvent(new Event('input', { bubbles: true }));
          textEl.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        } else {
          const optionEl = document.querySelector(\`div[data-value="\${val}"], div[role="radio"][data-value="\${val}"]\`);
          if (optionEl) { optionEl.click(); filled++; }
        }
      }
    }
    const btn = document.querySelector('div.uArJ5e.Y5sE8d, div[jsname="M2UYVd"], div[jsname="M2UYWe"], div[role="button"].Y5sE8d');
    if (btn) { btn.click(); }
  })();`;

  const bookmarkletCode = `javascript:${encodeURIComponent(scriptBody.replace(/\s+/g, ' '))}`;

  res.json({
    prefilledUrl,
    samplePayload,
    bookmarkletCode,
    rawScript: scriptBody
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Google Form Autofill Engine running on http://localhost:${PORT}`);
});
