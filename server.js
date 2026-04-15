const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,app_token,access_token,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.raw({ type: '*/*', limit: '10mb' }));

app.all('/v2/condor/*', (req, res) => {
  const path = req.url;
  const appToken = req.headers['app_token'] || '';
  const accessToken = req.headers['access_token'] || '';

  const options = {
    hostname: 'api.superlogica.net',
    port: 443,
    path: path,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
      'app_token': appToken,
      'access_token': accessToken,
      'client_id': appToken,
      'Authorization': 'Bearer ' + accessToken,
    }
  };

  if (req.body && req.body.length) {
    options.headers['Content-Length'] = req.body.length;
  }

  const proxy = https.request(options, (apiRes) => {
    res.status(apiRes.statusCode);
    Object.entries(apiRes.headers).forEach(([k, v]) => {
      if (!['transfer-encoding','connection'].includes(k)) res.setHeader(k, v);
    });
    apiRes.pipe(res);
  });

  proxy.on('error', (err) => {
    res.status(502).json({ error: 'Proxy error', message: err.message });
  });

  if (req.body && req.body.length) proxy.write(req.body);
  proxy.end();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Superlogica Proxy' });
});

app.listen(PORT, () => {
  console.log(`Proxy rodando na porta ${PORT}`);
});
