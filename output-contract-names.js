const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const OUTPUT_PATH = './output/named-addresses.html';

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get all contracts deployed
    const contracts = await db.all('SELECT * FROM contract_info');

    for (const contract of contracts) {
      const { address, name } = contract;
      const wrappedElement = `<div><a href="https://etherscan.io/address/${address}">${address}: ${name}</a></div>\n`;
      await fs.promises.appendFile(OUTPUT_PATH, wrappedElement + '\n');
    }

    await db.close();
  } catch (err) {
    console.error();
  }
})();
