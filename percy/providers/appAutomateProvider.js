const { GenericProvider } = require('./genericProvider');
const { Cache } = require('../util/cache');
const log = require('../util/log');

class AppAutomateProvider extends GenericProvider {
  constructor(driver) {
    super(driver);
    this._markedPercy = false;
  }

  static supports(driver) {
    return driver.remoteHostname.includes('browserstack');
  }

  async screenshot(name, {
    fullscreen,
    deviceName,
    orientation,
    statusBarHeight,
    navigationBarHeight
  } = {}) {
    let response = null;
    try {
      await this.percyScreenshotBegin(name);
      response = await super.screenshot(name, {
        fullscreen,
        deviceName: deviceName || await this.getDeviceName(),
        orientation,
        statusBarHeight,
        navigationBarHeight
      });
    } finally {
      await this.percyScreenshotEnd(name, response?.body?.link);
    }
    return response;
  }

  async percyScreenshotBegin(name) {
    try {
      const { success } = await this.browserstackExecutor('percyScreenshot', {
        name,
        percyBuildId: process.env.PERCY_BUILD_ID,
        percyBuildUrl: process.env.PERCY_BUILD_URL || 'unknown',
        state: 'begin'
      });
      this._markedPercy = success;
    } catch (e) {
      log.debug(`[${name}] Could not mark App Automate session as percy`);
    }
  }

  async percyScreenshotEnd(name, percyScreenshotUrl) {
    try {
      await this.browserstackExecutor('percyScreenshot', {
        name,
        percyScreenshotUrl,
        status: 'success',
        state: 'end'
      });
    } catch (e) {
      log.debug(`[${name}] Could not mark App Automate session as percy`);
    }
  }

  async getDeviceName() {
    return (await this.getSessionDetails()).device;
  }

  async getSessionDetails() {
    return await Cache.withCache(Cache.bstackSessionDetails, this.driver.sessionId,
      async () => await this.browserstackExecutor('getSessionDetails'));
  }

  async browserstackExecutor(action, args) {
    let options = args ? { action, arguments: args } : { action };
    return JSON.parse(await this.driver.execute(`browserstack_executor: ${JSON.stringify(options)}`));
  }
}

module.exports = {
  AppAutomateProvider
};
