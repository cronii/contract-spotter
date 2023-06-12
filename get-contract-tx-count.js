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
    // const contracts = await db.all('SELECT address FROM contracts');

    // get all unnamed contracts
    const contracts = await db.all('SELECT contracts.address FROM contracts LEFT JOIN contract_name ON contracts.address = contract_name.address WHERE contract_name.name IS NULL');

    await db.run('CREATE TABLE IF NOT EXISTS contract_tx (address TEXT PRIMARY KEY, transactions INT)');

    for (const contract of contracts) {
      const { address } = contract;
      console.time(address);

      const response = await fetch(`http://localhost:8080/slurp?addrs=${address}`);
      const data = await response.json();

      await db.run('INSERT INTO contract_tx (address, transactions) VALUES (?, ?)', [address, data.data.length]);
      console.timeEnd(address);
    }

    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
