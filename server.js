const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    const response = await fetch('https://api-preview.apps.angrydynomiteslab.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    res.json(await response.json());
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
});
app.get('/health', (req, res) => res.sendStatus(200));

const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}/proxy`));