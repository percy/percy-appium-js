const { GenericProvider } = require('./genericProvider');
const { TimeIt } = require('../util/timing');
const { Tile } = require('../util/tile');
const log = require('../util/log');
const utils = require('@percy/sdk-utils');

class AppAutomateProvider extends GenericProvider {
  constructor(driver) {
    super(driver);
    this._markedPercy = false;
  }

  static supports(driver) {
    return driver.remoteHostname.includes(process.env.AA_DOMAIN || 'browserstack');
  }

  async screenshot(name, {
    fullscreen,
    deviceName,
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
    topScrollviewOffset,
    bottomScrollviewOffset,
    scrollableId,
    sync,
    testCase,
    thTestCaseExecutionId
  } = {}) {
    let response = null;
    let error;
    sync = sync || null;
    try {
      let result = await this.percyScreenshotBegin(name);
      this.setDebugUrl(result);
      response = await super.screenshot(name, {
        fullscreen,
        deviceName: deviceName || result?.deviceName,
        osVersion: result?.osVersion?.split('.')[0],
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
        topScrollviewOffset,
        bottomScrollviewOffset,
        scrollableId,
        sync,
        testCase,
        thTestCaseExecutionId
      });
    } catch (e) {
      error = e;
      throw e;
    } finally {
      await this.percyScreenshotEnd(name, response?.body?.link, sync, `${error}`);
    }
    return response;
  }

  async percyScreenshotBegin(name) {
    return await TimeIt.run('percyScreenshotBegin', async () => {
      try {
        let result = await this.browserstackExecutor('percyScreenshot', {
          name,
          percyBuildId: utils.percy?.build?.id,
          percyBuildUrl: utils.percy?.build?.url,
          state: 'begin'
        });
        this._markedPercy = result.success;
        return result;
      } catch (e) {
        log.debug(`[${name}] Could not mark App Automate session as percy`);
        log.debug(`[${name}] ${e}`);
        return null;
      }
    });
  }

  async percyScreenshotEnd(name, percyScreenshotUrl, sync, statusMessage = null) {
    return await TimeIt.run('percyScreenshotEnd', async () => {
      try {
        await this.browserstackExecutor('percyScreenshot', {
          name,
          percyScreenshotUrl,
          status: percyScreenshotUrl ? 'success' : 'failure',
          statusMessage,
          sync,
          state: 'end'
        });
      } catch (e) {
        log.debug(`[${name}] Could not mark App Automate session as percy`);
      }
    });
  }

  // Override this for AA specific optimizations
  async getTiles(fullscreen, fullPage, screenLengths, scrollableXpath, topScrollviewOffset, bottomScrollviewOffset, scrollableId) {
    // Override AA optimizations
    if (this.isDisableRemoteUpload()) {
      if (fullPage === true) {
        log.warn('Full page screenshots are only supported when "PERCY_DISABLE_REMOTE_UPLOADS" is not set');
      }
      return await super.getTiles(fullscreen, fullPage, screenLengths);
    }

    let screenshotType = 'fullpage';
    let projectId = 'percy-prod';
    if (fullPage !== true) {
      screenshotType = 'singlepage';
    }
    if (this.isPercyDev()) {
      projectId = 'percy-dev';
    }
    // Take screenshots via browserstack executor
    const response = await TimeIt.run('percyScreenshot:screenshot', async () => {
      return await this.browserstackExecutor('percyScreenshot', {
        state: 'screenshot',
        percyBuildId: utils.percy?.build?.id,
        screenshotType,
        projectId,
        scaleFactor: await this.metadata.scaleFactor(),
        options: {
          numOfTiles: screenLengths || 4,
          deviceHeight: (await this.metadata.screenSize()).height,
          scollableXpath: scrollableXpath || null,
          topScrollviewOffset: topScrollviewOffset || 0,
          bottomScrollviewOffset: bottomScrollviewOffset || 0,
          scrollableId: scrollableId || null,
          FORCE_FULL_PAGE: process.env.FORCE_FULL_PAGE === 'true'
        }
      });
    });

    if (!response.success) {
      throw new Error('Failed to get screenshots from App Automate.' +
        ' Check dashboard for error.');
    }

    const tiles = [];
    const statBarHeight = await this.metadata.statusBarHeight();
    const navBarHeight = await this.metadata.navigationBarHeight();

    JSON.parse(response.result).forEach(tileData => {
      tiles.push(new Tile({
        statusBarHeight: statBarHeight,
        navBarHeight,
        fullscreen,
        headerHeight: tileData.header_height,
        footerHeight: tileData.footer_height,
        sha: tileData.sha.split('-')[0] // drop build id
      }));
    });

    return tiles;
  }

  async browserstackExecutor(action, args) {
    let options = args ? { action, arguments: args } : { action };
    return JSON.parse(await this.driver.execute(`browserstack_executor: ${JSON.stringify(options)}`));
  }

  setDebugUrl(result) {
    if (!result) return null;

    const buildHash = result.buildHash;
    const sessionHash = result.sessionHash;
    this.debugUrl = `https://app-automate.browserstack.com/dashboard/v2/builds/${buildHash}/sessions/${sessionHash}`;
  }

  isDisableRemoteUpload() {
    return process.env.PERCY_DISABLE_REMOTE_UPLOADS === 'true';
  }

  isPercyDev() {
    return process.env.PERCY_ENABLE_DEV === 'true';
  }
}

module.exports = {
  AppAutomateProvider
};
