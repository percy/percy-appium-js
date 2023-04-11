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
} catch { }

try {
  clientWdPkg = require('webdriverio/package.json');
} catch { }

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
    navigationBarHeight,
    fullPage,
    screenLengths,
    ignoreRegionXpaths,
    ignoreRegionAccessibilityIds,
    ignoreRegionAppiumElements,
    customIgnoreRegions,
    scrollableXpath,
    scrollableId
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
    const tiles = await this.getTiles(fullscreen, fullPage, screenLengths, scrollableXpath, scrollableId);
    const ignoreRegions = await this.findIgnoredRegions(ignoreRegionXpaths || [], ignoreRegionAccessibilityIds || [], ignoreRegionAppiumElements || [], customIgnoreRegions || []);
    log.debug(`${name} : Tag ${JSON.stringify(tag)}`);
    log.debug(`${name} : Tiles ${JSON.stringify(tiles)}`);
    log.debug(`${name} : Debug url ${this.debugUrl}`);
    return await utils.postComparison({
      name,
      tag,
      tiles,
      externalDebugUrl: await this.getDebugUrl(),
      ignoredElementsData: ignoreRegions,
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO
    });
  }

  async getTiles(fullscreen, _fullPage, _screenLengths) {
    if (_fullPage === true) {
      log.warn('Full page screeshot is only supported on App Automate.' +
        ' Falling back to single page screenshot.');
    }

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

  async findIgnoredRegions(ignoreRegionXpaths, ignoreRegionAccessibilityIds, ignoreRegionAppiumElements, customIgnoreRegions) {
    const ignoredElementsArray = [];
    await this.ignoreRegionsByXpaths(ignoredElementsArray, ignoreRegionXpaths);
    await this.ignoreRegionsByIds(ignoredElementsArray, ignoreRegionAccessibilityIds);
    await this.ignoreRegionsByElement(ignoredElementsArray, ignoreRegionAppiumElements);
    await this.addCustomIgnoreRegions(ignoredElementsArray, customIgnoreRegions);

    const ignoredElementsLocations = {
      ignoreElementsData: ignoredElementsArray
    };

    return ignoredElementsLocations;
  }

  async ignoreElementObject(selector, element) {
    const scaleFactor = await this.metadata.scaleFactor();
    const location = await element.getLocation();
    const size = await element.getSize();
    const coOrdinates = {
      top: location.y * scaleFactor,
      bottom: (location.y + size.height) * scaleFactor,
      left: location.x * scaleFactor,
      right: (location.x + size.width) * scaleFactor
    };

    const jsonObject = {
      selector,
      coOrdinates
    };

    return jsonObject;
  }

  async ignoreRegionsByXpaths(ignoredElementsArray, xpaths) {
    for (const xpath of xpaths) {
      try {
        const element = await this.driver.elementByXPath(xpath);
        const selector = `xpath: ${xpath}`;
        const ignoredRegion = await this.ignoreElementObject(selector, element);
        ignoredElementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Appium Element with xpath: ${xpath} not found. Ignoring this xpath.`);
        log.debug(e.toString());
      }
    }
  }

  async ignoreRegionsByIds(ignoredElementsArray, ids) {
    for (const id of ids) {
      try {
        const element = await this.driver.elementByAccessibilityId(id);
        const selector = `id: ${id}`;
        const ignoredRegion = await this.ignoreElementObject(selector, element);
        ignoredElementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Appium Element with id: ${id} not found. Ignoring this id.`);
        log.debug(e.toString());
      }
    }
  }

  async ignoreRegionsByElement(ignoredElementsArray, elements) {
    for (let index = 0; index < elements.length; index++) {
      try {
        const type = await elements[index].getAttribute('class');
        const selector = `element: ${index} ${type}`;

        const ignoredRegion = await this.ignoreElementObject(selector, elements[index]);
        ignoredElementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Correct Mobile Element not passed at index ${index}.`);
        log.debug(e.toString());
      }
    }
  }

  async addCustomIgnoreRegions(ignoredElementsArray, customLocations) {
    const { width, height } = await this.metadata.screenSize();
    for (let index = 0; index < customLocations.length; index++) {
      const customLocation = customLocations[index];
      if (customLocation.isValid(height, width)) {
        const selector = `custom ignore region ${index}`;
        const ignoredRegion = {
          selector,
          coOrdinates: {
            top: customLocation.top,
            bottom: customLocation.bottom,
            left: customLocation.left,
            right: customLocation.right
          }
        };
        ignoredElementsArray.push(ignoredRegion);
      } else {
        log.info(`Values passed in custom ignored region at index: ${index} is not valid`);
      }
    }
  }
}

module.exports = {
  GenericProvider
};
