const { ethers } = require('ethers');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('contract-address.db');
const provider = new ethers.providers.JsonRpcProvider('http://geth.dappnode:8545/');

// const BLOCK_START = 17165000; // May 1st
const BLOCK_START = 17167595;
const BLOCK_END = 17265000;
// const BLOCK_END = 17380000;

// const WAIT_TIME = 10;

function initDatabase() {
  // db.runSync('CREATE TABLE IF NOT EXISTS state (id INT PRIMARY KEY, name TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS contracts (address TEXT PRIMARY KEY, block INT, deployer TEXT, bytecode TEXT)');
}

// Given a block, return list of transactions
async function getTransactions(block) {
  try {
    const blockWithTransactions = await provider.getBlockWithTransactions(block);
    // await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    return blockWithTransactions.transactions;
  } catch (error) {
    console.log(error);
  }
}

async function getContractsDeployed (destinationPath) {
  try {
    console.time('total run time');
    initDatabase();

    for (let block = BLOCK_START; block <= BLOCK_END; block++) {
      console.time(block);
      const transactions = await getTransactions(block);

      for (const transaction of transactions) {
        if (transaction.creates !== null) {
          const address = transaction.creates;
          const deployer = transaction.from;
          const bytecode = transaction.data;
          db.run('INSERT INTO contracts (address, block, deployer, bytecode) VALUES (?, ?, ?, ?)', [address, block, deployer, bytecode], (err) => {
            if (err) { console.error(err); }
          });
        }
      }

      console.timeEnd(block);
    }

    console.timeEnd('total run time');
  } catch (error) {
    console.log(error);
  }
}

getContractsDeployed();
db.close();
