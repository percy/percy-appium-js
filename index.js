const { AppiumDriver } = require('./percy/driver/driverWrapper');
const { ProviderResolver } = require('./percy/providers/providerResolver');
const { TimeIt } = require('./percy/util/timing');

const log = require('./percy/util/log');
const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('./package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;

let clientWdPkg = null;
try {
  clientWdPkg = require('wd/package.json');
} catch { }

try {
  clientWdPkg = require('webdriverio/package.json');
} catch { }

let ENV_INFO = `(${clientWdPkg?.name}/${clientWdPkg?.version})`;

async function isPercyEnabled(driver) {
  if (!(await utils.isPercyEnabled())) return false;

  return (await driver.getPercyOptions()).enabled;
}

const getElementIdFromElements = async function getElementIdFromElements(type, elements) {
  if (type === 'wd') return elements.map(e => e.value);
  if (type === 'wdio') return elements.map(e => e.elementId);
};

async function percyOnAutomate(driver, name, options = {}) {
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
    if (!(await driver.getPercyOptions()).ignoreErrors) throw error;
  }
}

module.exports = async function percyScreenshot(driver, name, options = {}) {
  let {
    fullscreen,
    deviceName,
    orientation,
    statusBarHeight,
    navigationBarHeight,
    fullPage,
    screenLengths,
    ignoreRegionXpaths,
    ignoreRegionAccessibilityIds,
    ignoreRegionAppiumElements,
    customIgnoreRegions,
    scrollableXpath,
    scrollableId
  } = options;
  // allow working with or without standalone mode for wdio
  if (!driver || typeof driver === 'string') {
    // Unable to test this as couldnt define `browser` from test mjs file that would be
    // accessible here
    /* istanbul ignore if */
    if (name) {
      fullscreen = name.fullscreen;
      deviceName = name.deviceName;
      orientation = name.orientation;
      statusBarHeight = name.statusBarHeight;
      navigationBarHeight = name.navigationBarHeight;
      fullPage = name.fullPage;
      screenLengths = name.screenLengths;
      ignoreRegionXpaths = name.ignoreRegionXpaths;
      ignoreRegionAccessibilityIds = name.ignoreRegionAccessibilityIds;
      ignoreRegionAppiumElements = name.ignoreRegionAppiumElements;
      customIgnoreRegions = name.customIgnoreRegions;
      scrollableXpath = name.scrollableXpath;
      scrollableId = name.scrollableId;
      options = name;
    }
    try {
      // browser is defined in wdio context
      // eslint-disable-next-line no-undef
      [driver, name] = [browser, driver];
    } catch (e) { // ReferenceError: browser is not defined.
      driver = undefined;
    }
  };
  if (!driver) throw new Error('The WebdriverIO `browser` object or wd `driver` object is required.');
  if (!name) throw new Error('The `name` argument is required.');

  log.debug(`[${name}] -> begin`);
  driver = new AppiumDriver(driver);

  if (!await isPercyEnabled(driver)) {
    log.info(`[${name}] percy is disabled for session ${driver.sessionId} -> end`);
    return;
  };
  return TimeIt.run('percyScreenshot', async () => {
    try {
      if (utils.percy?.type === 'automate') {
        return percyOnAutomate(driver, name, options);
      }
      const provider = ProviderResolver.resolve(driver);
      const response = await provider.screenshot(name, {
        fullscreen,
        deviceName,
        orientation,
        statusBarHeight,
        navigationBarHeight,
        fullPage,
        screenLengths,
        ignoreRegionXpaths,
        ignoreRegionAccessibilityIds,
        ignoreRegionAppiumElements,
        customIgnoreRegions,
        scrollableXpath,
        scrollableId
      });
      log.debug(`[${name}] -> end`);
      return response;
    } catch (e) {
      log.error(`[${name}] failed to take screenshot`);
      log.debug(`[${name}] ${e}, \n ${e.stack}`);
      if (!(await driver.getPercyOptions()).ignoreErrors) throw e;
    }
  });
};

module.exports.request = async function request(data) {
  /* istanbul ignore next */
  await utils.captureAutomateScreenshot(data);
}; // To mock in test case
