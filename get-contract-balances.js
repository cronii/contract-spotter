const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { ethers } = require('ethers');

const CONFIG = require('./config.json');
const ABI = require('./abi/abi-erc-20.json');

const ERROR_LOG = './output/errorlog-get-contract-balance';

const COMMON_TOKENS = {
  USDC: {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6
  },
  USDT: {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6
  },
  WETH: {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18
  }
};

(async () => {
  try {
    const errorLog = `${ERROR_LOG}-${Date.now()}`;
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcGeth);
    const db = await open({
      filename: 'contract-address.db',
      driver: sqlite3.Database
    });

    // ethers.utils.formatUnits()

    // get addresses from contact_tx (which is only populated with contracts that did not return anything from name function)
    const query = 'SELECT contract_tx.address FROM contract_tx LEFT JOIN contract_symbols ON contract_tx.address = contract_symbols.address WHERE contract_symbols.symbol IS NULL AND contract_tx.transactions > 1';
    const contractAddresses = await db.all(query);

    await db.run('CREATE TABLE IF NOT EXISTS contract_balances (address TEXT PRIMARY KEY, usdc REAL, usdt REAL, weth REAL)');

    // instantiate common erc20 contracts
    const ContractUSDC = new ethers.Contract(COMMON_TOKENS.USDC.address, ABI, provider);
    const ContractUSDT = new ethers.Contract(COMMON_TOKENS.USDT.address, ABI, provider);
    const ContractWETH = new ethers.Contract(COMMON_TOKENS.WETH.address, ABI, provider);

    for (const contractAddress of contractAddresses) {
      const { address } = contractAddress;

      try {
        console.time(address);

        const balanceUSDC = await ContractUSDC.balanceOf(address);
        const balanceUSDT = await ContractUSDT.balanceOf(address);
        const balanceWETH = await ContractWETH.balanceOf(address);

        const realUSDC = ethers.utils.formatUnits(balanceUSDC, COMMON_TOKENS.USDC.decimals);
        const realUSDT = ethers.utils.formatUnits(balanceUSDT, COMMON_TOKENS.USDT.decimals);
        const realWETH = ethers.utils.formatUnits(balanceWETH, COMMON_TOKENS.WETH.decimals);

        if (realUSDC > 0) {
          console.log(`${address}: ${realUSDC} USDC`);
        }

        if (realUSDT > 0) {
          console.log(`${address}: ${realUSDT} USDT`);
        }

        if (realWETH > 0) {
          console.log(`${address}: ${realWETH} WETH`);
        }

        await db.run('INSERT OR REPLACE INTO contract_balances (address, usdc, usdt, weth) VALUES (?, ?, ?, ?)', [address, realUSDC, realUSDT, realWETH]);
        console.timeEnd(address);
      } catch (error) {
        console.error(error);
        await fs.promises.appendFile(errorLog, JSON.stringify(error, null, 2));
      }
    }

    console.log(`processed ${contractAddresses.length} contracts`);
    await db.close();
  } catch (err) {
    console.error(err);
  }
})();
