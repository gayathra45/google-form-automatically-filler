const { parseGoogleForm } = require('./services/formParser');
const { submitGoogleFormWithBrowser } = require('./services/puppeteerSubmitter');

async function testRealBrowserSubmission() {
  const url = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform?usp=dialog';
  console.log('1. Parsing Form...');
  const formInfo = await parseGoogleForm(url);
  console.log('Title:', formInfo.title);
  console.log('Questions:', formInfo.questions.map(q => q.title));

  const rulesMap = {
    'entry.559352220': { mode: 'faker_full_name' },
    'entry.877086558': { mode: 'random_option' },
    'entry.924523986': { mode: 'faker_number', numberMin: 1, numberMax: 4 },
    'entry.186230675': { mode: 'random_option', maxCheckboxPicks: 2 },
    'entry.1751303409': { mode: 'fixed', fixedValue: 'No allergies' },
    'entry.443565211': { mode: 'faker_email' }
  };

  console.log('\n2. Submitting with Browser Automation Engine...');
  const result = await submitGoogleFormWithBrowser(
    formInfo.url,
    formInfo.questions,
    rulesMap,
    1
  );

  console.log('\n=== REAL SUBMISSION RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  process.exit(0);
}

testRealBrowserSubmission().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
