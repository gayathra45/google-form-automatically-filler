const axios = require('axios');
const http = require('http');

async function testExact10() {
  const parseRes = await axios.post('http://localhost:5000/api/parse', {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdc2j0G5Wz8aE5-fK69wL7m1R6oN8k3v_sample1/viewform'
  });

  const EXACT_COUNT = 10;
  let buffer = '';

  const postData = JSON.stringify({
    formInfo: parseRes.data.form,
    rulesMap: {
      'entry.2005620554': { mode: 'faker_full_name' }
    },
    count: EXACT_COUNT,
    delayMs: 80,
    jitterMs: 0
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/batch-submit-sse',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    res.on('data', (chunk) => {
      buffer += chunk.toString();
    });

    res.on('end', () => {
      const matches = buffer.match(/event: completed_one/g) || [];
      console.log(`Total 'completed_one' events received: ${matches.length}/${EXACT_COUNT}`);
      
      const finishedMatch = buffer.match(/event: finished\ndata: (\{.*\})/);
      if (finishedMatch) {
        const summary = JSON.parse(finishedMatch[1]).summary;
        console.log(`Summary total: ${summary.total}, successful: ${summary.successful}, logs: ${summary.logs.length}`);
      }

      if (matches.length === EXACT_COUNT) {
        console.log(`✅ EXACT COUNT VERIFIED: Submits strictly ${EXACT_COUNT} times!`);
      }
    });
  });

  req.write(postData);
  req.end();
}

testExact10();
