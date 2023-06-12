const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const CONFIG = require('./config.json');
const ABI = require('./abi/abi-erc-20.json');
const { ethers } = require('ethers');

const ERROR_LOG = './output/errorlog-get-contract-name';

(async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    const contractAddresses = await db.all('SELECT * FROM v_contract_info WHERE name IS NULL');
    console.log(`found ${contractAddresses.length} contracts`);

    await db.run('CREATE TABLE IF NOT EXISTS contract_name (address TEXT PRIMARY KEY, name TEXT)');

    for (const contractAddress of contractAddresses) {
      const { address } = contractAddress;
      console.time(address);

      try {
        const contract = new ethers.Contract(address, ABI, provider);
        const name = await contract.name();

        await db.run('INSERT OR REPLACE INTO contract_name (address, name) VALUES (?, ?)', [address, name]);

        console.log(`${address}: ${name}`);
      } catch (error) {
        await fs.promises.appendFile(ERROR_LOG, JSON.stringify(error, null, 2));
      }

      console.timeEnd(address);
    }

    console.log(`processed ${contractAddresses.length} contracts`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
