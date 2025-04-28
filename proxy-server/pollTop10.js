const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// CONFIG
const API_URL = 'https://your-api.com/top10';
const SNAPSHOT_DIR = './snapshots';
const INTERVAL_HOURS = 4; // or 6
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

// Ensure snapshot folder exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR);
}

// Fetch current top 10
async function fetchTop10() {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.top10.map(player => ({ id: player.id, position: player.position }));
}

// Get last snapshot
function getLastSnapshot() {
  const files = fs.readdirSync(SNAPSHOT_DIR).sort();
  if (files.length === 0) return null;
  const lastFile = files[files.length - 1];
  return JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, lastFile), 'utf8'));
}

// Save snapshot
function saveSnapshot(snapshot) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(SNAPSHOT_DIR, `${timestamp}.json`),
    JSON.stringify(snapshot, null, 2)
  );
}

// Compare snapshots (with "waiting aura" logic)
function detectChangesAndAugment(lastSnapshot, currentSnapshot) {
  if (!lastSnapshot) return { changed: true, finalSnapshot: currentSnapshot };

  const lastIds = lastSnapshot.map(player => player.id);
  const currentIds = currentSnapshot.map(player => player.id);

  let changed = false;

  // Detect if any old player is missing
  const missingPlayers = lastIds.filter(id => !currentIds.includes(id));
  if (missingPlayers.length > 0) {
    changed = true;

    // Add a placeholder for new incoming player
    console.log(`Player dropped from Top 10: ${missingPlayers.join(', ')}`);
    currentSnapshot.push({ id: 'new-challenger', position: 11 });
  }

  // Also detect reordering
  for (let i = 0; i < 10; i++) {
    if (currentSnapshot[i] && currentSnapshot[i].id !== lastSnapshot[i]?.id) {
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

    const { changed, finalSnapshot } = detectChangesAndAugment(lastSnapshot, currentSnapshot);

    if (changed) {
      console.log('Change detected. Saving snapshot...');
      saveSnapshot(finalSnapshot);
    } else {
      console.log('No change detected.');
    }
  } catch (err) {
    console.error('Error polling:', err);
  } finally {
    setTimeout(poll, INTERVAL_MS); // Reschedule
  }
}

// Start
poll();
