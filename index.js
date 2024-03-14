const { AppiumDriver } = require('./percy/driver/driverWrapper');
const { ProviderResolver } = require('./percy/providers/providerResolver');
const { TimeIt } = require('./percy/util/timing');
const postFailedEvents = require('./percy/util/postFailedEvents');
const percyOnAutomate = require('./percy/percyOnAutomate');

const log = require('./percy/util/log');
const utils = require('@percy/sdk-utils');

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
    considerRegionXpaths,
    considerRegionAccessibilityIds,
    considerRegionAppiumElements,
    customConsiderRegions,
    scrollableXpath,
    topScrollviewOffset,
    bottomScrollviewOffset,
    scrollableId,
    sync,
    testCase
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
      considerRegionXpaths = name.considerRegionXpaths;
      considerRegionAccessibilityIds = name.considerRegionAccessibilityIds;
      considerRegionAppiumElements = name.considerRegionAppiumElements;
      customConsiderRegions = name.customConsiderRegions;
      scrollableXpath = name.scrollableXpath;
      topScrollviewOffset = name.topScrollviewOffset;
      bottomScrollviewOffset = name.bottomScrollviewOffset;
      scrollableId = name.scrollableId;
      sync = name.sync;
      testCase = name.testCase;
      options = name;
    }
    try {
      // browser is defined in wdio context
      // eslint-disable-next-line no-undef
      [driver, name] = [browser, driver];
    } catch (e) { // ReferenceError: browser is not defined.
      driver = undefined;
      await postFailedEvents(e);
    }
  };
  if (!driver) throw new Error('The WebdriverIO `browser` object or wd `driver` object is required.');
  if (!name) throw new Error('The `name` argument is required.');

  log.debug(`[${name}] -> begin`);
  driver = new AppiumDriver(driver);

  if (!await module.exports.isPercyEnabled(driver)) {
    log.info(`[${name}] percy is disabled for session ${driver.sessionId} -> end`);
    return;
  };
  return TimeIt.run('percyScreenshot', async () => {
    try {
      if (utils.percy?.type === 'automate') {
        const percyOnAutomateResponse = await percyOnAutomate(driver, name, options);
        return percyOnAutomateResponse?.body?.data;
      }
      const provider = ProviderResolver.resolve(driver);
      // Only added for browserstack sdk.
      let thTestCaseExecutionId = options.thTestCaseExecutionId;

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
        considerRegionXpaths,
        considerRegionAccessibilityIds,
        considerRegionAppiumElements,
        customConsiderRegions,
        scrollableXpath,
        topScrollviewOffset,
        bottomScrollviewOffset,
        scrollableId,
        sync,
        testCase,
        thTestCaseExecutionId
      });
      log.debug(`[${name}] -> end`);
      return response?.body?.data;
    } catch (e) {
      log.error(`[${name}] failed to take screenshot`);
      log.debug(`[${name}] ${e}, \n ${e.stack}`);
      await postFailedEvents(e);
      if (!(await driver.getPercyOptions()).ignoreErrors) throw e;
    }
  });
};

// jasmine cannot mock individual functions, hence adding isPercyEnabled to the exports object
// also need to define this at the end of the file or else default exports will over-ride this
module.exports.isPercyEnabled = async function isPercyEnabled(driver) {
  if (!(await utils.isPercyEnabled())) return false;

  return (await driver.getPercyOptions()).enabled;
};
