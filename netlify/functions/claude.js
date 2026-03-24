const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log('Function called, body length:', event.body?.length);
  console.log('API key present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(event.body)
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

    req.write(event.body);
    req.end();
  });
};
