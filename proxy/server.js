// server.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Apply basic CORS globally
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With'],
}));

// ✅ Handle CORS preflight requests for /graphql
app.options('/graphql', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.sendStatus(204); // No Content
});

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ✅ Serve static files (optional)
app.use('/static', express.static(path.join(__dirname, 'public')));

// ✅ GraphQL Proxy Route
app.post('/graphql', async (req, res) => {
  try {
    const response = await fetch('https://api-preview.apps.angrydynomiteslab.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // ✅ Apply CORS headers to response (just in case)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    console.log('✅ Forwarded response:', JSON.stringify(data, null, 2));
    res.status(response.status).json(data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy server error', details: err.message });
  }
});

// ✅ Root Test Route
app.get('/', (req, res) => {
  res.send('🌐 Elemental Proxy Server is running.');
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
