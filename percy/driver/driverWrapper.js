const { Cache } = require('../util/cache');
const { Undefined } = require('../util/validations');

// This is a single common driver class that gives same interface to multiple appium drivers
// like wd or wdio etc.
class AppiumDriver {
  constructor(driver) {
    this.driver = driver;
    this.type = null;
    if (driver.constructor.name === 'Browser' && !Undefined(driver.getSession)) {
      this.type = 'wdio';
    } else if (driver.constructor.name === '' && !Undefined(driver.sessionCapabilities)) {
      this.type = 'wd';
    }
  }

  // cached
  async getCapabilities() {
    return await Cache.withCache(Cache.caps, this.sessionId,
      async () => {
        if (this.wd) return await this.driver.sessionCapabilities();
        if (this.wdio) return await this.driver.getSession();
      });
  }

  async getPercyOptions() {
    let optionsObject = {};
    if (this.wd) {
      optionsObject = (await this.getCapabilities()).desired;
    }
    if (this.wdio) {
      optionsObject = this.driver.capabilities;
    }

    // pull w3c
    const percyOptions = optionsObject['percy:options'] || {};

    // defaults
    if (Undefined(percyOptions.enabled)) percyOptions.enabled = true;
    if (Undefined(percyOptions.raiseErrors)) percyOptions.raiseErrors = false;

    // pull legacy for wd
    if (!Undefined(optionsObject['percy.enabled'])) percyOptions.enabled = optionsObject['percy.enabled'];
    if (!Undefined(optionsObject['percy.raiseErrors'])) percyOptions.raiseErrors = optionsObject['percy.raiseErrors'];

    return percyOptions;
  }

  // non cached
  async getOrientation() {
    return (await this.driver.getOrientation()).toLowerCase();
  }

  async takeScreenshot() {
    return await this.driver.takeScreenshot();
  }

  async execute(command) {
    return await this.driver.execute(command);
  }

  get sessionId() {
    if (this.wd) return this.driver.sessionID;
    if (this.wdio) return this.driver.sessionId;
  }

  get remoteHostname() {
    if (this.wd) return this.driver.configUrl.hostname;
    if (this.wdio) return this.driver.options.hostname;
  }

  get wdio() {
    return this.type === 'wdio';
  }

  get wd() {
    return this.type === 'wd';
  }
}

module.exports = {
  AppiumDriver
};
