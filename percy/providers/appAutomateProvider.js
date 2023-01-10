const { GenericProvider } = require('./genericProvider');
const { TimeIt } = require('../util/timing');
const log = require('../util/log');
const { Tile } = require('../util/tile');

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
      let result = await this.percyScreenshotBegin(name);
      this.setDebugUrl(result);
      response = await super.screenshot(name, {
        fullscreen,
        deviceName: deviceName || result.deviceName,
        osVersion: result.osVersion?.split('.')[0],
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

  async percyScreenshot() {
    return await TimeIt.run('percyScreenshot', async () => {
      let res = await this.browserstackExecutor('percyScreenshot', {
        percyBuildId: process.env.PERCY_BUILD_ID,
        state: 'screenshot'
      });
      return res.result;
    });
  }

  async getTiles(fullscreen) {
    const sha = await this.percyScreenshot();
    return [
      new Tile({
        filepath: null,
        sha,
        statusBarHeight: await this.metadata.statusBarHeight(),
        navBarHeight: await this.metadata.navigationBarHeight(),
        headerHeight: 0,
        footerHeight: 0,
        fullscreen
      })
    ];
  }

  async percyScreenshotBegin(name) {
    return await TimeIt.run('percyScreenshotBegin', async () => {
      try {
        let result = await this.browserstackExecutor('percyScreenshot', {
          name,
          percyBuildId: process.env.PERCY_BUILD_ID,
          percyBuildUrl: process.env.PERCY_BUILD_URL,
          state: 'begin'
        });
        this._markedPercy = result.success;
        return result;
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

  async browserstackExecutor(action, args) {
    let options = args ? { action, arguments: args } : { action };
    return JSON.parse(await this.driver.execute(`browserstack_executor: ${JSON.stringify(options)}`));
  }

  async setDebugUrl(result) {
    const buildHash = result.buildHash;
    const sessionHash = result.sessionHash;
    this.debugUrl = `https://app-automate.browserstack.com/dashboard/v2/builds/${buildHash}/sessions/${sessionHash}`;
  }
}

module.exports = {
  AppAutomateProvider
};
