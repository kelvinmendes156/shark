const express = require('express');
const cors = require('cors');
// Importação compatible com Node.js moderno e Railway
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

// Substitua 'SEU_APP_ID' pela ID real do seu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/SEU_APP_ID/exec';

app.all('/proxy', async (req, res) => {
  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' }, // cabeçalho simples para evitar falhas
    };

    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
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

