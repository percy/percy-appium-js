const { Metadata } = require("./metadata");

class IosMetadata extends Metadata {
  async statusBar() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBar) return this._statusBar;

    const height = await super.statusBar();
    // In Ios the height in caps needs to be multiplied by pixel ratio 
    return height * (await this.caps()).pixelRatio;
  }

  async navigationBar() {
    // Always 0 for ios as it never had any on screen nav buttons
    return 0;
  }

  async screenSize() {
    // We just add statusBar and viewport rect
    // We do not use existing functions because user can override those
    const caps = await this.caps();
    const height = caps.statBarHeight + caps.viewportRect.height;
    const width = caps.viewportRect.width;
    return { width, height };
  }
}

module.exports = {
  IosMetadata,
}