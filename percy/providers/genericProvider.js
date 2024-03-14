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
    considerRegionXpaths,
    considerRegionAccessibilityIds,
    considerRegionAppiumElements,
    customConsiderRegions,
    scrollableXpath,
    scrollableId,
    sync,
    testCase,
    thTestCaseExecutionId
  }) {
    fullscreen = fullscreen || false;
    sync = sync || null;

    this.metadata = await MetadataResolver.resolve(this.driver, {
      deviceName,
      osVersion,
      orientation,
      statusBarHeight,
      navigationBarHeight
    });

    const tag = await this.getTag();
    const tiles = await this.getTiles(fullscreen, fullPage, screenLengths, scrollableXpath, scrollableId);
    const ignoreRegions = await this.findRegions(
      ignoreRegionXpaths, ignoreRegionAccessibilityIds, ignoreRegionAppiumElements, customIgnoreRegions
    );
    const considerRegions = await this.findRegions(
      considerRegionXpaths, considerRegionAccessibilityIds, considerRegionAppiumElements, customConsiderRegions
    );

    log.debug(`${name} : Tag ${JSON.stringify(ignoreRegions)}`);
    log.debug(`${name} : Tag ${JSON.stringify(tag)}`);
    log.debug(`${name} : Tiles ${JSON.stringify(tiles)}`);
    log.debug(`${name} : Debug url ${this.debugUrl}`);
    log.debug(`${name} : sync ${sync}`);
    return await utils.postComparison({
      name,
      tag,
      tiles,
      externalDebugUrl: await this.getDebugUrl(),
      ignoredElementsData: {
        ignoreElementsData: ignoreRegions
      },
      consideredElementsData: {
        considerElementsData: considerRegions
      },
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO,
      sync,
      testCase,
      thTestCaseExecutionId
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

  async findRegions(xpaths, accessibilityIds, appiumElements, customLocations) {
    const regionsArray = [];
    await this.getRegionsByXpath(regionsArray, xpaths || []);
    await this.getRegionsByIds(regionsArray, accessibilityIds || []);
    await this.getRegionsByElements(regionsArray, appiumElements || []);
    await this.getRegionsByLocation(regionsArray, customLocations || []);

    return regionsArray;
  }

  async getRegionObject(selector, element) {
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

  async getRegionsByXpath(elementsArray, xpaths) {
    for (const xpath of xpaths) {
      try {
        const element = await this.driver.elementByXPath(xpath);
        const selector = `xpath: ${xpath}`;
        const ignoredRegion = await this.getRegionObject(selector, element);
        elementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Appium Element with xpath: ${xpath} not found. Ignoring this xpath.`);
        log.debug(e.toString());
      }
    }
  }

  async getRegionsByIds(elementsArray, ids) {
    for (const id of ids) {
      try {
        const element = await this.driver.elementByAccessibilityId(id);
        const selector = `id: ${id}`;
        const ignoredRegion = await this.getRegionObject(selector, element);
        elementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Appium Element with id: ${id} not found. Ignoring this id.`);
        log.debug(e.toString());
      }
    }
  }

  async getRegionsByElements(elementsArray, elements) {
    for (let index = 0; index < elements.length; index++) {
      try {
        const type = await elements[index].getAttribute('class');
        const selector = `element: ${index} ${type}`;

        const ignoredRegion = await this.getRegionObject(selector, elements[index]);
        elementsArray.push(ignoredRegion);
      } catch (e) {
        log.info(`Correct Mobile Element not passed at index ${index}.`);
        log.debug(e.toString());
      }
    }
  }

  async getRegionsByLocation(elementsArray, customLocations) {
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
        elementsArray.push(ignoredRegion);
      } else {
        log.info(`Values passed in custom ignored region at index: ${index} is not valid`);
      }
    }
  }
}

module.exports = {
  GenericProvider
};
