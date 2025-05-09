      // Required modules
      const express = require('express');
      const fetch = require('node-fetch');
      const path = require('path');
      const fs = require('fs');
      const cors = require('cors');

      // Express app setup
      const app = express();
      const PORT = process.env.PORT || 8080;

      // Directory paths
      const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
      const HIGHLIGHT_DIR = path.join(__dirname, 'highlights');

      // Ensure folders exist
      if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR);
      if (!fs.existsSync(HIGHLIGHT_DIR)) fs.mkdirSync(HIGHLIGHT_DIR);

      // Middleware
      app.use(express.json());
      app.use(
        cors({
          origin: '*',
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'Authorization'],
        })
      );

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

      // Static files
      app.use('/asset', express.static(path.join(__dirname, 'asset')));
      app.use('/static', express.static(path.join(__dirname, 'asset')));

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
          Accept: 'application/json',
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
              `,
            }),
          });

          const result = await response.json();
          const masterpiece = result?.data?.masterpiece;

          if (!masterpiece || !masterpiece.id) {
            console.error('❌ No valid masterpiece found');
            return;
          }

          console.log(`📸 Saving snapshot for masterpiece ID: ${masterpiece.id}`);
          saveSnapshot(masterpiece.id, masterpiece.leaderboard);

          const collected = masterpiece.collectedPoints || 0;
          const required = masterpiece.requiredPoints || 1;
          const progress = collected / required;

          console.log(`📈 Progress: ${(progress * 100).toFixed(2)}%`);

          if (progress < 0.5) {
            setSnapshotInterval(10 * 60 * 1000); // 10 minutes
          } else if (progress < 0.8) {
            setSnapshotInterval(2 * 60 * 1000); // 2 minutes
          } else if (progress < 0.95) {
            setSnapshotInterval(1 * 60 * 1000); // 1 minute
          } else {
            setSnapshotInterval(30 * 1000); // 30 seconds
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
          leaderboard,
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
            Accept: 'application/json',
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

          const snapshotFiles = files.filter((file) => file.endsWith('.json')).sort();

          const latestSnapshots = snapshotFiles.slice(-50);

          const snapshotPromises = latestSnapshots.map((filename) => {
            const filepath = path.join(SNAPSHOT_DIR, filename);
            return fs.promises.readFile(filepath, 'utf-8').then((content) => ({
              filename,
              data: JSON.parse(content),
            }));
          });

          Promise.all(snapshotPromises)
            .then((results) => res.json(results))
            .catch((err) => {
              console.error('❌ Error loading snapshot files:', err);
              res.status(500).json({ error: 'Failed to load snapshots' });
            });
        });
      });

      // Highlight Masterpiece API
      app.post('/api/highlight-masterpiece', async (req, res) => {
        const { masterpieceId } = req.body;

        if (!masterpieceId) {
          return res.status(400).json({ error: 'masterpieceId is required' });
        }

        console.log(`🌟 Highlighting masterpiece ID: ${masterpieceId}`);

        try {
          const files = await fs.promises.readdir(SNAPSHOT_DIR);

          const matchingFiles = files.filter(
            (file) => file.startsWith(`snapshot-${masterpieceId}-`) && file.endsWith('.json')
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
            .filter((file) => file.startsWith('snapshot-') && file.endsWith('.json'))
            .map((file) => {
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
      app.get('/api/highlight-snapshots/:masterpieceId', async (req, res) => {
        const masterpieceId = req.params.masterpieceId;

        try {
          const files = await fs.promises.readdir(HIGHLIGHT_DIR);

          const matchingFiles = files
            .filter((file) => file.startsWith(`snapshot-${masterpieceId}-`) && file.endsWith('.json'))
            .sort(); // sort snapshots by filename/time

          if (matchingFiles.length === 0) {
            return res.status(404).json({ error: 'No highlight snapshots found for this masterpiece.' });
          }

          const snapshotPromises = matchingFiles.map((filename) => {
            const filepath = path.join(HIGHLIGHT_DIR, filename);
            return fs.promises.readFile(filepath, 'utf-8').then((content) => ({
              filename,
              data: JSON.parse(content),
            }));
          });

          const snapshots = await Promise.all(snapshotPromises);

          res.json(snapshots);
        } catch (err) {
          console.error('❌ Error loading highlight snapshots:', err);
          res.status(500).json({ error: 'Failed to load highlight snapshots.' });
        }
      });

      // --- Start Server ---
      app.listen(PORT, () => {
        console.log(`✅ Proxy Server + Snapshot System running at http://localhost:${PORT}`);
      });

      // 🚀 Start dynamic snapshots
      setSnapshotInterval(10 * 60 * 1000); // Start slow at 10 minutes
