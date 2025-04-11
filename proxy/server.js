// server.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Apply CORS middleware globally
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'Authorization']
}));

// ✅ Explicitly handle OPTIONS preflight
app.options('/graphql', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.sendStatus(204);
});

app.use(express.json());

// ✅ Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(require('cors')());


// ✅ Static file support (if needed)
app.use('/static', express.static(path.join(__dirname, 'public')));

// ✅ Proxy endpoint
app.post('/graphql', async (req, res) => {
  try {
    const headersToForward = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (req.headers.authorization) {
      headersToForward['Authorization'] = req.headers.authorization;
      console.log('🔐 Forwarding auth header:', req.headers.authorization);
    }

    const response = await fetch('https://api-preview.apps.angrydynomiteslab.com/graphql', {
      method: 'POST',
      headers: headersToForward,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // ✅ Set headers again on the actual response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    console.log('✅ Forwarded response:', JSON.stringify(data, null, 2));
    res.status(response.status).json(data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy server error', details: err.message });
  }
});

// ✅ Default route
app.get('/', (req, res) => {
  res.send('🌐 Elemental Proxy Server is running.');
});

// ✅ Start
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
