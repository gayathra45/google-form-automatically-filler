const axios = require('axios');

async function testHeaders() {
  const viewUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/viewform';
  const postUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf9r4n61D2gdbAJxRNtKHtgEFX9nwpx3Z2af4eeTsmj0a3YNA/formResponse';

  const client = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    }
  });

  const getRes = await client.get(viewUrl);
  const fbzxMatch = getRes.data.match(/name="fbzx"\s+value="([^"]+)"/);
  const fbzx = fbzxMatch ? fbzxMatch[1] : '';
  const cookies = getRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';

  const params = new URLSearchParams();
  params.append('entry.559352220', 'Test Auto Header');
  params.append('entry.877086558', "Yes,  I'll be there");
  params.append('entry.924523986', '1');
  params.append('entry.186230675', 'Mains');
  params.append('entry.1751303409', 'None');
  params.append('entry.443565211', 'testauto@gmail.com');
  params.append('fvv', '1');
  params.append('pageHistory', '0');
  if (fbzx) params.append('fbzx', fbzx);

  try {
    const postRes = await client.post(postUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'Referer': viewUrl,
        'Origin': 'https://docs.google.com'
      }
    });

    console.log('Status:', postRes.status);
    const body = postRes.data;
    const ok = body.includes('freebirdFormviewerViewResponseConfirmationMessage') || body.includes('Your response has been recorded') || body.includes('response has been recorded') || body.includes('ප්‍රතිචාරය');
    console.log('Success confirmed?:', ok);
    if (!ok) console.log('Snippet:', body.substring(0, 1000));
  } catch (err) {
    console.log('Failed:', err.response?.status, err.message);
  }
}

testHeaders();
