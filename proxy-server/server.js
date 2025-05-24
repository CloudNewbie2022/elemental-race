

// Required modules
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const cors = require('cors');






// ──────────────────────────────────────────────
// Setup our “history” folder constant **before** we ever use it
// ──────────────────────────────────────────────
const HISTORY_DIR = path.join(__dirname, 'highlight-history');
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR);



// Express app setup
const app = express();
const PORT = process.env.PORT || 8080;

// Directory paths
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const HIGHLIGHT_DIR = path.join(__dirname, 'highlights');

// Ensure folders exist
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR);
if (!fs.existsSync(HIGHLIGHT_DIR)) fs.mkdirSync(HIGHLIGHT_DIR);

//import edit 


const allFiles = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.json'));
const latestFile = allFiles.sort().reverse()[0];
const MP_ID = latestFile?.split('-')[1] || '122';
const LATEST_JSON_PATH = path.join(HISTORY_DIR, 'latest.json');




// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'Authorization']
}));


//import 3



// Helper: extract the top-10 IDs (or names) from a snapshot
function getTop10Ids(snapshot) {
  const board = snapshot.data?.leaderboard || snapshot.leaderboard || [];
  return board
    .sort((a, b) => b.masterpiecePoints - a.masterpiecePoints)
    .slice(0, 10)
    .map(p => p.profile?.id || p.profile?.displayName);
}

// Helper: only keep snapshots whose top-10 differ from the previous
function filterMeaningfulChanges(snapshots) {
  const filtered = [];
  let lastTop = null;

  snapshots.forEach(snap => {
    const topIds = getTop10Ids(snap);
    if (!lastTop || topIds.join() !== lastTop.join()) {
      filtered.push(snap);
      lastTop = topIds;
    }
  });

  return filtered;
}



//import two 

// Serve static frontend files (like testingalpine.html)
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// ──────────────────────────────────────────────
// Highlight-History API (must be **after** express() + middleware)
// ──────────────────────────────────────────────


// 1) list every past run
app.get('/api/history', (req, res) => {
  const runs = fs.readdirSync(HISTORY_DIR)
    .filter(name => fs.statSync(path.join(HISTORY_DIR, name)).isDirectory())
    .sort((a, b) => b - a)                    // newest first
    .map(id => ({ id, timestamp: new Date(+id) }));
  res.json(runs);
});

// 2) fetch the snapshots for one run
app.get('/api/history/:id', (req, res) => {
  const runDir    = path.join(HISTORY_DIR, req.params.id);
  const manifest  = path.join(runDir, 'replay.json');
  if (!fs.existsSync(manifest)) {
    return res.status(404).json({ error: 'Run not found' });
  }
  // load the file list and then each highlight
  const files = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const snaps = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(__dirname, 'highlights', f), 'utf8'))
  );
  res.json(snaps);
});


app.get('/api/status', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});



app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});




app.options('/graphql', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.status(200).send();
});




//import




// if (meaningful.length === 0) {
  // return res
   // .status(404)
    //.json({ error: 'No meaningful snapshots for MP121' });
// }




// Add this route to return all snapshot frames for MP121
app.get('/api/highlight-snapshots/121', async (req, res) => {
  try {
    const dir = path.join(__dirname, 'snapshots');
    const files = (await fs.promises.readdir(dir))
      .filter(f => f.startsWith('snapshot-121-') && f.endsWith('.json'))
      .sort();

    // load & parse each snapshot
    const snaps = await Promise.all(
      files.map(f =>
        fs.promises.readFile(path.join(dir, f), 'utf8')
          .then(raw => JSON.parse(raw))
      )
    );

    // filter out consecutive duplicates
    const meaningful = filterMeaningfulChanges(snaps);

    if (!meaningful.length) {
      return res.status(404).json({ error: 'No meaningful snapshots for MP121' });
    }

    res.json(meaningful);
  } catch (err) {
    console.error('❌ Error reading MP121 snapshots:', err);
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});




// <<< HELPERS >>>
// Helper: grab the Top 10 entries (in order) as a simple array of { id, points }
function getTop10Frame(snapshot) {
  const board = snapshot.data?.leaderboard || snapshot.leaderboard || [];
  return board
    .sort((a, b) => b.masterpiecePoints - a.masterpiecePoints)
    .slice(0, 10)
    .map(p => ({
      id: p.profile?.id || p.profile?.displayName,
      points: p.masterpiecePoints
    }));
}

// Helper: only keep snapshots whose Top 10 (id+points) differ from the previous
function filterMeaningfulChanges(snapshots) {
  if (!Array.isArray(snapshots)) return [];
  const filtered = [];
  let lastFrame = null;

  snapshots.forEach(snap => {
    const frame = getTop10Frame(snap);
    const key = JSON.stringify(frame);
    if (key !== lastFrame) {
      filtered.push(snap);
      lastFrame = key;
    }
  });

  return filtered;
}






function syncHighlight() {
  // Read and sort snapshot files
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.includes(`snapshot-${MP_ID}-`) && f.endsWith('.json'))
    .sort();

  // Parse each snapshot JSON
  const snapshots = files.map(f => {
    const fullPath = path.join(SNAPSHOT_DIR, f);
    const raw = fs.readFileSync(fullPath, 'utf8');

 try {
    const data = JSON.parse(raw);
    data.timestamp = data.timestamp || fs.statSync(fullPath).mtimeMs;
    return data;
  } catch (err) {
    console.warn(`⚠️ Skipping corrupted snapshot file: ${f}`);
    return null;
  }
}).filter(Boolean); // Remove nulls

    const data = JSON.parse(raw);
    // If no timestamp in data, use file's last modified time
    data.timestamp = data.timestamp || fs.statSync(fullPath).mtimeMs;
    return data;
  };

  // Filter for meaningful leaderboard changes
  const highlightFrames = filterMeaningfulChanges(snapshots);

  // Write the highlight history
  // <<< OUTPUT HIGHLIGHT FILE >>>
  const outFile = path.join(HIGHLIGHT_DIR, `mp${MP_ID}.json`);
  fs.writeFileSync(outFile, JSON.stringify(highlightFrames, null, 2), 'utf8');
  console.log(`✅ Highlight generated: ${outFile} (${highlightFrames.length} frames)`);

  // Write the latest pointer
  // <<< UPDATE LATEST.JSON >>>
  const latestPayload = {
    masterpieceId: `mp${MP_ID}`,
    updated: new Date().toISOString()
  };
  fs.writeFileSync(LATEST_JSON_PATH, JSON.stringify(latestPayload, null, 2), 'utf8');
  console.log(`📌 Updated latest.json at ${LATEST_JSON_PATH}`);


// Run the sync process
syncHighlight();


//end of syncHighlight








// Static files
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.use('/static', express.static(path.join(__dirname, 'asset')));
app.use('/highlight-history', express.static(path.join(__dirname, 'highlight-history')));

app.use('/snapshots', express.static(path.join(__dirname, 'snapshots')));
app.use('/highlights', express.static(path.join(__dirname, 'highlights')));



// --- Smart Snapshot Management ---
let currentInterval = null;

function setSnapshotInterval(ms) {
  if (currentInterval) clearInterval(currentInterval);
  console.log(`⏱️ Setting new snapshot interval: every ${ms / 1000} seconds`);
  currentInterval = setInterval(fetchAndSaveLatestMasterpiece, ms);
}

// Fetch and save masterpiece
async function fetchAndSaveLatestMasterpiece() {
  const headersToForward = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch('https://api-preview.apps.angrydynomiteslab.com/graphql', {
      method: 'POST',
      headers: headersToForward,
      body: JSON.stringify({
        query: `
          query {
            masterpiece {
              id
              name
              collectedPoints
              requiredPoints
              leaderboard {
                profile {
                  displayName
                  avatarUrl
                }
                masterpiecePoints
              }
            }
          }
        `
      })
    });

    const result = await response.json();
    const masterpiece = result?.data?.masterpiece;

    if (!masterpiece || !masterpiece.id) {
      console.error('❌ No valid masterpiece found');
      return;
    }

    console.log(`📸 Saving snapshot for masterpiece ID: ${masterpiece.id}`);
    saveSnapshot(masterpiece.id, masterpiece.leaderboard);
    syncHighlight(); // ✅ Auto-sync highlights and update latest.json




    const allFiles = fs
      .readdirSync(SNAPSHOT_DIR)
      .filter(f => f.startsWith(`snapshot-${masterpiece.id}-`))
      .sort();
    const prevFile = allFiles.length > 1
      ? allFiles[allFiles.length - 2]
      : null;

    // 2) Load old board and compute highlights:
    let oldBoard = [];
    if (prevFile) {
      const raw = fs.readFileSync(path.join(SNAPSHOT_DIR, prevFile), 'utf-8');
      oldBoard = JSON.parse(raw).leaderboard || [];
    }
    const newBoard = masterpiece.leaderboard;
    const highlights = computeHighlights(oldBoard, newBoard);

    // 3) If there are changes, write a highlight file:
    if (highlights.length) {
      const highName = `snapshot-${masterpiece.id}-${Date.now()}.json`;
      fs.writeFileSync(
        path.join(HIGHLIGHT_DIR, highName),
        JSON.stringify({ masterpieceId: masterpiece.id, highlights }, null, 2)
      );
      console.log(`🌟 Wrote highlights: ${highName}`);
    }

    const collected = masterpiece.collectedPoints || 0;
    const required = masterpiece.requiredPoints || 1;
    const progress = collected / required;

    console.log(`📈 Progress: ${(progress * 100).toFixed(2)}%`);

    if (progress < 0.5) {
      setSnapshotInterval(10 * 60 * 1000); // 10 minutes
    } else if (progress < 0.8) {
      setSnapshotInterval(2 * 60 * 1000);  // 2 minutes
    } else if (progress < 0.95) {
      setSnapshotInterval(1 * 60 * 1000);  // 1 minute
    } else {
      setSnapshotInterval(30 * 1000);      // 30 seconds
    }

  } catch (err) {
    console.error('❌ Error fetching masterpiece:', err.message);
  }
}

// Save snapshot helper
function saveSnapshot(masterpieceId, leaderboard) {
  const timestamp = Date.now();
  const filename = `snapshot-${masterpieceId}-${timestamp}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  const snapshot = {
    masterpieceId,
    leaderboard
  };

  fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), (err) => {
    if (err) {
      console.error('❌ Error saving snapshot:', err);
    } else {
      console.log(`✅ Snapshot saved: ${filename}`);
    }
  });
}

// --- API Endpoints ---

// Proxy GraphQL
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

// Manual Save API (if needed)
app.post('/api/save-snapshot', (req, res) => {
  const snapshot = req.body;
  if (!snapshot || !snapshot.leaderboard) {
    return res.status(400).json({ error: 'Invalid snapshot data' });
  }

  const timestamp = Date.now();
  const filename = `snapshot-manual-${timestamp}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), (err) => {
    if (err) {
      console.error('❌ Error saving manual snapshot:', err);
      return res.status(500).json({ error: 'Failed to save snapshot' });
    }
    console.log(`✅ Manual Snapshot saved: ${filename}`);
    res.json({ message: 'Snapshot saved', filename });
  });
});

// Latest Snapshots API
app.get('/api/latest-snapshots', (req, res) => {
  fs.readdir(SNAPSHOT_DIR, (err, files) => {
    if (err) {
      console.error('❌ Error reading snapshots directory:', err);
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
      .then(results => res.json(results))
      .catch(err => {
        console.error('❌ Error loading snapshot files:', err);
        res.status(500).json({ error: 'Failed to load snapshots' });
      });
  });
});

function computeHighlights(oldBoard, newBoard) {
  const highlights = [];
  const oldRanks = oldBoard.reduce((m, p, i) => {
    const name = p.profile.displayName;
    m[name] = i + 1; // Store old rank (1-based index)
    return m;
  }, {});

  // Compare new board with old ranks
  newBoard.forEach((p, i) => {
    const name = p.profile.displayName;
    const oldRank = oldRanks[name] || null;
    const newRank = i + 1;
    if (oldRank && oldRank !== newRank) {
      highlights.push({ name, from: oldRank, to: newRank, change: oldRank - newRank });
    }
  });
  return highlights;
}

// Highlight Masterpiece API
app.post('/api/highlight-masterpiece', async (req, res) => {
  const { masterpieceId } = req.body;

  if (!masterpieceId) {
    return res.status(400).json({ error: 'masterpieceId is required' });
  }

  console.log(`🌟 Highlighting masterpiece ID: ${masterpieceId}`);

  try {
    const files = await fs.promises.readdir(SNAPSHOT_DIR);

    const matchingFiles = files.filter(file =>
      file.startsWith(`snapshot-${masterpieceId}-`) && file.endsWith('.json')
    );

    if (matchingFiles.length === 0) {
      return res.status(404).json({ error: 'No matching snapshots found for this masterpiece' });
    }

    for (const file of matchingFiles) {
      const srcPath = path.join(SNAPSHOT_DIR, file);
      const destPath = path.join(HIGHLIGHT_DIR, file);
      await fs.promises.copyFile(srcPath, destPath);
      console.log(`✅ Highlighted snapshot copied: ${file}`);
    }

    res.json({ message: `Masterpiece ${masterpieceId} highlighted with ${matchingFiles.length} snapshots.` });

  } catch (err) {
    console.error('❌ Error highlighting masterpiece:', err);
    res.status(500).json({ error: 'Failed to highlight masterpiece' });
  }
});

// --- API: Get Latest Highlighted Masterpiece ID ---
app.get('/api/latest-highlight-id', async (req, res) => {
  try {
    const files = await fs.promises.readdir(HIGHLIGHT_DIR);

    const highlightedMasterpieceIds = files
      .filter(file => file.startsWith('snapshot-') && file.endsWith('.json'))
      .map(file => {
        const parts = file.split('-');
        return parts[1]; // Get masterpieceId part
      });

    if (highlightedMasterpieceIds.length === 0) {
      return res.status(404).json({ error: 'No highlights available.' });
    }

    // Pick the most recent highlight (by filename latest)
    const latestId = highlightedMasterpieceIds.sort().reverse()[0];

    res.json({ masterpieceId: latestId });

  } catch (err) {
    console.error('❌ Error getting latest highlight:', err);
    res.status(500).json({ error: 'Failed to get latest highlight.' });
  }
});

// --- API to Get All Highlight Snapshots for a Masterpiece ---
app.get('/api/highlight-snapshots/121', async (req, res) => {
  try {
    const files = (await fs.promises.readdir(SNAPSHOT_DIR))
      .filter(f => f.startsWith('snapshot-121-') && f.endsWith('.json'))
      .sort();

    const snaps = await Promise.all(
      files.map(f => fs.promises.readFile(
        path.join(SNAPSHOT_DIR, f), 'utf8'
      ).then(JSON.parse))
    );

    const meaningful = filterMeaningfulChanges(snaps);

    if (!meaningful.length) {
      return res.status(404).json({ error: 'No meaningful snapshots for MP121' });
    }

    res.json(meaningful);
  } catch (err) {
    console.error('❌ Error reading MP121 snapshots:', err);
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Proxy Server + Snapshot System running at http://localhost:${PORT}`);
});

// 🚀 Start dynamic snapshots
setSnapshotInterval(10 * 60 * 1000); // Start slow at 10 minutes
setInterval(syncHighlight, 60 * 1000); // Optional fallback
