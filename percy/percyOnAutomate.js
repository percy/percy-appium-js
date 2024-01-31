const log = require('./util/log');
const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('../package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const { Cache } = require('./util/cache');

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
    // Since driver is AppiumDriver object created from driverWrapper.js
    // This AppiumDriver has a property of driver which contains the original driver
    // Hence to access the capabilities of original driver adding this fix
    // Also, note that driverWrapper.getCapabilities() returns only few capabilities and not all
    const capabilities = await Cache.withCache(Cache.capabilities, sessionId, async () => {
      return driver.type === 'wd' ? await driver.getCapabilities() : driver.driver.capabilities;
    });
    const commandExecutorUrl = await Cache.withCache(Cache.commandExecutorUrl, sessionId, async () => {
      return driver.commandExecutorUrl;
    });

    /* istanbul ignore next */
    if (options) {
      if ('ignoreRegionAppiumElements' in options) {
        options.ignore_region_appium_elements = options.ignoreRegionAppiumElements;
        delete options.ignoreRegionAppiumElements;
      }
      if ('considerRegionAppiumElements' in options) {
        options.consider_region_appium_elements = options.considerRegionAppiumElements;
        delete options.considerRegionAppiumElements;
      }
      if ('ignore_region_appium_elements' in options) {
        options.ignore_region_elements = await getElementIdFromElements(driver.type, options.ignore_region_appium_elements);
        delete options.ignore_region_appium_elements;
      }
      if ('consider_region_appium_elements' in options) {
        options.consider_region_elements = await getElementIdFromElements(driver.type, options.consider_region_appium_elements);
        delete options.consider_region_appium_elements;
      }
    }

    // Post the driver details to the automate screenshot endpoint with snapshot options and other info
    return await module.exports.request({
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
  return await utils.captureAutomateScreenshot(data);
}; // To mock in test case
