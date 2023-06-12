const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { ethers } = require('ethers');

const CONFIG = require('./config.json');
const UTILS = require('./utils');

const OUTPUT_SYMBOLS = './reports/get-contract-symbol.html';
const OUTPUT_SYMBOLESS = './reports/symboless-contracts.html';
const ERROR_LOG = './error-logs/error-get-contract-info';

const WAIT_TIME = 100;
const ABI = [{
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
    const errorLog = `${ERROR_LOG}-${Date.now()}`;
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get addresses from contact_tx (which is only populated with contracts that did not return anything from name function)
    const query = 'SELECT * FROM contract_tx WHERE transactions > 1 ORDER BY transactions DESC';
    const contractAddresses = await db.all(query);

    // empty file before appending
    await fs.promises.writeFile(OUTPUT_SYMBOLS, '');
    await fs.promises.writeFile(OUTPUT_SYMBOLESS, '');
    await db.run('CREATE TABLE IF NOT EXISTS contract_symbols (address TEXT PRIMARY KEY, symbol TEXT)');

    for (const contractAddress of contractAddresses) {
      const { address } = contractAddress;

      try {
        console.time(address);
        const contract = new ethers.Contract(address, ABI, provider);
        const symbol = await contract.symbol();

        await db.run('INSERT OR REPLACE INTO contract_symbols (address, symbol) VALUES (?, ?)', [address, symbol]);

        if (symbol) {
          const wrappedElement = `<div><a href="${UTILS.toEtherscanLink(address)}" target="_blank">${address}: ${symbol}</a></div>\n`;
          await fs.promises.appendFile(OUTPUT_SYMBOLS, wrappedElement + '\n');
        }

        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
        console.timeEnd(address);
      } catch (error) {
        console.error(error);
        await fs.promises.appendFile(errorLog, JSON.stringify(error, null, 2));
      }
    }

    console.log(`processed ${contractAddresses.length} contracts`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
