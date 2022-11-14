const { AppiumDriver } = require('./percy/driver/driverWrapper');
const { ProviderResolver } = require('./percy/providers/providerResolver');
const { TimeIt } = require('./percy/util/timing');

const log = require('./percy/util/log');
const utils = require('@percy/sdk-utils');

async function isPercyEnabled(driver) {
  if (!(await utils.isPercyEnabled())) return false;

  return (await driver.getPercyOptions()).enabled;
}

module.exports = async function percyScreenshot(driver, name, {
  fullscreen,
  deviceName,
  orientation,
  statusBarHeight,
  navigationBarHeight
} = {}) {
  // allow working with or without standalone mode
  // if (!driver || typeof driver === 'string') [driver, name, options] = [browser, driver, name];
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
      const provider = ProviderResolver.resolve(driver);
      const response = await provider.screenshot(name, {
        fullscreen,
        deviceName,
        orientation,
        statusBarHeight,
        navigationBarHeight
      });
      log.debug(`[${name}] -> end`);
      return response;
    } catch (e) {
      log.error(`[${name}] failed to take screenshot`);
      log.debug(`[${name}] ${e}, \n ${e.stack}`);
      if ((await driver.getPercyOptions()).raiseErrors) throw e;
    }
  });
};
