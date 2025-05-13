const path = require('path');
const fs = require('fs');

const MP_ID = '121'; // Still locked to mp121 for now

const SNAPSHOT_DIR = path.join(__dirname, 'elemental-race', 'highlight-history', 'snapshots');
const HIGHLIGHT_DIR = path.join(__dirname, 'elemental-race', 'highlight-history', 'highlights');
const LATEST_JSON_PATH = path.join(HIGHLIGHT_DIR, 'latest.json');


// Helpers
function arraysEqual(a, b) {
  return (
    Array.isArray(a) && Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => v === b[i])
  );
}

function getTop10Ids(snapshot) {
  const leaderboard = snapshot.data?.leaderboard || snapshot.leaderboard || [];
  return leaderboard
    .sort((a, b) => b.masterpiecePoints - a.masterpiecePoints)
    .slice(0, 10)
    .map(p => p.profile?.id || p.profile?.displayName || 'unknown');
}

function filterMeaningfulChanges(snapshots) {
  const filtered = [];
  let lastTopIds = null;

  snapshots.forEach(snap => {
    const topIds = getTop10Ids(snap);
    if (!lastTopIds || !arraysEqual(topIds, lastTopIds)) {
      filtered.push(snap);
      lastTopIds = topIds;
    }
  });

  return filtered;
}

// Main
(function syncHighlight() {
  const allFiles = fs.readdirSync(SNAPSHOT_DIR);
  const mpFiles = allFiles
    .filter(f => f.includes(`snapshot-${MP_ID}-`) && f.endsWith('.json'))
    .sort(); // Ensure chronological order

  const fullSnapshots = mpFiles.map(f => {
    const fullPath = path.join(SNAPSHOT_DIR, f);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);
    data.timestamp = data.timestamp || fs.statSync(fullPath).mtimeMs;
    return data;
  });

  const highlightFrames = filterMeaningfulChanges(fullSnapshots);

  const outPath = path.join(HIGHLIGHT_DIR, `mp${MP_ID}.json`);
  fs.writeFileSync(outPath, JSON.stringify(highlightFrames, null, 2), 'utf8');
  console.log(`✅ Highlight generated: ${outPath} (${highlightFrames.length} frames)`);

  const latestPayload = {
    masterpieceId: `mp${MP_ID}`,
    updated: new Date().toISOString()
  };
  fs.writeFileSync(LATEST_JSON_PATH, JSON.stringify(latestPayload, null, 2), 'utf8');
  console.log(`📌 Updated latest.json`);
})();
