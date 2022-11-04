class Metadata {
  constructor(driver, {
    deviceName,
    orientation,
    statusBar,
    navigationBar,
  } = {}) {
    this.driver = driver;
    this.sessionId = this.driver.sessionId;
    this.remoteHostname = this.driver.remoteHostname;

    this._deviceName = deviceName;
    this._orientation = orientation;
    this._statusBar = statusBar;
    this._navigationBar = navigationBar;
  }

  // items that need caps are moved to getters as caps are not stored on wd driver object
  // So we need to make a lazy call to avoid making session get call in non app automate context
  caps() {
    return this.driver.getCapabilities();
  }

  async osName() {
    return (await this.caps()).platformName;
  }

  async osVersion() {
    return (await this.caps()).osVersion;
  }

  async orientation() {
    // We use cache if provided by user
    if (this._orientation) {
      if (["portrait", "landscape"].includes(this._orientation)) {
        return this._orientation;
      } else if (this._orientation === "caps") {
        let orientation = (await this.caps()).deviceOrientation?.toLowerCase() 
        if (orientation) return orientation;
      }
    }

    // We do not cache real time call
    return await this.driver.getOrientation();
  }

  // Ideally dont cache this as it can change in the test
  async systemBars() {
    console.log(new Error().stack)
    throw "Not implemented"
  }

  async statusBar() {
    if (this._statusBar) return this._statusBar;

    const heightFromCaps = (await this.caps()).statBarHeight;
    if (heightFromCaps != null) return heightFromCaps;

    return (await this.systemBars()).statusBar;
  }

  async navigationBar() {
    if (this._navigationBar) return this._navigationBar;

    try {
      const screenHeight = (await this.screenSize()).height;
      const viewportHeight = (await this.caps()).viewportRect?.height;
      const statusBarHeight = await this.statusBar();
      const computedHeight = screenHeight - viewportHeight - statusBarHeight;
      if (computedHeight >= 0) {
        return computedHeight;
      } else {
        throw `Could not compute correct height ${computedHeight}`
      }
    } catch (e) {
      console.log(e)
    }

    return (await this.systemBars()).navigationBar;
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
}

module.exports = {
  Metadata,
}
