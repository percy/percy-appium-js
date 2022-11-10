const { Metadata } = require("./metadata");

class IosMetadata extends Metadata {
  async statusBarHeight() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBarHeight) return this._statusBarHeight;

    const height = await super.statusBarHeight();
    // In Ios the height of statusBarHeight in caps needs to be multiplied by pixel ratio 
    return height * (await this.caps()).pixelRatio;
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
    const height = caps.statBarHeight * (await this.caps()).pixelRatio + caps.viewportRect.height;
    const width = caps.viewportRect.width;
    return { width, height };
  }
}

module.exports = {
  IosMetadata,
}