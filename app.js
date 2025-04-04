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

async function fetchLeaderboard(userAddress) {
  try {
    const response = await fetch('YOUR_GRAPHQL_API_URL', {
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