// 1. IMPORTS
import { connectWallet } from './web3.js';

// 2. DOM ELEMENTS
const leaderboardEl = document.getElementById('leaderboard');
const connectBtn = document.getElementById('connect-wallet');

// 3. MAIN FUNCTIONS
async function initApp() {
  // Connect wallet on button click
  connectBtn.addEventListener('click', async () => {
    const wallet = await connectWallet();
    if (wallet) {
      await fetchLeaderboard(wallet.address);
    }
  });
}
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname)); // <-- Serves index.html, JS, CSS, etc.

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8080, () => {
  console.log('Proxy + frontend running on http://localhost:8080');
});

async function fetchLeaderboard(userAddress) {
  try {
    console.log("🔍 Fetching real data from proxy...");
    // Fetch leaderboard data from the GraphQL API
    // Replace with your actual GraphQL API endpoint
    const response = await fetch('https://ab782caa-f065-4ff3-bb94-3d5019d411fd-00-1he2khpvaeygc.janeway.replit.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query Leaderboard($address: String) {
          masterpiece(id: 110) {
            leaderboard {
              position
              profile { displayName, avatarUrl, walletAddress }
            }
          }
        }`,
        variables: { address: userAddress }
      })
    });
    renderLeaderboard(await response.json());
  } catch (error) {
    console.error("API Error:", error);
  }
}

function renderLeaderboard(data) {
  leaderboardEl.innerHTML = data.masterpiece.leaderboard
    .map(player => `
      <div class="${player.profile.walletAddress === currentUser ? 'highlight' : ''}">
        ${player.position}. ${player.profile.displayName}
      </div>
    `).join('');
}

// 4. INITIALIZE
document.addEventListener('DOMContentLoaded', initApp);
