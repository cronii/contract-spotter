const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const Utils = require('./utils/utils');

const OUTPUT_PATH = './reports/named-contracts-2.html';

const BLOCK_START = 17537000; // April 17th~
const BLOCK_END = 17538151; // May 1st~

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // get all named contracts
    const query = `SELECT address, name FROM v_contract_info
    WHERE block >= ${BLOCK_START}
    AND block <= ${BLOCK_END}
    ORDER BY name DESC`;

    const contracts = await db.all(query);
    await db.close();

    const reportContents = [];
    for (const contract of contracts) {
      const { address, name } = contract;
      reportContents.push({ address: Utils.toEtherscanAddressHTML(address), name });
    }

    await Utils.generateReport(OUTPUT_PATH, reportContents);
  } catch (err) {
    console.error(err);
  }
})();
