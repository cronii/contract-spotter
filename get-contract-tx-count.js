// const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fetch = require('node-fetch');

// const BLOCK_START = 17165000; // May 1
// const BLOCK_END = 17265000; // May 15

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get all contracts deployed
    const contracts = await db.all('SELECT address FROM contracts');

    // create temp table to store contract info (num transactions)
    await db.run('CREATE TABLE IF NOT EXISTS contracts_info (address TEXT PRIMARY KEY, transactions INT)');

    for (const contract of contracts) {
      const { address } = contract;
      const response = await fetch(`http://localhost:8080/slurp?addrs=${address}`);
      const data = await response.json();

      console.log(data.data.length);
      db.run('INSERT INTO contracts_info (address, transactions) VALUES (?, ?)', [address, data.data.length]);
    }

    await db.close();
  } catch (err) {
    console.error();
  }
})();
