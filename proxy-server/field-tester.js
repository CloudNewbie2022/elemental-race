const fetch = require('node-fetch');

const API_URL = 'http://localhost:8080/graphql';

const fieldsToTest = [
  'rarity',
  'tags',
  'description',
  'owner',
  'image',
  'imageUrl',
  'category',
  'updatedAt',
  'createdAt',
  'collection',
  'status'
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
