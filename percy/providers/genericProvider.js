const utils = require('@percy/sdk-utils');
const tmp = require('tmp');
const fs = require('fs/promises');

const { Tile } = require("../util/tile");
const { MetadataResolver } = require("../metadata/metadataResolver");

// Collect client and environment information
const sdkPkg = require('../../package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = 'none'; //`${seleniumPkg.name}/${seleniumPkg.version}`;

class GenericProvider {
  constructor(driver) {
    this.driver = driver;
    this.metadata = null;
  }

  static supports(_driver) {
    return true;
  }

  async screenshot(name, { fullscreen, deviceName }) {
    fullscreen = fullscreen || false;

    this.metadata = await MetadataResolver.resolve(this.driver, { fullscreen, deviceName });
    const tag = await this.getTag();
    const tiles = await this.getTiles(fullscreen);
    console.log(tiles)
    return await utils.postComparison({
      name,
      tag: tag,
      tiles: tiles,
      externalDebugUrl: this.getDebugUrl(),
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO,
    });
  }

  async getTiles(fullscreen) {
    const base64content = await this.driver.takeScreenshot()
    const path = await this.writeTempImage(base64content);
    return [
      new Tile({
        filepath: path,
        statusBarHeight: await this.metadata.statusBar(),
        navBarHeight: await this.metadata.navigationBar(),
        headerHeight: 0,
        footerHeight: 0,
        fullscreen: fullscreen,
      })
    ]
  }

  async getTag() {
    const { width, height}  = await this.metadata.screenSize();
    return {
      name: await this.metadata.deviceName(),
      osName: await this.metadata.osName(),
      osVersion: await this.metadata.osVersion(),
      width,
      height,
      orientation: await this.metadata.orientation(),
    }
  }

  async writeTempImage(base64content) {
    const path = await this.tempFile();
    const buffer = Buffer.from(base64content, "base64")
    await fs.writeFile(path, buffer);
    return path;
  }

  // this creates a temp file and closes descriptor
  tempFile() {
    return new Promise((resolve, reject) => {
      tmp.file({ mode: 0o644, prefix: "percy-", postfix: ".png",
          discardDescriptor: true }, (err, path) => {
          if (err) reject(err);
          resolve(path);
      });
    })
  }

  async getDebugUrl() {
    return null;
  }
}

module.exports = {
  GenericProvider,
}
