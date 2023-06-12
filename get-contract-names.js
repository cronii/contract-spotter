const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { ethers } = require('ethers');

const CONFIG = require('./config.json');
const ABI = require('./utils/abi-erc-20.json');

const ERROR_LOG = './error-logs/error-get-contract-name';

(async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    const timestamp = Date.now();
    let updates = 0;

    const query = `SELECT * FROM v_contract_info
    WHERE name IS NULL
    AND nameProcessed IS NULL`;

    const contractAddresses = await db.all(query);
    console.log(`${contractAddresses.length} contracts found`);

    await db.run('CREATE TABLE IF NOT EXISTS contract_name (address TEXT PRIMARY KEY, name TEXT, processed INT)');

    for (const contractAddress of contractAddresses) {
      const { address } = contractAddress;
      console.time(address);

      try {
        const contract = new ethers.Contract(address, ABI, provider);
        const name = await contract.name();
        const sanitizedName = name.replace(/'/g, "''");

        await db.run('INSERT OR REPLACE INTO contract_name (address, name, processed) VALUES (?, ?, ?)', [address, sanitizedName, timestamp]);

        console.log(`${address}: ${name}`);
        updates++;
      } catch (error) {
        await db.run('INSERT OR REPLACE INTO contract_name (address, name, processed) VALUES (?, ?, ?)', [address, null, timestamp]);
        await fs.promises.appendFile(`${ERROR_LOG}-${timestamp}`, JSON.stringify(error, null, 2));
      }

      console.timeEnd(address);
    }

    console.log(`${contractAddresses.length} contracts processed`);
    console.log(`${updates} updated contracts`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
