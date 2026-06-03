const { Client } = require('pg');
const client = new Client({
  connectionString: process.argv[2],
});
client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
