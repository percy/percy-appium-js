const log = require('../util/log');
class Metadata {
  constructor(driver, {
    deviceName,
    osVersion,
    orientation,
    statusBarHeight,
    navigationBarHeight
  } = {}) {
    this.driver = driver;
    this.sessionId = this.driver.sessionId;
    this.remoteHostname = this.driver.remoteHostname;

    this._deviceName = deviceName;
    this._osVersion = osVersion;
    this._orientation = orientation || 'caps';
    this._statusBarHeight = statusBarHeight;
    this._navigationBarHeight = navigationBarHeight;
    this._viewportRect = null;
  }

  // items that need caps are moved to getters as caps are not stored on wd driver object
  // So we need to make a lazy call to avoid making session get call in app automate context
  async caps() {
    return await this.driver.getCapabilities();
  }

  async osName() {
    return (await this.caps()).platformName;
  }

  async osVersion() {
    if (this._osVersion) return this._osVersion;

    const caps = await this.caps();
    return (caps.osVersion || caps.platformVersion)?.split('.')[0];
  }

  async orientation() {
    if (this._orientation === 'auto') {
      return await this.driver.getOrientation();
    }

    if (['portrait', 'landscape'].includes(this._orientation)) {
      return this._orientation;
    }

    const deviceOrientation = (await this.caps()).deviceOrientation?.toLowerCase();
    if (deviceOrientation) return deviceOrientation;

    return 'portrait'; // default if failed to get from caps (wd/jsonwire)
  }

  // Ideally dont cache this as it can change in the test
  async systemBars() {
    throw new Error('Not implemented');
  }

  async statusBarHeight() {
    if (this._statusBarHeight) return this._statusBarHeight;

    const heightFromCaps = (await this.caps()).statBarHeight;
    if (heightFromCaps != null) return heightFromCaps;

    return (await this.systemBars()).statusBarHeight;
  }

  async navigationBarHeight() {
    if (this._navigationBarHeight) return this._navigationBarHeight;

    try {
      const screenHeight = (await this.screenSize()).height;
      const viewportHeight = (await this.caps()).viewportRect?.height;
      const _statusBarHeight = await this.statusBarHeight();
      const computedHeight = screenHeight - viewportHeight - _statusBarHeight;
      if (computedHeight >= 0) {
        return computedHeight;
      } else {
        throw new Error(`Could not compute correct height ${computedHeight}`);
      }
    } catch (e) {
      log.debug(e);
    }

    return (await this.systemBars()).navigationBarHeight;
  }

  async screenSize() {
    let deviceScreenSize = (await this.caps()).deviceScreenSize;
    const [width, height] = deviceScreenSize.split('x').map(i => parseInt(i, 10));
    return { width, height };
  }

  async deviceName() {
    if (this._deviceName) return this._deviceName;

    let caps = await this.caps();
    return caps.desired.deviceName || caps.desired.device;
  }

  async scaleFactor() {
    return 1;
  }
}

module.exports = {
  Metadata
};
