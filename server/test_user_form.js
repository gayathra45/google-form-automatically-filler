const axios = require('axios');
const { parseGoogleForm } = require('./services/formParser');
const { buildSubmissionPayload } = require('./services/dataGenerator');

async function testUserForm() {
  const url = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform?usp=dialog';
  console.log('=== 1. Parsing Form ===');
  const formInfo = await parseGoogleForm(url);
  console.log('Title:', formInfo.title);
  console.log('Response URL:', formInfo.responseUrl);
  console.log('Question count:', formInfo.questionCount);
  console.log('Questions:', JSON.stringify(formInfo.questions, null, 2));
  console.log('Tokens - pageHistory:', formInfo.pageHistory, 'fbzx:', formInfo.fbzx);

  console.log('\n=== 2. Building Payload ===');
  const rulesMap = {};
  formInfo.questions.forEach(q => {
    if (q.options && q.options.length > 0) {
      rulesMap[q.id] = { mode: 'random_option' };
    } else {
      rulesMap[q.id] = { mode: 'fixed', fixedValue: 'Test Automation Submission' };
    }
  });

  const payload = buildSubmissionPayload(formInfo.questions, rulesMap, 1);
  console.log('Generated Payload:', payload);

  console.log('\n=== 3. Submitting to Google Forms ===');
  const formUrl = formInfo.responseUrl;
  const formData = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (Array.isArray(v)) {
      v.forEach(val => formData.append(k, val));
    } else {
      formData.append(k, v);
    }
  }
  if (formInfo.pageHistory) formData.append('pageHistory', formInfo.pageHistory);
  if (formInfo.fbzx) formData.append('fbzx', formInfo.fbzx);
  formData.append('fvv', '1');
  formData.append('draftResponse', '[]');
  formData.append('submissionTimestamp', Date.now().toString());

  console.log('Form Post Body String:\n', formData.toString());

  try {
    const res = await axios.post(formUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': formUrl.replace('/formResponse', '/viewform'),
        'Origin': 'https://docs.google.com'
      },
      maxRedirects: 5
    });

    console.log('Status Code:', res.status);
    console.log('Response URL:', res.request?.res?.responseUrl);
    const html = typeof res.data === 'string' ? res.data : '';
    console.log('Response HTML length:', html.length);
    
    // Check if recorded
    const isRecorded = html.includes('freebirdFormviewerViewResponseConfirmationMessage') || 
                       html.includes('Your response has been recorded') ||
                       html.includes('response has been recorded') ||
                       html.includes('vscqUb') || // class for confirmation message
                       html.includes('id="freebird-response-title"');
    console.log('Was response successfully recorded in Google Form?:', isRecorded);

    if (!isRecorded) {
      console.log('--- HTML SNIPPET ---');
      console.log(html.substring(0, 1500));
    }
  } catch (err) {
    console.error('Submission error:', err.response?.status, err.message);
    if (err.response?.data) {
      console.log(err.response.data.substring(0, 1000));
    }
  }
}

testUserForm();
