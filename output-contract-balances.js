const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fetch = require('node-fetch');

const Utils = require('./utils/utils');
const Config = require('./config.json');

const WAIT_TIME = 250;
const OUTPUT_PATH = './reports/output-contract-balances.html';

(async () => {
  try {
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    const query = `SELECT * FROM v_contract_info
    WHERE usdc  > 0
    OR usdt > 0
    OR weth > 0
    ORDER BY usdc DESC`;

    const contracts = await db.all(query);

    // empty file before appending
    await fs.promises.writeFile(OUTPUT_PATH, '');

    for (const contract of contracts) {
      const { address } = contract;

      const apiCall = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${Config.etherscanApiKey}`;

      const response = await fetch(apiCall);
      const data = await response.json();
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

      const contractName = data.result[0].ContractName || '';
      console.log(contractName);

      const wrappedElement = `<div><a href="${Utils.toEtherscanLink(address)}" target="_blank">${address}: ${contractName}</a></div>\n`;
      await fs.promises.appendFile(OUTPUT_PATH, wrappedElement + '\n');
    }

    console.log(`${contracts.length} contracts returned`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
