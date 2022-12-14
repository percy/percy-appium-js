const utils = require('@percy/sdk-utils');
const tmp = require('tmp');
const fs = require('fs/promises');

const { Tile } = require('../util/tile');
const { MetadataResolver } = require('../metadata/metadataResolver');
const { TimeIt } = require('../util/timing');
const log = require('../util/log');

// Collect client and environment information
const sdkPkg = require('../../package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;

let clientWdPkg = null;
try {
  clientWdPkg = require('wd/package.json');
} catch {}

try {
  clientWdPkg = require('webdriverio/package.json');
} catch {}

let ENV_INFO = `(${clientWdPkg?.name}/${clientWdPkg?.version})`;

class GenericProvider {
  constructor(driver) {
    this.driver = driver;
    this.metadata = null;
    this.debugUrl = null;
  }

  static supports(_driver) {
    return true;
  }

  async screenshot(name, {
    fullscreen,
    deviceName,
    osVersion,
    orientation,
    statusBarHeight,
    navigationBarHeight
  }) {
    fullscreen = fullscreen || false;

    this.metadata = await MetadataResolver.resolve(this.driver, {
      deviceName,
      osVersion,
      orientation,
      statusBarHeight,
      navigationBarHeight
    });

    const tag = await this.getTag();
    const tiles = await this.getTiles(fullscreen);
    log.debug(`${name} : Tag ${JSON.stringify(tag)}`);
    log.debug(`${name} : Tiles ${JSON.stringify(tiles)}`);
    log.debug(`${name} : Debug url ${this.debugUrl}`);
    return await utils.postComparison({
      name,
      tag,
      tiles,
      externalDebugUrl: await this.getDebugUrl(),
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO
    });
  }

  async getTiles(fullscreen) {
    const base64content = await this.driver.takeScreenshot();
    const path = await this.writeTempImage(base64content);
    return [
      new Tile({
        filepath: path,
        statusBarHeight: await this.metadata.statusBarHeight(),
        navBarHeight: await this.metadata.navigationBarHeight(),
        headerHeight: 0,
        footerHeight: 0,
        fullscreen
      })
    ];
  }

  async getTag() {
    const { width, height } = await this.metadata.screenSize();
    return {
      name: await this.metadata.deviceName(),
      osName: await this.metadata.osName(),
      osVersion: await this.metadata.osVersion(),
      width,
      height,
      orientation: await this.metadata.orientation()
    };
  }

  async writeTempImage(base64content) {
    return await TimeIt.run('writeTempImage', async () => {
      const path = await this.tempFile();
      const buffer = Buffer.from(base64content, 'base64');
      await fs.writeFile(path, buffer);
      return path;
    });
  }

  // this creates a temp file and closes descriptor
  async tempFile() {
    const percyTmpDir = process.env.PERCY_TMP_DIR;
    if (percyTmpDir) {
      // this does not throw for existing directory if recursive is true
      await fs.mkdir(percyTmpDir, { recursive: true });
    }
    return await TimeIt.run('tempFile', async () => {
      return await new Promise((resolve, reject) => {
        tmp.file({
          mode: 0o644,
          tmpdir: percyTmpDir,
          prefix: 'percy-',
          postfix: '.png',
          discardDescriptor: true
        }, (err, path) => {
          /* istanbul ignore next */ // hard to test
          if (err) reject(err);
          resolve(path);
        });
      });
    });
  }

  async getDebugUrl() {
    return this.debugUrl;
  }
}

module.exports = {
  GenericProvider
};
