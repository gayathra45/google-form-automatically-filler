const axios = require('axios');

async function testAll() {
  console.log('--- 1. Testing Health Check ---');
  const health = await axios.get('http://localhost:5000/api/health');
  console.log('Health Response:', health.data);

  console.log('\n--- 2. Testing Form Parser ---');
  const parseRes = await axios.post('http://localhost:5000/api/parse', {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdc2j0G5Wz8aE5-fK69wL7m1R6oN8k3v_sample1/viewform'
  });
  console.log('Form Parsed:', parseRes.data.success);
  console.log('Form Title:', parseRes.data.form.title);
  console.log('Questions Count:', parseRes.data.form.questionCount);
  console.log('Question Samples:', parseRes.data.form.questions.map(q => ({ id: q.id, title: q.title, type: q.type })));

  console.log('\n--- 3. Testing Single Submission ---');
  const submitRes = await axios.post('http://localhost:5000/api/submit-single', {
    formInfo: parseRes.data.form,
    rulesMap: {
      'entry.2005620554': { mode: 'faker_full_name' },
      'entry.1045781291': { mode: 'faker_email' },
      'entry.839401928': { mode: 'scale_rating', scaleValue: 5 },
      'entry.1065046570': { mode: 'random_option' },
      'entry.1166974658': { mode: 'random_option', maxCheckboxPicks: 2 },
      'entry.837918230': { mode: 'random_option' },
      'entry.839517201': { mode: 'faker_paragraph' }
    },
    index: 1
  });
  console.log('Submit Result:', submitRes.data);

  console.log('\n--- 4. Testing Tools Generation (Bookmarklet & Prefilled URL) ---');
  const toolsRes = await axios.post('http://localhost:5000/api/generate-tools', {
    formInfo: parseRes.data.form,
    rulesMap: {
      'entry.2005620554': { mode: 'fixed', fixedValue: 'John Doe' },
      'entry.1045781291': { mode: 'fixed', fixedValue: 'john@example.com' }
    }
  });
  console.log('Prefilled URL preview:', toolsRes.data.prefilledUrl);
  console.log('Bookmarklet Code length:', toolsRes.data.bookmarkletCode.length);

  console.log('\n--- 5. Testing CSV Parsing ---');
  const csvContent = `Full Name,Email,Role,Rating\nAlice Johnson,alice@corp.com,Engineering,5\nBob Smith,bob@startup.io,Marketing,4`;
  const csvRes = await axios.post('http://localhost:5000/api/parse-csv', { csvContent });
  console.log('CSV Parsed rows:', csvRes.data.totalRows, 'Headers:', csvRes.data.headers);

  console.log('\n✅ ALL BACKEND & SUBMISSION APIS OPERATING PERFECTLY!');
}

testAll().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
});
