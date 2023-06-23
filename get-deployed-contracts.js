const { ethers } = require('ethers');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const CONFIG = require('./config.json');

const BLOCK_START = 17065000;
const BLOCK_END = 17361664;

const CHUNK_SIZE = 50; // Adjust this based on your system's capacity

async function getTransactions(provider, block) {
  try {
    const blockWithTransactions = await provider.getBlockWithTransactions(block);
    return blockWithTransactions.transactions;
  } catch (error) {
    console.log(error);
  }
}

(async () => {
  try {
    console.time('Total Run Time');
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    await db.run('CREATE TABLE IF NOT EXISTS contracts (address TEXT PRIMARY KEY, block INT, deployer TEXT, bytecode TEXT)');
    let counter = 0;

    for (let chunkStart = BLOCK_START; chunkStart <= BLOCK_END; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, BLOCK_END);
      const promises = [];

      for (let block = chunkStart; block <= chunkEnd; block++) {
        promises.push(getTransactions(provider, block));
      }

      const allTransactions = await Promise.all(promises);
      const sqlInserts = [];

      allTransactions.forEach((transactions, index) => {
        transactions.forEach((transaction) => {
          if (transaction.creates !== null) {
            const address = transaction.creates;
            const deployer = transaction.from;
            const bytecode = transaction.data;
            const block = chunkStart + index;

            sqlInserts.push(`INSERT INTO contracts (address, block, deployer, bytecode) VALUES ('${address}', ${block}, '${deployer}', '${bytecode}')`);

            counter++;
            console.log(`Contract found: ${address}`);
          }
        });
      });

      if (sqlInserts.length > 0) {
        await db.run(sqlInserts.join(';'));
      }
    }

    console.log(`${counter} contracts found`);
    console.timeEnd('Total Run Time');
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();