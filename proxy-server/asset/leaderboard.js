document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.getElementById('leaderboard');
  
    fetch('https://api-preview.apps.angrydynomiteslab.com/graphql') // Replace with your actual API endpoint
      .then(response => response.json())
      .then(data => {
        // Filter entries where eventId is null
        const filteredEntries = data.filter(entry => entry.eventId === null);
  
        // Sort entries by points in descending order
        const sortedEntries = filteredEntries.sort((a, b) => b.points - a.points);
  
        // Get top 10 entries
        const topTen = sortedEntries.slice(0, 10);
  
        // Clear the loading text
        leaderboardContainer.innerHTML = '';
  
        // Display each entry
        topTen.forEach((entry, index) => {
          const entryDiv = document.createElement('div');
          entryDiv.classList.add('entry');
          entryDiv.textContent = `${index + 1}. ${entry.name} - ${entry.points} points`;
          leaderboardContainer.appendChild(entryDiv);
        });
      })
      .catch(error => {
        console.error('Error fetching leaderboard data:', error);
        leaderboardContainer.textContent = 'Failed to load leaderboard.';
      });
  });
  