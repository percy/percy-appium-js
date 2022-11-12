const { Undefined } = require('../util/validations');
const { Metadata } = require('./metadata');
const staticDeviceMeta = require('../config/devices.json');

class IosMetadata extends Metadata {
  async statusBarHeight() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBarHeight) return this._statusBarHeight;

    const caps = await this.caps();
    if (Undefined(caps.statBarHeight)) {
      const data = await this.staticData();
      if (!Undefined(data)) {
        return data.statusBarHeight * data.pixelRatio;
      }
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

    if (Undefined(caps.viewportRect)) {
      // console.log(`ERROR viewportRect is missing for ${await this.deviceName()}`);
      const data = await this.staticData();
      return { width: data.screenWidth, height: data.screenHeight };
    }
    const height = caps.statBarHeight * caps.pixelRatio + caps.viewportRect.height;
    const width = caps.viewportRect.width;
    return { width, height };
  }

  // helpers

  async staticData() {
    return staticDeviceMeta[(await this.deviceName()).toLowerCase()];
  }
}

module.exports = {
  IosMetadata
};
