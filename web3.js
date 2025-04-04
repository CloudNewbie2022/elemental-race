// Web3 wallet integration  
// Universal Web3 wallet connector
export async function connectWallet() {
  // Modern EIP-1193 standard detection
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      return {
        address: accounts[0],
        provider: window.ethereum
      };
    } catch (error) {
      console.error("User rejected connection:", error);
      return null;
    }
  }
  
  // Legacy wallet support
  if (window.web3) {
    return {
      address: window.web3.eth.accounts[0],
      provider: window.web3.currentProvider
    };
  }
  
  // Wallet not detected
  alert("Please install MetaMask, Coinbase Wallet, or any EIP-1193 compatible wallet!");
  return null;
}