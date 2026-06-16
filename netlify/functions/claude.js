const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log('Function called, body length:', event.body?.length);
  console.log('API key present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

  // Parse body and force correct model if missing or wrong
  let bodyObj;
  try {
    bodyObj = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  // Force valid model — claude-sonnet-4-6 is available on all tiers
  bodyObj.model = 'claude-sonnet-4-6';

  const bodyStr = JSON.stringify(bodyObj);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      console.log('Anthropic status:', res.statusCode);
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Response length:', data.length);
        console.log('Response preview:', data.substring(0, 200));
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: data
        });
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err.message);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      });
    });

    req.write(bodyStr);
    req.end();
  });
};
