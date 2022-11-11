const { Cache } = require('../util/cache');
const { Undefined } = require('../util/validations');
const { TimeIt } = require('../util/timing');

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
        return await TimeIt.run('getCapabilities', async () => {
          if (this.wd) return await this.driver.sessionCapabilities();
          if (this.wdio) return await this.driver.getSession();
        });
      });
  }

  async getSystemBars() {
    return await Cache.withCache(Cache.systemBars, this.sessionId, async () => {
      return await TimeIt.run('getSystemBars', async () => {
        if (this.wdio) {
          const bars = await this.driver.getSystemBars();
          return {
            statusbarHeight: bars.statusBar.height,
            navigationBarHeight: bars.navigationBar.height
          };
        }
        if (this.wd) throw new Error('System bars are not supported on wd driver');
      });
    }, true);
  }

  async getPercyOptions() {
    let optionsObject = {};
    if (this.wd) {
      // in Android devices percy:options exist in desired
      optionsObject = (await this.getCapabilities()).desired;
      // desired is empty for iOS but percy:options is in standard capabilities
      if (Undefined(optionsObject)) {
        optionsObject = await this.getCapabilities();
      }
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
    return await TimeIt.run('getOrientation', async () => {
      return (await this.driver.getOrientation()).toLowerCase();
    });
  }

  async takeScreenshot() {
    return await TimeIt.run('takeScreenshot', async () => {
      return await this.driver.takeScreenshot();
    });
  }

  async execute(command) {
    return await TimeIt.run('execute', async () => {
      return await this.driver.execute(command);
    });
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
