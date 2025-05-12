const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const HIGHLIGHT_DIR = path.join(__dirname, 'highlights');
const HISTORY_DIR = path.join(__dirname, 'highlight-history');

// Ensure directories exist
[HIGHLIGHT_DIR, HISTORY_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

let lastTop10 = null;
const currentRunFiles = [];
const files = fs.readdirSync(SNAPSHOT_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => v === b[i]);
}

// Identify key frames and move them
files.forEach(file => {
  const filePath = path.join(SNAPSHOT_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const list = data.players || data.leaderboard || data.data?.leaderboard;
  const top10 = list.slice(0, 10).map(p => p.id || p.profile?.id || p.name || p.profile?.displayName);

  if (!lastTop10 || !arraysEqual(top10, lastTop10)) {
    // this snapshot has a top-10 change
    currentRunFiles.push(file);
    fs.renameSync(filePath, path.join(HIGHLIGHT_DIR, file));
  }
  lastTop10 = top10;
});

// Save the replay run if we captured any key frames
if (currentRunFiles.length) {
  const runId = Date.now().toString();
  const runDir = path.join(HISTORY_DIR, runId);
  fs.mkdirSync(runDir);
  fs.writeFileSync(
    path.join(runDir, 'replay.json'),
    JSON.stringify(currentRunFiles, null, 2)
  );
  console.log(`Saved highlight replay ${runId}`);
}