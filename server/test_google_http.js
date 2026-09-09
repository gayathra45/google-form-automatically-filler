const axios = require('axios');

async function testGoogleHttp() {
  const viewUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform';
  
  // 1. Fetch form view
  console.log('1. Fetching form HTML...');
  const getRes = await axios.get(viewUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });

  const html = getRes.data;
  const fbzxMatch = html.match(/name="fbzx"\s+value="([^"]+)"/);
  const fbzx = fbzxMatch ? fbzxMatch[1] : '';
  const pageHistoryMatch = html.match(/name="pageHistory"\s+value="([^"]+)"/);
  const pageHistory = pageHistoryMatch ? pageHistoryMatch[1] : '0';

  console.log('Found fbzx:', fbzx, 'pageHistory:', pageHistory);

  // Check form action in HTML
  const actionMatch = html.match(/<form[^>]+action="([^"]+)"/);
  console.log('HTML form action:', actionMatch ? actionMatch[1] : 'not found');

  const postUrl = actionMatch ? actionMatch[1] : 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/formResponse';
  console.log('Target postUrl:', postUrl);

  const cookies = getRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  console.log('Cookies:', cookies);

  const params = new URLSearchParams();
  params.append('entry.559352220', 'Test Runner Automation');
  params.append('entry.877086558', "Yes,  I'll be there");
  params.append('entry.924523986', '1');
  params.append('entry.186230675', 'Mains');
  params.append('entry.1751303409', 'None');
  params.append('entry.443565211', 'testrunner@gmail.com');
  params.append('fvv', '1');
  params.append('pageHistory', pageHistory);
  if (fbzx) params.append('fbzx', fbzx);

  try {
    const res = await axios({
      method: 'POST',
      url: postUrl,
      data: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': viewUrl,
        'Origin': 'https://docs.google.com',
        'Cookie': cookies
      },
      maxRedirects: 5
    });

    console.log('POST Response status:', res.status);
    console.log('POST Response URL:', res.request?.res?.responseUrl);
    const body = typeof res.data === 'string' ? res.data : '';
    const success = body.includes('freebirdFormviewerViewResponseConfirmationMessage') || 
                    body.includes('Your response has been recorded') ||
                    body.includes('response has been recorded') ||
                    body.includes('ප්‍රතිචාරය සටහන්');
    console.log('Form submission confirmed by Google?:', success);
    if (!success) {
      console.log('Response body snippet:', body.substring(0, 1000));
    }
  } catch (err) {
    console.error('Error on POST:', err.response?.status, err.message);
    if (err.response?.data) {
      console.log('Error data snippet:', err.response.data.substring(0, 1000));
    }
  }
}

testGoogleHttp();
