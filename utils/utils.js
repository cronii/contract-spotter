const fs = require('fs');
const fetch = require('node-fetch');

const Config = require('../config.json');

const WAIT_TIME = 250;

function toEtherscanLink(address) {
  return `https://etherscan.io/address/${address}`;
}

function toEtherscanAddressHTML(address) {
  return `<a href="https://etherscan.io/address/${address}" target="_blank">${address}</a>`;
}

function generateHeader(contents) {
  let tableHeader = '<tr>';
  Object.keys(contents[0]).forEach((key) => {
    tableHeader += `<th scope="col">${key}</th>`;
  });
  tableHeader += '</tr>\n';

  return tableHeader;
}

function generateRow(content) {
  let tableRow = '<tr>';
  Object.values(content).forEach((value) => {
    tableRow += `<td>${value}</td>`;
  });
  tableRow += '</tr>\n';

  return tableRow;
}

async function generateReport(filename, contents) {
  await fs.promises.writeFile(filename, '<html><head></head><body><table>\n');

  await fs.promises.appendFile(filename, generateHeader(contents));

  for (const content of contents) {
    await fs.promises.appendFile(filename, generateRow(content));
  }

  await fs.promises.appendFile(filename, '</table></body></html>');
}

async function getEtherscanContractName(address) {
  const apiCall = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${Config.etherscanApiKey}`;

  const response = await fetch(apiCall);
  const data = await response.json();
  await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

  return data.result[0].ContractName || '';
}

module.exports = {
  toEtherscanLink,
  toEtherscanAddressHTML,
  getEtherscanContractName,
  generateReport
};
