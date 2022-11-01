const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('./package.json');
const seleniumPkg = require('selenium-webdriver/package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${seleniumPkg.name}/${seleniumPkg.version}`;

// Execute browserstack specific commands
function browserstackExecutor(driver, action, args) {
  let options = args ? { action, arguments: args } : { action };
  return driver.execute(`browserstack_executor: ${JSON.stringify(options)}`);
}

// Collect various device information
function getDeviceInformation(driver) {
  let meta = {
    name: driver.capabilities.deviceName,
    osName: driver.capabilities.platformName,
    osVersion: driver.capabilities.platformVersion,
    orientation: driver.getOrientation().toLowerCase()
  };

  if (meta.osName.toLowerCase() === 'android') {
    // collect information from android devices
    let size = driver.capabilities.deviceScreenSize;
    let [width, height] = size.split('x').map(i => parseInt(i, 10));
    let { statusBar, navigationBar: navBar } = driver.getSystemBars();
    Object.assign(meta, { width, height, statusBar, navBar, android: true });
  } else if (meta.osName.toLowerCase() === 'ios') {
    // collect information from ios devices
    let viewport = driver.execute('mobile: viewportRect');
    let [width, height] = [viewport.width, viewport.top + viewport.height];
    let [statusBar, navBar] = [{ height: viewport.top }, { height: 0 }];
    Object.assign(meta, { width, height, statusBar, navBar, ios: true });
  } else {
    // throw for unsupported devices
    throw new Error(`Unsupported platform: ${meta.osName}`);
  }

  // collect information from browserstack devices
  if (driver.capabilities['bstack:options'] ||
      Object.keys(driver.capabilities).some(cap => cap.startsWith('browserstack.'))) {
    let session = browserstackExecutor(driver, 'getSessionDetails');
    meta.debugUrl = session.browser_url;
    meta.browserstack = true
  }

  return meta;
}

// Take a screenshot and post it to the comparison endpoint
module.exports = function percyScreenshot(driver, name, options) {
  // allow working with or without standalone mode
  if (!driver || typeof driver === 'string') [driver, name, options] = [browser, driver, name];
  if (!driver) throw new Error('The WebdriverIO `browser` object is required.');
  if (!name) throw new Error('The `name` argument is required.');

  return driver.call(async () => {
    if (!(await utils.isPercyEnabled())) return;
    let log = utils.logger('appium-webdriverio');

    try {
      // Collect device information
      let meta = getDeviceInfo(driver);

      // Execute browserstack specific begin screenshot action
      if (meta.browserstack) {
        browserstackExecutor(driver, 'percyScreenshot', {
          percyBuildId: process.env.PERCY_BUILD_ID,
          percyBuildUrl: process.env.PERCY_BUILD_URL,
          state: 'begin'
        });
      }

      // Post to the comparison endpoint with device information and screenshots
      let { link } = await utils.postComparison({
        name,
        tag: {
          name: meta.name,
          osName: meta.osName,
          osVersion: meta.osVersion,
          width: meta.width,
          height: meta.height,
          orientation: meta.orientation
        },
        tiles: [{
          content: driver.takeScreenshot(),
          statusBarHeight: meta.statusBar?.height,
          navBarHeight: meta.navBar?.height,
          fullscreen: options?.fullscreen
        }],
        externalDebugUrl: meta.debugUrl,
        environmentInfo: ENV_INFO,
        clientInfo: CLIENT_INFO,
      });

      // Execute browserstack specific end screenshot action
      if (meta.browserstack) {
        browserstackExecutor(driver, 'percyScreenshot', {
          percyScreenshotUrl: link,
          state: 'end'
        });
      }
    } catch (error) {
      // Handle errors
      log.error(`Could not take screenshot "${name}"`);
      log.error(error);
    }
  });
};
