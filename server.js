const express = require('express');
const cors = require('cors');
// Importando fetch para Node.js moderno
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = 'https://script.google.com/macros/s/AKfycb14zVP.../exec'; // Confirme a URL correta do seu Script

app.all('/proxy', async (req, res) => {
  try {
    const options = {
      method: req.method,
      headers: {}
    };

    // Se for POST, envia body JSON com o content-type correto
    if (req.method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(req.body);
    }

    // Se for GET, remove header Content-Type para evitar problemas

    const response = await fetch(API_URL, options);
    const text = await response.text();

    // Retornar o texto direto (JSON ou callback JSONP)

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

