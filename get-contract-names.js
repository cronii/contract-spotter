const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const CONFIG = require('./config.json');
const { ethers } = require('ethers');

const ERROR_LOG = './output/errorlog-contract-info';
const WAIT_TIME = 100;
const ABI = [{
  inputs: [],
  name: 'name',
  outputs: [
    {
      internalType: 'string',
      name: '',
      type: 'string'
    }
  ],
  stateMutability: 'view',
  type: 'function'
},
{
  inputs: [],
  name: 'symbol',
  outputs: [
    {
      internalType: 'string',
      name: '',
      type: 'string'
    }
  ],
  stateMutability: 'view',
  type: 'function'
}];

(async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    const contractAddresses = await db.all('SELECT address FROM contracts');

    await db.run('CREATE TABLE IF NOT EXISTS contract_info (address TEXT PRIMARY KEY, name TEXT)');

    for (const contractAddress of contractAddresses) {
      const { address } = contractAddress;

      try {
        console.time(address);
        const contract = new ethers.Contract(address, ABI, provider);
        const name = await contract.name();

        await db.run('INSERT INTO contract_info (address, name) VALUES (?, ?)', [address, name]);

        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
        console.timeEnd(address);
      } catch (error) {
        console.error(error);
        await fs.promises.appendFile(ERROR_LOG, JSON.stringify(error, null, 2));
      }
    }

    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
