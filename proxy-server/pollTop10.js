// /proxy-server/pollTop10.js

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// CONFIG
const API_URL = 'https://your-api.com/top10';
const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');
const INTERVAL_HOURS = 4; // Change to 6 if needed
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

// Ensure snapshot folder exists\ if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });


/**
 * Fetch current top 10 players
 * @returns {Promise<Array<{id: string, position: number}>>}
 */
async function fetchTop10() {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.top10.map(player => ({
    id: player.id,
    position: player.position,
  }));
}

/**
 * Get the last saved snapshot from disk
 * @returns {Array<{id: string, position: number}>|null}
 */
function getLastSnapshot() {
  const files = fs.existsSync(SNAPSHOT_DIR)
    ? fs.readdirSync(SNAPSHOT_DIR).sort()
    : [];

  if (files.length === 0) {
    return null;
  }

  const lastFile = files[files.length - 1];
  const filePath = path.join(SNAPSHOT_DIR, lastFile);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Save a snapshot to disk with timestamp
 * @param {Array} snapshot
 */
function saveSnapshot(snapshot) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
  const filename = `${timestamp}.json`;
    const filePath = path.join(SNAPSHOT_DIR, filename);
    const json = JSON.stringify(snapshot, null, 2);
    // 1) write the timestamped file
    fs.writeFileSync(filePath, json, 'utf8');
    // 2) also overwrite latest.json so the front-end can always fetch the newest
    const latestPath = path.join(SNAPSHOT_DIR, 'latest.json');
    fs.writeFileSync(latestPath, json, 'utf8');
   }

/**
 * Compare snapshots and detect changes
 * @param {Array|null} lastSnapshot
 * @param {Array} currentSnapshot
 * @returns {{ changed: boolean, finalSnapshot: Array }}
 */
function detectChangesAndAugment(lastSnapshot, currentSnapshot) {
  if (!lastSnapshot) {
    return { changed: true, finalSnapshot: currentSnapshot };
  }

  const lastIds = lastSnapshot.map(p => p.id);
  const currentIds = currentSnapshot.map(p => p.id);
  let changed = false;

  // Detect missing players (dropped out)
  const missingPlayers = lastIds.filter(id => !currentIds.includes(id));
  if (missingPlayers.length > 0) {
    changed = true;
    console.log(
      `Player(s) dropped from Top 10: ${missingPlayers.join(', ')}`
    );
    // Placeholder for new challenger
    currentSnapshot.push({ id: 'new-challenger', position: 11 });
  }

  // Detect reordering within top 10
  for (let i = 0; i < 10; i++) {
    if (
      currentSnapshot[i] &&
      currentSnapshot[i].id !== lastSnapshot[i]?.id
    ) {
      changed = true;
      break;
    }
  }

  return { changed, finalSnapshot: currentSnapshot };
}

// Main polling loop
async function poll() {
  try {
    const currentSnapshot = await fetchTop10();
    const lastSnapshot = getLastSnapshot();
    const { changed, finalSnapshot } = detectChangesAndAugment(
      lastSnapshot,
      currentSnapshot
    );

    if (changed) {
      console.log('Change detected. Saving snapshot...');
      saveSnapshot(finalSnapshot);
    } else {
      console.log('No change detected.');
    }
  } catch (err) {
    console.error('Error polling:', err);
  } finally {
    setTimeout(poll, INTERVAL_MS);
  }
}

// Start polling
poll();
