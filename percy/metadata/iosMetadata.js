const { Metadata } = require('./metadata');
const staticDeviceMeta = require('../config/devices.json');

class IosMetadata extends Metadata {
  async statusBarHeight() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBarHeight) return this._statusBarHeight;

    if (await this.staticData()) {
      const data = await this.staticData();
      return data.statusBarHeight * data.pixelRatio;
    }

    // For iOS method to fetch statusBarHeight for wdio & wd is different
    if (this.driver.wdio) {
      return (await this.viewportRect()).top;
    } else {
      const caps = await this.caps();
      return (caps.statBarHeight || 1) * (caps.pixelRatio || 1);
    }
  }

  async navigationBarHeight() {
    if (this._navigationBarHeight) return this._navigationBarHeight;
    // Always 0 for ios as it never had any on screen nav buttons
    // the gesture bar at bottom is drawn on top of the app
    return 0;
  }

  async screenSize() {
    // We just add statusBarHeight and viewport rect
    // We do not use existing functions because user can override those
    if (await this.staticData()) {
      const data = await this.staticData();
      return { width: data.screenWidth, height: data.screenHeight };
    }

    let height, width;
    // For iOS method to fetch screenSize for wdio & wd is different
    if (this.driver.wdio) {
      const viewportRect = await this.viewportRect();
      height = viewportRect.top + viewportRect.height;
      width = viewportRect.width;
    } else {
      const caps = await this.caps();
      height = caps.statBarHeight * caps.pixelRatio + caps.viewportRect?.height;
      width = caps.viewportRect?.width;
    }
    return { width, height };
  }

  async viewportRect() {
    if (this._viewportRect) return this._viewportRect;

    this._viewportRect = await this.driver.execute('mobile: viewportRect');
    return this._viewportRect;
  }

  // Need override because ios does not have desired in caps
  async deviceName() {
    if (this._deviceName) return this._deviceName;

    let caps = await this.caps();
    return caps.deviceName || caps.device;
  }

  // helpers

  async staticData() {
    return staticDeviceMeta[(await this.deviceName())?.toLowerCase()];
  }

  async scaleFactor() {
    // For iOS method to fetch scaleFactor for wdio & wd is different
    if (this.driver.wdio) {
      const viewportRect = await this.viewportRect();
      const actualWidth = viewportRect.width;
      const windowSize = await this.driver.getWindowSize();
      const width = windowSize.width;
      return actualWidth / width;
    } else {
      return (await this.caps()).pixelRatio;
    }
  }
}

module.exports = {
  IosMetadata
};
