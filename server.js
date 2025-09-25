const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Troque pelo seu ID real do Apps Script
const API_URL = 'https://script.google.com/macros/s/SEU_APP_ID/exec';

app.all('/proxy', async (req, res) => {
  try {
    const options = {
      method: req.method,
      headers: {...req.headers}
    };

    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
      options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(API_URL, options);
    const data = await response.text();

    res.send(data);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server rodando na porta ${PORT}`);
});
