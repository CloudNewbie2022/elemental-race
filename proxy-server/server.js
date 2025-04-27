
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;






app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Apply CORS middleware globally
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'Authorization']
}));


// Explicitly handle OPTIONS preflight
app.options('/graphql', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.status(200).send(); // Send a 200 OK response
});


// Static file support (if needed)
app.use('/asset', express.static(path.join(__dirname, 'asset')));


// Proxy endpoint
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

    // Set headers again on the actual response
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











// Static file support (if needed)
app.use('/static', express.static(path.join(__dirname, 'asset')));






// --- Snapshot and Highlight Management (non-intrusive) ---

const fs = require('fs');

// Directories for snapshots and highlights
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const HIGHLIGHT_DIR = path.join(__dirname, 'highlights');

// Ensure folders exist
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR);
if (!fs.existsSync(HIGHLIGHT_DIR)) fs.mkdirSync(HIGHLIGHT_DIR);

// API: Save a new snapshot
app.post('/api/save-snapshot', (req, res) => {
  const snapshot = req.body;

  if (!snapshot || !snapshot.leaderboard) {
    return res.status(400).json({ error: 'Invalid snapshot data' });
  }

  const timestamp = Date.now();
  const filename = `snapshot-${timestamp}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), (err) => {
    if (err) {
      console.error('❌ Error saving snapshot:', err);
      return res.status(500).json({ error: 'Failed to save snapshot' });
    }
    console.log(`✅ Snapshot saved: ${filename}`);
    res.json({ message: 'Snapshot saved', filename });
  });
});



// API: Get the latest snapshots (up to 50)
app.get('/api/latest-snapshots', (req, res) => {
  fs.readdir(SNAPSHOT_DIR, (err, files) => {
    if (err) {
      console.error('❌ Error reading snapshot directory:', err);
      return res.status(500).json({ error: 'Failed to load snapshots' });
    }

    const snapshotFiles = files
      .filter(file => file.endsWith('.json'))
      .sort();

    const latestSnapshots = snapshotFiles.slice(-50);

    const snapshotPromises = latestSnapshots.map(filename => {
      const filepath = path.join(SNAPSHOT_DIR, filename);
      return fs.promises.readFile(filepath, 'utf-8').then(content => ({
        filename,
        data: JSON.parse(content)
      }));
    });

    Promise.all(snapshotPromises)
      .then(results => {
        res.json(results);
      })
      .catch(err => {
        console.error('❌ Error loading snapshot files:', err);
        res.status(500).json({ error: 'Failed to load snapshots' });
      });
  });
});








// Start
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});