const path = require('path');
const fs = require('fs');

// <<< CONFIGURATION >>>
// If this script lives inside your proxy-server folder, __dirname points to .../proxy-server
// You can override MP_ID via environment variable if needed
const MP_ID = process.env.MP_ID || '121';

// <<< PATH SETUP >>>
// Update these if your folder structure changes
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const HIGHLIGHT_DIR = path.join(__dirname, 'highlight-history');
const LATEST_JSON_PATH = path.join(HIGHLIGHT_DIR, 'latest.json');

// Ensure output directories exist
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
fs.mkdirSync(HIGHLIGHT_DIR, { recursive: true });
