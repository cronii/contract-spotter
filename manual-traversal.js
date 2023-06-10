const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const OUTPUT_PATH = './output/manual-17203590.html';

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get all contracts deployed
    const contracts = await db.all('SELECT * FROM contracts_info ORDER BY transactions DESC');
    for (const contract of contracts) {
      const { address, transactions } = contract;
      const wrappedElement = `<div><a href="https://etherscan.io/address/${address}">${address}: ${transactions} txs</a></div>\n`;
      await fs.promises.appendFile(OUTPUT_PATH, wrappedElement + '\n');
    }

    await db.close();
  } catch (err) {
    console.error();
  }
})();
