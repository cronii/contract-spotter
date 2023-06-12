const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const OUTPUT_PATH = './reports/blank-contract-tx-count.html';

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    //
    const contracts = await db.all('SELECT contract_tx.address, contract_tx.transactions FROM contract_tx LEFT JOIN contract_symbols ON contract_tx.address = contract_symbols.address WHERE contract_symbols.symbol IS NULL AND contract_tx.transactions > 1 ORDER BY contract_tx.transactions DESC');

    // empty file before appending
    await fs.promises.writeFile(OUTPUT_PATH, '');

    for (const contract of contracts) {
      const { address, transactions } = contract;
      const wrappedElement = `<div><a href="https://etherscan.io/address/${address}" target="_blank">${address}: ${transactions} txs</a></div>\n`;
      await fs.promises.appendFile(OUTPUT_PATH, wrappedElement + '\n');
    }

    console.log(`${contracts.length} contracts returned`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
