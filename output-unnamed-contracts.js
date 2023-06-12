const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const Utils = require('./utils');

const OUTPUT_PATH = './reports/unnamed-contracts.html';

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get contracts that do not have contract.name populated
    const contracts = await db.all('SELECT contracts.address FROM contracts LEFT JOIN contract_name ON contracts.address = contract_name.address WHERE contract_name.name IS NULL');

    // empty file before appending
    await fs.promises.writeFile(OUTPUT_PATH, '');

    for (const contract of contracts) {
      const { address } = contract;
      const wrappedElement = `<div><a href="${Utils.toEtherscanLink(address)}" target="_blank">${address}</a></div>\n`;
      await fs.promises.appendFile(OUTPUT_PATH, wrappedElement + '\n');
    }

    console.log(`${contracts.length} contracts found`);
    await db.close();
  } catch (err) {
    console.error();
  }
})();
