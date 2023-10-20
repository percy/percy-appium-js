const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('../../package.json');
const CLIENT_INFO = `${sdkPkg.name.split('/')[1]}-js/${sdkPkg.version}`;

module.exports = async function postFailedEvents(error) {
  let options = {
    clientInfo: CLIENT_INFO,
    errorMessage: error
  };

  return await module.exports.request(options);
};

module.exports.request = async function request(data) {
  try {
    await utils.postFailedEvent(data);
  } catch {}
}; // To mock in test case
