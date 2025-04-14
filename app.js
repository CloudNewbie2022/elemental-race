// 1. IMPORTS
import { connectWallet } from './web3.js';

// 2. DOM ELEMENTS
const connectBtn = document.getElementById('connect-wallet');

// 3. MAIN FUNCTIONS
async function fetchLeaderboard(userAddress) {
  try {
    console.log("🔍 Fetching real data from proxy...");
    // Fetch leaderboard data from the GraphQL API
    // REMEMBER TO USE /graphql FOR THE PROXY
    const response = await fetch('/graphql', {
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
    const responseJson = await response.json()
    console.log(responseJson)
    //call the fetchData method from index to render the live data
    window.fetchData(userAddress)

  } catch (error) {
    console.error("API Error:", error);
  }
}

// Connect wallet on button click
connectBtn.addEventListener('click', async () => {
  const wallet = await connectWallet();
  if (wallet) {
    fetchLeaderboard(wallet.address)
  }
});
