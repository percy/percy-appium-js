// Covering only not covered in index tests
import helpers from '@percy/sdk-utils/test/helpers';
import { AppAutomateProvider } from '../../../percy/providers/appAutomateProvider.js';
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('AppAutomateProvider', () => {
  let driver;
  let superScreenshotSpy;

  beforeEach(async () => {
    await helpers.setupTest();
    driver = AppiumDriverMock();
    superScreenshotSpy = spyOn(GenericProvider.prototype, 'screenshot');
  });

  describe('screenshot', () => {
    let percyScreenshotBeginSpy;
    let percyScreenshotEndSpy;

    beforeEach(() => {
      percyScreenshotBeginSpy = spyOn(AppAutomateProvider.prototype,
        'percyScreenshotBegin').and.returnValue(true);
      percyScreenshotEndSpy = spyOn(AppAutomateProvider.prototype,
        'percyScreenshotEnd').and.returnValue(true);
    });

    it('test call with default args', async () => {
      const appAutomate = new AppAutomateProvider(driver);

      superScreenshotSpy.and.resolveTo({ body: { link: 'link to screenshot' } });
      await appAutomate.screenshot('abc');

      expect(percyScreenshotBeginSpy).toHaveBeenCalledWith('abc');
      expect(superScreenshotSpy).toHaveBeenCalledWith('abc', jasmine.any(Object));
      expect(percyScreenshotEndSpy).toHaveBeenCalledWith('abc', 'link to screenshot', null, 'undefined');
    });

    it('passes exception message to percyScreenshotEnd in case of exception', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      const errorMessage = 'Some error occured';
      superScreenshotSpy.and.rejectWith(new Error(errorMessage));
      percyScreenshotEndSpy.and.rejectWith(new Error(errorMessage));

      await expectAsync(appAutomate.screenshot('abc')).toBeRejectedWithError(errorMessage);

      expect(percyScreenshotBeginSpy).toHaveBeenCalledWith('abc');

      expect(percyScreenshotEndSpy).toHaveBeenCalledWith(
        'abc', undefined, null, `Error: ${errorMessage}`);
    });
  });

  describe('percyScreenshotBegin', () => {
    it('supresses exception and does not throw', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotBegin('abc');
    });
  });

  describe('percyScreenshotEnd', () => {
    it('supresses exception and does not throw', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotEnd('abc', 'url');
    });

    it('marks status as failed if screenshot url is not present', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotEnd('abc');

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('failure'));
    });
  });

  describe('browserstackExecutor', () => {
    it('only sends action when no arguments are provided', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.browserstackExecutor('action');

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('action'));
    });

    it('uses arguments when provided', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.browserstackExecutor('action', { arg: 'arg1' });

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('arguments'));
    });
  });

  describe('setDebugUrl', () => {
    const expectedBrowserUrl = 'https://app-automate.browserstack.com/dashboard/v2/builds/abc/sessions/def';

    it('returns url', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.setDebugUrl({ buildHash: 'abc', sessionHash: 'def' });
      expect(appAutomate.debugUrl).toEqual(expectedBrowserUrl);
    });

    it('returns null if passed result was null', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.setDebugUrl(null);
      expect(appAutomate.debugUrl).toEqual(null);
    });
  });

  describe('getTiles', () => {
    let args = {
      state: 'screenshot',
      percyBuildId: undefined,
      screenshotType: 'singlepage',
      projectId: 'percy-prod',
      scaleFactor: 1,
      options: {
        numOfTiles: 4,
        deviceHeight: undefined,
        scollableXpath: null,
        scrollableId: null,
        FORCE_FULL_PAGE: false,
        iosOptimizedFullpage: false
      }
    };

    describe('when taking singlepage', () => {
      describe('when env isDisableRemoteUpload is true', () => {
        it('takes a local appium screenshot', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          spyOn(AppAutomateProvider.prototype, 'isDisableRemoteUpload')
            .and.returnValue('true');
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          superGetTilesSpy.and.resolveTo([]);
          await appAutomate.getTiles(true, false, null, null, null, null, null, null, null, false);
          expect(superGetTilesSpy).toHaveBeenCalledWith(true, false, null, null, null, null, null, null, null, false);
        });
      });

      describe('when env isDisableRemoteUpload is false', () => {
        it('takes screenshot with remote executor', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          let browserstackExecutorSpy = spyOn(
            AppAutomateProvider.prototype,
            'browserstackExecutor'
          );
          superGetTilesSpy.and.resolveTo([]);
          let response = {
            success: true,
            result: JSON.stringify([
              { header_height: 100, footer_height: 200, sha: 'abc' }
            ])
          };
          browserstackExecutorSpy.and.resolveTo(response);
          var screenSize = {
            height: 2000
          };
          args.options.deviceHeight = screenSize.height;
          args.options.topScrollviewOffset = 0;
          args.options.bottomScrollviewOffset = 0;
          args.options.androidScrollAreaPercentage = null;
          args.options.scrollSpeed = null;
          args.options.iosOptimizedFullpage = false;
          appAutomate.metadata = {
            statusBarHeight: () => 100,
            navigationBarHeight: () => 200,
            scaleFactor: () => 1,
            screenSize: () => screenSize
          };
          let tiles = await appAutomate.getTiles(true, false, null, null, null, null, null, null, null, false);
          expect(tiles[0].statusBarHeight).toEqual(100);
          expect(tiles[0].navBarHeight).toEqual(200);
          expect(browserstackExecutorSpy).toHaveBeenCalledWith(
            'percyScreenshot',
            args
          );
        });
      });
    });

    describe('when taking fullpage', () => {
      describe('when env isDisableRemoteUpload is true', () => {
        it('takes a local appium screenshot', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          spyOn(AppAutomateProvider.prototype, 'isDisableRemoteUpload')
            .and.returnValue('true');
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          superGetTilesSpy.and.resolveTo([]);

          await appAutomate.getTiles(true, true, null, null, null, null, null, null, null, false);
          expect(superGetTilesSpy).toHaveBeenCalledWith(true, true, null, null, null, null, null, null, null, false);
        });
      });

      describe('when env isDisableRemoteUpload is false', () => {
        it('takes screenshot with remote executor', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          let browserstackExecutorSpy = spyOn(AppAutomateProvider.prototype, 'browserstackExecutor');
          superGetTilesSpy.and.resolveTo([]);
          let response = {
            success: true,
            result: JSON.stringify([{ header_height: 100, footer_height: 200, sha: 'abc' }])
          };
          browserstackExecutorSpy.and.resolveTo(response);
          var screenSize = {
            height: 2000
          };
          args.options.deviceHeight = screenSize.height;
          args.screenshotType = 'fullpage';
          appAutomate.metadata = { statusBarHeight: () => 100, navigationBarHeight: () => 200, scaleFactor: () => 1, screenSize: () => screenSize };

          await appAutomate.getTiles(true, true, null, null, null, null, null, null, null, false);
          expect(browserstackExecutorSpy).toHaveBeenCalledWith('percyScreenshot', args);
        });
      });

      describe('when env isPercyDev is true', () => {
        it('takes screenshot with remote executor with "percy-dev" as projectId', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          spyOn(AppAutomateProvider.prototype, 'isPercyDev')
            .and.returnValue('true');
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          let browserstackExecutorSpy = spyOn(AppAutomateProvider.prototype, 'browserstackExecutor');
          superGetTilesSpy.and.resolveTo([]);
          let response = {
            success: true,
            result: JSON.stringify([{ header_height: 100, footer_height: 200, sha: 'abc' }])
          };
          browserstackExecutorSpy.and.resolveTo(response);
          var screenSize = {
            height: 2000
          };
          args.projectId = 'percy-dev';
          args.options.deviceHeight = screenSize.height;
          args.options.topScrollviewOffset = 0;
          args.options.bottomScrollviewOffset = 0;
          args.options.androidScrollAreaPercentage = null;
          args.options.scrollSpeed = null;
          args.options.iosOptimizedFullpage = false;
          args.screenshotType = 'fullpage';
          appAutomate.metadata = { statusBarHeight: () => 100, navigationBarHeight: () => 200, scaleFactor: () => 1, screenSize: () => screenSize };
          await appAutomate.getTiles(true, true, null, null, null, null, null, null, null, false);
          expect(browserstackExecutorSpy).toHaveBeenCalledWith('percyScreenshot', args);
        });
      });

      describe('when other options are passed', () => {
        it('takes screenshot with remote executor with "percy-dev" as projectId', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          spyOn(AppAutomateProvider.prototype, 'isPercyDev')
            .and.returnValue('true');
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          let browserstackExecutorSpy = spyOn(AppAutomateProvider.prototype, 'browserstackExecutor');
          superGetTilesSpy.and.resolveTo([]);
          let response = {
            success: true,
            result: JSON.stringify([{ header_height: 100, footer_height: 200, sha: 'abc' }])
          };
          browserstackExecutorSpy.and.resolveTo(response);
          var screenSize = {
            height: 2000
          };
          args.projectId = 'percy-dev';
          args.options.deviceHeight = screenSize.height;
          args.options.topScrollviewOffset = 100;
          args.options.bottomScrollviewOffset = 250;
          args.options.androidScrollAreaPercentage = 50;
          args.options.scrollSpeed = 500;
          args.options.iosOptimizedFullpage = false;
          args.screenshotType = 'fullpage';
          appAutomate.metadata = { statusBarHeight: () => 100, navigationBarHeight: () => 200, scaleFactor: () => 1, screenSize: () => screenSize };
          await appAutomate.getTiles(true, true, null, null, 100, 250, null, 50, 500, false);
          expect(browserstackExecutorSpy).toHaveBeenCalledWith('percyScreenshot', args);
        });
      });

      describe('when iosOptimizedFullpage is true', () => {
        it('takes screenshot with iosOptimizedFullpage option set to true', async () => {
          const appAutomate = new AppAutomateProvider(driver);
          spyOn(AppAutomateProvider.prototype, 'isPercyDev')
            .and.returnValue('true');
          let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
          let browserstackExecutorSpy = spyOn(AppAutomateProvider.prototype, 'browserstackExecutor');
          superGetTilesSpy.and.resolveTo([]);
          let response = {
            success: true,
            result: JSON.stringify([{ header_height: 100, footer_height: 200, sha: 'abc' }])
          };
          browserstackExecutorSpy.and.resolveTo(response);
          var screenSize = {
            height: 2000
          };
          args.projectId = 'percy-dev';
          args.options.deviceHeight = screenSize.height;
          args.options.topScrollviewOffset = 0;
          args.options.bottomScrollviewOffset = 0;
          args.options.androidScrollAreaPercentage = null;
          args.options.scrollSpeed = null;
          args.options.iosOptimizedFullpage = true;
          args.screenshotType = 'fullpage';
          appAutomate.metadata = { statusBarHeight: () => 100, navigationBarHeight: () => 200, scaleFactor: () => 1, screenSize: () => screenSize };
          await appAutomate.getTiles(true, true, null, null, null, null, null, null, null, true);
          expect(browserstackExecutorSpy).toHaveBeenCalledWith('percyScreenshot', args);
        });
      });
    });
  });
});
