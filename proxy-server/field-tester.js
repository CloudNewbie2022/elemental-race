const fetch = require('node-fetch');

const API_URL = 'http://localhost:8080/graphql';

const fieldsToTest = [
    'Resource',
    'symbol',
    'amount',
    'avatar',
    'isEns',
    'Badge',
    'badgeName',
    'url',
    'description',
    'displayName',
    'infoUrl',
    'OnChainToken',
    'eventId',
    'name',
    'position',
    'profile',
    'uid',
    'displayName',
    'mintDate',
    'contract',
    'requiredPoints',
    'points',
    'rewardstages',
    'rank',
    'score',
    'value',
    'trait_type'
  ];
  

(async () => {
  for (const field of fieldsToTest) {
    const query = `
      query {
        masterpieces {
          id
          ${field}
        }
      }
    `;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (data.errors) {
        console.log(`❌ ${field}: ${data.errors[0].message}`);
      } else {
        console.log(`✅ ${field}: success`);
      }
    } catch (err) {
      console.log(`❌ ${field}: ${err.message}`);
    }
  }
})();
