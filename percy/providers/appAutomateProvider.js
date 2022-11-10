const { GenericProvider } = require("./genericProvider");
const { Cache } = require("../util/cache");

class AppAutomateProvider extends GenericProvider {
  constructor(driver) {
    super(driver);
    this._markedPercy = false;
  }

  static supports(driver) {
    return driver.remoteHostname.includes("browserstack");
  }

  async screenshot(name, {
    fullscreen,
    deviceName,
    orientation,
    statusBarHeight,
    navigationBarHeight,
  } = {}) {
    await this.percyScreenshotBegin(name);
    const response = await super.screenshot(name, {
      fullscreen,
      deviceName: deviceName || await this.getDeviceName(),
      orientation,
      statusBarHeight,
      navigationBarHeight,
    });
    await this.percyScreenshotEnd(name, response.body.link);
  }

  async percyScreenshotBegin(name) {
    try {
      const { success } = await this.browserstackExecutor('percyScreenshot', {
        name,
        percyBuildId: process.env.PERCY_BUILD_ID,
        percyBuildUrl: process.env.PERCY_BUILD_URL || "unknown",
        state: 'begin'
      });
      this._markedPercy = success;
    } catch(e) {
      console.log("Could not mark App Automate percy session");
    }
  }

  async percyScreenshotEnd(name, percyScreenshotUrl) {
    if (!this._markedPercy) return;

    try {
      await this.browserstackExecutor('percyScreenshot', {
        name,
        percyScreenshotUrl,
        status: "success",
        state: 'end',
      });
    } catch(e) {
      console.log("Could not mark App Automate percy session");
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
  AppAutomateProvider,
}