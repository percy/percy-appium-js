const { Cache } = require('../util/cache');
const { Undefined } = require('../util/validations');
const { TimeIt } = require('../util/timing');

// This is a single common driver class that gives same interface to multiple appium drivers
// like wd or wdio etc.
class AppiumDriver {
  constructor(driver) {
    this.driver = driver;
    this.type = null;

    /* istanbul ignore else */
    // Note: else is covered here but constructor name '' couldnt cover (which is the case)
    // in real world when you get wd driver passed so need to ignore coverage on it
    if (driver.constructor.name === 'Browser' && !Undefined(driver.getSession)) {
      this.type = 'wdio';
    } else if ((driver.constructor.name === '' ||
      driver.constructor.name === 'Object') && // Object check is only added for tests
        !Undefined(driver.sessionCapabilities)) {
      this.type = 'wd';
    }
  }

  // cached
  async getCapabilities() {
    return await Cache.withCache(Cache.caps, this.sessionId,
      async () => {
        return await TimeIt.run('getCapabilities', async () => {
          if (this.wd) return await this.driver.sessionCapabilities();
          /* istanbul ignore next */ // not sure why its marking it when its covered
          if (this.wdio) return await this.driver.getSession();
        });
      });
  }

  async getSystemBars() {
    return await Cache.withCache(Cache.systemBars, this.sessionId, async () => {
      return await TimeIt.run('getSystemBars', async () => {
        try {
          if (this.wdio) {
            const bars = await this.driver.getSystemBars();
            return {
              statusbarHeight: bars.statusBar.height,
              navigationBarHeight: bars.navigationBar.height
            };
          }
          /* istanbul ignore next */ // not sure why its marking it when its covered
          if (this.wd) throw new Error('System bars are not supported on wd driver');
        } catch {
          // return default 0, 0 in case of failure
          return {
            statusbarHeight: 0,
            navigationBarHeight: 0
          };
        }
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
    /* istanbul ignore next */
    const percyOptions = optionsObject['percy:options'] || optionsObject.percyOptions || {};

    // defaults
    if (Undefined(percyOptions.enabled)) percyOptions.enabled = true;
    if (Undefined(percyOptions.ignoreErrors)) percyOptions.ignoreErrors = true;

    // pull legacy for wd
    if (!Undefined(optionsObject['percy.enabled'])) percyOptions.enabled = optionsObject['percy.enabled'];
    if (!Undefined(optionsObject['percy.ignoreErrors'])) percyOptions.ignoreErrors = optionsObject['percy.ignoreErrors'];

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
    /* istanbul ignore next */ // not sure why its marking it when its covered
    if (this.wdio) return this.driver.sessionId;
  }

  get remoteHostname() {
    if (this.wd) return this.driver.configUrl.hostname;
    /* istanbul ignore next */ // not sure why its marking it when its covered
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
