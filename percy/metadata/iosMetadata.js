const { Metadata } = require('./metadata');
const staticDeviceMeta = require('../config/devices.json');

class IosMetadata extends Metadata {
  async statusBarHeight() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBarHeight) return this._statusBarHeight;

    const caps = await this.caps();
    if (await this.staticData()) {
      const data = await this.staticData();
      return data.statusBarHeight * data.pixelRatio;
    }

    // In Ios the height of statusBarHeight in caps needs to be multiplied by pixel ratio
    return (caps.statBarHeight || 1) * (caps.pixelRatio || 1);
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
    const caps = await this.caps();
    if (await this.staticData()) {
      const data = await this.staticData();
      return { width: data.screenWidth, height: data.screenHeight };
    }
    const height = caps.statBarHeight * caps.pixelRatio + caps.viewportRect?.height;
    const width = caps.viewportRect?.width;
    return { width, height };
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
    return (await this.caps()).pixelRatio;
  }
}

module.exports = {
  IosMetadata
};
