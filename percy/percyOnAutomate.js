const log = require('./util/log');
const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('../package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const { Cache } = require('./util/cache');
const { filterCapabilities, sanitizeCommandExecutorUrl } = require('./util/util');
const resolveClientPkg = require('./util/resolveClientPkg');

// webdriverio takes precedence over wd; resolveAppiumClientPkg centralizes that
// and handles webdriverio v9 (no "webdriverio/package.json" subpath export).
let clientWdPkg = resolveClientPkg.resolveAppiumClientPkg();

let ENV_INFO = `(${clientWdPkg?.name}/${clientWdPkg?.version})`;

// Accepts what users pass as `ignoreRegionAppiumElements` /
// `considerRegionAppiumElements`: an array of elements, a promise of one (e.g. an
// un-awaited webdriverio `$$()`), an array of promises of elements (e.g.
// `[$('~a'), $('~b')]`, where webdriverio 9+ returns chainable promises), or a
// single element.
async function getElementIdFromElements(type, elements) {
  let resolved = await elements;
  if (resolved === null || resolved === undefined) return [];
  if (typeof resolved[Symbol.iterator] !== 'function') resolved = [resolved];
  resolved = await Promise.all(Array.from(resolved));
  if (type === 'wd') return resolved.map(e => e.value);
  /* istanbul ignore next */
  if (type === 'wdio') return resolved.map(e => e.elementId);
}

module.exports = async function percyOnAutomate(driver, name, options) {
  try {
    const sessionId = driver.sessionId;
    // Since driver is AppiumDriver object created from driverWrapper.js
    // This AppiumDriver has a property of driver which contains the original driver
    // Hence to access the capabilities of original driver adding this fix
    // Also, note that driverWrapper.getCapabilities() returns only few capabilities and not all
    // Filter credentials out BEFORE caching so the process-global cache never
    // holds secrets that could cross-leak between sessions (CWE-284/CWE-639).
    const capabilities = await Cache.withCache(Cache.capabilities, sessionId, async () => {
      const rawCaps = driver.type === 'wd' ? await driver.getCapabilities() : driver.driver.capabilities;
      return filterCapabilities(rawCaps);
    });
    const commandExecutorUrl = await Cache.withCache(Cache.commandExecutorUrl, sessionId, async () => {
      return sanitizeCommandExecutorUrl(driver.commandExecutorUrl);
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

module.exports.getElementIdFromElements = getElementIdFromElements;
