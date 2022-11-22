const { GenericProvider } = require('./genericProvider');
const { Cache } = require('../util/cache');
const { TimeIt } = require('../util/timing');
const log = require('../util/log');

class AppAutomateProvider extends GenericProvider {
  constructor(driver) {
    super(driver);
    this._markedPercy = false;
  }

  static supports(driver) {
    return driver.remoteHostname.includes(process.env.AA_DOMAIN || 'browserstack');
  }

  async screenshot(name, {
    fullscreen,
    deviceName,
    orientation,
    statusBarHeight,
    navigationBarHeight
  } = {}) {
    let response = null;
    let error;
    try {
      await this.percyScreenshotBegin(name);
      response = await super.screenshot(name, {
        fullscreen,
        deviceName: deviceName || await this.getDeviceName(),
        osVersion: await this.getOsVersion(),
        orientation,
        statusBarHeight,
        navigationBarHeight
      });
    } catch (e) {
      error = e;
    } finally {
      await this.percyScreenshotEnd(name, response?.body?.link, `${error}`);
    }
    return response;
  }

  async percyScreenshotBegin(name) {
    return await TimeIt.run('percyScreenshotBegin', async () => {
      try {
        const { success } = await this.browserstackExecutor('percyScreenshot', {
          name,
          percyBuildId: process.env.PERCY_BUILD_ID,
          percyBuildUrl: process.env.PERCY_BUILD_URL,
          state: 'begin'
        });
        this._markedPercy = success;
      } catch (e) {
        log.debug(`[${name}] Could not mark App Automate session as percy`);
      }
    });
  }

  async percyScreenshotEnd(name, percyScreenshotUrl, statusMessage = null) {
    return await TimeIt.run('percyScreenshotEnd', async () => {
      try {
        await this.browserstackExecutor('percyScreenshot', {
          name,
          percyScreenshotUrl,
          status: percyScreenshotUrl ? 'success' : 'failure',
          statusMessage,
          state: 'end'
        });
      } catch (e) {
        log.debug(`[${name}] Could not mark App Automate session as percy`);
      }
    });
  }

  async getDeviceName() {
    return await TimeIt.run('getAADeviceName', async () => {
      return (await this.getSessionDetails()).device;
    });
  }

  async getOsVersion() {
    return await TimeIt.run('getAAOsVersion', async () => {
      return (await this.getSessionDetails()).os_version?.split('.')[0];
    });
  }

  async getSessionDetails() {
    return await Cache.withCache(Cache.bstackSessionDetails, this.driver.sessionId,
      async () => {
        return await TimeIt.run('getSessionDetails', async () => {
          return await this.browserstackExecutor('getSessionDetails');
        });
      });
  }

  async browserstackExecutor(action, args) {
    let options = args ? { action, arguments: args } : { action };
    return JSON.parse(await this.driver.execute(`browserstack_executor: ${JSON.stringify(options)}`));
  }

  async getDebugUrl() {
    return await TimeIt.run('getDebugUrl', async () => {
      return await this.getSessionDetails().browser_url;
    });
  }
}

module.exports = {
  AppAutomateProvider
};
