const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('http://geth.dappnode:8545/');

async function getTransactions(block) {
  try {
    const blockWithTransactions = await provider.getBlockWithTransactions(block);
    return blockWithTransactions;
  } catch (error) {
    console.log(error);
  }
}

async function getContractsDeployed (destinationPath) {
  try {
    const transactions = await getTransactions(5561490);

    console.log(transactions);
  } catch (error) {
    console.log(error);
  }
}

getContractsDeployed();
