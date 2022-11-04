const { Cache } = require("../util/cache")

// This is a single common driver class that gives same interface to multiple appium drivers
// like wd or wdio etc. 
// Note: currently only implemented for wd
class AppiumDriver {
  constructor(driver) {
    this.driver = driver;
  }

  // cached
  async getCapabilities() {
    return await Cache.withCache(Cache.caps, this.sessionId,
      async () => await this.driver.sessionCapabilities());
  }

  // non cached
  async getOrientation() {
    return (await this.driver.getOrientation()).toLowerCase();
  }

  async takeScreenshot() {
    return await this.driver.takeScreenshot();
  }

  async execute(command) {
    return await this.driver.execute(command)
  }

  get sessionId() {
    return this.driver.sessionID;
  }

  get remoteHostname() {
    return this.driver.configUrl.hostname;
  }
}

module.exports = {
  AppiumDriver,
};
