const fs = require('fs');

function toEtherscanLink(address) {
  return `https://etherscan.io/address/${address}`;
}

function toEtherscanAddressHTML(address) {
  return `<a href="https://etherscan.io/address/${address}">${address}</a>`;
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

module.exports = {
  toEtherscanLink,
  toEtherscanAddressHTML,
  generateReport
};
