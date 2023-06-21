const log = require('./util/log');
const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('../package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;

let clientWdPkg = null;
try {
  clientWdPkg = require('wd/package.json');
} catch { }

try {
  clientWdPkg = require('webdriverio/package.json');
} catch { }

let ENV_INFO = `(${clientWdPkg?.name}/${clientWdPkg?.version})`;

async function getElementIdFromElements(type, elements) {
  if (type === 'wd') return elements.map(e => e.value);
  /* istanbul ignore next */
  if (type === 'wdio') return elements.map(e => e.elementId);
}

module.exports = async function percyOnAutomate(driver, name, options) {
  try {
    const sessionId = driver.sessionId;
    const capabilities = await driver.getCapabilities();
    const commandExecutorUrl = driver.commandExecutorUrl;

    if (options && 'ignore_region_appium_elements' in options) {
      options.ignore_region_elements = await getElementIdFromElements(driver.type, options.ignore_region_appium_elements);
      delete options.ignore_region_appium_elements;
    }

    // Post the driver details to the automate screenshot endpoint with snapshot options and other info
    await module.exports.request({
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO,
      sessionId,
      commandExecutorUrl,
      capabilities,
      snapshotName: name,
      options
    });
  } catch (error) {
    // Handle errors
    log.error(`Could not take Screenshot "${name}"`);
    log.error(error.stack);
    /* istanbul ignore next */
    if (!(await driver.getPercyOptions()).ignoreErrors) throw error;
  }
};

/* istanbul ignore next */ // since can't test this function
module.exports.request = async function request(data) {
  await utils.captureAutomateScreenshot(data);
}; // To mock in test case
