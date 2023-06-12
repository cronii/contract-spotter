const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const Utils = require('./utils/utils');

const OUTPUT_PATH = './reports/contract-balances.html';

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
    await db.close();

    const reportContents = [];
    for (const contract of contracts) {
      const { address, usdc, usdt, weth } = contract;
      const value = usdc + usdt + (weth * 1730.00);

      // const contractName = await Utils.getEtherscanContractName(address);
      // console.log(contractName);

      reportContents.push({ address: Utils.toEtherscanAddressHTML(address), value, usdc, usdt, weth });
    }

    // sort by value desc
    reportContents.sort((a, b) => b.value - a.value);

    await Utils.generateReport(OUTPUT_PATH, reportContents);
    console.log(`${contracts.length} contracts returned`);
  } catch (err) {
    console.error(err);
  }
})();
