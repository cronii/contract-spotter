const { ethers } = require('ethers');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const CONFIG = require('./config.json');

// const BLOCK_START = 17165000; // May 1st
const BLOCK_START = 17283927;
const BLOCK_END = 17380000;
// const BLOCK_END = 17380000;

const WAIT_TIME = 50;

// Given a block, return list of transactions
async function getTransactions(provider, block) {
  try {
    const blockWithTransactions = await provider.getBlockWithTransactions(block);
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    return blockWithTransactions.transactions;
  } catch (error) {
    console.log(error);
  }
}

(async () => {
  try {
    console.time('Total Run Time');
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcAlchemy);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    await db.run('CREATE TABLE IF NOT EXISTS contracts (address TEXT PRIMARY KEY, block INT, deployer TEXT, bytecode TEXT)');

    for (let block = BLOCK_START; block <= BLOCK_END; block++) {
      console.time(block);
      const transactions = await getTransactions(provider, block);

      for (const transaction of transactions) {
        if (transaction.creates !== null) {
          const address = transaction.creates;
          const deployer = transaction.from;
          const bytecode = transaction.data;

          console.log(`Contract found: ${address}`);
          await db.run('INSERT INTO contracts (address, block, deployer, bytecode) VALUES (?, ?, ?, ?)', [address, block, deployer, bytecode]);
        }
      }

      console.timeEnd(block);
    }

    console.timeEnd('Total Run Time');
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
